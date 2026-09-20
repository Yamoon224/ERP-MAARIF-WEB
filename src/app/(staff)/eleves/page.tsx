"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { listAcademicYears } from "@/lib/api/academics";
import { listStudents } from "@/lib/api/students";
import type { AcademicYear, Student } from "@/lib/api/types";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [years, setYears] = useState<AcademicYear[]>([]);
  const debouncedSearch = useDebouncedValue(search);
  const { page, perPage, setPage, setPerPage } = usePagination(`${debouncedSearch}|${academicYear}`);

  useEffect(() => {
    listAcademicYears()
      .then(setYears)
      .catch(() => setYears([]));
  }, []);

  const fetcher = useMemo(
    () => () => listStudents({ search: debouncedSearch || undefined, academic_year: academicYear || undefined, page, per_page: perPage }),
    [debouncedSearch, academicYear, page, perPage],
  );

  const { data, meta, isLoading } = usePaginatedResource(fetcher, [debouncedSearch, academicYear, page, perPage]);

  const columns: DataTableColumn<Student>[] = [
    { key: "matricule", header: "Matricule", render: (row) => <span className="font-mono text-xs">{row.matricule}</span> },
    { key: "name", header: "Nom", render: (row) => `${row.first_name} ${row.last_name}` },
    { key: "class", header: "Classe", render: (row) => row.school_class?.name ?? "—" },
    { key: "guardian", header: "Tuteur", render: (row) => row.guardian_name },
    {
      key: "status",
      header: "Statut",
      render: (row) => <Badge tone={row.is_active ? "success" : "neutral"}>{row.is_active ? "Actif" : "Inactif"}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Link href={`/eleves/${row.id}`} className="text-sm font-medium text-primary hover:underline">
          Voir le dossier
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Eleves</h1>
          <p className="mt-1 text-sm text-muted">Dossiers, matricules et affectation aux classes.</p>
        </div>
        <Link href="/eleves/nouveau">
          <Button>
            <Plus className="size-4" /> Inscrire un eleve
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un eleve, un matricule..." />
        <Select
          aria-label="Année scolaire"
          className="h-10 w-48"
          value={academicYear}
          onChange={(event) => setAcademicYear(event.target.value)}
        >
          <option value="">Toutes les années</option>
          {years.map((year) => (
            <option key={year.label} value={year.label}>
              Inscrits en {year.label}
            </option>
          ))}
        </Select>
      </div>

      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucun eleve trouve." />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
