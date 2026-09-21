"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { listMobileMoneyTransactions } from "@/lib/api/accounting";
import type { MobileMoneyStatus, MobileMoneyTransaction } from "@/lib/api/types";
import { formatDateTime, formatMoney, formatMonth } from "@/lib/utils/format";

const STATUS_TONE: Record<MobileMoneyStatus, "info" | "success" | "danger" | "neutral" | "warning"> = {
  pending: "info",
  successful: "success",
  failed: "danger",
  expired: "neutral",
  needs_review: "warning",
};

function monthsLabel(months: string[]): string {
  if (months.length === 0) return "—";
  if (months.length === 1) return formatMonth(months[0]);

  return `${formatMonth(months[0])} → ${formatMonth(months[months.length - 1])}`;
}

/**
 * Demandes de paiement mobile money des parents. Une demande confirmée devient
 * un paiement avec son reçu (liste ci-dessous) ; ce suivi sert surtout aux
 * demandes « à vérifier » : l'opérateur a débité le parent alors que les mois
 * étaient déjà réglés, et la comptabilité doit rembourser. N'affiche rien tant
 * qu'aucun parent n'a payé de cette façon.
 */
export function MobileMoneyMonitor() {
  const [transactions, setTransactions] = useState<MobileMoneyTransaction[]>([]);

  useEffect(() => {
    listMobileMoneyTransactions({ per_page: 10 })
      .then((page) => setTransactions(page.data))
      .catch(() => setTransactions([]));
  }, []);

  if (transactions.length === 0) return null;

  const columns: DataTableColumn<MobileMoneyTransaction>[] = [
    { key: "date", header: "Demande", render: (row) => formatDateTime(row.created_at) },
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
          <span className="block text-xs text-muted capitalize">{monthsLabel(row.months)}</span>
        </span>
      ),
    },
    {
      key: "operator",
      header: "Opérateur",
      render: (row) => (
        <span>
          {row.operator_label}
          <span className="block font-mono text-xs text-muted">{row.phone}</span>
        </span>
      ),
    },
    { key: "amount", header: "Montant", render: (row) => <span className="font-medium">{formatMoney(row.amount)}</span> },
    {
      key: "status",
      header: "État",
      render: (row) => (
        <span>
          <Badge tone={STATUS_TONE[row.status]}>{row.status_label}</Badge>
          {row.status === "successful" && row.receipt_number && <span className="mt-0.5 block font-mono text-xs text-muted">{row.receipt_number}</span>}
          {row.failure_reason && row.status !== "successful" && <span className="mt-0.5 block max-w-64 text-xs text-muted">{row.failure_reason}</span>}
        </span>
      ),
    },
  ];

  return (
    <section aria-labelledby="mobile-money-heading" className="mb-8">
      <h2 id="mobile-money-heading" className="mb-3 text-base font-semibold text-foreground">
        Paiements mobile money des parents
      </h2>
      <DataTable columns={columns} rows={transactions} rowKey={(row) => row.id} />
    </section>
  );
}
