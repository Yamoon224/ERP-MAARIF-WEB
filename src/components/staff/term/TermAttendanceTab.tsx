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
import { useT } from "@/lib/i18n/store";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE } from "@/lib/labels";
import { formatDate } from "@/lib/utils/format";

/** Présences, absences et retards du trimestre : bilan puis pointages. */
export function TermAttendanceTab({ termId }: { termId: string }) {
  const { t } = useT();
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
    { key: "status", header: "Statut", render: (row) => <Badge tone={ATTENDANCE_TONE[row.status]}>{t(ATTENDANCE_LABEL[row.status])}</Badge> },
    {
      key: "justified",
      header: "Justifiée",
      render: (row) => (row.status === "present" ? "—" : row.justified ? t("Oui") : t("Non")),
    },
    { key: "reason", header: "Motif", render: (row) => row.reason ?? "—" },
  ];

  return (
    <div className="space-y-5">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("Présences")} value={summary.present} accent="attendance" />
          <StatCard
            label={t("Absences")}
            value={summary.absent}
            hint={t("{count} non justifiée(s)", { count: summary.unjustified_absences })}
            accent="attendance"
          />
          <StatCard label={t("Retards")} value={summary.late} accent="attendance" />
          <StatCard label={t("Pointages")} value={summary.total} accent="attendance" />
        </div>
      )}

      <div>
        <DataTable exportName="Présences du trimestre" columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucun pointage pour ce trimestre." />
        {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
      </div>
    </div>
  );
}
