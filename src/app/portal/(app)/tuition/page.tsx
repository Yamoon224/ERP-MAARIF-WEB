"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TuitionStatementView } from "@/components/accounting/TuitionStatementView";
import { MobileMoneyPayment } from "@/components/portal/MobileMoneyPayment";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { getMyTuition, listMyPayments } from "@/lib/api/accounting";
import type { Payment, TuitionStatement } from "@/lib/api/types";
import { formatDate, formatMoney, formatMonth } from "@/lib/utils/format";

/**
 * Scolarité de l'enfant : le relevé mois par mois pour chaque année
 * d'inscription, les reçus déjà délivrés, et le paiement en ligne par mobile
 * money pour les mois restants.
 */
export default function ParentTuitionPage() {
  const [statements, setStatements] = useState<TuitionStatement[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyTuition()
      .then((loaded) => {
        setStatements(loaded);
        setAcademicYear(loaded[0]?.enrollment.academic_year ?? "");
      })
      .catch(() => setError("Impossible de charger la scolarité."))
      .finally(() => setIsLoading(false));
  }, []);

  const loadPayments = useCallback(() => {
    if (!academicYear) return;

    listMyPayments({ academic_year: academicYear, per_page: 100 })
      .then((page) => setPayments(page.data))
      .catch(() => setPayments([]));
  }, [academicYear]);

  useEffect(loadPayments, [loadPayments]);

  /** Un paiement vient d'être confirmé : le relevé (mois réglés) et les reçus changent. */
  const handlePaid = useCallback(() => {
    getMyTuition()
      .then(setStatements)
      .catch(() => undefined);
    loadPayments();
  }, [loadPayments]);

  const statement = useMemo(() => statements.find((candidate) => candidate.enrollment.academic_year === academicYear), [statements, academicYear]);

  const columns: DataTableColumn<Payment>[] = [
    { key: "receipt", header: "Reçu", render: (row) => <span className="font-mono text-xs">{row.receipt_number}</span> },
    { key: "date", header: "Date", render: (row) => formatDate(row.paid_at) },
    {
      key: "months",
      header: "Mois réglés",
      render: (row) => (
        <span className="capitalize">
          {row.months.length === 1 ? formatMonth(row.months[0]) : `${formatMonth(row.months[0])} → ${formatMonth(row.months[row.months.length - 1])}`}
        </span>
      ),
    },
    { key: "formula", header: "Formule", render: (row) => <Badge tone="info">{row.period_label}</Badge> },
    { key: "method", header: "Mode", render: (row) => row.method_label },
    { key: "amount", header: "Montant", render: (row) => <span className="font-medium">{formatMoney(row.amount)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Frais de scolarité"
        description="La scolarité est mensuelle. Réglez-la au mois, au trimestre, au semestre ou pour l'année, en ligne par mobile money ou auprès de la comptabilité de l'établissement."
        actions={
          statements.length > 1 && (
            <label className="flex flex-col text-xs font-medium text-muted">
              Année scolaire
              <Select className="mt-1 h-9 w-44" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
                {statements.map((entry) => (
                  <option key={entry.enrollment.id} value={entry.enrollment.academic_year}>
                    {entry.enrollment.academic_year}
                  </option>
                ))}
              </Select>
            </label>
          )
        }
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      {!isLoading && !error && statements.length === 0 && (
        <p className="rounded-md border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          Aucune inscription enregistrée pour le moment.
        </p>
      )}

      {statement && (
        <div className="space-y-8">
          <p className="text-sm text-muted">
            {statement.enrollment.school_class?.name ?? "Classe non renseignée"} · {statement.enrollment.academic_year}
          </p>

          <MobileMoneyPayment
            key={statement.enrollment.id}
            enrollmentId={statement.enrollment.id}
            remaining={statement.totals.remaining}
            onPaid={handlePaid}
          />

          <TuitionStatementView statement={statement} />

          <section aria-labelledby="payments-heading">
            <h2 id="payments-heading" className="mb-3 text-base font-semibold text-foreground">
              Paiements enregistrés
            </h2>
            <DataTable exportName="Paiements de scolarité" columns={columns} rows={payments} rowKey={(row) => row.id} emptyMessage="Aucun paiement enregistré pour cette année." />
          </section>
        </div>
      )}
    </div>
  );
}
