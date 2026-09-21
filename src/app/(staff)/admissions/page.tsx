"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { listAcademicYears } from "@/lib/api/academics";
import { getAdmissionSummary, listAdmissions } from "@/lib/api/admissions";
import type { AcademicYear, Admission, AdmissionStatus, AdmissionSummary, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { ADMISSION_LABEL, ADMISSION_TONE } from "@/lib/labels";
import { formatDate } from "@/lib/utils/format";

const STATUSES = Object.keys(ADMISSION_LABEL) as AdmissionStatus[];

/** Cartes de synthèse : les statuts qui demandent une action, puis ceux qui sont réglés. */
const SUMMARY_CARDS: ReadonlyArray<{ status: AdmissionStatus; accent: "primary" | "academics" | "discipline" | "grades" }> = [
  { status: "pending", accent: "primary" },
  { status: "under_review", accent: "academics" },
  { status: "accepted", accent: "grades" },
  { status: "waitlisted", accent: "discipline" },
];

export default function AdmissionsPage() {
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "admissions.manage");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdmissionStatus | "">("");
  const [academicYear, setAcademicYear] = useState("");
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [summary, setSummary] = useState<AdmissionSummary | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const { page, perPage, setPage, setPerPage } = usePagination(`${debouncedSearch}|${status}|${academicYear}`);

  useEffect(() => {
    listAcademicYears()
      .then(setYears)
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    getAdmissionSummary(academicYear || undefined)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [academicYear]);

  const fetcher = useMemo(
    () => () =>
      listAdmissions({
        search: debouncedSearch || undefined,
        status: status || undefined,
        academic_year: academicYear || undefined,
        page,
        per_page: perPage,
      }),
    [debouncedSearch, status, academicYear, page, perPage],
  );
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [debouncedSearch, status, academicYear, page, perPage]);

  const columns: DataTableColumn<Admission>[] = [
    { key: "reference", header: "Référence", render: (row) => <span className="font-mono text-xs">{row.reference}</span> },
    { key: "name", header: "Candidat", render: (row) => row.full_name },
    { key: "level", header: "Niveau", render: (row) => `${row.level} · ${row.academic_year}` },
    {
      key: "guardian",
      header: "Tuteur",
      render: (row) => (
        <div>
          <p>{row.guardian_name}</p>
          <p className="text-xs text-muted">{row.guardian_phone}</p>
        </div>
      ),
    },
    { key: "submitted", header: "Déposée le", render: (row) => formatDate(row.submitted_on) },
    { key: "status", header: "Statut", render: (row) => <Badge tone={ADMISSION_TONE[row.status]}>{ADMISSION_LABEL[row.status]}</Badge> },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Link href={`/admissions/${row.id}`} className="text-sm font-medium text-primary hover:underline">
          Voir le dossier
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admissions"
        description="Candidatures des futurs élèves : dépôt, étude du dossier, décision, puis inscription dans une classe."
        actions={
          canManage && (
            <Link href="/admissions/new">
              <Button>
                <Plus className="size-4" /> Nouvelle candidature
              </Button>
            </Link>
          )
        }
      />

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUMMARY_CARDS.map((card) => (
            <StatCard key={card.status} accent={card.accent} label={ADMISSION_LABEL[card.status]} value={summary.by_status[card.status]} />
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un candidat, une référence, un tuteur..." />
        <Select aria-label="Année scolaire" className="h-10 w-48" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
          <option value="">Toutes les années</option>
          {years.map((year) => (
            <option key={year.label} value={year.label}>
              {year.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Statut"
          className="h-10 w-48"
          value={status}
          onChange={(event) => setStatus(event.target.value as AdmissionStatus | "")}
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {ADMISSION_LABEL[value]}
            </option>
          ))}
        </Select>
      </div>

      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune candidature trouvée." />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
