import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import ExpenseCategoriesPage from "@/app/(staff)/expenses/categories/page";
import type { ExpenseCategory } from "@/lib/api/types";
import { server } from "@/test/msw/server";
import { API_URL, signInAs } from "@/test/fixtures";

let categories: ExpenseCategory[] = [];
let requests: Array<{ method: string; url: string; body: unknown }> = [];

function seed() {
  categories = [
    { id: "k1", name: "Fournitures scolaires", description: "Craies, marqueurs", is_active: true, expenses_count: 3 },
    { id: "k2", name: "Sorties pédagogiques", description: null, is_active: true, expenses_count: 0 },
    { id: "k3", name: "Ancien poste", description: null, is_active: false, expenses_count: 1 },
  ];
}

function rowOf(name: string): HTMLElement {
  return screen.getByText(name).closest("tr") as HTMLElement;
}

describe("ExpenseCategoriesPage", () => {
  beforeEach(() => {
    seed();
    requests = [];
    signInAs(["expenses.view", "expenses.manage"], ["accountant"]);

    server.use(
      http.get(`${API_URL}/expense-categories`, () => HttpResponse.json({ data: categories })),
      http.post(`${API_URL}/expense-categories`, async ({ request }) => {
        const body = (await request.json()) as { name: string; description: string | null };
        requests.push({ method: "POST", url: "", body });
        categories = [...categories, { id: "k9", name: body.name, description: body.description, is_active: true, expenses_count: 0 }];
        return HttpResponse.json({ data: categories.at(-1) }, { status: 201 });
      }),
      http.put(`${API_URL}/expense-categories/:id`, async ({ request, params }) => {
        const body = (await request.json()) as Partial<ExpenseCategory>;
        requests.push({ method: "PUT", url: String(params.id), body });
        categories = categories.map((category) => (category.id === params.id ? { ...category, ...body } : category));
        return HttpResponse.json({ data: categories.find((category) => category.id === params.id) });
      }),
      http.delete(`${API_URL}/expense-categories/:id`, ({ params }) => {
        requests.push({ method: "DELETE", url: String(params.id), body: null });
        categories = categories.filter((category) => category.id !== params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
  });

  it("lists the categories with how many expenses each carries and whether it is active", async () => {
    render(<ExpenseCategoriesPage />);

    const row = await screen.findByText("Fournitures scolaires").then((cell) => cell.closest("tr") as HTMLElement);
    expect(row).toHaveTextContent("Craies, marqueurs");
    expect(row).toHaveTextContent("3");
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(within(rowOf("Ancien poste")).getByText("Désactivée")).toBeInTheDocument();
  });

  it("adds a category and shows it in the list", async () => {
    const user = userEvent.setup();
    render(<ExpenseCategoriesPage />);
    await screen.findByText("Fournitures scolaires");

    await user.type(screen.getByLabelText("Nouvelle catégorie"), "  Fêtes scolaires ");
    await user.click(screen.getByRole("button", { name: /Ajouter/ }));

    expect(await screen.findByText("Fêtes scolaires")).toBeInTheDocument();
    expect(requests).toEqual([{ method: "POST", url: "", body: { name: "Fêtes scolaires", description: null } }]);
    expect(screen.getByLabelText("Nouvelle catégorie")).toHaveValue("");
  });

  it("refuses an empty name before calling the API", async () => {
    const user = userEvent.setup();
    render(<ExpenseCategoriesPage />);
    await screen.findByText("Fournitures scolaires");

    await user.click(screen.getByRole("button", { name: /Ajouter/ }));

    expect(await screen.findByText("Le nom est requis.")).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it("renames a category in place", async () => {
    const user = userEvent.setup();
    render(<ExpenseCategoriesPage />);
    await screen.findByText("Sorties pédagogiques");

    await user.click(screen.getByRole("button", { name: "Renommer Sorties pédagogiques" }));
    const field = screen.getByLabelText("Nom de Sorties pédagogiques");
    await user.clear(field);
    await user.type(field, "Sorties et voyages");
    await user.click(screen.getByRole("button", { name: "Enregistrer Sorties pédagogiques" }));

    expect(await screen.findByText("Sorties et voyages")).toBeInTheDocument();
    expect(requests[0]).toMatchObject({ method: "PUT", url: "k2", body: { name: "Sorties et voyages" } });
  });

  it("deactivates an active category and reactivates a deactivated one", async () => {
    const user = userEvent.setup();
    render(<ExpenseCategoriesPage />);
    await screen.findByText("Fournitures scolaires");

    await user.click(screen.getByRole("button", { name: "Désactiver Fournitures scolaires" }));
    await waitFor(() => expect(within(rowOf("Fournitures scolaires")).getByText("Désactivée")).toBeInTheDocument());
    expect(requests[0].body).toMatchObject({ is_active: false });

    await user.click(screen.getByRole("button", { name: "Réactiver Ancien poste" }));
    await waitFor(() => expect(within(rowOf("Ancien poste")).getByText("Active")).toBeInTheDocument());
    expect(requests[1].body).toMatchObject({ is_active: true });
  });

  it("only offers to delete a category that carries no expense", async () => {
    render(<ExpenseCategoriesPage />);
    await screen.findByText("Fournitures scolaires");

    expect(screen.queryByRole("button", { name: "Supprimer Fournitures scolaires" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer Sorties pédagogiques" })).toBeInTheDocument();
  });

  it("deletes an empty category after confirmation", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<ExpenseCategoriesPage />);
    await screen.findByText("Sorties pédagogiques");

    await user.click(screen.getByRole("button", { name: "Supprimer Sorties pédagogiques" }));

    await waitFor(() => expect(screen.queryByText("Sorties pédagogiques")).not.toBeInTheDocument());
    expect(confirm).toHaveBeenCalled();
    expect(requests).toEqual([{ method: "DELETE", url: "k2", body: null }]);
    confirm.mockRestore();
  });

  it("keeps the category when the deletion is not confirmed", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<ExpenseCategoriesPage />);
    await screen.findByText("Sorties pédagogiques");

    await user.click(screen.getByRole("button", { name: "Supprimer Sorties pédagogiques" }));

    expect(screen.getByText("Sorties pédagogiques")).toBeInTheDocument();
    expect(requests).toHaveLength(0);
    confirm.mockRestore();
  });

  it("shows the server's message when a category cannot be added", async () => {
    server.use(
      http.post(`${API_URL}/expense-categories`, () =>
        HttpResponse.json({ message: "Le nom est déjà utilisé.", error_code: "validation_failed" }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    render(<ExpenseCategoriesPage />);
    await screen.findByText("Fournitures scolaires");

    await user.type(screen.getByLabelText("Nouvelle catégorie"), "Fournitures scolaires");
    await user.click(screen.getByRole("button", { name: /Ajouter/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Le nom est déjà utilisé.");
  });
});
