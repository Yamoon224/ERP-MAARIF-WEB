import { cn } from "@/lib/utils/cn";

export interface BarChartDatum {
  label: string;
  value: number;
  /** Texte du survol et de l'alternative accessible (montant formaté). */
  title: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  ariaLabel: string;
  className?: string;
}

/**
 * Histogramme minimal en CSS : suffit pour lire une évolution mensuelle sans
 * embarquer de bibliothèque de graphiques. Chaque barre porte son montant en
 * `title` et dans le tableau masqué destiné aux lecteurs d'écran.
 */
export function BarChart({ data, ariaLabel, className }: BarChartProps) {
  const max = Math.max(...data.map((datum) => datum.value), 0);

  return (
    <div className={cn("w-full", className)}>
      <div role="img" aria-label={ariaLabel} className="flex h-40 items-end gap-2">
        {data.map((datum) => {
          const height = max > 0 ? Math.max((datum.value / max) * 100, datum.value > 0 ? 3 : 0) : 0;

          return (
            <div key={datum.label} className="flex h-full flex-1 flex-col justify-end" title={`${datum.label} : ${datum.title}`}>
              <div className="rounded-t bg-accent-accounting" style={{ height: `${height}%` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2" aria-hidden="true">
        {data.map((datum) => (
          <span key={datum.label} className="flex-1 truncate text-center text-xs text-muted">
            {datum.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.label}>
              <th scope="row">{datum.label}</th>
              <td>{datum.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
