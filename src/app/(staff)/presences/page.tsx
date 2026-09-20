"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { StudentPicker } from "@/components/staff/StudentPicker";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { attendanceSchema, type AttendanceFormInput } from "@/lib/validation/attendance";
import { listAttendance, recordAttendance } from "@/lib/api/attendance";
import { getErrorMessage } from "@/lib/api/error";
import type { AttendanceRecord, AttendanceStatus, Student } from "@/lib/api/types";

const STATUS_TONE: Record<AttendanceStatus, "success" | "danger" | "warning"> = {
  present: "success",
  absent: "danger",
  retard: "warning",
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  retard: "Retard",
};

export default function AttendancePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const fetcher = useMemo(() => () => listAttendance({ student_id: student?.id, per_page: 20 }), [student]);
  const { data, isLoading, reload } = usePaginatedResource(fetcher, [student?.id]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceFormInput>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { status: "present", date: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(values: AttendanceFormInput) {
    if (!student) return;
    setServerError(null);

    try {
      await recordAttendance({ ...values, student_id: student.id, reason: values.reason || null });
      reset({ status: "present", date: values.date, reason: "" });
      reload();
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible d'enregistrer ce pointage."));
    }
  }

  const columns: DataTableColumn<AttendanceRecord>[] = [
    { key: "date", header: "Date", render: (row) => row.date },
    { key: "status", header: "Statut", render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge> },
    { key: "justified", header: "Justifiee", render: (row) => (row.justified ? "Oui" : "Non") },
    { key: "reason", header: "Motif", render: (row) => row.reason ?? "—" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Presences</h1>
      <p className="mb-6 text-sm text-muted">Selectionnez un eleve pour pointer sa presence du jour.</p>

      <div className="mb-6 max-w-sm">
        <StudentPicker selected={student} onSelect={setStudent} onClear={() => setStudent(null)} />
      </div>

      {student && (
        <>
          <Card accent="attendance" className="mb-6">
            <CardHeader>
              <CardTitle>Pointer une presence</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-4" noValidate>
                {serverError && (
                  <div className="sm:col-span-4">
                    <Alert>{serverError}</Alert>
                  </div>
                )}

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register("date")} />
                  <FieldError>{errors.date?.message}</FieldError>
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select id="status" {...register("status")}>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="retard">Retard</option>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="reason">Motif (optionnel)</Label>
                  <Input id="reason" {...register("reason")} />
                </div>

                <div className="sm:col-span-4">
                  <Button type="submit" loading={isSubmitting}>
                    <Check className="size-4" /> Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucun pointage pour cet eleve." />
        </>
      )}
    </div>
  );
}
