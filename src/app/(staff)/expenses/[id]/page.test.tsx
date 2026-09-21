import { Suspense } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import ExpenseDetailPage from "@/app/(staff)/expenses/[id]/page";
import type { Expense } from "@/lib/api/types";
import { server } from "@/test/msw/server";
import { API_URL, signInAs } from "@/test/fixtures";

const VALID: Expense = {
  id: "e1",
  number: "DEP-2026-000002",
  category: { id: "k1", name: "Fournitures scolaires" },
  label: "Craies blanches",
  supplier_name: "Papeterie Centrale",
  quantity: 40,
  unit: "boîte",
  unit_price: 12000,
  amount: 480000,
  method: "cash",
  method_label: "Especes",
  invoice_reference: "FAC-118",
  spent_at: "2026-10-05",
  note: null,
  status: "valid",
  cancelled_at: null,
  cancellation_reason: null,
  recorded_by: { id: "u1", name: "Awa Comptable" },
};

async function renderPage(expense: Expense = VALID) {
  server.use(http.get(`${API_URL}/expenses/e1`, () => HttpResponse.json({ data: expense })));

  // `use(params)` suspend une fois : act asynchrone laisse la promesse se résoudre avant les assertions.
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <ExpenseDetailPage params={Promise.resolve({ id: "e1" })} />
      </Suspense>,
    );
  });
  await screen.findByRole("heading", { name: expense.label });
}

describe("ExpenseDetailPage", () => {
  beforeEach(() => signInAs(["expenses.view", "expenses.manage"], ["accountant"]));

  it("shows the whole purchase: supplier, quantity, unit price, invoice and who recorded it", async () => {
    await renderPage();

    expect(screen.getByText("DEP-2026-000002")).toBeInTheDocument();
    expect(screen.getByText("Papeterie Centrale")).toBeInTheDocument();
    expect(screen.getByText("40 boîte")).toBeInTheDocument();
    expect(screen.getByText("FAC-118")).toBeInTheDocument();
    expect(screen.getByText("Awa Comptable")).toBeInTheDocument();
    expect(screen.getByText("Montant total").parentElement).toHaveTextContent(/480\D000/);
    expect(screen.getByRole("link", { name: /Modifier/ })).toHaveAttribute("href", "/expenses/e1/edit");
  });

  it("cancels the expense with a reason, and keeps it on record marked as cancelled", async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API_URL}/expenses/e1/cancel`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: { ...VALID, status: "cancelled", cancelled_at: "2026-10-06T08:00:00Z", cancellation_reason: "Facture en double" },
        });
      }),
    );
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByRole("button", { name: /Annuler cette dépense/ }));
    const confirm = screen.getByRole("button", { name: "Confirmer l'annulation" });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText("Motif de l'annulation"), "Facture en double");
    await user.click(confirm);

    expect(await screen.findByText("ANNULÉE")).toBeInTheDocument();
    expect(screen.getByText(/Facture en double/)).toBeInTheDocument();
    expect(body).toEqual({ reason: "Facture en double" });
    // Une dépense annulée n'offre plus ni modification ni nouvelle annulation.
    expect(screen.queryByRole("link", { name: /Modifier/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Annuler cette dépense/ })).not.toBeInTheDocument();
  });

  it("shows the server's refusal when the cancellation fails", async () => {
    server.use(
      http.post(`${API_URL}/expenses/e1/cancel`, () =>
        HttpResponse.json({ message: "Cette dépense est déjà annulée.", error_code: "expense_already_cancelled" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByRole("button", { name: /Annuler cette dépense/ }));
    await user.type(screen.getByLabelText("Motif de l'annulation"), "Doublon");
    await user.click(screen.getByRole("button", { name: "Confirmer l'annulation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cette dépense est déjà annulée.");
  });

  it("offers no action to a viewer", async () => {
    signInAs(["expenses.view"], ["accountant"]);
    await renderPage();

    expect(screen.queryByRole("link", { name: /Modifier/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Annuler cette dépense/ })).not.toBeInTheDocument();
  });

  it("says so when the expense does not exist", async () => {
    server.use(http.get(`${API_URL}/expenses/e1`, () => HttpResponse.json({ message: "Introuvable" }, { status: 404 })));

    await act(async () => {
      render(
        <Suspense fallback={null}>
          <ExpenseDetailPage params={Promise.resolve({ id: "e1" })} />
        </Suspense>,
      );
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Dépense introuvable.");
  });
});
