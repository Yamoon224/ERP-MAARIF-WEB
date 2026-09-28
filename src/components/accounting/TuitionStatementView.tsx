"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import type { TuitionStatement } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
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
  const { t } = useT();
  const { installments, totals } = statement;

  if (installments.length === 0) {
    return (
      <p className="rounded-md border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        {t("Aucune échéance pour cette inscription : la scolarité mensuelle de la classe n'est pas encore fixée.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("Scolarité de l'année")}
          value={formatMoney(totals.total)}
          hint={t("{count} mois", { count: totals.months_total })}
          accent="accounting"
        />
        <StatCard
          label={t("Réglé")}
          value={formatMoney(totals.paid)}
          hint={t("{count} mois payé(s)", { count: totals.months_paid })}
          accent="grades"
        />
        <StatCard label={t("Reste à payer")} value={formatMoney(totals.remaining)} accent="attendance" />
        <StatCard
          label={t("En retard")}
          value={formatMoney(totals.overdue_amount)}
          hint={t("{count} mois échu(s) non réglé(s)", { count: totals.overdue_months })}
          accent="discipline"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
              <th className="px-4 py-3 font-medium">{t("Mois")}</th>
              <th className="px-4 py-3 font-medium">{t("Montant")}</th>
              <th className="px-4 py-3 font-medium">{t("État")}</th>
              <th className="px-4 py-3 font-medium">{t("Payé le")}</th>
              <th className="px-4 py-3 font-medium">{t("Reçu")}</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((installment) => (
              <tr key={installment.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 capitalize">{formatMonth(installment.month)}</td>
                <td className="px-4 py-2.5">{formatMoney(installment.amount)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={INSTALLMENT_TONE[installment.status]}>{t(INSTALLMENT_LABEL[installment.status])}</Badge>
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
                    "-"
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
