"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { listAcademicYears, listMyAcademicYears } from "@/lib/api/academics";
import { getMyResults, getStudentResults } from "@/lib/api/results";
import type { AcademicYear, StudentPeriodResult, StudentResults } from "@/lib/api/types";
import { DECISION_TONE } from "@/lib/labels";
import { formatAverage } from "@/lib/utils/format";

interface StudentResultsCardProps {
  /** `staff` lit les résultats d'un élève choisi ; `parent` ceux de l'enfant du jeton. */
  source: "staff" | "parent";
  studentId?: string;
}

/** Rang lisible : `1er / 24`, `3e / 24`. Vide tant que l'élève n'est pas classé. */
export function formatRank(rank: number | null, rankedCount: number | null): string {
  if (rank === null) return "—";

  return `${rank === 1 ? "1er" : `${rank}e`}${rankedCount ? ` / ${rankedCount}` : ""}`;
}

/**
 * Résultats d'un élève sur l'année : chaque trimestre, les deux semestres et
 * l'année, avec la moyenne, le rang dans la classe et la mention. Le détail
 * par matière suit la période sélectionnée.
 */
export function StudentResultsCard({ source, studentId }: StudentResultsCardProps) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [results, setResults] = useState<StudentResults | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (source === "parent" ? listMyAcademicYears() : listAcademicYears())
      .then(setYears)
      .catch(() => setYears([]));
  }, [source]);

  // Sans choix explicite, l'année courante, sinon la plus récente.
  const year = selectedYear ?? (years.find((candidate) => candidate.is_current) ?? years[0])?.label ?? null;

  useEffect(() => {
    if (!year) return;

    let cancelled = false;
    const request = source === "parent" ? getMyResults(year) : getStudentResults(studentId ?? "", year);

    request
      .then((response) => {
        if (cancelled) return;
        setResults(response);
        setFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setResults(null);
        setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [source, studentId, year]);

  const periods = results?.periods ?? [];
  const selected: StudentPeriodResult | undefined = periods.find((period) => period.key === selectedKey) ?? periods.at(-1);
  // Le parent ne voit qu'une décision validée ; la suggestion est un outil du personnel.
  const suggested = source === "staff" && results?.decision === null ? results.suggested_decision : null;

  return (
    <Card accent="grades">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Résultats</CardTitle>
        <label className="flex items-center gap-2 text-xs font-medium text-muted">
          Année scolaire
          <Select
            className="h-9 w-40"
            value={year ?? ""}
            disabled={years.length === 0}
            onChange={(event) => {
              setSelectedYear(event.target.value);
              setSelectedKey(null);
            }}
          >
            {years.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      </CardHeader>

      <CardContent className="space-y-5">
        {failed && <p className="text-sm text-danger">Impossible de charger les résultats.</p>}
        {!failed && years.length === 0 && <p className="text-sm text-muted">Aucune année scolaire n&apos;est encore définie.</p>}
        {!failed && results && periods.length === 0 && <p className="text-sm text-muted">Aucun trimestre n&apos;est défini pour cette année.</p>}

        {results && periods.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Classe :</span>
              <span className="font-medium text-foreground">{results.school_class?.name ?? "Non inscrit cette année"}</span>
              {results.decision && (
                <Badge tone={DECISION_TONE[results.decision.value]}>{results.decision.label}</Badge>
              )}
              {suggested && <Badge tone="neutral">Suggéré : {suggested.label}</Badge>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
                    <th className="py-2 pr-4 font-medium">Période</th>
                    <th className="py-2 pr-4 font-medium">Moyenne</th>
                    <th className="py-2 pr-4 font-medium">Rang</th>
                    <th className="py-2 font-medium">Mention</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr
                      key={period.key}
                      className={period.key === selected?.key ? "border-b border-border bg-background" : "border-b border-border"}
                    >
                      <td className="py-2 pr-4">
                        <button type="button" onClick={() => setSelectedKey(period.key)} className="font-medium text-primary hover:underline">
                          {period.label}
                        </button>
                      </td>
                      <td className="py-2 pr-4 font-medium">{formatAverage(period.average)}</td>
                      <td className="py-2 pr-4">{formatRank(period.rank, period.ranked_count)}</td>
                      <td className="py-2">{period.mention ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Détail par matière — {selected.label}</h3>
                {selected.subjects.length === 0 ? (
                  <p className="text-sm text-muted">Aucune note sur cette période.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs tracking-wide text-muted uppercase">
                        <th className="py-1.5 font-medium">Matière</th>
                        <th className="py-1.5 font-medium">Coefficient</th>
                        <th className="py-1.5 font-medium">Notes</th>
                        <th className="py-1.5 font-medium">Moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.subjects.map((subject) => (
                        <tr key={subject.subject_id} className="border-t border-border">
                          <td className="py-1.5">{subject.subject}</td>
                          <td className="py-1.5">{subject.coefficient}</td>
                          <td className="py-1.5">{subject.grades_count}</td>
                          <td className="py-1.5 font-medium">{formatAverage(subject.average)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
