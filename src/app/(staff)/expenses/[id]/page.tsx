"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, Pencil } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { cancelExpense, getExpense } from "@/lib/api/expenses";
import { getErrorMessage } from "@/lib/api/error";
import type { Expense, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useT } from "@/lib/i18n/store";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils/format";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-border py-2 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

/** Fiche d'une dépense. Une dépense annulée reste consultable, marquée ANNULÉE, avec son motif. */
export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useT();
  const { id } = use(params);
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "expenses.manage");

  const [expense, setExpense] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getExpense(id)
      .then(setExpense)
      .catch(() => setError(t("Dépense introuvable.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCancel(event: React.FormEvent) {
    event.preventDefault();
    if (!expense || !reason.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      setExpense(await cancelExpense(expense.id, reason.trim()));
      setIsCancelling(false);
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible d'annuler cette dépense.")));
    } finally {
      setIsSaving(false);
    }
  }

  if (!expense) {
    return error ? (
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <Link href="/expenses" className="text-sm font-medium text-primary hover:underline">
          {t("Retour aux dépenses")}
        </Link>
      </div>
    ) : (
      <p className="text-sm text-muted">{t("Chargement...")}</p>
    );
  }

  const isCancelled = expense.status === "cancelled";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/expenses" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> {t("Toutes les dépenses")}
        </Link>
        {canManage && !isCancelled && !isCancelling && (
          <div className="flex items-center gap-2">
            <Link href={`/expenses/${expense.id}/edit`}>
              <Button variant="secondary">
                <Pencil className="size-4" /> {t("Modifier")}
              </Button>
            </Link>
            <Button variant="danger" onClick={() => setIsCancelling(true)}>
              <Ban className="size-4" /> {t("Annuler cette dépense")}
            </Button>
          </div>
        )}
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {isCancelling && (
        <form onSubmit={handleCancel} className="mb-6 max-w-xl rounded-md border border-danger/30 bg-danger/5 p-4" noValidate>
          <p className="mb-3 text-sm text-foreground">
            {t("La dépense sortira des totaux et des graphiques. Elle reste au registre, marquée annulée, avec le motif.")}
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

      <article className="mx-auto max-w-2xl rounded-md border border-border bg-surface p-8 shadow-sm">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{expense.label}</h1>
            <p className="text-sm text-muted">{expense.category?.name}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-foreground">{expense.number}</p>
            <p className="text-sm text-muted">{formatDate(expense.spent_at)}</p>
            {isCancelled && (
              <Badge tone="danger" className="mt-1">
                {t("ANNULÉE")}
              </Badge>
            )}
          </div>
        </header>

        {isCancelled && (
          <p className="mt-4 rounded-md border border-danger/40 bg-danger/5 px-4 py-2 text-sm text-danger">
            {t("Dépense annulée le {date} - {reason}", {
              date: formatDateTime(expense.cancelled_at),
              reason: expense.cancellation_reason ?? "",
            })}
          </p>
        )}

        <dl className="mt-4">
          <Row label={t("Fournisseur")}>{expense.supplier_name ?? "-"}</Row>
          <Row label={t("Quantité")}>
            {expense.quantity.toLocaleString("fr-FR")}
            {expense.unit ? ` ${expense.unit}` : ""}
          </Row>
          <Row label={t("Prix unitaire")}>{formatMoney(expense.unit_price)}</Row>
          <Row label={t("Mode de paiement")}>{expense.method_label}</Row>
          <Row label={t("N° de facture ou de bon")}>{expense.invoice_reference ?? "-"}</Row>
          {expense.note && <Row label={t("Note")}>{expense.note}</Row>}
          <Row label={t("Saisie par")}>{expense.recorded_by?.name ?? "-"}</Row>
        </dl>

        <p className="mt-6 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm text-muted">{t("Montant total")}</span>
          <span className={isCancelled ? "text-2xl font-semibold text-muted line-through" : "text-2xl font-semibold text-foreground"}>
            {formatMoney(expense.amount)}
          </span>
        </p>
      </article>
    </div>
  );
}
