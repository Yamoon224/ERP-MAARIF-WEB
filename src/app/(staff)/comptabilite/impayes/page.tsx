"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { SearchInput } from "@/components/ui/SearchInput";
import { listArrears } from "@/lib/api/accounting";
import type { ArrearsRow, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { useSchoolClassOptions } from "@/lib/hooks/useSchoolClassOptions";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { emptyPage } from "@/lib/utils/emptyPage";
import { formatMoney, formatMonth } from "@/lib/utils/format";

/** Élèves dont au moins un mois de scolarité, déjà terminé, n'est pas réglé — les plus endettés d'abord. */
export default function ArrearsPage() {
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "accounting.manage");
  const period = usePeriodFilter();
  const classes = useSchoolClassOptions();

  const [search, setSearch] = useState("");
  const [schoolClassId, setSchoolClassId] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const filters = useMemo(
    () => ({ ...period.params, search: debouncedSearch || undefined, school_class_id: schoolClassId || undefined }),
    [period.params, debouncedSearch, schoolClassId],
  );

  const { page, perPage, setPage, setPerPage } = usePagination(JSON.stringify(filters));
  const fetcher = useMemo(
    () => () => (period.isReady ? listArrears({ ...filters, page, per_page: perPage }) : Promise.resolve(emptyPage<ArrearsRow>(perPage))),
    [period.isReady, filters, page, perPage],
  );
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [period.isReady, filters, page, perPage]);

  const columns: DataTableColumn<ArrearsRow>[] = [
    {
      key: "student",
      header: "Élève",
      render: (row) => (
        <span>
          <Link href={`/eleves/${row.student.id}`} className="font-medium hover:text-primary hover:underline">
            {row.student.name}
          </Link>
          <span className="block font-mono text-xs text-muted">{row.student.matricule}</span>
        </span>
      ),
    },
    { key: "class", header: "Classe", render: (row) => `${row.school_class ?? "—"} (${row.academic_year})` },
    { key: "months", header: "Mois en retard", render: (row) => <Badge tone="danger">{row.months_overdue}</Badge> },
    { key: "oldest", header: "Depuis", render: (row) => <span className="capitalize">{formatMonth(row.oldest_month)}</span> },
    { key: "amount", header: "Montant dû", render: (row) => <span className="font-semibold text-danger">{formatMoney(row.amount)}</span> },
    { key: "phone", header: "Tuteur", render: (row) => <a href={`tel:${row.student.guardian_phone}`} className="hover:underline">{row.student.guardian_phone}</a> },
    ...(canManage
      ? [
          {
            key: "pay",
            header: "",
            render: (row: ArrearsRow) => (
              <Link href="/comptabilite/paiements/nouveau" aria-label={`Encaisser ${row.student.name}`}>
                <Button size="sm" variant="outline">
                  Encaisser
                </Button>
              </Link>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Impayés"
        description="Mois de scolarité terminés et non réglés. Le mois en cours n'est pas un impayé."
      />

      <PeriodFilter filter={period} className="mb-4" />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Élève ou matricule..." />
        <label className="text-xs font-medium text-muted">
          Classe
          <Select className="mt-1 h-9 w-48" value={schoolClassId} onChange={(event) => setSchoolClassId(event.target.value)}>
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

      <DataTable columns={columns} rows={data} rowKey={(row) => row.enrollment_id} isLoading={isLoading} emptyMessage="Aucun impayé sur cette période." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
