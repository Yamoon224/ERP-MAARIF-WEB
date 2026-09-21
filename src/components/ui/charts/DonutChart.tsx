"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { Slice } from "@/components/ui/charts/chartUtils";

interface DonutChartProps {
  slices: Slice[];
  ariaLabel: string;
  /** Formate la valeur d'une part (montant, effectif...). */
  formatValue: (value: number) => string;
  /** Valeur au centre de l'anneau, plus courte que celle de la légende (un montant compact) ; par défaut la même. */
  formatCenter?: (value: number) => string;
  /** Texte sous le total, au centre de l'anneau. */
  totalLabel?: string;
  emptyMessage?: string;
  className?: string;
}

const RADIUS = 44;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Écart de surface entre deux parts, en unités du viewBox (2 px environ à 160 px de large). */
const GAP = 1.5;

const percentFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/**
 * Anneau (donut) pour une répartition d'un tout : au plus six parts (le reste
 * est regroupé en « Autres » par `toSlices`). Les parts sont séparées par un
 * écart de la couleur de surface, jamais par un contour. La légende porte le
 * libellé, la valeur et la part de chaque ligne, en texte neutre : la couleur
 * n'est jamais le seul canal d'identité.
 */
export function DonutChart({
  slices,
  ariaLabel,
  formatValue,
  formatCenter = formatValue,
  totalLabel = "au total",
  emptyMessage = "Aucune donnée sur la période.",
  className,
}: DonutChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (total <= 0) {
    return <p className={cn("text-sm text-muted", className)}>{emptyMessage}</p>;
  }

  const focus = slices.find((slice) => slice.key === hovered) ?? null;
  // Début et longueur de chaque arc sur la circonférence, calculés d'avance : le rendu ne modifie aucune variable.
  const arcs = slices.reduce<Array<{ slice: Slice; start: number; length: number }>>((acc, slice) => {
    const start = acc.length === 0 ? 0 : acc[acc.length - 1].start + acc[acc.length - 1].length;
    return [...acc, { slice, start, length: (slice.value / total) * CIRCUMFERENCE }];
  }, []);

  return (
    <figure className={cn("flex flex-col items-center gap-6 sm:flex-row", className)}>
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 120 120" role="img" aria-label={ariaLabel} className="size-full -rotate-90" onPointerLeave={() => setHovered(null)}>
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={STROKE} opacity={0.4} />
          {arcs.map(({ slice, start, length }) => {
            const visible = arcs.length > 1 ? Math.max(length - GAP, 0.5) : length;

            return (
              <circle
                key={slice.key}
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={STROKE}
                strokeDasharray={`${visible} ${CIRCUMFERENCE - visible}`}
                strokeDashoffset={-start}
                opacity={hovered === null || hovered === slice.key ? 1 : 0.35}
                className="transition-opacity"
                onPointerEnter={() => setHovered(slice.key)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-base leading-tight font-semibold text-foreground">{formatCenter(focus?.value ?? total)}</span>
          <span className="mt-0.5 max-w-24 truncate text-xs text-muted">{focus ? focus.label : totalLabel}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1.5 text-sm" aria-label="Légende">
        {slices.map((slice) => (
          <li
            key={slice.key}
            className={cn("flex items-center gap-2 rounded px-1.5 py-0.5 transition-colors", hovered === slice.key && "bg-foreground/5")}
            onPointerEnter={() => setHovered(slice.key)}
            onPointerLeave={() => setHovered(null)}
          >
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-foreground">{slice.label}</span>
            <span className="text-muted tabular-nums">{formatValue(slice.value)}</span>
            <span className="w-10 text-right text-muted tabular-nums">{percentFormatter.format((slice.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
