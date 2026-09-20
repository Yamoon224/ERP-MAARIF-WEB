"use client";

import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { listAcademicYears, listMyAcademicYears } from "@/lib/api/academics";
import type { AcademicYear, PeriodParams } from "@/lib/api/types";
import { currentMonth, monthsBetween } from "@/lib/utils/format";

/**
 * Granularité du filtre : l'année scolaire entière, un de ses trois
 * trimestres, ou un de ses mois.
 */
export type PeriodMode = "year" | "term" | "month";

interface PeriodState {
  academicYear: string | null;
  mode: PeriodMode;
  termId: string | null;
  month: string | null;
  set: (patch: Partial<Omit<PeriodState, "set">>) => void;
}

/**
 * Sélection partagée entre les pages : passer du tableau de bord aux absences
 * ou à la comptabilité conserve la période choisie. Volontairement en mémoire
 * (pas de stockage persistant) : un rechargement repart de l'année courante.
 */
export const usePeriodStore = create<PeriodState>()((set) => ({
  academicYear: null,
  mode: "year",
  termId: null,
  month: null,
  set: (patch) => set(patch),
}));

/** Remet la sélection à zéro (utilisé par les tests). */
export function resetPeriodStore() {
  usePeriodStore.setState({ academicYear: null, mode: "year", termId: null, month: null });
}

export function monthsOf(year: AcademicYear | undefined): string[] {
  return year ? monthsBetween(year.starts_at, year.ends_at) : [];
}

/** Année proposée par défaut : celle du trimestre courant, sinon la plus récente. */
export function defaultYear(years: AcademicYear[]): AcademicYear | undefined {
  return years.find((year) => year.is_current) ?? years[0];
}

function defaultTermId(year: AcademicYear | undefined): string | null {
  return (year?.terms.find((term) => term.is_current) ?? year?.terms[0])?.id ?? null;
}

function defaultMonth(year: AcademicYear | undefined): string | null {
  const months = monthsOf(year);
  const now = currentMonth();

  return (months.includes(now) ? now : months[0]) ?? null;
}

export interface UsePeriodFilterOptions {
  /** Portail parent : les années se lisent sur une route dédiée. */
  source?: "staff" | "parent";
  /**
   * Impose le niveau de détail, sans toucher à la sélection partagée : un
   * bulletin n'existe que par trimestre, quel que soit le choix fait ailleurs.
   */
  forceMode?: PeriodMode;
}

/**
 * Filtre "Année scolaire / Trimestre / Mensuel" : charge les années, garde la
 * sélection cohérente (un trimestre ou un mois n'existe que dans son année) et
 * fournit les paramètres de requête à passer aux appels API.
 */
export function usePeriodFilter({ source = "staff", forceMode }: UsePeriodFilterOptions = {}) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const state = usePeriodStore();
  const mode = forceMode ?? state.mode;

  useEffect(() => {
    let cancelled = false;

    (source === "parent" ? listMyAcademicYears() : listAcademicYears())
      .then((loaded) => {
        if (!cancelled) setYears(loaded);
      })
      .catch(() => {
        if (!cancelled) setYears([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  const year = years.find((candidate) => candidate.label === state.academicYear);

  // Une sélection périmée (année supprimée, première visite) est ramenée à une valeur valide.
  useEffect(() => {
    if (years.length === 0) return;

    if (!year) {
      const fallback = defaultYear(years);
      usePeriodStore.getState().set({
        academicYear: fallback?.label ?? null,
        termId: defaultTermId(fallback),
        month: defaultMonth(fallback),
      });
      return;
    }

    if (state.termId === null || !year.terms.some((term) => term.id === state.termId)) {
      usePeriodStore.getState().set({ termId: defaultTermId(year) });
    }
    if (state.month === null || !monthsOf(year).includes(state.month)) {
      usePeriodStore.getState().set({ month: defaultMonth(year) });
    }
  }, [years, year, state.termId, state.month]);

  const months = useMemo(() => monthsOf(year), [year]);

  const params = useMemo<PeriodParams>(() => {
    if (!year) return {};
    if (mode === "term" && state.termId) return { academic_year: year.label, term_id: state.termId };
    if (mode === "month" && state.month) return { academic_year: year.label, month: state.month };
    return { academic_year: year.label };
  }, [year, mode, state.termId, state.month]);

  return {
    years,
    year,
    months,
    mode,
    termId: state.termId,
    month: state.month,
    params,
    /** `false` tant que les années ne sont pas chargées : les pages attendent avant de requêter. */
    isReady: !isLoading && year !== undefined,
    isLoading,
    setYear: (label: string) => {
      const next = years.find((candidate) => candidate.label === label);
      state.set({ academicYear: label, termId: defaultTermId(next), month: defaultMonth(next) });
    },
    setMode: (next: PeriodMode) => {
      if (!forceMode) state.set({ mode: next });
    },
    setTermId: (termId: string) => state.set({ termId }),
    setMonth: (month: string) => state.set({ month }),
  };
}

export type PeriodFilterState = ReturnType<typeof usePeriodFilter>;
