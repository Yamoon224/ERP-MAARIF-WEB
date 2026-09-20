"use client";

import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { listClassesOfYear } from "@/lib/api/academics";
import type { SchoolClass, Term } from "@/lib/api/types";

/** Classes de l'année scolaire du trimestre (une classe existe pour toute l'année, donc ses trois trimestres). */
export function TermClassesTab({ term }: { term: Term }) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    listClassesOfYear(term.academic_year)
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setIsLoading(false));
  }, [term.academic_year]);

  const columns: DataTableColumn<SchoolClass>[] = [
    { key: "name", header: "Classe", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "level", header: "Niveau", render: (row) => row.level },
    { key: "students", header: "Effectif", render: (row) => row.students_count ?? "—" },
    { key: "teacher", header: "Titulaire", render: (row) => row.main_teacher?.name ?? "—" },
  ];

  return (
    <DataTable
      columns={columns}
      rows={classes}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      emptyMessage={`Aucune classe pour l'année ${term.academic_year}.`}
    />
  );
}
