"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClassAssignments } from "@/components/staff/ClassAssignments";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { getSchoolClass, updateSchoolClass } from "@/lib/api/academics";
import { getErrorMessage } from "@/lib/api/error";
import { listUsers } from "@/lib/api/users";
import type { SchoolClass, StaffUser } from "@/lib/api/types";

export default function SchoolClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAuthStore((state) => state.user as StaffUser | null);
  const canManage = hasPermission(user, "academics.manage");

  const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
  const [teachers, setTeachers] = useState<StaffUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getSchoolClass(id)
      .then(setSchoolClass)
      .catch((loadError) => setError(getErrorMessage(loadError, "Impossible de charger cette classe.")));
  }, [id]);

  useEffect(() => {
    if (!canManage) return;

    listUsers({ role: "teacher", is_active: true, per_page: 100 })
      .then((page) => setTeachers(page.data))
      .catch(() => setTeachers([]));
  }, [canManage]);

  async function handleMainTeacherChange(teacherId: string) {
    setError(null);
    setIsSaving(true);

    try {
      setSchoolClass(await updateSchoolClass(id, { main_teacher_id: teacherId || null }));
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible de modifier le titulaire."));
    } finally {
      setIsSaving(false);
    }
  }

  if (!schoolClass) {
    return error ? <Alert>{error}</Alert> : <p className="text-sm text-muted">Chargement...</p>;
  }

  const mainTeacher = schoolClass.main_teacher;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/classes" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Classes
        </Link>
        <PageHeader title={schoolClass.name} description={`${schoolClass.level} · année scolaire ${schoolClass.academic_year}`} />
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
                <option value="">Aucun</option>
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
            <p className="text-sm text-foreground">{mainTeacher?.name ?? "Aucun titulaire désigné."}</p>
          )}
        </CardContent>
      </Card>

      <ClassAssignments schoolClassId={schoolClass.id} canManage={canManage} teachers={teachers} currentUserId={user?.id} />
    </div>
  );
}
