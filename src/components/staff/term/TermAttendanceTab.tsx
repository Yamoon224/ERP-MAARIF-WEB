"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatCard } from "@/components/ui/StatCard";
import { getAttendanceSummary, listAttendance } from "@/lib/api/attendance";
import type { AttendanceRecord, AttendanceSummary } from "@/lib/api/types";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE } from "@/lib/labels";
import { formatDate } from "@/lib/utils/format";

/** Présences, absences et retards du trimestre : bilan puis pointages. */
export function TermAttendanceTab({ termId }: { termId: string }) {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const { page, perPage, setPage, setPerPage } = usePagination(termId);

  useEffect(() => {
    getAttendanceSummary({ term_id: termId })
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [termId]);

  const fetcher = useMemo(() => () => listAttendance({ term_id: termId, page, per_page: perPage }), [termId, page, perPage]);
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [termId, page, perPage]);

  const columns: DataTableColumn<AttendanceRecord>[] = [
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    { key: "student", header: "Élève", render: (row) => row.student.name },
    { key: "status", header: "Statut", render: (row) => <Badge tone={ATTENDANCE_TONE[row.status]}>{ATTENDANCE_LABEL[row.status]}</Badge> },
    { key: "justified", header: "Justifiée", render: (row) => (row.status === "present" ? "—" : row.justified ? "Oui" : "Non") },
    { key: "reason", header: "Motif", render: (row) => row.reason ?? "—" },
  ];

  return (
    <div className="space-y-5">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Présences" value={summary.present} accent="attendance" />
          <StatCard label="Absences" value={summary.absent} hint={`${summary.unjustified_absences} non justifiée(s)`} accent="attendance" />
          <StatCard label="Retards" value={summary.late} accent="attendance" />
          <StatCard label="Pointages" value={summary.total} accent="attendance" />
        </div>
      )}

      <div>
        <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucun pointage pour ce trimestre." />
        {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
      </div>
    </div>
  );
}
