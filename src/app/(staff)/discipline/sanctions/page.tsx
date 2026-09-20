"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { StudentPicker } from "@/components/staff/StudentPicker";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { sanctionSchema, type SanctionFormInput } from "@/lib/validation/discipline";
import { createSanction, listSanctions } from "@/lib/api/discipline";
import { getErrorMessage } from "@/lib/api/error";
import type { Sanction, Student } from "@/lib/api/types";

export default function SanctionsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const fetcher = useMemo(() => () => listSanctions({ student_id: student?.id }), [student]);
  const { data, isLoading, reload } = usePaginatedResource(fetcher, [student?.id]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SanctionFormInput>({ resolver: zodResolver(sanctionSchema), defaultValues: { type: "avertissement" } });

  async function onSubmit(values: SanctionFormInput) {
    if (!student) return;
    setServerError(null);

    try {
      await createSanction({ ...values, student_id: student.id, end_date: values.end_date || null });
      reset({ type: "avertissement" });
      reload();
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible d'enregistrer cette sanction."));
    }
  }

  const columns: DataTableColumn<Sanction>[] = [
    { key: "student", header: "Eleve", render: (row) => row.student.name },
    { key: "type", header: "Type", render: (row) => <Badge tone="danger">{row.type_label}</Badge> },
    { key: "reason", header: "Motif", render: (row) => row.reason },
    { key: "start_date", header: "Debut", render: (row) => row.start_date },
    { key: "end_date", header: "Fin", render: (row) => row.end_date ?? "—" },
    { key: "notified", header: "Tuteur notifie", render: (row) => (row.notified_at ? "Oui" : "Non") },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Sanctions disciplinaires</h1>
      <p className="mb-6 text-sm text-muted">
        La creation d&apos;une sanction notifie immediatement le tuteur par e-mail ou SMS.
      </p>

      <div className="mb-6 max-w-sm">
        <StudentPicker selected={student} onSelect={setStudent} onClear={() => setStudent(null)} />
      </div>

      {student && (
        <>
          <Card accent="discipline" className="mb-6">
            <CardHeader>
              <CardTitle>Nouvelle sanction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-4" noValidate>
                {serverError && (
                  <div className="sm:col-span-4">
                    <Alert>{serverError}</Alert>
                  </div>
                )}

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select id="type" {...register("type")}>
                    <option value="avertissement">Avertissement</option>
                    <option value="exclusion_temporaire">Exclusion temporaire</option>
                    <option value="renvoi_definitif">Renvoi definitif</option>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="reason">Motif</Label>
                  <Input id="reason" placeholder="Motif de la sanction" {...register("reason")} />
                  <FieldError>{errors.reason?.message}</FieldError>
                </div>

                <div>
                  <Label htmlFor="start_date">Date de debut</Label>
                  <Input id="start_date" type="date" {...register("start_date")} />
                  <FieldError>{errors.start_date?.message}</FieldError>
                </div>

                <div>
                  <Label htmlFor="end_date">Date de fin (optionnel)</Label>
                  <Input id="end_date" type="date" {...register("end_date")} />
                </div>

                <div className="flex items-end sm:col-span-3">
                  <Button type="submit" variant="danger" loading={isSubmitting}>
                    <ShieldAlert className="size-4" /> Enregistrer et notifier le tuteur
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune sanction pour cet eleve." />
        </>
      )}
    </div>
  );
}
