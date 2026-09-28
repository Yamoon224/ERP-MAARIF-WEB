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
import { useT } from "@/lib/i18n/store";

interface PromotionCardProps {
  sourceClass: { id: string; name: string; academic_year: string };
  years: AcademicYear[];
  /** Appelé après un passage réussi, pour rafraîchir ce qui en dépend. */
  onPromoted?: (summary: PromotionSummary) => void;
}

/** Lignes du bilan : ce qui a été fait, puis ce qui reste à traiter (un compteur à zéro est omis). */
export function summaryLines(
  summary: PromotionSummary,
  t: (text: string, params?: Record<string, string | number>) => string = (text) => text,
): { text: string; warning: boolean }[] {
  const lines: Array<[number, string, boolean]> = [
    [summary.promoted, t("élève(s) admis réinscrit(s) en classe supérieure"), false],
    [summary.repeated, t("redoublant(s) réinscrit(s)"), false],
    [summary.already_enrolled, t("élève(s) déjà inscrit(s) pour cette année, laissé(s) tel(s) quel(s)"), false],
    [summary.excluded, t("élève(s) exclu(s), non réinscrit(s)"), false],
    [summary.inactive, t("élève(s) inactif(s), non réinscrit(s)"), false],
    [summary.undecided, t("élève(s) sans décision enregistrée : validez les décisions puis relancez le passage"), true],
    [summary.without_class, t("redoublant(s) laissé(s) de côté : choisissez une classe de redoublement puis relancez"), true],
  ];

  return lines.filter(([count]) => count > 0).map(([count, label, warning]) => ({ text: `${count} ${label}`, warning }));
}

/**
 * Passage de fin d'année : réinscrit les élèves de la classe pour l'année
 * suivante d'après les décisions enregistrées. Rejouable sans risque : un élève
 * déjà inscrit pour l'année cible n'est jamais déplacé.
 */
export function PromotionCard({ sourceClass, years, onPromoted }: PromotionCardProps) {
  const { t } = useT();
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
      setError(getErrorMessage(failure, t("Impossible de réinscrire cette classe.")));
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
            {t("Aucune année postérieure à {year} n'existe encore : créez ses trimestres et ses classes pour y réinscrire les élèves.", {
              year: sourceClass.academic_year,
            })}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {t("Réinscrit les élèves de {className} d'après leurs décisions", { className: sourceClass.name })}{" "}
              <strong>{t("enregistrées")}</strong>{" "}
              {t(": les admis dans la classe supérieure, les redoublants dans la classe qu'ils répètent, les exclus ne sont pas réinscrits.")}
            </p>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <label className="flex flex-col text-xs font-medium text-muted">
                {t("Année d'accueil")}
                <Select className="mt-1 h-9 w-40" value={targetYear ?? ""} onChange={(event) => setSelectedYear(event.target.value)}>
                  {targetYears.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="flex flex-col text-xs font-medium text-muted">
                {t("Classe des admis")}
                <Select className="mt-1 h-9 w-48" value={admittedClassId} onChange={(event) => setAdmittedClassId(event.target.value)}>
                  <option value="">{t("Choisir...")}</option>
                  {targetClasses.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="flex flex-col text-xs font-medium text-muted">
                {t("Classe des redoublants")}
                <Select className="mt-1 h-9 w-56" value={repeatClassId} onChange={(event) => setRepeatClassId(event.target.value)}>
                  <option value="">{t("Ne pas réinscrire")}</option>
                  {targetClasses.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </Select>
              </label>

              <Button type="button" size="sm" loading={isRunning} disabled={!admittedClassId} onClick={handlePromote}>
                <GraduationCap className="size-4" /> {t("Réinscrire pour {year}", { year: targetYear ?? "" })}
              </Button>
            </div>

            {targetClasses.length === 0 && (
              <p className="text-sm text-muted">
                {t("Aucune classe n'existe pour l'année {year} : créez-la d'abord dans Classes.", { year: targetYear ?? "" })}
              </p>
            )}
          </>
        )}

        {error && <Alert>{error}</Alert>}

        {summary && (
          <ul role="status" className="space-y-1 rounded-md border border-border bg-background px-4 py-3 text-sm">
            {summaryLines(summary, t).length === 0 ? (
              <li>{t("Aucun élève à réinscrire dans cette classe.")}</li>
            ) : (
              summaryLines(summary, t).map((line) => (
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
