"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { listMySummons } from "@/lib/api/discipline";
import type { Summon, SummonStatus } from "@/lib/api/types";

const STATUS_TONE: Record<SummonStatus, "warning" | "success" | "neutral"> = {
  pending: "warning",
  done: "success",
  cancelled: "neutral",
};

const STATUS_LABEL: Record<SummonStatus, string> = {
  pending: "En attente",
  done: "Realisee",
  cancelled: "Annulee",
};

export default function ParentSummonsPage() {
  const { page, perPage, setPage, setPerPage } = usePagination();
  const { data, meta, isLoading } = usePaginatedResource(() => listMySummons({ page, per_page: perPage }), [page, perPage]);

  const columns: DataTableColumn<Summon>[] = [
    { key: "reason", header: "Motif", render: (row) => row.reason },
    { key: "date", header: "Date prevue", render: (row) => new Date(row.scheduled_at).toLocaleString("fr-FR") },
    { key: "location", header: "Lieu", render: (row) => row.location ?? "—" },
    { key: "status", header: "Statut", render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge> },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Convocations</h1>
      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune convocation." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
