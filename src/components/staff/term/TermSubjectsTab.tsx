"use client";

import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { listTermSubjects } from "@/lib/api/academics";
import type { TermSubject } from "@/lib/api/types";
import { formatAverage } from "@/lib/utils/format";

/** Matières enseignées pendant le trimestre : dans les classes de l'année, ou déjà notées ce trimestre. */
export function TermSubjectsTab({ termId }: { termId: string }) {
  const [subjects, setSubjects] = useState<TermSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    listTermSubjects(termId)
      .then(setSubjects)
      .catch(() => setSubjects([]))
      .finally(() => setIsLoading(false));
  }, [termId]);

  const columns: DataTableColumn<TermSubject>[] = [
    { key: "name", header: "Matière", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "code", header: "Code", render: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { key: "coefficient", header: "Coefficient", render: (row) => row.coefficient },
    { key: "classes", header: "Classes", render: (row) => row.classes_count },
    { key: "grades", header: "Notes saisies", render: (row) => row.grades_count },
    { key: "average", header: "Moyenne", render: (row) => formatAverage(row.average) },
  ];

  return <DataTable columns={columns} rows={subjects} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune matière pour ce trimestre." />;
}
