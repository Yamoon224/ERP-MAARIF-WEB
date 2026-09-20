"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { listClassesOfYear } from "@/lib/api/academics";
import { listGrades } from "@/lib/api/grades";
import type { Grade, SchoolClass, Term } from "@/lib/api/types";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { useSubjectOptions } from "@/lib/hooks/useSubjectOptions";
import { formatDate } from "@/lib/utils/format";

/** Notes saisies pendant le trimestre, filtrables par classe et par matière. */
export function TermGradesTab({ term }: { term: Term }) {
  const [schoolClassId, setSchoolClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const subjects = useSubjectOptions();
  const { page, perPage, setPage, setPerPage } = usePagination(`${schoolClassId}|${subjectId}`);

  useEffect(() => {
    listClassesOfYear(term.academic_year)
      .then(setClasses)
      .catch(() => setClasses([]));
  }, [term.academic_year]);

  const fetcher = useMemo(
    () => () =>
      listGrades({
        term_id: term.id,
        school_class_id: schoolClassId || undefined,
        subject_id: subjectId || undefined,
        page,
        per_page: perPage,
      }),
    [term.id, schoolClassId, subjectId, page, perPage],
  );
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [term.id, schoolClassId, subjectId, page, perPage]);

  const columns: DataTableColumn<Grade>[] = [
    { key: "student", header: "Élève", render: (row) => row.student.name },
    { key: "subject", header: "Matière", render: (row) => row.subject.name },
    { key: "type", header: "Type", render: (row) => (row.type === "devoir" ? "Devoir" : "Composition") },
    { key: "value", header: "Note", render: (row) => `${row.value}/${row.max_value}` },
    { key: "normalized", header: "Sur 20", render: (row) => <span className="font-medium">{row.normalized_on_20}</span> },
    { key: "date", header: "Date", render: (row) => formatDate(row.recorded_at) },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select aria-label="Classe" className="h-10 w-48" value={schoolClassId} onChange={(event) => setSchoolClassId(event.target.value)}>
          <option value="">Toutes les classes</option>
          {classes.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>
              {schoolClass.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Matière" className="h-10 w-48" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
          <option value="">Toutes les matières</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </Select>
      </div>

      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune note pour ce trimestre." />
      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
