"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Loader2, RotateCcw, Smartphone, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import {
  getMobileMoneyPayment,
  listMyMobileMoneyPayments,
  previewMyPayment,
  startMobileMoneyPayment,
} from "@/lib/api/accounting";
import { getErrorMessage } from "@/lib/api/error";
import type { MobileMoneyOperator, MobileMoneyTransaction, PaymentPeriod, PaymentPreview } from "@/lib/api/types";
import { PAYMENT_PERIOD_HINT, PAYMENT_PERIOD_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils/cn";
import { formatMoney, formatMonth } from "@/lib/utils/format";

const PERIODS: PaymentPeriod[] = ["monthly", "quarterly", "semiannual", "annual"];

const OPERATORS: Array<{ value: MobileMoneyOperator; label: string }> = [
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn_momo", label: "MTN MoMo" },
  { value: "moov_money", label: "Moov Money" },
];

interface MobileMoneyPaymentProps {
  /** Inscription (année scolaire) que l'on règle. */
  enrollmentId: string;
  /** Reste à payer sur cette inscription : à zéro, il n'y a plus rien à régler. */
  remaining: number;
  /** Appelé une fois, quand l'opérateur a confirmé : la page recharge son relevé et ses reçus. */
  onPaid: () => void;
  /** Délai entre deux interrogations de l'opérateur (ms). */
  pollIntervalMs?: number;
}

function monthsLabel(months: string[]): string {
  if (months.length === 0) return "";
  if (months.length === 1) return formatMonth(months[0]);

  return `${formatMonth(months[0])} → ${formatMonth(months[months.length - 1])}`;
}

/**
 * Paiement de la scolarité par mobile money, à l'initiative du parent : il
 * choisit la formule et son opérateur, saisit son numéro, puis valide la
 * demande sur son téléphone. Le montant est calculé par le serveur ; la page
 * interroge l'opérateur jusqu'à la confirmation, qui délivre le reçu.
 */
export function MobileMoneyPayment({ enrollmentId, remaining, onPaid, pollIntervalMs = 3000 }: MobileMoneyPaymentProps) {
  const [period, setPeriod] = useState<PaymentPeriod>("monthly");
  const [preview, setPreview] = useState<PaymentPreview | null>(null);
  const [operator, setOperator] = useState<MobileMoneyOperator>("orange_money");
  const [phone, setPhone] = useState("");
  const [transaction, setTransaction] = useState<MobileMoneyTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const notifiedRef = useRef<string | null>(null);

  // Une demande encore en attente survit à un rechargement de la page : on la reprend au lieu de proposer d'en lancer une autre.
  useEffect(() => {
    listMyMobileMoneyPayments({ per_page: 5 })
      .then((page) => {
        const pending = page.data.find((candidate) => candidate.status === "pending" && candidate.enrollment?.id === enrollmentId);
        if (pending) setTransaction(pending);
      })
      .catch(() => undefined);
  }, [enrollmentId]);

  useEffect(() => {
    if (remaining <= 0) return;

    previewMyPayment(enrollmentId, period)
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [enrollmentId, period, remaining]);

  const transactionId = transaction?.id;
  const isPending = transaction?.status === "pending";

  useEffect(() => {
    if (!transactionId || !isPending) return;

    const timer = window.setTimeout(() => {
      getMobileMoneyPayment(transactionId)
        .then(setTransaction)
        .catch(() => undefined);
    }, pollIntervalMs);

    return () => window.clearTimeout(timer);
  }, [transactionId, isPending, transaction, pollIntervalMs]);

  useEffect(() => {
    if (transaction?.status === "successful" && notifiedRef.current !== transaction.id) {
      notifiedRef.current = transaction.id;
      onPaid();
    }
  }, [transaction, onPaid]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      setTransaction(await startMobileMoneyPayment({ enrollment_id: enrollmentId, period, operator, phone }));
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Impossible de lancer le paiement."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function reset() {
    setTransaction(null);
    setError(null);
  }

  return (
    <Card accent="primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="size-5 text-primary" aria-hidden="true" />
          Payer par mobile money
        </CardTitle>
      </CardHeader>
      <CardContent>
        {remaining <= 0 ? (
          <p className="text-sm text-muted">La scolarité de cette année est entièrement réglée. Merci !</p>
        ) : transaction ? (
          <Outcome transaction={transaction} onReset={reset} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <p className="text-sm text-muted">
              Choisissez ce que vous réglez, puis validez la demande sur votre téléphone. Les mois les plus anciens sont réglés en premier.
            </p>

            {error && <Alert>{error}</Alert>}

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">Formule</legend>
              <div role="radiogroup" aria-label="Formule de paiement" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PERIODS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={period === option}
                    onClick={() => setPeriod(option)}
                    className={cn(
                      "rounded-md border px-4 py-3 text-left transition-colors",
                      period === option ? "selected-brand" : "border-border hover:bg-foreground/5",
                    )}
                  >
                    <span className="block text-sm font-semibold text-foreground">{PAYMENT_PERIOD_LABEL[option]}</span>
                    <span className="mt-0.5 block text-xs text-muted">{PAYMENT_PERIOD_HINT[option]}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {preview && preview.months.length > 0 && (
              <p className="rounded-md bg-background px-4 py-3 text-sm" aria-live="polite">
                <span className="capitalize">{monthsLabel(preview.months)}</span> · {preview.months.length} mois ·{" "}
                <span className="font-semibold text-foreground">{formatMoney(preview.amount)}</span>
              </p>
            )}

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">Opérateur</legend>
              <div role="radiogroup" aria-label="Opérateur mobile money" className="grid gap-3 sm:grid-cols-3">
                {OPERATORS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={operator === option.value}
                    onClick={() => setOperator(option.value)}
                    className={cn(
                      "rounded-md border px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors",
                      operator === option.value ? "selected-brand" : "border-border hover:bg-foreground/5",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="max-w-sm">
              <Label htmlFor="mobile-money-phone">Numéro mobile money</Label>
              <Input
                id="mobile-money-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="6XX XX XX XX"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <p className="mt-1.5 text-xs text-muted">Le numéro du compte qui paie. Vous recevrez la demande sur ce téléphone.</p>
            </div>

            <Button type="submit" loading={isSubmitting} disabled={!preview || preview.months.length === 0 || phone.trim() === ""}>
              {preview && preview.months.length > 0 ? `Payer ${formatMoney(preview.amount)}` : "Payer"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function Outcome({ transaction, onReset }: { transaction: MobileMoneyTransaction; onReset: () => void }) {
  const summary = (
    <p className="mt-1 text-sm text-muted">
      <span className="capitalize">{monthsLabel(transaction.months)}</span> · {formatMoney(transaction.amount)} · {transaction.operator_label} ·{" "}
      {transaction.phone}
    </p>
  );

  if (transaction.status === "pending") {
    return (
      <div role="status" aria-live="polite" className="flex items-start gap-3">
        <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
        <div>
          <p className="font-medium text-foreground">En attente de votre validation…</p>
          <p className="mt-1 text-sm text-muted">
            Une demande de paiement vient d&apos;être envoyée à votre téléphone. Ouvrez-la et saisissez votre code secret pour confirmer.
            Cette page se met à jour toute seule.
          </p>
          {summary}
        </div>
      </div>
    );
  }

  if (transaction.status === "successful") {
    return (
      <div role="status" className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
        <div>
          <p className="font-medium text-foreground">Paiement confirmé</p>
          <p className="mt-1 text-sm text-muted">
            Reçu <span className="font-mono text-foreground">{transaction.receipt_number}</span>. Votre relevé est à jour.
          </p>
          {summary}
          <Button variant="outline" size="sm" className="mt-3" onClick={onReset}>
            <RotateCcw className="size-4" aria-hidden="true" /> Nouveau paiement
          </Button>
        </div>
      </div>
    );
  }

  const isReview = transaction.status === "needs_review";
  const Icon = isReview ? Clock : XCircle;
  const title = {
    failed: "Paiement refusé",
    expired: "Demande expirée",
    needs_review: "Paiement à vérifier",
    pending: "",
    successful: "",
  }[transaction.status];

  return (
    <div role="alert" className="flex items-start gap-3">
      <Icon className={cn("mt-0.5 size-5 shrink-0", isReview ? "text-warning" : "text-danger")} aria-hidden="true" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted">
          {transaction.failure_reason ?? "Le paiement n'a pas abouti."}
          {isReview && " Ne renouvelez pas le paiement : la comptabilité de l'établissement vous contactera pour régulariser."}
          {!isReview && " Aucun montant n'a été imputé à votre scolarité."}
        </p>
        {summary}
        <Button variant="outline" size="sm" className="mt-3" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden="true" /> {isReview ? "Fermer" : "Réessayer"}
        </Button>
      </div>
    </div>
  );
}
