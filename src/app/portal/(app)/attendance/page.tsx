"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { listMyAttendance } from "@/lib/api/attendance";
import type { AttendanceRecord } from "@/lib/api/types";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE } from "@/lib/labels";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { emptyPage } from "@/lib/utils/emptyPage";
import { formatDate } from "@/lib/utils/format";

export default function ParentAttendancePage() {
  const period = usePeriodFilter({ source: "parent" });
  const { page, perPage, setPage, setPerPage } = usePagination(JSON.stringify(period.params));
  const fetcher = useMemo(
    () => () => (period.isReady ? listMyAttendance({ ...period.params, page, per_page: perPage }) : Promise.resolve(emptyPage<AttendanceRecord>(perPage))),
    [period.isReady, period.params, page, perPage],
  );
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [period.isReady, period.params, page, perPage]);

  const columns: DataTableColumn<AttendanceRecord>[] = [
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    { key: "status", header: "Statut", render: (row) => <Badge tone={ATTENDANCE_TONE[row.status]}>{ATTENDANCE_LABEL[row.status]}</Badge> },
    { key: "justified", header: "Justifiée", render: (row) => (row.status === "present" ? "—" : row.justified ? "Oui" : "Non") },
    { key: "reason", header: "Motif", render: (row) => row.reason ?? "—" },
  ];

  return (
    <div>
      <PageHeader title="Présences" description="Historique des présences, absences et retards de votre enfant." />
      <PeriodFilter filter={period} className="mb-4" />
      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucun enregistrement sur cette période." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
