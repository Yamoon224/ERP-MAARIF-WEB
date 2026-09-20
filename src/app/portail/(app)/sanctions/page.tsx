"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { listMySanctions } from "@/lib/api/discipline";
import type { Sanction } from "@/lib/api/types";

export default function ParentSanctionsPage() {
  const { page, perPage, setPage, setPerPage } = usePagination();
  const { data, meta, isLoading } = usePaginatedResource(() => listMySanctions({ page, per_page: perPage }), [page, perPage]);

  const columns: DataTableColumn<Sanction>[] = [
    { key: "type", header: "Type", render: (row) => <Badge tone="danger">{row.type_label}</Badge> },
    { key: "reason", header: "Motif", render: (row) => row.reason },
    { key: "start_date", header: "Debut", render: (row) => row.start_date },
    { key: "end_date", header: "Fin", render: (row) => row.end_date ?? "—" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Sanctions</h1>
      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune sanction." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
