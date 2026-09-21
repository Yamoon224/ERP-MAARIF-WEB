"use client";

import { use, useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { BulletinExportButtons } from "@/components/grades/BulletinExportButtons";
import { StudentEnrollments } from "@/components/staff/StudentEnrollments";
import { StudentResultsCard } from "@/components/results/StudentResultsCard";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { getStudent, resetStudentPassword } from "@/lib/api/students";
import { downloadStudentBulletin, getStudentBulletin } from "@/lib/api/grades";
import { slugify } from "@/lib/export/tableExport";
import { listAllTerms } from "@/lib/api/academics";
import type { Bulletin, StaffUser, Student, Term } from "@/lib/api/types";

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const canViewResults = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "results.view");

  const [student, setStudent] = useState<Student | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [resetPassword, setResetPassword] = useState<string | null>(null);

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

  if (!student) {
    return <p className="text-sm text-muted">Chargement...</p>;
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
        <Badge tone={student.is_active ? "success" : "neutral"}>{student.is_active ? "Actif" : "Inactif"}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card accent="primary" className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted">Classe : </span>
              {student.school_class?.name ?? "Non affecte"}
            </p>
            <p>
              <span className="text-muted">Naissance : </span>
              {student.birth_date ?? "—"}
            </p>
            <p>
              <span className="text-muted">Tuteur : </span>
              {student.guardian_name}
            </p>
            <p>
              <span className="text-muted">Telephone : </span>
              {student.guardian_phone}
            </p>
            <p>
              <span className="text-muted">E-mail : </span>
              {student.guardian_email ?? "—"}
            </p>

            <div className="pt-3">
              <Button variant="secondary" size="sm" onClick={handleResetPassword}>
                <KeyRound className="size-4" />
                Reinitialiser le mot de passe
              </Button>
              {resetPassword && (
                <p className="mt-2 rounded-md bg-background p-2 font-mono text-xs">Nouveau mot de passe : {resetPassword}</p>
              )}
            </div>
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
              <p className="text-sm text-muted">Aucune note pour ce trimestre.</p>
            ) : (
              <div className="space-y-3">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs tracking-wide text-muted uppercase">
                      <th className="py-1.5 font-medium">Matiere</th>
                      <th className="py-1.5 font-medium">Coefficient</th>
                      <th className="py-1.5 font-medium">Moyenne</th>
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
                  Moyenne generale : {bulletin.overall_average}/20
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
