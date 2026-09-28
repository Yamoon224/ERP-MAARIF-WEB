"use client";

import { useEffect, useState } from "react";
import { Copy, Plus, Save, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input, Select } from "@/components/ui/Field";
import { getErrorMessage } from "@/lib/api/error";
import { duplicateGradeScale, getGradeScale, saveGradeScale, type GradeScaleBandInput } from "@/lib/api/results";
import type { PromotionDecisionValue, SchoolClass } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
import { DECISION_LABEL } from "@/lib/labels";

interface GradeScaleCardProps {
  schoolClass: { id: string; name: string };
  /** Autres classes de la même année, pour dupliquer le barème sans le ressaisir. */
  siblingClasses: SchoolClass[];
}

type BandRow = GradeScaleBandInput & { key: string };

let nextKey = 0;
const newKey = () => `new-${++nextKey}`;

function emptyRow(): BandRow {
  return { key: newKey(), min_average: 0, max_average: 20, label: "", decision: null };
}

const DECISION_VALUES = Object.keys(DECISION_LABEL) as PromotionDecisionValue[];

/**
 * Barème de passage et d'appréciation de la classe : chaque tranche de moyenne
 * annuelle (ex. [02–09]) donne une appréciation (« Bien », « Redouble »...) et,
 * en option, une décision de passage suggérée. Sans tranche définie ici, la
 * classe garde les mentions et le seuil de passage globaux de l'école - la
 * personnalisation est donc sans risque pour les classes déjà en place.
 */
export function GradeScaleCard({ schoolClass, siblingClasses }: GradeScaleCardProps) {
  const { t } = useT();
  const [rows, setRows] = useState<BandRow[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    setRows(null);
    setError(null);
    setNotice(null);
    setTargetIds([]);

    getGradeScale(schoolClass.id)
      .then((bands) =>
        setRows(
          bands.map((band) => ({
            key: band.id,
            min_average: band.min_average,
            max_average: band.max_average,
            label: band.label,
            decision: band.decision?.value ?? null,
          })),
        ),
      )
      .catch((failure) => setError(getErrorMessage(failure, t("Impossible de charger le barème."))));
    // Recharger à chaque changement de langue effacerait les tranches en cours de modification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolClass.id]);

  function updateRow(key: string, patch: Partial<BandRow>) {
    setRows((current) => current?.map((row) => (row.key === key ? { ...row, ...patch } : row)) ?? current);
  }

  function removeRow(key: string) {
    setRows((current) => current?.filter((row) => row.key !== key) ?? current);
  }

  async function handleSave() {
    if (!rows) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const saved = await saveGradeScale(
        schoolClass.id,
        rows.map((row) => ({ min_average: row.min_average, max_average: row.max_average, label: row.label, decision: row.decision })),
      );
      setRows(
        saved.map((band) => ({
          key: band.id,
          min_average: band.min_average,
          max_average: band.max_average,
          label: band.label,
          decision: band.decision?.value ?? null,
        })),
      );
      setNotice(t("Barème enregistré."));
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible d'enregistrer ce barème.")));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDuplicate() {
    if (targetIds.length === 0) return;

    setIsDuplicating(true);
    setError(null);
    setNotice(null);

    try {
      await duplicateGradeScale(schoolClass.id, targetIds);
      setNotice(t("Barème dupliqué vers {count} classe(s).", { count: targetIds.length }));
      setTargetIds([]);
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible de dupliquer ce barème.")));
    } finally {
      setIsDuplicating(false);
    }
  }

  return (
    <Card accent="grades" className="mb-5">
      <CardHeader>
        <CardTitle>Barème de passage et d&apos;appréciation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">
          {t(
            "Chaque tranche de moyenne annuelle donne une appréciation (ex. « Bien », « Redouble ») et, en option, une décision de passage suggérée dans le tableau des résultats. Sans tranche définie ici, {className} garde les mentions et le seuil de passage par défaut de l'école.",
            { className: schoolClass.name },
          )}
        </p>

        {rows === null ? (
          <p className="text-sm text-muted">{t("Chargement...")}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
                    <th className="py-2 pr-3 font-medium">{t("Moyenne min")}</th>
                    <th className="py-2 pr-3 font-medium">{t("Moyenne max")}</th>
                    <th className="py-2 pr-3 font-medium">{t("Appréciation")}</th>
                    <th className="py-2 pr-3 font-medium">{t("Décision suggérée")}</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-sm text-muted">
                        {t("Aucune tranche : ajoutez-en une pour personnaliser le barème de cette classe.")}
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.key} className="border-b border-border">
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          className="w-20"
                          value={row.min_average}
                          onChange={(event) => updateRow(row.key, { min_average: Number(event.target.value) })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          className="w-20"
                          value={row.max_average}
                          onChange={(event) => updateRow(row.key, { max_average: Number(event.target.value) })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          placeholder={t("Bien, Redouble...")}
                          className="w-40"
                          value={row.label}
                          onChange={(event) => updateRow(row.key, { label: event.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Select
                          className="h-9 w-56"
                          value={row.decision ?? ""}
                          onChange={(event) =>
                            updateRow(row.key, { decision: (event.target.value || null) as PromotionDecisionValue | null })
                          }
                        >
                          <option value="">{t("Aucune (seuil global)")}</option>
                          {DECISION_VALUES.map((value) => (
                            <option key={value} value={value}>
                              {t(DECISION_LABEL[value])}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          aria-label={t("Supprimer cette tranche")}
                          className="text-muted hover:text-danger"
                          onClick={() => removeRow(row.key)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={() => setRows((current) => [...(current ?? []), emptyRow()])}>
                <Plus className="size-4" /> {t("Ajouter une tranche")}
              </Button>
              <Button type="button" size="sm" loading={isSaving} onClick={handleSave}>
                <Save className="size-4" /> {t("Enregistrer le barème")}
              </Button>
            </div>

            {siblingClasses.length > 0 && (
              <div className="rounded-md border border-border bg-background px-4 py-3">
                <p className="mb-2 text-xs font-medium text-muted">{t("Dupliquer ce barème vers d'autres classes")}</p>
                <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {siblingClasses.map((candidate) => (
                    <Checkbox
                      key={candidate.id}
                      label={candidate.name}
                      checked={targetIds.includes(candidate.id)}
                      onChange={(event) =>
                        setTargetIds((current) =>
                          event.target.checked ? [...current, candidate.id] : current.filter((id) => id !== candidate.id),
                        )
                      }
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={isDuplicating}
                  disabled={targetIds.length === 0}
                  onClick={handleDuplicate}
                >
                  <Copy className="size-4" /> {t("Dupliquer")}
                </Button>
              </div>
            )}
          </>
        )}

        {error && <Alert>{error}</Alert>}
        {notice && (
          <p role="status" className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground">
            {notice}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
