"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { assignTeacher, listClassAssignments, listSubjects, unassignSubject } from "@/lib/api/academics";
import { getErrorMessage } from "@/lib/api/error";
import type { StaffUser, Subject, TeachingAssignment } from "@/lib/api/types";

interface ClassAssignmentsProps {
  schoolClassId: string;
  /** Qui peut affecter (`academics.manage`) : les autres ne font que consulter. */
  canManage: boolean;
  /** Comptes enseignants proposés dans la liste (vide pour qui ne peut pas affecter). */
  teachers: StaffUser[];
  /** Pour repérer d'un coup d'œil « ses » matières. */
  currentUserId?: string;
}

/**
 * Matières d'une classe et leur enseignant. Chaque matière a au plus un
 * enseignant dans la classe : en choisir un autre remplace le précédent, et
 * « Non affecté » retire l'affectation. Un enseignant peut en revanche se voir
 * confier plusieurs matières, dans plusieurs classes.
 */
export function ClassAssignments({ schoolClassId, canManage, teachers, currentUserId }: ClassAssignmentsProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSubjectId, setPendingSubjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listSubjects({ per_page: 100 }), listClassAssignments(schoolClassId)])
      .then(([subjectPage, current]) => {
        setSubjects(subjectPage.data);
        setAssignments(current);
      })
      .catch((loadError) => setError(getErrorMessage(loadError, "Impossible de charger les matières de cette classe.")))
      .finally(() => setIsLoading(false));
  }, [schoolClassId]);

  const teacherOf = (subject: Subject) => assignments.find((assignment) => assignment.subject.id === subject.id)?.teacher ?? null;

  async function handleChange(subject: Subject, teacherId: string) {
    setError(null);
    setPendingSubjectId(subject.id);

    try {
      if (teacherId === "") {
        await unassignSubject(schoolClassId, subject.id);
        setAssignments((previous) => previous.filter((assignment) => assignment.subject.id !== subject.id));
      } else {
        const updated = await assignTeacher(schoolClassId, subject.id, teacherId);
        setAssignments((previous) => [...previous.filter((assignment) => assignment.subject.id !== subject.id), updated]);
      }
    } catch (changeError) {
      setError(getErrorMessage(changeError, "Impossible de modifier cette affectation."));
    } finally {
      setPendingSubjectId(null);
    }
  }

  const columns: DataTableColumn<Subject>[] = [
    {
      key: "subject",
      header: "Matière",
      render: (subject) => (
        <>
          <span className="font-medium">{subject.name}</span> <span className="font-mono text-xs text-muted">{subject.code}</span>
        </>
      ),
    },
    { key: "coefficient", header: "Coef.", render: (subject) => subject.coefficient },
    {
      key: "teacher",
      header: "Enseignant",
      render: (subject) => {
        const teacher = teacherOf(subject);

        if (!canManage) {
          return teacher ? (
            <span className="inline-flex items-center gap-2">
              {teacher.name}
              {teacher.id === currentUserId && <Badge tone="info">Vous</Badge>}
            </span>
          ) : (
            <span className="text-muted">Non affecté</span>
          );
        }

        return (
          <Select
            aria-label={`Enseignant de ${subject.name}`}
            value={teacher?.id ?? ""}
            disabled={pendingSubjectId === subject.id}
            onChange={(event) => handleChange(subject, event.target.value)}
            className="max-w-64"
          >
            <option value="">Non affecté</option>
            {/* Un enseignant désactivé depuis l'affectation reste affiché, sinon la valeur choisie disparaîtrait de la liste. */}
            {teacher && !teachers.some((candidate) => candidate.id === teacher.id) && <option value={teacher.id}>{teacher.name}</option>}
            {teachers.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </Select>
        );
      },
    },
  ];

  return (
    <Card accent="academics">
      <CardHeader>
        <CardTitle>Matières et enseignants</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted">
          {canManage
            ? "Choisissez l'enseignant de chaque matière dans cette classe. Une matière n'a qu'un enseignant par classe, mais un enseignant peut en avoir plusieurs, dans plusieurs classes."
            : "Les enseignants de cette classe, matière par matière."}{" "}
          {!isLoading && `${assignments.length} matière${assignments.length > 1 ? "s" : ""} sur ${subjects.length} ${assignments.length > 1 ? "ont" : "a"} un enseignant.`}
        </p>

        {error && (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <DataTable exportName="Enseignants de la classe"
          columns={columns}
          rows={subjects}
          rowKey={(subject) => subject.id}
          isLoading={isLoading}
          emptyMessage="Aucune matière n'a encore été créée."
        />
      </CardContent>
    </Card>
  );
}
