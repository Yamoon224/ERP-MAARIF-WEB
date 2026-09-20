"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { listClassesOfYear } from "@/lib/api/academics";
import { getErrorMessage } from "@/lib/api/error";
import { promoteClass } from "@/lib/api/results";
import type { AcademicYear, PromotionSummary, SchoolClass } from "@/lib/api/types";

interface PromotionCardProps {
  sourceClass: { id: string; name: string; academic_year: string };
  years: AcademicYear[];
  /** Appelé après un passage réussi, pour rafraîchir ce qui en dépend. */
  onPromoted?: (summary: PromotionSummary) => void;
}

/** Lignes du bilan : ce qui a été fait, puis ce qui reste à traiter (un compteur à zéro est omis). */
export function summaryLines(summary: PromotionSummary): { text: string; warning: boolean }[] {
  const lines: Array<[number, string, boolean]> = [
    [summary.promoted, "élève(s) admis réinscrit(s) en classe supérieure", false],
    [summary.repeated, "redoublant(s) réinscrit(s)", false],
    [summary.already_enrolled, "élève(s) déjà inscrit(s) pour cette année, laissé(s) tel(s) quel(s)", false],
    [summary.excluded, "élève(s) exclu(s), non réinscrit(s)", false],
    [summary.inactive, "élève(s) inactif(s), non réinscrit(s)", false],
    [summary.undecided, "élève(s) sans décision enregistrée : validez les décisions puis relancez le passage", true],
    [summary.without_class, "redoublant(s) laissé(s) de côté : choisissez une classe de redoublement puis relancez", true],
  ];

  return lines.filter(([count]) => count > 0).map(([count, label, warning]) => ({ text: `${count} ${label}`, warning }));
}

/**
 * Passage de fin d'année : réinscrit les élèves de la classe pour l'année
 * suivante d'après les décisions enregistrées. Rejouable sans risque : un élève
 * déjà inscrit pour l'année cible n'est jamais déplacé.
 */
export function PromotionCard({ sourceClass, years, onPromoted }: PromotionCardProps) {
  const targetYears = years
    .map((year) => year.label)
    .filter((label) => label > sourceClass.academic_year)
    .sort();

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [admittedClassId, setAdmittedClassId] = useState("");
  const [repeatClassId, setRepeatClassId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PromotionSummary | null>(null);

  const targetYear = selectedYear !== null && targetYears.includes(selectedYear) ? selectedYear : (targetYears[0] ?? null);

  useEffect(() => {
    if (!targetYear) return;

    listClassesOfYear(targetYear)
      .then(setClasses)
      .catch(() => setClasses([]));
  }, [targetYear]);

  const targetClasses = classes.filter((schoolClass) => schoolClass.academic_year === targetYear);

  async function handlePromote() {
    if (!admittedClassId) return;

    setIsRunning(true);
    setError(null);
    setSummary(null);

    try {
      const result = await promoteClass(sourceClass.id, { admitted_class_id: admittedClassId, repeat_class_id: repeatClassId || null });
      setSummary(result);
      onPromoted?.(result);
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible de réinscrire cette classe."));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card accent="academics" className="mb-5">
      <CardHeader>
        <CardTitle>Passage à l&apos;année suivante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {targetYears.length === 0 ? (
          <p className="text-sm text-muted">
            Aucune année postérieure à {sourceClass.academic_year} n&apos;existe encore : créez ses trimestres et ses classes pour y réinscrire les élèves.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">
              Réinscrit les élèves de {sourceClass.name} d&apos;après leurs décisions <strong>enregistrées</strong> : les admis dans la classe supérieure, les
              redoublants dans la classe qu&apos;ils répètent, les exclus ne sont pas réinscrits.
            </p>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <label className="text-xs font-medium text-muted">
                Année d&apos;accueil
                <Select className="mt-1 h-9 w-40" value={targetYear ?? ""} onChange={(event) => setSelectedYear(event.target.value)}>
                  {targetYears.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="text-xs font-medium text-muted">
                Classe des admis
                <Select className="mt-1 h-9 w-48" value={admittedClassId} onChange={(event) => setAdmittedClassId(event.target.value)}>
                  <option value="">Choisir...</option>
                  {targetClasses.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="text-xs font-medium text-muted">
                Classe des redoublants
                <Select className="mt-1 h-9 w-56" value={repeatClassId} onChange={(event) => setRepeatClassId(event.target.value)}>
                  <option value="">Ne pas réinscrire</option>
                  {targetClasses.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </Select>
              </label>

              <Button type="button" size="sm" loading={isRunning} disabled={!admittedClassId} onClick={handlePromote}>
                <GraduationCap className="size-4" /> Réinscrire pour {targetYear}
              </Button>
            </div>

            {targetClasses.length === 0 && (
              <p className="text-sm text-muted">Aucune classe n&apos;existe pour l&apos;année {targetYear} : créez-la d&apos;abord dans Classes.</p>
            )}
          </>
        )}

        {error && <Alert>{error}</Alert>}

        {summary && (
          <ul role="status" className="space-y-1 rounded-md border border-border bg-background px-4 py-3 text-sm">
            {summaryLines(summary).length === 0 ? (
              <li>Aucun élève à réinscrire dans cette classe.</li>
            ) : (
              summaryLines(summary).map((line) => (
                <li key={line.text} className={line.warning ? "text-warning" : "text-foreground"}>
                  {line.text}
                </li>
              ))
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
