"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { listMySanctions } from "@/lib/api/discipline";
import type { Sanction } from "@/lib/api/types";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { emptyPage } from "@/lib/utils/emptyPage";
import { formatDate } from "@/lib/utils/format";

export default function ParentSanctionsPage() {
  const period = usePeriodFilter({ source: "parent" });
  const { page, perPage, setPage, setPerPage } = usePagination(JSON.stringify(period.params));
  const fetcher = useMemo(
    () => () => (period.isReady ? listMySanctions({ ...period.params, page, per_page: perPage }) : Promise.resolve(emptyPage<Sanction>(perPage))),
    [period.isReady, period.params, page, perPage],
  );
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [period.isReady, period.params, page, perPage]);

  const columns: DataTableColumn<Sanction>[] = [
    { key: "type", header: "Type", render: (row) => <Badge tone="danger">{row.type_label}</Badge> },
    { key: "reason", header: "Motif", render: (row) => row.reason },
    { key: "start_date", header: "Début", render: (row) => formatDate(row.start_date) },
    { key: "end_date", header: "Fin", render: (row) => formatDate(row.end_date) },
  ];

  return (
    <div>
      <PageHeader title="Sanctions" />
      <PeriodFilter filter={period} className="mb-4" />
      <DataTable exportName="Sanctions" columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune sanction sur cette période." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
