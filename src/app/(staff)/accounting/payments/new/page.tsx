"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { TuitionStatementView } from "@/components/accounting/TuitionStatementView";
import { StudentPicker } from "@/components/staff/StudentPicker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { createPayment, getTuitionStatement, previewPayment } from "@/lib/api/accounting";
import { getErrorMessage } from "@/lib/api/error";
import { listEnrollments } from "@/lib/api/students";
import type { Enrollment, PaymentMethod, PaymentPeriod, PaymentPreview, StaffUser, Student, TuitionStatement } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { PAYMENT_METHOD_LABEL, PAYMENT_PERIOD_HINT, PAYMENT_PERIOD_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils/cn";
import { formatMoney, formatMonth, today } from "@/lib/utils/format";

const PERIODS = Object.keys(PAYMENT_PERIOD_LABEL) as PaymentPeriod[];

/**
 * Encaissement de la scolarité : on choisit l'élève et l'année, on voit son
 * relevé, puis la formule (mois, trimestre, semestre ou année). Les mois
 * réglés et le montant sont calculés par le serveur — l'aperçu les montre
 * avant de valider, la saisie ne les modifie pas.
 */
export default function NewPaymentPage() {
  const router = useRouter();
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "accounting.manage");

  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [statement, setStatement] = useState<TuitionStatement | null>(null);

  const [period, setPeriod] = useState<PaymentPeriod>("monthly");
  const [preview, setPreview] = useState<PaymentPreview | null>(null);

  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(() => today());
  const [note, setNote] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnrollments([]);
    setEnrollmentId("");
    setStatement(null);
    if (!student) return;

    listEnrollments(student.id)
      .then((loaded) => {
        setEnrollments(loaded);
        setEnrollmentId(loaded[0]?.id ?? "");
      })
      .catch(() => setError("Impossible de charger les inscriptions de l'élève."));
  }, [student]);

  useEffect(() => {
    setStatement(null);
    if (!enrollmentId) return;

    let cancelled = false;
    getTuitionStatement(enrollmentId)
      .then((loaded) => {
        if (!cancelled) setStatement(loaded);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger le relevé de scolarité.");
      });

    return () => {
      cancelled = true;
    };
  }, [enrollmentId]);

  const remaining = statement?.totals.remaining ?? 0;
  const canPay = statement !== null && statement.installments.length > 0 && remaining > 0;

  useEffect(() => {
    setPreview(null);
    if (!enrollmentId || !canPay) return;

    let cancelled = false;
    previewPayment(enrollmentId, period)
      .then((loaded) => {
        if (!cancelled) setPreview(loaded);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      });

    return () => {
      cancelled = true;
    };
  }, [enrollmentId, period, canPay, statement]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!enrollmentId) return;

    setIsSaving(true);
    setError(null);

    try {
      const payment = await createPayment({
        enrollment_id: enrollmentId,
        period,
        method,
        reference: reference || null,
        paid_at: paidAt || null,
        note: note || null,
      });
      router.push(`/accounting/payments/${payment.id}`);
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible d'enregistrer ce paiement."));
      setIsSaving(false);
    }
  }

  if (!canManage) {
    return <Alert>Vous n&apos;avez pas le droit d&apos;encaisser des paiements.</Alert>;
  }

  const shortfall = preview && preview.requested_months !== null && preview.months.length < preview.requested_months;

  return (
    <div>
      <Link href="/accounting/payments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Tous les paiements
      </Link>
      <PageHeader title="Nouveau paiement" description="La scolarité est mensuelle : choisissez combien de mois la famille règle d'un coup." />

      <div className="mb-6 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div>
          <Label>Élève</Label>
          <StudentPicker selected={student} onSelect={setStudent} onClear={() => setStudent(null)} />
        </div>

        {student && (
          <div>
            <Label htmlFor="enrollment">Année scolaire</Label>
            <Select id="enrollment" value={enrollmentId} onChange={(event) => setEnrollmentId(event.target.value)} disabled={enrollments.length === 0}>
              {enrollments.length === 0 && <option value="">Aucune inscription</option>}
              {enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollment.academic_year} · {enrollment.school_class?.name ?? "classe supprimée"}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {student && enrollments.length === 0 && (
        <Alert className="mb-4">Cet élève n&apos;est inscrit dans aucune classe : inscrivez-le depuis son dossier avant d&apos;encaisser.</Alert>
      )}

      {statement && (
        <div className="space-y-6">
          <section aria-labelledby="statement-heading">
            <h2 id="statement-heading" className="mb-3 text-base font-semibold text-foreground">
              Relevé de scolarité
            </h2>
            <TuitionStatementView statement={statement} receiptHref={(id) => `/accounting/payments/${id}`} />
          </section>

          {statement.installments.length === 0 && (
            <Alert>
              Aucune échéance : fixez d&apos;abord la scolarité mensuelle de la classe dans{" "}
              <Link href="/accounting/fees" className="font-medium underline">
                Frais de scolarité
              </Link>
              , et vérifiez que les trimestres de l&apos;année sont définis.
            </Alert>
          )}

          {statement.installments.length > 0 && remaining === 0 && (
            <p className="rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
              La scolarité de cette année est entièrement réglée.
            </p>
          )}

          {canPay && (
            <form onSubmit={handleSubmit} noValidate>
              <Card accent="accounting">
                <CardHeader>
                  <CardTitle>Formule de paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
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
                          period === option ? "border-primary bg-primary/10" : "border-border hover:bg-foreground/5",
                        )}
                      >
                        <span className="block text-sm font-semibold text-foreground">{PAYMENT_PERIOD_LABEL[option]}</span>
                        <span className="mt-0.5 block text-xs text-muted">{PAYMENT_PERIOD_HINT[option]}</span>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-md bg-background p-4 text-sm" aria-live="polite">
                    {preview ? (
                      <>
                        <p className="text-foreground">
                          <span className="font-medium">{preview.months.length} mois :</span>{" "}
                          {preview.months.map((month) => formatMonth(month)).join(", ")}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">Montant à encaisser : {formatMoney(preview.amount)}</p>
                        {shortfall && (
                          <p className="mt-1 text-xs text-warning">
                            Il ne reste que {preview.months.length} mois à payer : la formule règle seulement ce qui reste.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted">Calcul du montant...</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label htmlFor="method">Mode de paiement</Label>
                      <Select id="method" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
                        {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((key) => (
                          <option key={key} value={key}>
                            {PAYMENT_METHOD_LABEL[key]}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reference">Référence (optionnel)</Label>
                      <Input id="reference" value={reference} maxLength={100} placeholder="N° de transaction, de chèque..." onChange={(event) => setReference(event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="paid_at">Date du paiement</Label>
                      <Input id="paid_at" type="date" value={paidAt} max={today()} onChange={(event) => setPaidAt(event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="note">Note (optionnel)</Label>
                      <Input id="note" value={note} maxLength={255} onChange={(event) => setNote(event.target.value)} />
                    </div>
                  </div>

                  <Button type="submit" loading={isSaving} disabled={!preview}>
                    <Check className="size-4" /> Encaisser {preview ? formatMoney(preview.amount) : ""}
                  </Button>
                </CardContent>
              </Card>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
