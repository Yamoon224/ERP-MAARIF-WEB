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
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { useSubjectOptions } from "@/lib/hooks/useSubjectOptions";
import { useTermOptions } from "@/lib/hooks/useTermOptions";
import { gradeSchema, type GradeFormInput } from "@/lib/validation/grades";
import { createGrade, deleteGrade, listGrades } from "@/lib/api/grades";
import { getErrorMessage } from "@/lib/api/error";
import type { Grade, Student } from "@/lib/api/types";

export default function GradesPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const subjects = useSubjectOptions();
  const terms = useTermOptions();

  const fetcher = useMemo(
    () => () => listGrades({ student_id: student?.id, per_page: 20 }),
    [student],
  );
  const { data, isLoading, reload } = usePaginatedResource(fetcher, [student?.id]);

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
      <p className="mb-6 text-sm text-muted">Selectionnez un eleve pour consulter et saisir ses notes.</p>

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
            </CardContent>
          </Card>

          <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune note enregistree pour cet eleve." />
        </>
      )}
    </div>
  );
}
