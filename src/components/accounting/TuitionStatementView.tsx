import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import type { TuitionStatement } from "@/lib/api/types";
import { INSTALLMENT_LABEL, INSTALLMENT_TONE } from "@/lib/labels";
import { formatDate, formatMoney, formatMonth } from "@/lib/utils/format";

interface TuitionStatementViewProps {
  statement: TuitionStatement;
  /** Lien vers le reçu d'un paiement ; absent = pas de lien (portail parent). */
  receiptHref?: (paymentId: string) => string;
}

/**
 * Relevé de scolarité d'une inscription : totaux, puis un mois par ligne avec
 * son état (réglé, en retard, à payer, à venir) et le reçu qui l'a réglé.
 */
export function TuitionStatementView({ statement, receiptHref }: TuitionStatementViewProps) {
  const { installments, totals } = statement;

  if (installments.length === 0) {
    return (
      <p className="rounded-md border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        Aucune échéance pour cette inscription : la scolarité mensuelle de la classe n&apos;est pas encore fixée.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Scolarité de l'année" value={formatMoney(totals.total)} hint={`${totals.months_total} mois`} accent="accounting" />
        <StatCard label="Réglé" value={formatMoney(totals.paid)} hint={`${totals.months_paid} mois payé(s)`} accent="grades" />
        <StatCard label="Reste à payer" value={formatMoney(totals.remaining)} accent="attendance" />
        <StatCard
          label="En retard"
          value={formatMoney(totals.overdue_amount)}
          hint={`${totals.overdue_months} mois échu(s) non réglé(s)`}
          accent="discipline"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
              <th className="px-4 py-3 font-medium">Mois</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">État</th>
              <th className="px-4 py-3 font-medium">Payé le</th>
              <th className="px-4 py-3 font-medium">Reçu</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((installment) => (
              <tr key={installment.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 capitalize">{formatMonth(installment.month)}</td>
                <td className="px-4 py-2.5">{formatMoney(installment.amount)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={INSTALLMENT_TONE[installment.status]}>{INSTALLMENT_LABEL[installment.status]}</Badge>
                </td>
                <td className="px-4 py-2.5">{formatDate(installment.paid_at)}</td>
                <td className="px-4 py-2.5">
                  {installment.payment ? (
                    receiptHref ? (
                      <Link href={receiptHref(installment.payment.id)} className="font-mono text-xs text-primary hover:underline">
                        {installment.payment.receipt_number}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs">{installment.payment.receipt_number}</span>
                    )
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
