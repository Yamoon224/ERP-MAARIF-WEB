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
import { schoolClassSchema, type SchoolClassFormInput } from "@/lib/validation/academics";
import { createSchoolClass, deleteSchoolClass, listSchoolClasses } from "@/lib/api/academics";
import { getErrorMessage } from "@/lib/api/error";
import type { SchoolClass, StaffUser } from "@/lib/api/types";

export default function SchoolClassesPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "academics.manage");

  const { page, perPage, setPage, setPerPage } = usePagination();
  const { data, meta, isLoading, reload } = usePaginatedResource(
    () => listSchoolClasses({ page, per_page: perPage }),
    [page, perPage],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SchoolClassFormInput>({ resolver: zodResolver(schoolClassSchema) });

  async function onSubmit(values: SchoolClassFormInput) {
    setServerError(null);

    try {
      await createSchoolClass(values);
      reset();
      reload();
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible de creer cette classe."));
    }
  }

  async function handleDelete(schoolClass: SchoolClass) {
    await deleteSchoolClass(schoolClass.id);
    reload();
  }

  const columns: DataTableColumn<SchoolClass>[] = [
    { key: "name", header: "Nom", render: (row) => row.name },
    { key: "level", header: "Niveau", render: (row) => row.level },
    { key: "year", header: "Annee scolaire", render: (row) => row.academic_year },
    { key: "students", header: "Effectif", render: (row) => row.students_count ?? "—" },
    { key: "teacher", header: "Titulaire", render: (row) => row.main_teacher?.name ?? "—" },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            render: (row: SchoolClass) => (
              <button onClick={() => handleDelete(row)} aria-label="Supprimer la classe" className="text-muted hover:text-danger">
                <Trash2 className="size-4" />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Classes</h1>

      {canManage && (
        <Card accent="academics" className="mb-6">
          <CardHeader>
            <CardTitle>Nouvelle classe</CardTitle>
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
                <Input id="name" placeholder="6eme A" {...register("name")} />
                <FieldError>{errors.name?.message}</FieldError>
              </div>

              <div>
                <Label htmlFor="level">Niveau</Label>
                <Input id="level" placeholder="6eme" {...register("level")} />
                <FieldError>{errors.level?.message}</FieldError>
              </div>

              <div>
                <Label htmlFor="academic_year">Annee scolaire</Label>
                <Input id="academic_year" placeholder="2025-2026" {...register("academic_year")} />
                <FieldError>{errors.academic_year?.message}</FieldError>
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
