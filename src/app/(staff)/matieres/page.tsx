"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { useAuthStore } from "@/lib/auth/store";
import { hasPermission } from "@/lib/auth/permissions";
import { subjectSchema, type SubjectFormInput } from "@/lib/validation/academics";
import { createSubject, deleteSubject, listSubjects } from "@/lib/api/academics";
import { getErrorMessage } from "@/lib/api/error";
import type { StaffUser, Subject } from "@/lib/api/types";

export default function SubjectsPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "academics.manage");

  const { page, perPage, setPage, setPerPage } = usePagination();
  const { data, meta, isLoading, reload } = usePaginatedResource(
    () => listSubjects({ page, per_page: perPage }),
    [page, perPage],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormInput>({ resolver: zodResolver(subjectSchema), defaultValues: { coefficient: "1" } });

  async function onSubmit(values: SubjectFormInput) {
    setServerError(null);

    try {
      await createSubject({ ...values, coefficient: Number(values.coefficient) });
      reset({ coefficient: "1", name: "", code: "" });
      reload();
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible de creer cette matiere."));
    }
  }

  async function handleDelete(subject: Subject) {
    await deleteSubject(subject.id);
    reload();
  }

  const columns: DataTableColumn<Subject>[] = [
    { key: "name", header: "Nom", render: (row) => row.name },
    { key: "code", header: "Code", render: (row) => row.code },
    { key: "coefficient", header: "Coefficient", render: (row) => row.coefficient },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            render: (row: Subject) => (
              <button onClick={() => handleDelete(row)} aria-label="Supprimer la matiere" className="text-muted hover:text-danger">
                <Trash2 className="size-4" />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Matieres</h1>

      {canManage && (
        <Card accent="academics" className="mb-6">
          <CardHeader>
            <CardTitle>Nouvelle matiere</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-4" noValidate>
              {serverError && (
                <div className="sm:col-span-4">
                  <Alert>{serverError}</Alert>
                </div>
              )}

              <div>
                <Label htmlFor="name">Nom</Label>
                <Input id="name" placeholder="Mathematiques" {...register("name")} />
                <FieldError>{errors.name?.message}</FieldError>
              </div>

              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" placeholder="MATH" {...register("code")} />
                <FieldError>{errors.code?.message}</FieldError>
              </div>

              <div>
                <Label htmlFor="coefficient">Coefficient</Label>
                <Input id="coefficient" type="number" step="0.5" placeholder="2" {...register("coefficient")} />
                <FieldError>{errors.coefficient?.message}</FieldError>
              </div>

              <div className="flex items-end">
                <Button type="submit" loading={isSubmitting} className="w-full">
                  <Plus className="size-4" /> Creer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
