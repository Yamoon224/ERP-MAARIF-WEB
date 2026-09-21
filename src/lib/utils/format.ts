/** Devise d'affichage des montants (code ISO 4217). Configurable : NEXT_PUBLIC_CURRENCY. */
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "GNF";

const moneyFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: CURRENCY });

/** 1250000 -> "1 250 000 FG" (les décimales suivent la devise : aucune pour le GNF, deux pour l'EUR). */
export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}

/** Date `YYYY-MM-DD` (ou ISO) -> `03/11/2025`, sans décalage de fuseau horaire. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

/** Date-heure ISO -> `03/11/2025 09:30` (heure locale). */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const shortMonthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

function monthToDate(month: string): Date {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex - 1, 1));
}

/** `2025-10` -> `octobre 2025`. */
export function formatMonth(month: string): string {
  return monthFormatter.format(monthToDate(month));
}

/** `2025-10` -> `oct.` (axe d'un histogramme). */
export function formatMonthShort(month: string): string {
  return shortMonthFormatter.format(monthToDate(month));
}

/**
 * Libellé d'axe d'un mois `YYYY-MM` : « sept. 25 » pour le premier et à chaque janvier, « oct. » sinon.
 * Sans l'année, septembre 2025 et septembre 2026 se confondraient sur un axe qui déborde d'une année.
 */
export function formatMonthAxis(month: string, index: number): string {
  const short = formatMonthShort(month);
  return index === 0 || month.endsWith("-01") ? `${short} ${month.slice(2, 4)}` : short;
}

/** Tous les mois `YYYY-MM` entre deux dates (bornes incluses), dans l'ordre. */
export function monthsBetween(from: string, to: string): string[] {
  const [startYear, startMonth] = from.slice(0, 7).split("-").map(Number);
  const [endYear, endMonth] = to.slice(0, 7).split("-").map(Number);

  const months: string[] = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

/** Mois courant au format `YYYY-MM`. */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Moyenne sur 20, ou un tiret quand il n'y a pas encore de note. */
export function formatAverage(average: number | null | undefined): string {
  return average === null || average === undefined ? "—" : `${average.toFixed(2)}/20`;
}

export function formatPercent(rate: number | null | undefined): string {
  return rate === null || rate === undefined ? "—" : `${rate.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

/** Date du jour au format `YYYY-MM-DD` (heure locale, pas UTC : le pointage se fait à l'heure de l'école). */
export function today(now: Date = new Date()): string {
  return `${currentMonth(now)}-${String(now.getDate()).padStart(2, "0")}`;
}
