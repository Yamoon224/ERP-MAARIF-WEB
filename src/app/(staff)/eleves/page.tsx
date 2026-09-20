"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { listStudents } from "@/lib/api/students";
import type { Student } from "@/lib/api/types";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const fetcher = useMemo(
    () => () => listStudents({ search: debouncedSearch || undefined, page }),
    [debouncedSearch, page],
  );

  const { data, meta, isLoading } = usePaginatedResource(fetcher, [debouncedSearch, page]);

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

      <div className="mb-4">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Rechercher un eleve, un matricule..." />
      </div>

      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucun eleve trouve." />

      {meta && <Pagination currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} onPageChange={setPage} />}
    </div>
  );
}
