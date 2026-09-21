"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Tags, Trophy } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ColumnChart } from "@/components/ui/charts/ColumnChart";
import { DonutChart } from "@/components/ui/charts/DonutChart";
import { formatTick, seriesColor, toSlices } from "@/components/ui/charts/chartUtils";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { getExpenseSummary, listExpenseCategories, listExpenses } from "@/lib/api/expenses";
import type { Expense, ExpenseCategory, ExpenseSummary, PaymentMethod, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { PAYMENT_METHOD_LABEL } from "@/lib/labels";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { emptyPage } from "@/lib/utils/emptyPage";
import { formatDate, formatMoney, formatMonth, formatMonthShort } from "@/lib/utils/format";

type StatusFilter = "" | "valid" | "cancelled";

/** « 40 boîtes × 12 000 FG » : le détail d'un achat sous sa désignation. */
function detail(expense: Expense): string {
  const quantity = expense.quantity.toLocaleString("fr-FR");
  return `${quantity}${expense.unit ? ` ${expense.unit}` : ""} × ${formatMoney(expense.unit_price)}`;
}

export default function ExpensesPage() {
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "expenses.manage");
  const period = usePeriodFilter();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [method, setMethod] = useState<"" | PaymentMethod>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    listExpenseCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Le bilan suit la période, pas les filtres de la liste : les graphiques restent lisibles quand on cherche « craies ».
  useEffect(() => {
    if (!period.isReady) return;

    let cancelled = false;
    setSummaryError(null);
    getExpenseSummary(period.params)
      .then((loaded) => {
        if (!cancelled) setSummary(loaded);
      })
      .catch(() => {
        if (!cancelled) setSummaryError("Impossible de charger le bilan des dépenses.");
      });

    return () => {
      cancelled = true;
    };
  }, [period.isReady, period.params]);

  const filters = useMemo(
    () => ({
      ...period.params,
      search: debouncedSearch || undefined,
      expense_category_id: categoryId || undefined,
      method: method || undefined,
      status: status || undefined,
    }),
    [period.params, debouncedSearch, categoryId, method, status],
  );

  const { page, perPage, setPage, setPerPage } = usePagination(JSON.stringify(filters));
  const fetcher = useMemo(
    () => () => (period.isReady ? listExpenses({ ...filters, page, per_page: perPage }) : Promise.resolve(emptyPage<Expense>(perPage))),
    [period.isReady, filters, page, perPage],
  );
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [period.isReady, filters, page, perPage]);

  const topCategory = summary?.by_category[0];

  const columns: DataTableColumn<Expense>[] = [
    {
      key: "number",
      header: "N°",
      render: (row) => (
        <Link href={`/expenses/${row.id}`} className="font-mono text-xs text-primary hover:underline">
          {row.number}
        </Link>
      ),
    },
    { key: "date", header: "Date", render: (row) => formatDate(row.spent_at) },
    {
      key: "label",
      header: "Désignation",
      className: "min-w-56",
      render: (row) => (
        <div>
          <p className="font-medium">{row.label}</p>
          <p className="text-xs text-muted">
            {detail(row)}
            {row.supplier_name ? ` · ${row.supplier_name}` : ""}
          </p>
        </div>
      ),
    },
    { key: "category", header: "Catégorie", render: (row) => row.category?.name ?? "—" },
    { key: "method", header: "Mode", render: (row) => row.method_label },
    { key: "amount", header: "Montant", render: (row) => <span className="font-medium">{formatMoney(row.amount)}</span> },
    {
      key: "status",
      header: "Statut",
      render: (row) => (row.status === "valid" ? <Badge tone="success">Valide</Badge> : <Badge tone="danger">Annulée</Badge>),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dépenses et approvisionnements"
        description="Achats de craies, de registres et de fournitures, factures et réparations de l'établissement."
        actions={
          canManage && (
            <>
              <Link href="/expenses/categories">
                <Button variant="secondary">
                  <Tags className="size-4" /> Catégories
                </Button>
              </Link>
              <Link href="/expenses/new">
                <Button>
                  <Plus className="size-4" /> Nouvelle dépense
                </Button>
              </Link>
            </>
          )
        }
      />

      <PeriodFilter filter={period} className="mb-6" />

      {summaryError && <Alert className="mb-6">{summaryError}</Alert>}

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total dépensé"
              value={formatMoney(summary.total.total)}
              hint="Dépenses valides de la période"
              icon={<Receipt className="size-4" />}
              accent="attendance"
            />
            <StatCard
              label="Achats enregistrés"
              value={summary.total.count}
              hint={summary.total.count > 0 ? `${formatMoney(summary.total.total / summary.total.count)} en moyenne` : "Aucune dépense"}
              icon={<Tags className="size-4" />}
              accent="grades"
            />
            <StatCard
              label="Premier poste"
              value={topCategory ? topCategory.name : "—"}
              hint={topCategory ? `${formatMoney(topCategory.total)} · ${topCategory.count} dépense(s)` : "Aucune dépense"}
              icon={<Trophy className="size-4" />}
              accent="academics"
            />
          </div>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
            <Card accent="attendance" className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Dépenses mois par mois</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.by_month.length === 0 ? (
                  <p className="text-sm text-muted">Aucune dépense.</p>
                ) : (
                  <ColumnChart
                    ariaLabel="Dépenses par mois"
                    series={[{ key: "spent", label: "Dépenses", color: seriesColor(1) }]}
                    data={summary.by_month.map((entry) => ({
                      label: formatMonthShort(entry.month),
                      fullLabel: formatMonth(entry.month),
                      values: { spent: entry.total },
                    }))}
                    formatValue={formatMoney}
                  />
                )}
              </CardContent>
            </Card>

            <Card accent="attendance">
              <CardHeader>
                <CardTitle>Par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  ariaLabel="Répartition des dépenses par catégorie"
                  slices={toSlices(summary.by_category.map((category) => ({ key: category.id, label: category.name, value: category.total })))}
                  formatValue={formatMoney}
                  formatCenter={formatTick}
                  totalLabel="dépensés"
                  emptyMessage="Aucune dépense sur la période."
                  className="sm:flex-col"
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="mt-8 mb-4 flex flex-wrap items-end gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Désignation, fournisseur, n° de facture..." />
        <label className="flex flex-col text-xs font-medium text-muted">
          Catégorie
          <Select className="mt-1 h-9 w-56" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Toutes</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col text-xs font-medium text-muted">
          Mode
          <Select className="mt-1 h-9 w-40" value={method} onChange={(event) => setMethod(event.target.value as typeof method)}>
            <option value="">Tous</option>
            {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((key) => (
              <option key={key} value={key}>
                {PAYMENT_METHOD_LABEL[key]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col text-xs font-medium text-muted">
          Statut
          <Select className="mt-1 h-9 w-36" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            <option value="">Tous</option>
            <option value="valid">Valides</option>
            <option value="cancelled">Annulées</option>
          </Select>
        </label>
      </div>

      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune dépense sur cette période." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
