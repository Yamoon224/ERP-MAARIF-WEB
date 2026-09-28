"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { StudentPicker } from "@/components/staff/StudentPicker";
import { Pagination } from "@/components/ui/Pagination";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { emptyPage } from "@/lib/utils/emptyPage";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { summonSchema, type SummonFormInput } from "@/lib/validation/discipline";
import { createSummon, listSummons } from "@/lib/api/discipline";
import { getErrorMessage } from "@/lib/api/error";
import { useT } from "@/lib/i18n/store";
import type { Student, Summon, SummonStatus } from "@/lib/api/types";

const STATUS_TONE: Record<SummonStatus, "warning" | "success" | "neutral"> = {
  pending: "warning",
  done: "success",
  cancelled: "neutral",
};

const STATUS_LABEL: Record<SummonStatus, string> = {
  pending: "En attente",
  done: "Réalisée",
  cancelled: "Annulée",
};

export default function SummonsPage() {
  const { t } = useT();
  const [student, setStudent] = useState<Student | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const period = usePeriodFilter();
  const { page, perPage, setPage, setPerPage } = usePagination(`${student?.id}|${JSON.stringify(period.params)}`);
  const fetcher = useMemo(
    () => () =>
      period.isReady
        ? listSummons({ ...period.params, student_id: student?.id, page, per_page: perPage })
        : Promise.resolve(emptyPage<Summon>(perPage)),
    [period.isReady, period.params, student, page, perPage],
  );
  const { data, meta, isLoading, reload } = usePaginatedResource(fetcher, [period.isReady, period.params, student?.id, page, perPage]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SummonFormInput>({ resolver: zodResolver(summonSchema) });

  async function onSubmit(values: SummonFormInput) {
    if (!student) return;
    setServerError(null);

    try {
      await createSummon({ ...values, student_id: student.id, location: values.location || null });
      reset();
      reload();
    } catch (error) {
      setServerError(getErrorMessage(error, t("Impossible de créer cette convocation.")));
    }
  }

  const columns: DataTableColumn<Summon>[] = [
    { key: "student", header: "Élève", render: (row) => row.student.name },
    { key: "reason", header: "Motif", render: (row) => row.reason },
    { key: "date", header: "Date prévue", render: (row) => new Date(row.scheduled_at).toLocaleString("fr-FR") },
    { key: "status", header: "Statut", render: (row) => <Badge tone={STATUS_TONE[row.status]}>{t(STATUS_LABEL[row.status])}</Badge> },
    { key: "notified", header: "Tuteur notifié", render: (row) => (row.notified_at ? t("Oui") : t("Non")) },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">{t("Convocations")}</h1>
      <p className="mb-6 text-sm text-muted">{t("La création d'une convocation notifie immédiatement le tuteur par e-mail ou SMS.")}</p>

      <PeriodFilter filter={period} className="mb-4" />

      <div className="mb-6 max-w-sm">
        <StudentPicker selected={student} onSelect={setStudent} onClear={() => setStudent(null)} />
      </div>

      {student && (
        <>
          <Card accent="discipline" className="mb-6">
            <CardHeader>
              <CardTitle>Nouvelle convocation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3" noValidate>
                {serverError && (
                  <div className="sm:col-span-3">
                    <Alert>{serverError}</Alert>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <Label htmlFor="reason">Motif</Label>
                  <Input id="reason" placeholder={t("Motif de la convocation")} {...register("reason")} />
                  <FieldError>{errors.reason?.message}</FieldError>
                </div>

                <div>
                  <Label htmlFor="scheduled_at">Date et heure</Label>
                  <Input id="scheduled_at" type="datetime-local" {...register("scheduled_at")} />
                  <FieldError>{errors.scheduled_at?.message}</FieldError>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="location">Lieu (optionnel)</Label>
                  <Input id="location" placeholder={t("Bureau de la direction")} {...register("location")} />
                </div>

                <div className="flex items-end sm:col-span-3">
                  <Button type="submit" loading={isSubmitting}>
                    <Megaphone className="size-4" /> {t("Convoquer et notifier le tuteur")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      <DataTable exportName="Convocations"
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage={
          student ? t("Aucune convocation pour cet élève sur cette période.") : t("Aucune convocation sur cette période.")
        }
      />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
