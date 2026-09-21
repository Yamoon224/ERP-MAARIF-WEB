"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { listMySummons } from "@/lib/api/discipline";
import type { Summon } from "@/lib/api/types";
import { SUMMON_LABEL, SUMMON_TONE } from "@/lib/labels";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { emptyPage } from "@/lib/utils/emptyPage";
import { formatDateTime } from "@/lib/utils/format";

export default function ParentSummonsPage() {
  const period = usePeriodFilter({ source: "parent" });
  const { page, perPage, setPage, setPerPage } = usePagination(JSON.stringify(period.params));
  const fetcher = useMemo(
    () => () => (period.isReady ? listMySummons({ ...period.params, page, per_page: perPage }) : Promise.resolve(emptyPage<Summon>(perPage))),
    [period.isReady, period.params, page, perPage],
  );
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [period.isReady, period.params, page, perPage]);

  const columns: DataTableColumn<Summon>[] = [
    { key: "reason", header: "Motif", render: (row) => row.reason },
    { key: "date", header: "Date prévue", render: (row) => formatDateTime(row.scheduled_at) },
    { key: "location", header: "Lieu", render: (row) => row.location ?? "—" },
    { key: "status", header: "Statut", render: (row) => <Badge tone={SUMMON_TONE[row.status]}>{SUMMON_LABEL[row.status]}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Convocations" />
      <PeriodFilter filter={period} className="mb-4" />
      <DataTable exportName="Convocations" columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune convocation sur cette période." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
