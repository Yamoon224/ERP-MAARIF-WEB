"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatTick, niceScale } from "@/components/ui/charts/chartUtils";

export interface ColumnSeries {
  key: string;
  label: string;
  /** Couleur CSS de la série, en général `seriesColor(n)`. */
  color: string;
}

export interface ColumnDatum {
  /** Libellé court de l'axe (« oct. »). */
  label: string;
  /** Libellé complet du survol et du tableau (« octobre 2025 »). */
  fullLabel?: string;
  values: Record<string, number>;
}

interface ColumnChartProps {
  series: ColumnSeries[];
  data: ColumnDatum[];
  ariaLabel: string;
  /** Formate une valeur pour le survol et le tableau (montant, effectif...). */
  formatValue: (value: number) => string;
  /** Effectifs : graduations entières. */
  integer?: boolean;
  /** Hauteur de la zone de tracé, en pixels. */
  height?: number;
  className?: string;
}

/**
 * Histogramme à une ou plusieurs séries, en HTML/CSS (aucune bibliothèque).
 *
 * Marques fines (24 px au plus), extrémité arrondie de 4 px et pied droit sur
 * la ligne de base, 2 px d'écart entre barres voisines, grille en filets
 * discrets. Au-dessus de deux séries la légende est toujours présente ; le
 * survol donne le détail d'un groupe, et les valeurs restent lisibles dans le
 * tableau repliable, pour le clavier et les lecteurs d'écran.
 */
export function ColumnChart({ series, data, ariaLabel, formatValue, integer = false, height = 200, className }: ColumnChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const peak = Math.max(0, ...data.flatMap((datum) => series.map((entry) => datum.values[entry.key] ?? 0)));
  const scale = niceScale(peak, integer);
  const active = hovered === null ? null : data[hovered];

  return (
    <figure className={cn("w-full", className)}>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label="Légende">
          {series.map((entry) => (
            <li key={entry.key} className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: entry.color }} aria-hidden="true" />
              {entry.label}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <div className="relative w-10 shrink-0 text-right text-[11px] text-muted" style={{ height }} aria-hidden="true">
          {scale.ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2 tabular-nums" style={{ bottom: `${(tick / scale.max) * 100}%` }}>
              {formatTick(tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div role="img" aria-label={ariaLabel} className="relative" style={{ height }} onPointerLeave={() => setHovered(null)}>
            {scale.ticks.map((tick) => (
              <div key={tick} className="absolute inset-x-0 border-t border-border" style={{ bottom: `${(tick / scale.max) * 100}%` }} aria-hidden="true" />
            ))}

            <div className="absolute inset-0 flex">
              {data.map((datum, index) => (
                <div
                  key={datum.label + index}
                  className={cn("flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 px-0.5 transition-colors", hovered === index && "bg-foreground/5")}
                  onPointerEnter={() => setHovered(index)}
                  onClick={() => setHovered(index)}
                >
                  {series.map((entry) => {
                    const value = datum.values[entry.key] ?? 0;
                    const share = (value / scale.max) * 100;

                    return (
                      <div
                        key={entry.key}
                        className="w-full max-w-6 rounded-t-[4px]"
                        style={{ height: `${value > 0 ? Math.max(share, 1.5) : 0}%`, backgroundColor: entry.color }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {active && hovered !== null && (
              <div
                className={cn(
                  "pointer-events-none absolute top-0 z-10 min-w-40 rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-md",
                  hovered < data.length / 2 ? "" : "-translate-x-full",
                )}
                style={{ left: `${((hovered + (hovered < data.length / 2 ? 1 : 0)) / data.length) * 100}%` }}
              >
                <p className="mb-1 font-medium text-foreground">{active.fullLabel ?? active.label}</p>
                {series.map((entry) => (
                  <p key={entry.key} className="flex items-center justify-between gap-4 text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
                      {entry.label}
                    </span>
                    <span className="font-medium text-foreground tabular-nums">{formatValue(active.values[entry.key] ?? 0)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 flex" aria-hidden="true">
            {data.map((datum, index) => (
              <span key={datum.label + index} className="min-w-0 flex-1 truncate text-center text-[11px] text-muted">
                {datum.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-primary">Voir les valeurs</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{ariaLabel}</caption>
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 pr-4 font-medium" />
              {series.map((entry) => (
                <th key={entry.key} scope="col" className="py-1 pr-4 font-medium">
                  {entry.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((datum, index) => (
              <tr key={datum.label + index} className="border-t border-border">
                <th scope="row" className="py-1 pr-4 font-medium text-foreground">
                  {datum.fullLabel ?? datum.label}
                </th>
                {series.map((entry) => (
                  <td key={entry.key} className="py-1 pr-4 text-foreground tabular-nums">
                    {formatValue(datum.values[entry.key] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
