"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { TuitionStatementView } from "@/components/accounting/TuitionStatementView";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { getTuitionStatement } from "@/lib/api/accounting";
import { getErrorMessage } from "@/lib/api/error";
import { enrollStudent, listEnrollments } from "@/lib/api/students";
import type { Enrollment, StaffUser, TuitionStatement } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useSchoolClassOptions } from "@/lib/hooks/useSchoolClassOptions";
import { formatDate, formatMoney } from "@/lib/utils/format";

interface StudentEnrollmentsProps {
  studentId: string;
  /** Appelé après une réinscription : le dossier de l'élève affiche alors sa nouvelle classe. */
  onEnrolled: () => void;
}

/**
 * Inscriptions de l'élève : une par année scolaire (l'année entière, donc les
 * trois trimestres). Permet la réinscription dans une classe d'une nouvelle
 * année, et montre la scolarité de l'année choisie à qui a accès à la comptabilité.
 */
export function StudentEnrollments({ studentId, onEnrolled }: StudentEnrollmentsProps) {
  const user = useAuthStore((state) => state.user as StaffUser | null);
  const canEnroll = hasPermission(user, "students.manage");
  const canSeeTuition = hasPermission(user, "accounting.view");

  const classes = useSchoolClassOptions();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [statement, setStatement] = useState<TuitionStatement | null>(null);
  const [schoolClassId, setSchoolClassId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    listEnrollments(studentId)
      .then((loaded) => {
        setEnrollments(loaded);
        setSelectedId((current) => (loaded.some((enrollment) => enrollment.id === current) ? current : (loaded[0]?.id ?? "")));
      })
      .catch(() => setEnrollments([]));
  }, [studentId, reloadToken]);

  useEffect(() => {
    setStatement(null);
    if (!canSeeTuition || !selectedId) return;

    let cancelled = false;
    getTuitionStatement(selectedId)
      .then((loaded) => {
        if (!cancelled) setStatement(loaded);
      })
      .catch(() => {
        if (!cancelled) setStatement(null);
      });

    return () => {
      cancelled = true;
    };
  }, [canSeeTuition, selectedId, reloadToken]);

  // Les classes proposées : celles des années où l'élève n'a pas encore de classe, plus les autres classes de ses années (transfert).
  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => b.academic_year.localeCompare(a.academic_year) || a.name.localeCompare(b.name)),
    [classes],
  );

  async function handleEnroll(event: React.FormEvent) {
    event.preventDefault();
    if (!schoolClassId) return;

    setIsSaving(true);
    setError(null);

    try {
      await enrollStudent(studentId, schoolClassId);
      setSchoolClassId("");
      setReloadToken((token) => token + 1);
      onEnrolled();
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible d'inscrire l'élève dans cette classe."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card accent="academics">
      <CardHeader>
        <CardTitle>Inscriptions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted">On s&apos;inscrit pour une année scolaire entière : les trois trimestres et la scolarité s&apos;y rattachent.</p>

        {enrollments.length === 0 ? (
          <p className="text-sm text-muted">Aucune inscription enregistrée.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
                  <th className="px-4 py-2.5 font-medium">Année scolaire</th>
                  <th className="px-4 py-2.5 font-medium">Classe</th>
                  <th className="px-4 py-2.5 font-medium">Inscrit le</th>
                  {canSeeTuition && <th className="px-4 py-2.5 font-medium">Scolarité mensuelle</th>}
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    className={
                      enrollment.id === selectedId
                        ? "border-b border-border bg-primary/5 last:border-0"
                        : "border-b border-border last:border-0 hover:bg-background"
                    }
                  >
                    <td className="px-4 py-2.5 font-medium">
                      {canSeeTuition ? (
                        <button type="button" onClick={() => setSelectedId(enrollment.id)} className="hover:text-primary hover:underline">
                          {enrollment.academic_year}
                        </button>
                      ) : (
                        enrollment.academic_year
                      )}
                    </td>
                    <td className="px-4 py-2.5">{enrollment.school_class?.name ?? "—"}</td>
                    <td className="px-4 py-2.5">{formatDate(enrollment.enrolled_on)}</td>
                    {canSeeTuition && (
                      <td className="px-4 py-2.5">
                        {enrollment.school_class && enrollment.school_class.monthly_fee > 0 ? formatMoney(enrollment.school_class.monthly_fee) : "Non fixée"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canEnroll && (
          <form onSubmit={handleEnroll} className="flex flex-wrap items-end gap-3" noValidate>
            <label className="text-xs font-medium text-muted">
              Réinscrire dans une classe
              <Select className="mt-1 h-9 w-64" value={schoolClassId} onChange={(event) => setSchoolClassId(event.target.value)}>
                <option value="">Choisir une classe...</option>
                {sortedClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name} ({schoolClass.academic_year})
                  </option>
                ))}
              </Select>
            </label>
            <Button type="submit" size="sm" loading={isSaving} disabled={!schoolClassId}>
              <RefreshCw className="size-4" /> Inscrire
            </Button>
          </form>
        )}

        {error && <Alert>{error}</Alert>}

        {canSeeTuition && statement && (
          <section aria-labelledby="student-tuition-heading" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="student-tuition-heading" className="text-sm font-semibold text-foreground">
                Scolarité {statement.enrollment.academic_year}
              </h3>
              {hasPermission(user, "accounting.manage") && statement.totals.remaining > 0 && (
                <Link href="/comptabilite/paiements/nouveau" className="text-sm font-medium text-primary hover:underline">
                  Encaisser un paiement →
                </Link>
              )}
            </div>
            <TuitionStatementView statement={statement} receiptHref={(paymentId) => `/comptabilite/paiements/${paymentId}`} />
          </section>
        )}
      </CardContent>
    </Card>
  );
}
