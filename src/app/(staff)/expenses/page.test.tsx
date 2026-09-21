import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import ExpensesPage from "@/app/(staff)/expenses/page";
import type { Expense, ExpenseCategory, ExpenseSummary } from "@/lib/api/types";
import { server } from "@/test/msw/server";
import { ACADEMIC_YEARS, API_URL, paged, signInAs } from "@/test/fixtures";

const CATEGORIES: ExpenseCategory[] = [
  { id: "k1", name: "Fournitures scolaires", description: null, is_active: true, expenses_count: 2 },
  { id: "k2", name: "Registres et imprimés", description: null, is_active: true, expenses_count: 1 },
];

const EXPENSES: Expense[] = [
  {
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
    recorded_by: { id: "u1", name: "Comptable" },
  },
  {
    id: "e2",
    number: "DEP-2026-000001",
    category: { id: "k2", name: "Registres et imprimés" },
    label: "Registres d'appel",
    supplier_name: null,
    quantity: 2,
    unit: null,
    unit_price: 35000,
    amount: 70000,
    method: "cheque",
    method_label: "Cheque",
    invoice_reference: null,
    spent_at: "2026-10-01",
    note: null,
    status: "cancelled",
    cancelled_at: "2026-10-02T09:00:00Z",
    cancellation_reason: "Saisie en double",
    recorded_by: null,
  },
];

const SUMMARY: ExpenseSummary = {
  period: { from: "2026-09-01", to: "2027-08-31" },
  total: { total: 480000, count: 1 },
  by_category: [{ id: "k1", name: "Fournitures scolaires", total: 480000, count: 1 }],
  by_method: [],
  by_month: [
    { month: "2026-09", total: 0 },
    { month: "2026-10", total: 480000 },
  ],
};

let listQueries: URLSearchParams[] = [];
let summaryQueries: URLSearchParams[] = [];

describe("ExpensesPage", () => {
  beforeEach(() => {
    listQueries = [];
    summaryQueries = [];
    signInAs(["expenses.view", "expenses.manage"], ["accountant"]);

    server.use(
      http.get(`${API_URL}/academic-years`, () => HttpResponse.json({ data: ACADEMIC_YEARS })),
      http.get(`${API_URL}/expense-categories`, () => HttpResponse.json({ data: CATEGORIES })),
      http.get(`${API_URL}/expenses/summary`, ({ request }) => {
        summaryQueries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ data: SUMMARY });
      }),
      http.get(`${API_URL}/expenses`, ({ request }) => {
        listQueries.push(new URL(request.url).searchParams);
        return HttpResponse.json(paged(EXPENSES));
      }),
    );
  });

  it("lists the purchases of the current academic year with their detail", async () => {
    render(<ExpensesPage />);

    const link = await screen.findByRole("link", { name: "DEP-2026-000002" });
    expect(link).toHaveAttribute("href", "/expenses/e1");

    const row = link.closest("tr") as HTMLElement;
    expect(within(row).getByText("Craies blanches")).toBeInTheDocument();
    // « 40 boîte × 12 000 » : quantité, unité et prix unitaire sous la désignation, avec le fournisseur.
    expect(row).toHaveTextContent(/40 boîte × 12\D000\D+ · Papeterie Centrale/);
    expect(within(row).getByText("Fournitures scolaires")).toBeInTheDocument();
    expect(within(row).getByText("Valide")).toBeInTheDocument();

    const cancelled = screen.getByRole("link", { name: "DEP-2026-000001" }).closest("tr") as HTMLElement;
    expect(within(cancelled).getByText("Annulée")).toBeInTheDocument();

    expect(listQueries[0].get("academic_year")).toBe("2026-2027");
  });

  it("shows the balance sheet of the period with a monthly chart and a category ring", async () => {
    render(<ExpensesPage />);

    expect(await screen.findByRole("img", { name: "Dépenses par mois" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Répartition des dépenses par catégorie" })).toBeInTheDocument();

    expect(screen.getByText("Total dépensé").closest("div")?.parentElement).toHaveTextContent(/480\D000/);
    expect(screen.getByText("Premier poste").closest("div")?.parentElement).toHaveTextContent("Fournitures scolaires");
    expect(summaryQueries[0].get("academic_year")).toBe("2026-2027");
  });

  it("filters by category, payment method and status", async () => {
    const user = userEvent.setup();
    render(<ExpensesPage />);
    await screen.findByRole("link", { name: "DEP-2026-000002" });

    await user.selectOptions(screen.getByLabelText("Catégorie"), "k2");
    await waitFor(() => expect(listQueries.at(-1)?.get("expense_category_id")).toBe("k2"));

    await user.selectOptions(screen.getByLabelText("Mode"), "cheque");
    await waitFor(() => expect(listQueries.at(-1)?.get("method")).toBe("cheque"));

    await user.selectOptions(screen.getByLabelText("Statut"), "cancelled");
    await waitFor(() => expect(listQueries.at(-1)?.get("status")).toBe("cancelled"));

    // Le bilan suit la période, pas les filtres de la liste.
    expect(summaryQueries.every((query) => !query.has("expense_category_id"))).toBe(true);
  });

  it("offers to record a purchase and to manage categories only to those who may", async () => {
    render(<ExpensesPage />);
    await screen.findByRole("link", { name: "DEP-2026-000002" });

    expect(screen.getByRole("link", { name: /Nouvelle dépense/ })).toHaveAttribute("href", "/expenses/new");
    expect(screen.getByRole("link", { name: /Catégories/ })).toHaveAttribute("href", "/expenses/categories");
  });

  it("is read-only for a viewer", async () => {
    signInAs(["expenses.view"], ["accountant"]);
    render(<ExpensesPage />);
    await screen.findByRole("link", { name: "DEP-2026-000002" });

    expect(screen.queryByRole("link", { name: /Nouvelle dépense/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Catégories/ })).not.toBeInTheDocument();
  });
});
