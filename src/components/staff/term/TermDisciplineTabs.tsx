"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { listSanctions, listSummons } from "@/lib/api/discipline";
import type { Sanction, Summon } from "@/lib/api/types";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { SUMMON_LABEL, SUMMON_TONE } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/utils/format";

/** Sanctions dont la date de début tombe dans le trimestre. */
export function TermSanctionsTab({ termId }: { termId: string }) {
  const { page, perPage, setPage, setPerPage } = usePagination(termId);
  const fetcher = useMemo(() => () => listSanctions({ term_id: termId, page, per_page: perPage }), [termId, page, perPage]);
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [termId, page, perPage]);

  const columns: DataTableColumn<Sanction>[] = [
    { key: "student", header: "Élève", render: (row) => row.student.name },
    { key: "type", header: "Type", render: (row) => <Badge tone="danger">{row.type_label}</Badge> },
    { key: "reason", header: "Motif", render: (row) => row.reason },
    { key: "start", header: "Début", render: (row) => formatDate(row.start_date) },
    { key: "end", header: "Fin", render: (row) => formatDate(row.end_date) },
  ];

  return (
    <>
      <DataTable exportName="Sanctions du trimestre" columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune sanction pour ce trimestre." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </>
  );
}

/** Convocations prévues pendant le trimestre. */
export function TermSummonsTab({ termId }: { termId: string }) {
  const { page, perPage, setPage, setPerPage } = usePagination(termId);
  const fetcher = useMemo(() => () => listSummons({ term_id: termId, page, per_page: perPage }), [termId, page, perPage]);
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [termId, page, perPage]);

  const columns: DataTableColumn<Summon>[] = [
    { key: "student", header: "Élève", render: (row) => row.student.name },
    { key: "reason", header: "Motif", render: (row) => row.reason },
    { key: "date", header: "Date prévue", render: (row) => formatDateTime(row.scheduled_at) },
    { key: "status", header: "Statut", render: (row) => <Badge tone={SUMMON_TONE[row.status]}>{SUMMON_LABEL[row.status]}</Badge> },
  ];

  return (
    <>
      <DataTable exportName="Convocations du trimestre" columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune convocation pour ce trimestre." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </>
  );
}
