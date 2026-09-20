"use client";

import { CalendarRange } from "lucide-react";
import { Select } from "@/components/ui/Field";
import { formatMonth } from "@/lib/utils/format";
import type { PeriodFilterState, PeriodMode } from "@/lib/period/usePeriodFilter";
import { cn } from "@/lib/utils/cn";

const MODES: ReadonlyArray<{ value: PeriodMode; label: string }> = [
  { value: "year", label: "Année" },
  { value: "term", label: "Trimestre" },
  { value: "month", label: "Mois" },
];

interface PeriodFilterProps {
  filter: PeriodFilterState;
  /** Masque l'un des niveaux, par exemple le mois pour un écran qui n'a pas de sens mensuel. */
  modes?: PeriodMode[];
  className?: string;
}

/**
 * Filtre de période commun à tous les écrans : année scolaire (obligatoire),
 * puis au choix l'année entière, un trimestre ou un mois de cette année.
 */
export function PeriodFilter({ filter, modes = ["year", "term", "month"], className }: PeriodFilterProps) {
  const { years, year, months, mode, termId, month, isLoading } = filter;

  if (!isLoading && years.length === 0) {
    return (
      <p className={cn("rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted", className)}>
        Aucune année scolaire n&apos;est encore définie : créez d&apos;abord les trimestres.
      </p>
    );
  }

  const availableModes = MODES.filter((option) => modes.includes(option.value));

  return (
    <div
      role="group"
      aria-label="Filtre de période"
      className={cn("flex flex-wrap items-end gap-x-4 gap-y-3 rounded-md border border-border bg-surface px-4 py-3", className)}
    >
      <div className="flex items-center gap-2 self-center text-sm font-medium text-muted">
        <CalendarRange className="size-4" aria-hidden="true" />
        Période
      </div>

      <label className="text-xs font-medium text-muted">
        Année scolaire
        <Select
          className="mt-1 h-9 w-40"
          value={year?.label ?? ""}
          disabled={isLoading}
          onChange={(event) => filter.setYear(event.target.value)}
        >
          {years.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
              {option.is_current ? " (en cours)" : ""}
            </option>
          ))}
        </Select>
      </label>

      <div role="radiogroup" aria-label="Niveau de détail" className="inline-flex overflow-hidden rounded-full border border-border">
        {availableModes.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={mode === option.value}
            onClick={() => filter.setMode(option.value)}
            className={cn(
              "h-9 px-4 text-sm font-medium transition-colors",
              mode === option.value ? "bg-primary text-primary-foreground" : "text-muted hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {mode === "term" && (
        <label className="text-xs font-medium text-muted">
          Trimestre
          <Select className="mt-1 h-9 w-44" value={termId ?? ""} onChange={(event) => filter.setTermId(event.target.value)}>
            {year?.terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </Select>
        </label>
      )}

      {mode === "month" && (
        <label className="text-xs font-medium text-muted">
          Mois
          <Select className="mt-1 h-9 w-44" value={month ?? ""} onChange={(event) => filter.setMonth(event.target.value)}>
            {months.map((value) => (
              <option key={value} value={value}>
                {formatMonth(value)}
              </option>
            ))}
          </Select>
        </label>
      )}
    </div>
  );
}
