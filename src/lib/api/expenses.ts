import { apiClient } from "@/lib/api/client";
import type { Expense, ExpenseCategory, ExpenseSummary, PaginatedResponse, PaymentMethod, PeriodParams } from "@/lib/api/types";

export interface ExpenseListParams extends PeriodParams {
  expense_category_id?: string;
  method?: PaymentMethod;
  status?: "valid" | "cancelled";
  search?: string;
  sort?: "spent_at" | "amount";
  direction?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

/** Saisie d'une dépense : le montant n'y figure pas, le serveur le calcule (quantité × prix unitaire). */
export interface ExpensePayload {
  expense_category_id: string;
  label: string;
  supplier_name?: string | null;
  quantity: number;
  unit?: string | null;
  unit_price: number;
  method: PaymentMethod;
  invoice_reference?: string | null;
  spent_at?: string | null;
  note?: string | null;
}

export async function listExpenses(params: ExpenseListParams) {
  const { data } = await apiClient.get<PaginatedResponse<Expense>>("/expenses", { params });
  return data;
}

export async function getExpense(id: string) {
  const { data } = await apiClient.get<{ data: Expense }>(`/expenses/${id}`);
  return data.data;
}

export async function createExpense(payload: ExpensePayload) {
  const { data } = await apiClient.post<{ data: Expense }>("/expenses", payload);
  return data.data;
}

export async function updateExpense(id: string, payload: ExpensePayload) {
  const { data } = await apiClient.put<{ data: Expense }>(`/expenses/${id}`, payload);
  return data.data;
}

/** Annule une dépense : elle sort des totaux mais reste au registre avec son motif. */
export async function cancelExpense(id: string, reason: string) {
  const { data } = await apiClient.post<{ data: Expense }>(`/expenses/${id}/cancel`, { reason });
  return data.data;
}

/** Fournisseurs déjà saisis, du plus récent au plus ancien : saisie semi-automatique. */
export async function listSuppliers() {
  const { data } = await apiClient.get<{ data: string[] }>("/expenses/suppliers");
  return data.data;
}

export async function getExpenseSummary(params: PeriodParams) {
  const { data } = await apiClient.get<{ data: ExpenseSummary }>("/expenses/summary", { params });
  return data.data;
}

export async function listExpenseCategories(activeOnly = false) {
  const { data } = await apiClient.get<{ data: ExpenseCategory[] }>("/expense-categories", {
    params: activeOnly ? { active_only: 1 } : undefined,
  });
  return data.data;
}

export interface ExpenseCategoryPayload {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export async function createExpenseCategory(payload: ExpenseCategoryPayload) {
  const { data } = await apiClient.post<{ data: ExpenseCategory }>("/expense-categories", payload);
  return data.data;
}

export async function updateExpenseCategory(id: string, payload: ExpenseCategoryPayload) {
  const { data } = await apiClient.put<{ data: ExpenseCategory }>(`/expense-categories/${id}`, payload);
  return data.data;
}

export async function deleteExpenseCategory(id: string) {
  await apiClient.delete(`/expense-categories/${id}`);
}
