"use client";

import { use, useEffect, useState } from "react";
import { IdCard, KeyRound, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { BulletinExportButtons } from "@/components/grades/BulletinExportButtons";
import { StudentEnrollments } from "@/components/staff/StudentEnrollments";
import { StudentResultsCard } from "@/components/results/StudentResultsCard";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { getStudent, getStudentCardBlob, regenerateStudentCardToken, resetStudentPassword } from "@/lib/api/students";
import { getErrorMessage } from "@/lib/api/error";
import { downloadStudentBulletin, getStudentBulletin } from "@/lib/api/grades";
import { downloadBlob, slugify } from "@/lib/export/tableExport";
import { listAllTerms } from "@/lib/api/academics";
import type { Bulletin, StaffUser, Student, Term } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useT();
  const { id } = use(params);
  const canViewResults = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "results.view");

  const [student, setStudent] = useState<Student | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [isRegeneratingCard, setIsRegeneratingCard] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    getStudent(id).then(setStudent);
    listAllTerms().then((allTerms) => {
      setTerms(allTerms);
      const current = allTerms.find((term) => term.is_current) ?? allTerms[0];
      if (current) setSelectedTermId(current.id);
    });
  }, [id]);

  useEffect(() => {
    if (!selectedTermId) return;
    getStudentBulletin(id, selectedTermId)
      .then(setBulletin)
      .catch(() => setBulletin(null));
  }, [id, selectedTermId]);

  async function handleResetPassword() {
    const result = await resetStudentPassword(id);
    setResetPassword(result.initial_password);
  }

  async function handleDownloadCard() {
    setIsDownloadingCard(true);
    setCardError(null);

    try {
      downloadBlob(await getStudentCardBlob(id), `${slugify(`carte ${student?.matricule ?? id}`)}.pdf`);
    } catch (failure) {
      setCardError(getErrorMessage(failure, t("Impossible de télécharger la carte.")));
    } finally {
      setIsDownloadingCard(false);
    }
  }

  async function handleRegenerateCard() {
    if (!window.confirm(t("Régénérer le QR invalide la carte déjà imprimée : il faudra la réimprimer. Continuer ?"))) return;

    setIsRegeneratingCard(true);
    setCardError(null);

    try {
      await regenerateStudentCardToken(id);
    } catch (failure) {
      setCardError(getErrorMessage(failure, t("Impossible de régénérer le QR.")));
    } finally {
      setIsRegeneratingCard(false);
    }
  }

  if (!student) {
    return <p className="text-sm text-muted">{t("Chargement...")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {student.first_name} {student.last_name}
          </h1>
          <p className="mt-1 font-mono text-sm text-muted">{student.matricule}</p>
        </div>
        <Badge tone={student.is_active ? "success" : "neutral"}>{student.is_active ? t("Actif") : t("Inactif")}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card accent="primary" className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted">{t("Classe : ")}</span>
              {student.school_class?.name ?? t("Non affecté")}
            </p>
            <p>
              <span className="text-muted">{t("Naissance : ")}</span>
              {student.birth_date ?? "—"}
            </p>
            <p>
              <span className="text-muted">{t("Tuteur : ")}</span>
              {student.guardian_name}
            </p>
            <p>
              <span className="text-muted">{t("Téléphone : ")}</span>
              {student.guardian_phone}
            </p>
            <p>
              <span className="text-muted">{t("E-mail : ")}</span>
              {student.guardian_email ?? "—"}
            </p>

            <div className="flex flex-wrap gap-2 pt-3">
              <Button variant="secondary" size="sm" onClick={handleResetPassword}>
                <KeyRound className="size-4" />
                {t("Réinitialiser le mot de passe")}
              </Button>
              <Button variant="secondary" size="sm" loading={isDownloadingCard} onClick={handleDownloadCard}>
                <IdCard className="size-4" />
                {t("Carte élève (PDF)")}
              </Button>
              <Button variant="secondary" size="sm" loading={isRegeneratingCard} onClick={handleRegenerateCard}>
                <RefreshCw className="size-4" />
                {t("Régénérer le QR")}
              </Button>
            </div>
            {resetPassword && (
              <p className="mt-2 rounded-md bg-background p-2 font-mono text-xs">
                {t("Nouveau mot de passe : {password}", { password: resetPassword })}
              </p>
            )}
            {cardError && <p className="mt-2 text-xs text-danger">{cardError}</p>}
          </CardContent>
        </Card>

        <Card accent="grades" className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Bulletin</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <BulletinExportButtons
                fileName={slugify(`bulletin ${student.matricule} ${terms.find((term) => term.id === selectedTermId)?.name ?? ""}`)}
                load={(format) => downloadStudentBulletin(id, selectedTermId, format)}
                disabled={!selectedTermId || !bulletin}
              />
              <Select
                className="w-48"
                value={selectedTermId}
                onChange={(event) => setSelectedTermId(event.target.value)}
              >
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name} ({term.academic_year})
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!bulletin || bulletin.subjects.length === 0 ? (
              <p className="text-sm text-muted">{t("Aucune note pour ce trimestre.")}</p>
            ) : (
              <div className="space-y-3">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs tracking-wide text-muted uppercase">
                      <th className="py-1.5 font-medium">{t("Matière")}</th>
                      <th className="py-1.5 font-medium">{t("Coefficient")}</th>
                      <th className="py-1.5 font-medium">{t("Moyenne")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulletin.subjects.map((subject) => (
                      <tr key={subject.code} className="border-t border-border">
                        <td className="py-1.5">{subject.subject}</td>
                        <td className="py-1.5">{subject.coefficient}</td>
                        <td className="py-1.5 font-medium">{subject.average}/20</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rounded-md bg-background p-3 text-sm font-semibold text-foreground">
                  {t("Moyenne générale : {average}/20", { average: bulletin.overall_average ?? "—" })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canViewResults && <StudentResultsCard source="staff" studentId={id} />}

      <StudentEnrollments studentId={id} onEnrolled={() => getStudent(id).then(setStudent)} />
    </div>
  );
}
