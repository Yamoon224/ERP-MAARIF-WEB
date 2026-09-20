"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CheckCheck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPicker } from "@/components/staff/attendance/StatusPicker";
import { getRollCall, recordClassAttendance } from "@/lib/api/attendance";
import { getErrorMessage } from "@/lib/api/error";
import type { AttendanceStatus, RollCallRow } from "@/lib/api/types";
import { useSchoolClassOptions } from "@/lib/hooks/useSchoolClassOptions";
import { today } from "@/lib/utils/format";

interface RowState {
  status: AttendanceStatus;
  justified: boolean;
  reason: string;
}

/**
 * Appel de classe : on choisit la classe et la date, la feuille liste les
 * élèves actifs, et tout est enregistré en un seul envoi. Un élève déjà pointé
 * ce jour-là est prérempli avec son pointage (refaire l'appel le corrige).
 */
export default function AttendancePage() {
  const classes = useSchoolClassOptions();
  const [schoolClassId, setSchoolClassId] = useState("");
  const [date, setDate] = useState(() => today());
  const [rows, setRows] = useState<RollCallRow[]>([]);
  const [state, setState] = useState<Record<string, RowState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Classes les plus récentes d'abord : l'appel se fait presque toujours dans l'année en cours.
  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => b.academic_year.localeCompare(a.academic_year) || a.name.localeCompare(b.name)),
    [classes],
  );

  const loadRollCall = useCallback(async () => {
    if (!schoolClassId || !date) {
      setRows([]);
      setState({});
      return;
    }

    setIsLoading(true);
    setError(null);
    setSavedCount(null);

    try {
      const loaded = await getRollCall(schoolClassId, date);
      setRows(loaded);
      setState(
        Object.fromEntries(
          loaded.map((row) => [
            row.student.id,
            {
              status: row.record?.status ?? "present",
              justified: row.record?.justified ?? false,
              reason: row.record?.reason ?? "",
            },
          ]),
        ),
      );
    } catch (failure) {
      setRows([]);
      setError(getErrorMessage(failure, "Impossible de charger la feuille d'appel."));
    } finally {
      setIsLoading(false);
    }
  }, [schoolClassId, date]);

  useEffect(() => {
    loadRollCall();
  }, [loadRollCall]);

  function update(studentId: string, patch: Partial<RowState>) {
    setSavedCount(null);
    setState((current) => ({ ...current, [studentId]: { ...current[studentId], ...patch } }));
  }

  function markAllPresent() {
    setSavedCount(null);
    setState((current) =>
      Object.fromEntries(Object.entries(current).map(([id, row]) => [id, { status: "present" as const, justified: false, reason: "" }])),
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      await recordClassAttendance({
        school_class_id: schoolClassId,
        date,
        records: rows.map((row) => {
          const entry = state[row.student.id];
          const isPresent = entry.status === "present";

          return {
            student_id: row.student.id,
            status: entry.status,
            justified: isPresent ? false : entry.justified,
            reason: isPresent ? null : entry.reason || null,
          };
        }),
      });
      // Recharger la feuille remet le compteur à zéro : on l'affiche après.
      await loadRollCall();
      setSavedCount(rows.length);
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible d'enregistrer l'appel."));
    } finally {
      setIsSaving(false);
    }
  }

  const counts = useMemo(() => {
    const values = Object.values(state);
    return {
      present: values.filter((row) => row.status === "present").length,
      absent: values.filter((row) => row.status === "absent").length,
      late: values.filter((row) => row.status === "retard").length,
      alreadyPointed: rows.filter((row) => row.record !== null).length,
    };
  }, [state, rows]);

  return (
    <div>
      <PageHeader
        title="Présences"
        description="Faites l'appel d'une classe : un clic par élève, un seul enregistrement."
        actions={
          <Link href="/absences" className="text-sm font-medium text-primary hover:underline">
            Suivi et justification des absences →
          </Link>
        }
      />

      <Card accent="attendance" className="mb-6">
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-foreground">
            Classe
            <Select className="mt-1.5" value={schoolClassId} onChange={(event) => setSchoolClassId(event.target.value)}>
              <option value="">Choisir une classe...</option>
              {sortedClasses.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name} ({schoolClass.academic_year})
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-medium text-foreground">
            Date de l&apos;appel
            <Input className="mt-1.5" type="date" value={date} max={today()} onChange={(event) => setDate(event.target.value)} />
          </label>
        </CardContent>
      </Card>

      {error && <Alert className="mb-4">{error}</Alert>}

      {schoolClassId && !isLoading && rows.length === 0 && !error && (
        <p className="rounded-md border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          Aucun élève actif inscrit dans cette classe.
        </p>
      )}

      {isLoading && <p className="text-sm text-muted">Chargement de la feuille d&apos;appel...</p>}

      {rows.length > 0 && (
        <Card accent="attendance">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              Feuille d&apos;appel · {rows.length} élève(s)
              {counts.alreadyPointed > 0 && <span className="ml-2 font-normal text-muted">({counts.alreadyPointed} déjà pointé(s) ce jour)</span>}
            </CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={markAllPresent}>
              <CheckCheck className="size-4" /> Tout marquer présent
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
                    <th className="py-2 pr-4 font-medium">Élève</th>
                    <th className="py-2 pr-4 font-medium">Statut</th>
                    <th className="py-2 pr-4 font-medium">Justifiée</th>
                    <th className="py-2 font-medium">Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const entry = state[row.student.id];
                    if (!entry) return null;
                    const isPresent = entry.status === "present";

                    return (
                      <tr key={row.student.id} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-4">
                          <span className="font-medium text-foreground">{row.student.name}</span>
                          <span className="ml-2 font-mono text-xs text-muted">{row.student.matricule}</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <StatusPicker value={entry.status} onChange={(status) => update(row.student.id, { status })} label={row.student.name} />
                        </td>
                        <td className="py-2.5 pr-4">
                          <input
                            type="checkbox"
                            aria-label={`Absence justifiée pour ${row.student.name}`}
                            disabled={isPresent}
                            checked={!isPresent && entry.justified}
                            onChange={(event) => update(row.student.id, { justified: event.target.checked })}
                            className="size-4 rounded border-border"
                          />
                        </td>
                        <td className="py-2.5">
                          <Input
                            aria-label={`Motif pour ${row.student.name}`}
                            className="h-8 min-w-48"
                            placeholder={isPresent ? "" : "Motif (optionnel)"}
                            disabled={isPresent}
                            value={isPresent ? "" : entry.reason}
                            maxLength={255}
                            onChange={(event) => update(row.student.id, { reason: event.target.value })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted" aria-live="polite">
                {counts.present} présent(s) · {counts.absent} absent(s) · {counts.late} en retard
                {savedCount !== null && (
                  <span className="ml-3 inline-flex items-center gap-1 font-medium text-success">
                    <Check className="size-4" aria-hidden="true" /> Appel enregistré ({savedCount} élèves)
                  </span>
                )}
              </p>
              <Button type="button" onClick={handleSave} loading={isSaving}>
                <Check className="size-4" /> Enregistrer l&apos;appel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
