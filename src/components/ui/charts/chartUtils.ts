/** Couleur du n-ième élément d'une série catégorielle (fixe, jamais permutée : voir --series-* dans globals.css). */
export function seriesColor(index: number): string {
  return `var(--series-${(index % 6) + 1})`;
}

/** Teinte neutre du regroupement « Autres » : un reste n'a pas d'identité, il ne prend pas une couleur de série. */
export const OTHER_COLOR = "var(--muted)";

export interface AxisScale {
  /** Borne haute de l'axe (un nombre « rond » au-dessus de la plus grande valeur). */
  max: number;
  /** Graduations de 0 à `max`, incluses. */
  ticks: number[];
}

/**
 * Échelle d'axe à graduations rondes : 0 / 250 k / 500 k / 750 k / 1 M plutôt
 * que des multiples de la plus grande valeur. `integer` garde des graduations
 * entières pour des effectifs (jamais « 0,25 élève »).
 */
export function niceScale(maxValue: number, integer = false): AxisScale {
  if (!(maxValue > 0)) return { max: 1, ticks: integer ? [0, 1] : [0, 0.5, 1] };

  if (integer && maxValue <= 5) {
    const max = Math.ceil(maxValue);
    return { max, ticks: Array.from({ length: max + 1 }, (_, index) => index) };
  }

  const magnitude = 10 ** Math.floor(Math.log10(maxValue));
  const normalized = maxValue / magnitude;
  const rounded = [1, 2, 2.5, 5, 10].find((step) => step >= normalized) ?? 10;
  const max = rounded * magnitude;
  const divisions = rounded === 1 || rounded === 2 ? 4 : 5;

  return { max, ticks: Array.from({ length: divisions + 1 }, (_, index) => (max / divisions) * index) };
}

const compactFormatter = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

/** 1250000 -> « 1,3 M » : graduation d'axe, sans devise (le titre du graphique la donne). */
export function formatTick(value: number): string {
  return compactFormatter.format(value);
}

export interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * Prépare les parts d'un anneau : les valeurs nulles disparaissent, les plus
 * grosses passent en premier, et au-delà de `max` parts le reste est regroupé
 * en « Autres » (un anneau de plus de six parts ne se lit plus).
 */
export function toSlices(items: Array<{ key: string; label: string; value: number }>, max = 6): Slice[] {
  const positive = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);

  if (positive.length <= max) {
    return positive.map((item, index) => ({ ...item, color: seriesColor(index) }));
  }

  const head = positive.slice(0, max - 1).map((item, index) => ({ ...item, color: seriesColor(index) }));
  const rest = positive.slice(max - 1).reduce((sum, item) => sum + item.value, 0);

  return [...head, { key: "other", label: "Autres", value: rest, color: OTHER_COLOR }];
}
