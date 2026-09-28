"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, Printer } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { cancelPayment, getPayment } from "@/lib/api/accounting";
import { getErrorMessage } from "@/lib/api/error";
import type { Payment, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useT } from "@/lib/i18n/store";
import { formatDate, formatDateTime, formatMoney, formatMonth } from "@/lib/utils/format";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-border py-2 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Reçu de paiement, imprimable (voir `.print-area` dans globals.css : seule la
 * feuille est imprimée). Un reçu annulé reste consultable, marqué ANNULÉ.
 */
export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useT();
  const { id } = use(params);
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "accounting.manage");

  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getPayment(id)
      .then(setPayment)
      .catch(() => setError(t("Reçu introuvable.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCancel(event: React.FormEvent) {
    event.preventDefault();
    if (!payment || !reason.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      setPayment(await cancelPayment(payment.id, reason.trim()));
      setIsCancelling(false);
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible d'annuler ce paiement.")));
    } finally {
      setIsSaving(false);
    }
  }

  if (!payment) {
    return error ? (
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <Link href="/accounting/payments" className="text-sm font-medium text-primary hover:underline">
          {t("Retour aux paiements")}
        </Link>
      </div>
    ) : (
      <p className="text-sm text-muted">{t("Chargement...")}</p>
    );
  }

  const isCancelled = payment.status === "cancelled";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/accounting/payments" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> {t("Tous les paiements")}
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" /> {t("Imprimer")}
          </Button>
          {canManage && !isCancelled && !isCancelling && (
            <Button variant="danger" onClick={() => setIsCancelling(true)}>
              <Ban className="size-4" /> {t("Annuler ce paiement")}
            </Button>
          )}
        </div>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {isCancelling && (
        <form onSubmit={handleCancel} className="mb-6 max-w-xl rounded-md border border-danger/30 bg-danger/5 p-4 print:hidden" noValidate>
          <p className="mb-3 text-sm text-foreground">
            {t("Les {count} mois réglés par ce reçu redeviendront « à payer ». Le reçu reste consultable, marqué annulé.", {
              count: payment.months_count,
            })}
          </p>
          <Label htmlFor="reason">Motif de l&apos;annulation</Label>
          <Input id="reason" value={reason} maxLength={255} autoFocus onChange={(event) => setReason(event.target.value)} />
          <div className="mt-3 flex gap-2">
            <Button type="submit" variant="danger" loading={isSaving} disabled={!reason.trim()}>
              {t("Confirmer l'annulation")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsCancelling(false)}>
              {t("Retour")}
            </Button>
          </div>
        </form>
      )}

      <article className="print-area mx-auto max-w-2xl rounded-md border border-border bg-surface p-8 shadow-sm">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <Logo className="size-12" />
            <div>
              <p className="text-lg font-semibold text-foreground">ERP Maarif</p>
              <p className="text-sm text-muted">{t("Reçu de paiement de scolarité")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-foreground">{payment.receipt_number}</p>
            <p className="text-sm text-muted">{formatDate(payment.paid_at)}</p>
            {isCancelled && <Badge tone="danger" className="mt-1">{t("ANNULÉ")}</Badge>}
          </div>
        </header>

        {isCancelled && (
          <p className="mt-4 rounded-md border border-danger/40 bg-danger/5 px-4 py-2 text-sm text-danger">
            {t("Reçu annulé le {date} - {reason}", {
              date: formatDateTime(payment.cancelled_at),
              reason: payment.cancellation_reason ?? "",
            })}
          </p>
        )}

        <dl className="mt-4">
          <Row label={t("Élève")}>
            {payment.student?.name} <span className="font-mono text-xs text-muted">({payment.student?.matricule})</span>
          </Row>
          <Row label={t("Classe")}>{payment.enrollment?.school_class?.name ?? "-"}</Row>
          <Row label={t("Année scolaire")}>{payment.enrollment?.academic_year}</Row>
          <Row label={t("Formule")}>{payment.period_label}</Row>
          <Row label={t("Mois réglés")}>
            <span className="capitalize">{payment.months.map((month) => formatMonth(month)).join(", ")}</span>
          </Row>
          <Row label={t("Mode de paiement")}>
            {payment.method_label}
            {payment.reference ? ` · ${payment.reference}` : ""}
          </Row>
          {payment.note && <Row label={t("Note")}>{payment.note}</Row>}
          <Row label={t("Reçu par")}>{payment.received_by?.name ?? "-"}</Row>
        </dl>

        <p className="mt-6 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm text-muted">{t("Montant reçu")}</span>
          <span className={isCancelled ? "text-2xl font-semibold text-muted line-through" : "text-2xl font-semibold text-foreground"}>
            {formatMoney(payment.amount)}
          </span>
        </p>
      </article>
    </div>
  );
}
