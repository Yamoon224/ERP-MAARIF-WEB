"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Input, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateClassFee } from "@/lib/api/accounting";
import { listAcademicYears, listClassesOfYear } from "@/lib/api/academics";
import { getErrorMessage } from "@/lib/api/error";
import type { AcademicYear, SchoolClass, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { defaultYear } from "@/lib/period/usePeriodFilter";
import { CURRENCY, formatMoney, monthsBetween } from "@/lib/utils/format";

/**
 * Scolarité mensuelle de chaque classe, pour une année scolaire. Le tarif est
 * mensuel quelle que soit la formule de paiement choisie par la famille. Le
 * modifier met à jour les mois non réglés de tous les élèves de la classe ;
 * les mois déjà payés gardent leur montant.
 */
export default function FeesPage() {
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "accounting.manage");

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listAcademicYears()
      .then((loaded) => {
        setYears(loaded);
        setAcademicYear(defaultYear(loaded)?.label ?? "");
      })
      .catch(() => setError("Impossible de charger les années scolaires."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!academicYear) return;

    setIsLoading(true);
    listClassesOfYear(academicYear)
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setIsLoading(false));
  }, [academicYear]);

  async function save(schoolClass: SchoolClass) {
    if (!editing) return;

    const amount = Number(editing.value);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Le montant doit être un nombre positif ou nul.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateClassFee(schoolClass.id, amount);
      setClasses((current) => current.map((row) => (row.id === updated.id ? { ...row, monthly_fee: updated.monthly_fee } : row)));
      setEditing(null);
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible de modifier ce tarif."));
    } finally {
      setIsSaving(false);
    }
  }

  const columns: DataTableColumn<SchoolClass>[] = [
    { key: "name", header: "Classe", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "level", header: "Niveau", render: (row) => row.level },
    { key: "students", header: "Effectif", render: (row) => row.students_count ?? "—" },
    {
      key: "fee",
      header: "Scolarité mensuelle",
      render: (row) =>
        editing?.id === row.id ? (
          <div className="flex items-center gap-2">
            <Input
              aria-label={`Scolarité mensuelle de ${row.name} (${CURRENCY})`}
              type="number"
              min={0}
              step="any"
              className="h-8 w-40"
              autoFocus
              value={editing.value}
              onChange={(event) => setEditing({ id: row.id, value: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") save(row);
                if (event.key === "Escape") setEditing(null);
              }}
            />
            <Button size="sm" onClick={() => save(row)} loading={isSaving} aria-label="Enregistrer le tarif">
              <Check className="size-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(null)} aria-label="Annuler">
              <X className="size-4" />
            </Button>
          </div>
        ) : row.monthly_fee > 0 ? (
          <span className="font-medium">{formatMoney(row.monthly_fee)}</span>
        ) : (
          <span className="text-warning">Non fixée</span>
        ),
    },
    {
      key: "year",
      header: "Sur l'année",
      render: (row) => (row.monthly_fee > 0 ? formatMoney(row.monthly_fee * monthsInYear(years, academicYear)) : "—"),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            render: (row: SchoolClass) =>
              editing?.id === row.id ? null : (
                <button
                  type="button"
                  onClick={() => setEditing({ id: row.id, value: String(row.monthly_fee || "") })}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Pencil className="size-4" aria-hidden="true" /> Modifier
                </button>
              ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Frais de scolarité"
        description="Tarif mensuel par classe. Il s'applique à chaque mois de l'année scolaire, quelle que soit la formule de paiement (mois, trimestre, semestre, année)."
        actions={
          <label className="flex flex-col text-xs font-medium text-muted">
            Année scolaire
            <Select className="mt-1 h-9 w-44" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
              {years.map((year) => (
                <option key={year.label} value={year.label}>
                  {year.label}
                </option>
              ))}
            </Select>
          </label>
        }
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      <DataTable exportName="Frais de scolarité" columns={columns} rows={classes} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune classe pour cette année." />
    </div>
  );
}

/** Nombre de mois de scolarité d'une année : du mois de son premier jour à celui de son dernier. */
function monthsInYear(years: AcademicYear[], label: string): number {
  const year = years.find((candidate) => candidate.label === label);
  return year ? monthsBetween(year.starts_at, year.ends_at).length : 0;
}
