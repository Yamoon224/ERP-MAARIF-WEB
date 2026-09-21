import type { Locale } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils/cn";

/**
 * Drapeaux des langues proposées, en SVG : les émojis de drapeaux ne s'affichent pas sous Windows (deux lettres
 * à la place), alors qu'un SVG est identique partout. Purement décoratifs : la langue est toujours nommée à côté.
 */
export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  const classes = cn("h-4 w-6 shrink-0 rounded-[3px] ring-1 ring-black/15", className);

  if (locale === "fr") {
    return (
      <svg viewBox="0 0 3 2" className={classes} aria-hidden="true" focusable="false" data-flag="fr">
        <rect width="1" height="2" fill="#002395" />
        <rect x="1" width="1" height="2" fill="#ffffff" />
        <rect x="2" width="1" height="2" fill="#ed2939" />
      </svg>
    );
  }

  // États-Unis : treize bandes, canton bleu et une grille d'étoiles simplifiée.
  const stars = Array.from({ length: 4 }, (_, row) => Array.from({ length: 5 }, (_, column) => [0.85 + column * 1.5, 0.75 + row * 1.2] as const)).flat();

  return (
    <svg viewBox="0 0 19 10" className={classes} aria-hidden="true" focusable="false" data-flag="us">
      <rect width="19" height="10" fill="#ffffff" />
      {[0, 2, 4, 6, 8, 10, 12].map((stripe) => (
        <rect key={stripe} y={(stripe * 10) / 13} width="19" height={10 / 13} fill="#b22234" />
      ))}
      <rect width="7.6" height={(10 * 7) / 13} fill="#3c3b6e" />
      {stars.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.32" fill="#ffffff" />
      ))}
    </svg>
  );
}
