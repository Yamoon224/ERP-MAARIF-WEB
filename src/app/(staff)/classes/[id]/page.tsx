"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, IdCard } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClassAssignments } from "@/components/staff/ClassAssignments";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { getSchoolClass, updateSchoolClass } from "@/lib/api/academics";
import { getErrorMessage } from "@/lib/api/error";
import { getClassCardsBlob } from "@/lib/api/students";
import { downloadBlob, slugify } from "@/lib/export/tableExport";
import { listUsers } from "@/lib/api/users";
import type { SchoolClass, StaffUser } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";

export default function SchoolClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useT();
  const { id } = use(params);
  const user = useAuthStore((state) => state.user as StaffUser | null);
  const canManage = hasPermission(user, "academics.manage");
  const canPrintCards = hasPermission(user, "students.manage");

  const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
  const [teachers, setTeachers] = useState<StaffUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingCards, setIsDownloadingCards] = useState(false);

  useEffect(() => {
    getSchoolClass(id)
      .then(setSchoolClass)
      .catch((loadError) => setError(getErrorMessage(loadError, t("Impossible de charger cette classe."))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!canManage) return;

    // Filtre côté client : le serveur compare `is_active` à la chaîne « true » et ne renverrait personne.
    listUsers({ role: "teacher", per_page: 100 })
      .then((page) => setTeachers(page.data.filter((teacher) => teacher.is_active !== false)))
      .catch(() => setTeachers([]));
  }, [canManage]);

  async function handleMainTeacherChange(teacherId: string) {
    setError(null);
    setIsSaving(true);

    try {
      setSchoolClass(await updateSchoolClass(id, { main_teacher_id: teacherId || null }));
    } catch (saveError) {
      setError(getErrorMessage(saveError, t("Impossible de modifier le titulaire.")));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadCards() {
    setIsDownloadingCards(true);
    setError(null);

    try {
      downloadBlob(await getClassCardsBlob(id), `${slugify(`cartes ${schoolClass?.name ?? id}`)}.pdf`);
    } catch (downloadError) {
      setError(getErrorMessage(downloadError, t("Impossible de télécharger les cartes.")));
    } finally {
      setIsDownloadingCards(false);
    }
  }

  if (!schoolClass) {
    return error ? <Alert>{error}</Alert> : <p className="text-sm text-muted">{t("Chargement...")}</p>;
  }

  const mainTeacher = schoolClass.main_teacher;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/classes" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> {t("Classes")}
        </Link>
        <PageHeader
          title={schoolClass.name}
          description={t("{level} · année scolaire {year}", { level: schoolClass.level, year: schoolClass.academic_year })}
          actions={
            canPrintCards && (
              <Button variant="secondary" loading={isDownloadingCards} onClick={handleDownloadCards}>
                <IdCard className="size-4" /> {t("Cartes élèves (PDF)")}
              </Button>
            )
          }
        />
      </div>

      {error && <Alert>{error}</Alert>}

      <Card accent="users">
        <CardHeader>
          <CardTitle>Titulaire</CardTitle>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <div className="max-w-sm">
              <Label htmlFor="main_teacher_id">Enseignant titulaire de la classe</Label>
              <Select
                id="main_teacher_id"
                value={mainTeacher?.id ?? ""}
                disabled={isSaving}
                onChange={(event) => handleMainTeacherChange(event.target.value)}
              >
                <option value="">{t("Aucun")}</option>
                {mainTeacher && !teachers.some((teacher) => teacher.id === mainTeacher.id) && (
                  <option value={mainTeacher.id}>{mainTeacher.name}</option>
                )}
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <p className="text-sm text-foreground">{mainTeacher?.name ?? t("Aucun titulaire désigné.")}</p>
          )}
        </CardContent>
      </Card>

      <ClassAssignments schoolClassId={schoolClass.id} canManage={canManage} teachers={teachers} currentUserId={user?.id} />
    </div>
  );
}
