"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { useState } from "react";
import { listMyAttendance } from "@/lib/api/attendance";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/api/types";

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

export default function ParentAttendancePage() {
  const [page, setPage] = useState(1);
  const { data, meta, isLoading } = usePaginatedResource(() => listMyAttendance({ page }), [page]);

  const columns: DataTableColumn<AttendanceRecord>[] = [
    { key: "date", header: "Date", render: (row) => row.date },
    { key: "status", header: "Statut", render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge> },
    { key: "justified", header: "Justifiee", render: (row) => (row.justified ? "Oui" : "Non") },
    { key: "reason", header: "Motif", render: (row) => row.reason ?? "—" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Presences</h1>
      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucun enregistrement pour le moment." />
      {meta && <Pagination currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} onPageChange={setPage} />}
    </div>
  );
}
