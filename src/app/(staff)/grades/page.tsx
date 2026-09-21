"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { StudentPicker } from "@/components/staff/StudentPicker";
import { Pagination } from "@/components/ui/Pagination";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { emptyPage } from "@/lib/utils/emptyPage";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { useMyAssignments } from "@/lib/hooks/useMyAssignments";
import { useSubjectOptions } from "@/lib/hooks/useSubjectOptions";
import { useTermOptions } from "@/lib/hooks/useTermOptions";
import { gradeSchema, type GradeFormInput } from "@/lib/validation/grades";
import { createGrade, deleteGrade, listGrades } from "@/lib/api/grades";
import { getErrorMessage } from "@/lib/api/error";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import type { Grade, StaffUser, Student } from "@/lib/api/types";

export default function GradesPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const allSubjects = useSubjectOptions();
  const allTerms = useTermOptions();

  // Un enseignant ne note que ce qu'il enseigne à la classe de l'élève : le serveur
  // l'impose, on ne propose donc que ces matières (et les trimestres de l'année de la classe).
  // Un administrateur, lui, n'est limité par aucune affectation.
  const isRestricted = !hasPermission(useAuthStore((state) => state.user as StaffUser | null), "academics.manage");
  const myAssignments = useMyAssignments(isRestricted);
  const classAssignments = useMemo(
    () => (myAssignments ?? []).filter((assignment) => student?.school_class && assignment.school_class?.id === student.school_class.id),
    [myAssignments, student],
  );
  const subjects = useMemo(() => {
    if (!isRestricted) return allSubjects;
    const taught = new Set(classAssignments.map((assignment) => assignment.subject.id));
    return allSubjects.filter((subject) => taught.has(subject.id));
  }, [isRestricted, allSubjects, classAssignments]);
  const terms = useMemo(() => {
    const year = classAssignments[0]?.school_class?.academic_year;
    return isRestricted && year ? allTerms.filter((term) => term.academic_year === year) : allTerms;
  }, [isRestricted, allTerms, classAssignments]);
  const cannotGrade = isRestricted && myAssignments !== null && student !== null && subjects.length === 0;

  const period = usePeriodFilter();
  const { page, perPage, setPage, setPerPage } = usePagination(`${student?.id}|${JSON.stringify(period.params)}`);
  const fetcher = useMemo(
    () => () =>
      period.isReady
        ? listGrades({ ...period.params, student_id: student?.id, page, per_page: perPage })
        : Promise.resolve(emptyPage<Grade>(perPage)),
    [period.isReady, period.params, student, page, perPage],
  );
  const { data, meta, isLoading, reload } = usePaginatedResource(fetcher, [period.isReady, period.params, student?.id, page, perPage]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GradeFormInput>({
    resolver: zodResolver(gradeSchema),
    defaultValues: { type: "devoir", max_value: "20", recorded_at: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(values: GradeFormInput) {
    if (!student) return;
    setServerError(null);

    try {
      await createGrade({
        ...values,
        student_id: student.id,
        value: Number(values.value),
        max_value: Number(values.max_value),
        comment: values.comment || null,
      });
      reset({ type: values.type, max_value: "20", recorded_at: values.recorded_at, subject_id: "", term_id: values.term_id, value: "" });
      reload();
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible d'enregistrer cette note."));
    }
  }

  async function handleDelete(grade: Grade) {
    await deleteGrade(grade.id);
    reload();
  }

  const columns: DataTableColumn<Grade>[] = [
    { key: "subject", header: "Matiere", render: (row) => row.subject.name },
    { key: "term", header: "Trimestre", render: (row) => row.term.name },
    { key: "type", header: "Type", render: (row) => (row.type === "devoir" ? "Devoir" : "Composition") },
    { key: "value", header: "Note", render: (row) => `${row.value}/${row.max_value}` },
    { key: "normalized", header: "Sur 20", render: (row) => row.normalized_on_20 },
    { key: "date", header: "Date", render: (row) => row.recorded_at },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button onClick={() => handleDelete(row)} aria-label="Supprimer la note" className="text-muted hover:text-danger">
          <Trash2 className="size-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Notes</h1>
      <p className="mb-6 text-sm text-muted">
        Consultez les notes de la période choisie, ou sélectionnez un élève pour voir ses notes et en saisir de nouvelles.
      </p>

      <PeriodFilter filter={period} className="mb-4" />

      <div className="mb-6 max-w-sm">
        <StudentPicker selected={student} onSelect={setStudent} onClear={() => setStudent(null)} />
      </div>

      {student && (
        <>
          <Card accent="grades" className="mb-6">
            <CardHeader>
              <CardTitle>Ajouter une note</CardTitle>
            </CardHeader>
            <CardContent>
              {cannotGrade ? (
                <p className="text-sm text-muted">
                  Vous n&apos;enseignez aucune matière à la classe de cet élève{student?.school_class ? ` (${student.school_class.name})` : ""} : vous ne pouvez pas
                  lui saisir de note. Un administrateur peut vous affecter à cette classe.
                </p>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6" noValidate>
                  {serverError && (
                    <div className="sm:col-span-3 lg:col-span-6">
                      <Alert>{serverError}</Alert>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="subject_id">Matiere</Label>
                    <Select id="subject_id" {...register("subject_id")}>
                      <option value="">Choisir...</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </Select>
                    <FieldError>{errors.subject_id?.message}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="term_id">Trimestre</Label>
                    <Select id="term_id" {...register("term_id")}>
                      <option value="">Choisir...</option>
                      {terms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name}
                        </option>
                      ))}
                    </Select>
                    <FieldError>{errors.term_id?.message}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select id="type" {...register("type")}>
                      <option value="devoir">Devoir</option>
                      <option value="composition">Composition</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="value">Note</Label>
                    <Input id="value" type="number" step="0.01" placeholder="14.5" {...register("value")} />
                    <FieldError>{errors.value?.message}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="max_value">Bareme</Label>
                    <Input id="max_value" type="number" step="0.01" placeholder="20" {...register("max_value")} />
                    <FieldError>{errors.max_value?.message}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="recorded_at">Date</Label>
                    <Input id="recorded_at" type="date" {...register("recorded_at")} />
                  </div>

                  <div className="sm:col-span-3 lg:col-span-6">
                    <Button type="submit" loading={isSubmitting}>
                      <Plus className="size-4" /> Enregistrer la note
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage={student ? "Aucune note pour cet élève sur cette période." : "Aucune note sur cette période."}
      />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
