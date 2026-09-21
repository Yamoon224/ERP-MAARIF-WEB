"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { useAuthStore } from "@/lib/auth/store";
import { hasPermission } from "@/lib/auth/permissions";
import { termSchema, type TermFormInput } from "@/lib/validation/academics";
import { createTerm, deleteTerm, listAcademicYears, listTermsPaginated } from "@/lib/api/academics";
import { getErrorMessage } from "@/lib/api/error";
import type { AcademicYear, StaffUser, Term } from "@/lib/api/types";

export default function TermsPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "academics.manage");

  useEffect(() => {
    listAcademicYears()
      .then(setYears)
      .catch(() => setYears([]));
  }, []);

  const { page, perPage, setPage, setPerPage } = usePagination(academicYear);
  const { data, meta, isLoading, reload } = usePaginatedResource(
    () => listTermsPaginated({ academic_year: academicYear || undefined, page, per_page: perPage }),
    [academicYear, page, perPage],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TermFormInput>({ resolver: zodResolver(termSchema) });

  async function onSubmit(values: TermFormInput) {
    setServerError(null);

    try {
      await createTerm(values);
      reset();
      reload();
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible de creer ce trimestre."));
    }
  }

  async function handleDelete(term: Term) {
    await deleteTerm(term.id);
    reload();
  }

  const columns: DataTableColumn<Term>[] = [
    { key: "name", header: "Nom", render: (row) => row.name },
    { key: "year", header: "Année scolaire", render: (row) => row.academic_year },
    { key: "starts", header: "Début", render: (row) => row.starts_at },
    { key: "ends", header: "Fin", render: (row) => row.ends_at },
    { key: "current", header: "Courant", render: (row) => (row.is_current ? <Badge tone="success">Courant</Badge> : "—") },
    {
      key: "details",
      header: "",
      render: (row: Term) => (
        <Link
          href={`/terms/${row.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          aria-label={`Voir les détails du ${row.name} ${row.academic_year}`}
        >
          <Eye className="size-4" aria-hidden="true" /> Détails
        </Link>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            render: (row: Term) => (
              <button onClick={() => handleDelete(row)} aria-label="Supprimer le trimestre" className="text-muted hover:text-danger">
                <Trash2 className="size-4" />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Trimestres</h1>
          <p className="mt-1 text-sm text-muted">
            Une année scolaire compte trois trimestres. Ouvrez un trimestre pour voir ses classes, matières, élèves, notes, sanctions,
            convocations et présences.
          </p>
        </div>
        <label className="flex flex-col text-xs font-medium text-muted">
          Année scolaire
          <Select className="mt-1 h-9 w-44" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
            <option value="">Toutes les années</option>
            {years.map((year) => (
              <option key={year.label} value={year.label}>
                {year.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {canManage && (
        <Card accent="academics" className="mb-6">
          <CardHeader>
            <CardTitle>Nouveau trimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-5" noValidate>
              {serverError && (
                <div className="sm:col-span-5">
                  <Alert>{serverError}</Alert>
                </div>
              )}

              <div>
                <Label htmlFor="name">Nom</Label>
                <Input id="name" placeholder="1er trimestre" {...register("name")} />
                <FieldError>{errors.name?.message}</FieldError>
              </div>

              <div>
                <Label htmlFor="academic_year">Annee scolaire</Label>
                <Input id="academic_year" placeholder="2025-2026" {...register("academic_year")} />
                <FieldError>{errors.academic_year?.message}</FieldError>
              </div>

              <div>
                <Label htmlFor="starts_at">Debut</Label>
                <Input id="starts_at" type="date" {...register("starts_at")} />
                <FieldError>{errors.starts_at?.message}</FieldError>
              </div>

              <div>
                <Label htmlFor="ends_at">Fin</Label>
                <Input id="ends_at" type="date" {...register("ends_at")} />
                <FieldError>{errors.ends_at?.message}</FieldError>
              </div>

              <div className="flex items-end">
                <Button type="submit" loading={isSubmitting} className="w-full">
                  <Plus className="size-4" /> Creer
                </Button>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-5">
                <input type="checkbox" {...register("is_current")} className="size-4 rounded border-border" />
                Definir comme trimestre courant
              </label>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
