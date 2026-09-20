"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { SearchInput } from "@/components/ui/SearchInput";
import { listPayments } from "@/lib/api/accounting";
import type { Payment, PaymentMethod, PaymentPeriod, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { PAYMENT_METHOD_LABEL, PAYMENT_PERIOD_LABEL } from "@/lib/labels";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { emptyPage } from "@/lib/utils/emptyPage";
import { formatDate, formatMoney, formatMonth } from "@/lib/utils/format";

type StatusFilter = "" | "valid" | "cancelled";

/** Résumé des mois réglés : « octobre 2025 » ou « octobre 2025 → décembre 2025 ». */
function monthsLabel(months: string[]): string {
  if (months.length === 0) return "—";
  if (months.length === 1) return formatMonth(months[0]);
  return `${formatMonth(months[0])} → ${formatMonth(months[months.length - 1])}`;
}

export default function PaymentsPage() {
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "accounting.manage");
  const period = usePeriodFilter();

  const [search, setSearch] = useState("");
  const [periodType, setPeriodType] = useState<"" | PaymentPeriod>("");
  const [method, setMethod] = useState<"" | PaymentMethod>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const debouncedSearch = useDebouncedValue(search);

  const filters = useMemo(
    () => ({
      ...period.params,
      search: debouncedSearch || undefined,
      period_type: periodType || undefined,
      method: method || undefined,
      status: status || undefined,
    }),
    [period.params, debouncedSearch, periodType, method, status],
  );

  const { page, perPage, setPage, setPerPage } = usePagination(JSON.stringify(filters));
  const fetcher = useMemo(
    () => () => (period.isReady ? listPayments({ ...filters, page, per_page: perPage }) : Promise.resolve(emptyPage<Payment>(perPage))),
    [period.isReady, filters, page, perPage],
  );
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [period.isReady, filters, page, perPage]);

  const columns: DataTableColumn<Payment>[] = [
    {
      key: "receipt",
      header: "Reçu",
      render: (row) => (
        <Link href={`/comptabilite/paiements/${row.id}`} className="font-mono text-xs text-primary hover:underline">
          {row.receipt_number}
        </Link>
      ),
    },
    { key: "date", header: "Date", render: (row) => formatDate(row.paid_at) },
    {
      key: "student",
      header: "Élève",
      render: (row) => (
        <span>
          <span className="font-medium">{row.student?.name ?? "—"}</span>
          <span className="ml-2 text-xs text-muted">{row.enrollment?.school_class?.name}</span>
        </span>
      ),
    },
    {
      key: "period",
      header: "Formule",
      render: (row) => (
        <span>
          {row.period_label}
          <span className="block text-xs text-muted">{monthsLabel(row.months)}</span>
        </span>
      ),
    },
    { key: "method", header: "Mode", render: (row) => row.method_label },
    { key: "amount", header: "Montant", render: (row) => <span className="font-medium">{formatMoney(row.amount)}</span> },
    {
      key: "status",
      header: "Statut",
      render: (row) => (row.status === "valid" ? <Badge tone="success">Valide</Badge> : <Badge tone="danger">Annulé</Badge>),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Paiements"
        description="Historique des encaissements de scolarité. Cliquez sur un numéro de reçu pour l'ouvrir ou l'imprimer."
        actions={
          canManage && (
            <Link href="/comptabilite/paiements/nouveau">
              <Button>
                <Plus className="size-4" /> Nouveau paiement
              </Button>
            </Link>
          )
        }
      />

      <PeriodFilter filter={period} className="mb-4" />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Élève, matricule ou n° de reçu..." />
        <label className="flex flex-col text-xs font-medium text-muted">
          Formule
          <Select className="mt-1 h-9 w-40" value={periodType} onChange={(event) => setPeriodType(event.target.value as typeof periodType)}>
            <option value="">Toutes</option>
            {(Object.keys(PAYMENT_PERIOD_LABEL) as PaymentPeriod[]).map((key) => (
              <option key={key} value={key}>
                {PAYMENT_PERIOD_LABEL[key]}
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
            <option value="cancelled">Annulés</option>
          </Select>
        </label>
      </div>

      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucun paiement sur cette période." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
