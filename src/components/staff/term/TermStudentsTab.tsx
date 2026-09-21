"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { listClassesOfYear, listTermStudents } from "@/lib/api/academics";
import { getStudentBulletin } from "@/lib/api/grades";
import type { Bulletin, SchoolClass, Term, TermStudentRow } from "@/lib/api/types";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { formatAverage } from "@/lib/utils/format";

/** Détail des notes d'un élève pour le trimestre : le bulletin, déplié sous sa ligne. */
function StudentBulletin({ studentId, termId }: { studentId: string; termId: string }) {
  const [bulletin, setBulletin] = useState<Bulletin | null | undefined>(undefined);

  useEffect(() => {
    getStudentBulletin(studentId, termId)
      .then(setBulletin)
      .catch(() => setBulletin(null));
  }, [studentId, termId]);

  if (bulletin === undefined) return <p className="text-sm text-muted">Chargement des notes...</p>;
  if (!bulletin || bulletin.subjects.length === 0) return <p className="text-sm text-muted">Aucune note pour ce trimestre.</p>;

  return (
    <table className="w-full max-w-xl text-left text-sm">
      <thead>
        <tr className="text-xs tracking-wide text-muted uppercase">
          <th className="py-1 font-medium">Matière</th>
          <th className="py-1 font-medium">Coefficient</th>
          <th className="py-1 font-medium">Notes</th>
          <th className="py-1 font-medium">Moyenne</th>
        </tr>
      </thead>
      <tbody>
        {bulletin.subjects.map((subject) => (
          <tr key={subject.code} className="border-t border-border">
            <td className="py-1">{subject.subject}</td>
            <td className="py-1">{subject.coefficient}</td>
            <td className="py-1">{subject.grades_count}</td>
            <td className="py-1 font-medium">{subject.average}/20</td>
          </tr>
        ))}
        <tr className="border-t border-border font-semibold">
          <td className="py-1" colSpan={3}>
            Moyenne générale
          </td>
          <td className="py-1">{formatAverage(bulletin.overall_average)}</td>
        </tr>
      </tbody>
    </table>
  );
}

/** Élèves inscrits pour l'année du trimestre, avec leur moyenne et leurs absences sur le trimestre. */
export function TermStudentsTab({ term }: { term: Term }) {
  const [search, setSearch] = useState("");
  const [schoolClassId, setSchoolClassId] = useState("");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const { page, perPage, setPage, setPerPage } = usePagination(`${debouncedSearch}|${schoolClassId}`);

  useEffect(() => {
    listClassesOfYear(term.academic_year)
      .then(setClasses)
      .catch(() => setClasses([]));
  }, [term.academic_year]);

  const fetcher = useMemo(
    () => () =>
      listTermStudents(term.id, {
        search: debouncedSearch || undefined,
        school_class_id: schoolClassId || undefined,
        page,
        per_page: perPage,
      }),
    [term.id, debouncedSearch, schoolClassId, page, perPage],
  );
  const { data, meta, isLoading } = usePaginatedResource(fetcher, [term.id, debouncedSearch, schoolClassId, page, perPage]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un élève, un matricule..." />
        <Select aria-label="Classe" className="h-10 w-48" value={schoolClassId} onChange={(event) => setSchoolClassId(event.target.value)}>
          <option value="">Toutes les classes</option>
          {classes.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>
              {schoolClass.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 font-medium">Matricule</th>
              <th className="px-4 py-3 font-medium">Élève</th>
              <th className="px-4 py-3 font-medium">Classe</th>
              <th className="px-4 py-3 font-medium">Moyenne</th>
              <th className="px-4 py-3 font-medium">Absences</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Chargement...
                </td>
              </tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Aucun élève inscrit pour cette année.
                </td>
              </tr>
            )}
            {!isLoading &&
              data.map((row: TermStudentRow) => {
                const isExpanded = expandedId === row.enrollment_id;

                return (
                  <Fragment key={row.enrollment_id}>
                    <tr className="border-b border-border last:border-0 hover:bg-background">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Masquer" : "Afficher"} les notes de ${row.student.name}`}
                          onClick={() => setExpandedId(isExpanded ? null : row.enrollment_id)}
                          className="text-muted hover:text-foreground"
                        >
                          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{row.student.matricule}</td>
                      <td className="px-4 py-3">
                        {row.student.name} {!row.student.is_active && <Badge>Inactif</Badge>}
                      </td>
                      <td className="px-4 py-3">{row.school_class?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-medium">{formatAverage(row.average)}</td>
                      <td className="px-4 py-3">{row.absences}</td>
                      <td className="px-4 py-3">
                        <Link href={`/students/${row.student.id}`} className="text-sm font-medium text-primary hover:underline">
                          Dossier
                        </Link>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border bg-background">
                        <td />
                        <td colSpan={6} className="px-4 py-4">
                          <StudentBulletin studentId={row.student.id} termId={term.id} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
