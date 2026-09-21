"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, ShieldCheck, ShieldOff, Trash2, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Input, Label, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { StatCard } from "@/components/ui/StatCard";
import { StudentPicker } from "@/components/staff/StudentPicker";
import {
  deleteAttendance,
  getAttendanceSummary,
  listAttendance,
  recordAttendance,
  updateAttendance,
} from "@/lib/api/attendance";
import { getErrorMessage } from "@/lib/api/error";
import type { AttendanceRecord, AttendanceStatus, AttendanceSummary, Student } from "@/lib/api/types";
import { useSchoolClassOptions } from "@/lib/hooks/useSchoolClassOptions";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE } from "@/lib/labels";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { emptyPage } from "@/lib/utils/emptyPage";
import { formatDate, formatPercent, today } from "@/lib/utils/format";

type StatusFilter = "" | "absent" | "retard";
type JustifiedFilter = "" | "1" | "0";

/** Ligne dont la justification est en cours de saisie. */
interface Editing {
  id: string;
  reason: string;
}

/**
 * Gestion des absences : suivi des absences et retards sur la période, avec
 * justification a posteriori (certificat, appel du parent...), signalement
 * d'une absence isolée et classement des élèves les plus souvent absents.
 * L'appel de toute une classe se fait dans « Présences ».
 */
export default function AbsencesPage() {
  const period = usePeriodFilter();
  const classes = useSchoolClassOptions();

  const [status, setStatus] = useState<StatusFilter>("absent");
  const [justified, setJustified] = useState<JustifiedFilter>("");
  const [schoolClassId, setSchoolClassId] = useState("");
  const [student, setStudent] = useState<Student | null>(null);

  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      ...period.params,
      status: status || undefined,
      justified: justified === "" ? undefined : (Number(justified) as 0 | 1),
      school_class_id: schoolClassId || undefined,
      student_id: student?.id,
    }),
    [period.params, status, justified, schoolClassId, student],
  );

  const { page, perPage, setPage, setPerPage } = usePagination(JSON.stringify(filters));
  const fetcher = useMemo(
    () => () => (period.isReady ? listAttendance({ ...filters, page, per_page: perPage }) : Promise.resolve(emptyPage<AttendanceRecord>(perPage))),
    [period.isReady, filters, page, perPage],
  );
  const { data, meta, isLoading, reload } = usePaginatedResource(fetcher, [period.isReady, filters, page, perPage]);

  // Le bilan ignore le filtre de statut : il compte justement les statuts.
  const summaryFilters = useMemo(() => ({ ...filters, status: undefined, justified: undefined }), [filters]);
  const [summaryToken, setSummaryToken] = useState(0);
  useEffect(() => {
    if (!period.isReady) return;

    let cancelled = false;
    getAttendanceSummary(summaryFilters)
      .then((loaded) => {
        if (!cancelled) setSummary(loaded);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [period.isReady, summaryFilters, summaryToken]);

  function refresh() {
    reload();
    setSummaryToken((token) => token + 1);
  }

  async function saveJustification(record: AttendanceRecord, justifiedValue: boolean, reason: string) {
    setError(null);

    try {
      await updateAttendance(record.id, { justified: justifiedValue, reason: reason || null });
      setEditing(null);
      refresh();
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible de modifier cette absence."));
    }
  }

  async function handleDelete(record: AttendanceRecord) {
    setError(null);

    try {
      await deleteAttendance(record.id);
      refresh();
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible de supprimer ce pointage."));
    }
  }

  const columns: DataTableColumn<AttendanceRecord>[] = [
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    {
      key: "student",
      header: "Élève",
      render: (row) => (
        <Link href={`/students/${row.student.id}`} className="font-medium hover:text-primary hover:underline">
          {row.student.name}
        </Link>
      ),
    },
    { key: "status", header: "Statut", render: (row) => <Badge tone={ATTENDANCE_TONE[row.status]}>{ATTENDANCE_LABEL[row.status]}</Badge> },
    {
      key: "justified",
      header: "Justification",
      render: (row) =>
        row.status === "present" ? (
          "—"
        ) : row.justified ? (
          <Badge tone="success">Justifiée</Badge>
        ) : (
          <Badge tone="warning">Non justifiée</Badge>
        ),
    },
    {
      key: "reason",
      header: "Motif",
      render: (row) =>
        editing?.id === row.id ? (
          <div className="flex items-center gap-2">
            <Input
              aria-label="Motif de la justification"
              className="h-8 min-w-48"
              autoFocus
              value={editing.reason}
              maxLength={255}
              placeholder="Certificat médical, appel du parent..."
              onChange={(event) => setEditing({ id: row.id, reason: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveJustification(row, true, editing.reason);
                if (event.key === "Escape") setEditing(null);
              }}
            />
            <Button size="sm" onClick={() => saveJustification(row, true, editing.reason)} aria-label="Valider la justification">
              <Check className="size-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(null)} aria-label="Annuler">
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          (row.reason ?? "—")
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "present" ? null : (
          <div className="flex items-center justify-end gap-3">
            {row.justified ? (
              <button
                type="button"
                onClick={() => saveJustification(row, false, row.reason ?? "")}
                className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
              >
                <ShieldOff className="size-4" aria-hidden="true" /> Retirer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing({ id: row.id, reason: row.reason ?? "" })}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <ShieldCheck className="size-4" aria-hidden="true" /> Justifier
              </button>
            )}
            <button type="button" onClick={() => handleDelete(row)} aria-label="Supprimer ce pointage" className="text-muted hover:text-danger">
              <Trash2 className="size-4" />
            </button>
          </div>
        ),
    },
  ];

  const pointed = summary?.total ?? 0;

  return (
    <div>
      <PageHeader
        title="Absences"
        description="Suivi, justification et signalement des absences et retards."
        actions={
          <Link href="/attendance">
            <Button variant="secondary">Faire l&apos;appel d&apos;une classe</Button>
          </Link>
        }
      />

      <PeriodFilter filter={period} className="mb-6" />

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Absences" value={summary.absent} hint={`${summary.justified_absences} justifiée(s)`} accent="attendance" />
          <StatCard label="Non justifiées" value={summary.unjustified_absences} hint="À régulariser" accent="discipline" />
          <StatCard label="Retards" value={summary.late} accent="attendance" />
          <StatCard
            label="Taux de présence"
            value={pointed > 0 ? formatPercent((summary.present / pointed) * 100) : "—"}
            hint={`${pointed} pointage(s) sur la période`}
            accent="grades"
          />
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs font-medium text-muted">
              Type
              <Select className="mt-1 h-9 w-40" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
                <option value="absent">Absences</option>
                <option value="retard">Retards</option>
                <option value="">Tous les statuts</option>
              </Select>
            </label>
            <label className="flex flex-col text-xs font-medium text-muted">
              Justification
              <Select className="mt-1 h-9 w-44" value={justified} onChange={(event) => setJustified(event.target.value as JustifiedFilter)}>
                <option value="">Toutes</option>
                <option value="0">Non justifiées</option>
                <option value="1">Justifiées</option>
              </Select>
            </label>
            <label className="flex flex-col text-xs font-medium text-muted">
              Classe
              <Select className="mt-1 h-9 w-44" value={schoolClassId} onChange={(event) => setSchoolClassId(event.target.value)}>
                <option value="">Toutes les classes</option>
                {classes
                  .filter((schoolClass) => !period.year || schoolClass.academic_year === period.year.label)
                  .map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
              </Select>
            </label>
          </div>

          <div className="mb-4 max-w-sm">
            <StudentPicker selected={student} onSelect={setStudent} onClear={() => setStudent(null)} />
          </div>

          {error && <Alert className="mb-4">{error}</Alert>}

          <DataTable
            columns={columns}
            rows={data}
            rowKey={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="Aucune absence sur cette période."
          />
          {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
        </div>

        <aside className="space-y-6">
          <Card accent="attendance">
            <CardHeader>
              <CardTitle>Élèves les plus absents</CardTitle>
            </CardHeader>
            <CardContent>
              {!summary || summary.top_absentees.length === 0 ? (
                <p className="text-sm text-muted">Aucune absence sur la période.</p>
              ) : (
                <ol className="space-y-2.5">
                  {summary.top_absentees.map((entry, index) => (
                    <li key={entry.student.id} className="flex items-start justify-between gap-3 text-sm">
                      <span>
                        <span className="mr-2 text-muted">{index + 1}.</span>
                        <Link href={`/students/${entry.student.id}`} className="font-medium hover:text-primary hover:underline">
                          {entry.student.name}
                        </Link>
                      </span>
                      <span className="shrink-0 text-right text-xs text-muted">
                        {entry.absences} abs. ({entry.unjustified} non just.)
                        {entry.lates > 0 && <> · {entry.lates} ret.</>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <ReportAbsenceCard onSaved={refresh} />
        </aside>
      </div>
    </div>
  );
}

/** Signalement d'une absence ou d'un retard isolé, hors appel de classe (ex. appel du parent le matin). */
function ReportAbsenceCard({ onSaved }: { onSaved: () => void }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [date, setDate] = useState(() => today());
  const [status, setStatus] = useState<Exclude<AttendanceStatus, "present">>("absent");
  const [reason, setReason] = useState("");
  const [justified, setJustified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!student) return;

    setIsSaving(true);
    setMessage(null);

    try {
      await recordAttendance({ student_id: student.id, date, status, justified, reason: reason || null });
      setMessage({ tone: "success", text: `${status === "absent" ? "Absence" : "Retard"} enregistré(e) pour ${student.first_name} ${student.last_name}.` });
      setReason("");
      setJustified(false);
      onSaved();
    } catch (failure) {
      setMessage({ tone: "error", text: getErrorMessage(failure, "Impossible d'enregistrer ce pointage.") });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card accent="attendance">
      <CardHeader>
        <CardTitle>Signaler une absence</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <StudentPicker selected={student} onSelect={setStudent} onClear={() => setStudent(null)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="report-date">Date</Label>
              <Input id="report-date" type="date" value={date} max={today()} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="report-status">Type</Label>
              <Select id="report-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                <option value="absent">Absence</option>
                <option value="retard">Retard</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="report-reason">Motif (optionnel)</Label>
            <Input id="report-reason" value={reason} maxLength={255} onChange={(event) => setReason(event.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={justified} onChange={(event) => setJustified(event.target.checked)} className="size-4 rounded border-border" />
            Déjà justifiée
          </label>

          {message && (message.tone === "error" ? <Alert>{message.text}</Alert> : <p className="text-sm text-success">{message.text}</p>)}

          <Button type="submit" loading={isSaving} disabled={!student} className="w-full">
            <Plus className="size-4" /> Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
