import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import NewExpensePage from "@/app/(staff)/expenses/new/page";
import { mockRouter } from "@/test/mocks/navigation";
import { server } from "@/test/msw/server";
import { API_URL, signInAs } from "@/test/fixtures";

const CATEGORIES = [
  { id: "k1", name: "Fournitures scolaires", description: null, is_active: true, expenses_count: 0 },
  { id: "k2", name: "Registres et imprimés", description: null, is_active: true, expenses_count: 0 },
];

let created: Record<string, unknown> | null = null;

describe("NewExpensePage", () => {
  beforeEach(() => {
    created = null;
    signInAs(["expenses.view", "expenses.manage"], ["accountant"]);

    server.use(
      http.get(`${API_URL}/expense-categories`, () => HttpResponse.json({ data: CATEGORIES })),
      http.get(`${API_URL}/expenses/suppliers`, () => HttpResponse.json({ data: ["Papeterie Centrale", "Imprimerie Nationale"] })),
      http.post(`${API_URL}/expenses`, async ({ request }) => {
        created = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { id: "e9", number: "DEP-2026-000009" } }, { status: 201 });
      }),
    );
  });

  async function chooseCategory(user: ReturnType<typeof userEvent.setup>, name: string) {
    const select = screen.getByLabelText("Catégorie");
    await waitFor(() => expect(within(select).getByRole("option", { name })).toBeInTheDocument());
    await user.selectOptions(select, name);
  }

  it("computes the total as quantity times unit price while typing", async () => {
    const user = userEvent.setup();
    render(<NewExpensePage />);

    expect(screen.getByText("Montant total").parentElement).toHaveTextContent("—");

    await user.clear(screen.getByLabelText("Quantité"));
    await user.type(screen.getByLabelText("Quantité"), "40");
    await user.type(screen.getByLabelText("Prix unitaire"), "12000");

    expect(screen.getByText("Montant total").parentElement).toHaveTextContent(/480\D000/);
  });

  it("records a purchase and opens its sheet", async () => {
    const user = userEvent.setup();
    render(<NewExpensePage />);

    await chooseCategory(user, "Fournitures scolaires");
    await user.type(screen.getByLabelText("Désignation"), "Craies blanches");
    await user.type(screen.getByLabelText("Fournisseur (facultatif)"), "Papeterie Centrale");
    await user.clear(screen.getByLabelText("Quantité"));
    await user.type(screen.getByLabelText("Quantité"), "40");
    await user.type(screen.getByLabelText("Unité (facultatif)"), "boîte");
    await user.type(screen.getByLabelText("Prix unitaire"), "12000");
    await user.selectOptions(screen.getByLabelText("Mode de paiement"), "mobile_money");
    await user.type(screen.getByLabelText("N° de facture ou de bon (facultatif)"), "FAC-118");
    await user.click(screen.getByRole("button", { name: "Enregistrer la dépense" }));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/expenses/e9"));

    // Pas de montant dans la requête : le serveur le calcule. Les nombres sont de vrais nombres.
    expect(created).toMatchObject({
      expense_category_id: "k1",
      label: "Craies blanches",
      supplier_name: "Papeterie Centrale",
      quantity: 40,
      unit: "boîte",
      unit_price: 12000,
      method: "mobile_money",
      invoice_reference: "FAC-118",
      note: null,
    });
    expect(created).not.toHaveProperty("amount");
  });

  it("accepts a decimal comma and leaves optional fields out", async () => {
    const user = userEvent.setup();
    render(<NewExpensePage />);

    await chooseCategory(user, "Registres et imprimés");
    await user.type(screen.getByLabelText("Désignation"), "Ramettes A4");
    await user.clear(screen.getByLabelText("Quantité"));
    await user.type(screen.getByLabelText("Quantité"), "2,5");
    await user.type(screen.getByLabelText("Prix unitaire"), "42000");
    await user.click(screen.getByRole("button", { name: "Enregistrer la dépense" }));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
    expect(created).toMatchObject({ quantity: 2.5, supplier_name: null, unit: null, invoice_reference: null });
  });

  it("blocks an incomplete or absurd entry and says what is wrong", async () => {
    const user = userEvent.setup();
    render(<NewExpensePage />);

    await user.click(screen.getByRole("button", { name: "Enregistrer la dépense" }));

    expect(await screen.findByText("Sélectionnez une catégorie.")).toBeInTheDocument();
    expect(screen.getByText("La désignation est requise.")).toBeInTheDocument();
    expect(screen.getByText("Le prix unitaire est requis.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Quantité"));
    await user.type(screen.getByLabelText("Quantité"), "0");
    await user.type(screen.getByLabelText("Prix unitaire"), "abc");
    await user.click(screen.getByRole("button", { name: "Enregistrer la dépense" }));

    expect(await screen.findByText("La quantité doit être supérieure à 0.")).toBeInTheDocument();
    expect(screen.getByText("Le prix unitaire doit être supérieur à 0.")).toBeInTheDocument();
    expect(created).toBeNull();
  });

  it("shows the server's refusal and stays on the form", async () => {
    server.use(
      http.post(`${API_URL}/expenses`, () =>
        HttpResponse.json({ message: "La catégorie est désactivée.", error_code: "validation_failed" }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    render(<NewExpensePage />);

    await chooseCategory(user, "Fournitures scolaires");
    await user.type(screen.getByLabelText("Désignation"), "Craies");
    await user.type(screen.getByLabelText("Prix unitaire"), "5000");
    await user.click(screen.getByRole("button", { name: "Enregistrer la dépense" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La catégorie est désactivée.");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
