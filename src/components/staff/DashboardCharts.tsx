"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ColumnChart, type ColumnDatum, type ColumnSeries } from "@/components/ui/charts/ColumnChart";
import { DonutChart } from "@/components/ui/charts/DonutChart";
import { formatTick, seriesColor, toSlices, type Slice } from "@/components/ui/charts/chartUtils";
import type { DashboardStats } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
import { formatMoney, formatMonth, formatMonthAxis } from "@/lib/utils/format";

/** Encaissements et/ou dépenses mois par mois : les mois des deux séries sont réunis, dans l'ordre. */
function monthlyMoney(
  stats: DashboardStats,
  t: (text: string, params?: Record<string, string | number>) => string,
): { series: ColumnSeries[]; data: ColumnDatum[]; title: string } {
  const collected = stats.accounting?.by_month ?? null;
  const spent = stats.expenses?.by_month ?? null;

  const collectedSeries: ColumnSeries = { key: "collected", label: t("Encaissements"), color: seriesColor(0) };
  const spentSeries: ColumnSeries = { key: "spent", label: t("Dépenses"), color: seriesColor(1) };

  const series = [collected && collectedSeries, spent && spentSeries].filter((entry): entry is ColumnSeries => Boolean(entry));
  const months = [...new Set([...(collected ?? []), ...(spent ?? [])].map((entry) => entry.month))].sort();
  const totalOf = (rows: Array<{ month: string; total: number }> | null, month: string) => rows?.find((row) => row.month === month)?.total ?? 0;

  const title =
    collected && spent
      ? t("Encaissements et dépenses par mois")
      : collected
        ? t("Encaissements par mois")
        : t("Dépenses par mois");

  return {
    series,
    title,
    data: months.map((month, index) => ({
      label: formatMonthAxis(month, index),
      fullLabel: formatMonth(month),
      values: { collected: totalOf(collected, month), spent: totalOf(spent, month) },
    })),
  };
}

/**
 * Graphiques du tableau de bord : effectif par classe, présences, et pour ceux
 * qui y ont droit l'argent (encaissé et dépensé mois par mois, dépenses par
 * catégorie). Chaque bloc suit la période choisie en haut de page.
 */
export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const { t } = useT();
  const money = monthlyMoney(stats, t);
  const hasMoney = money.series.length > 0 && money.data.length > 0;
  const formatCount = (count: number) =>
    t(count > 1 ? "{count} élèves" : "{count} élève", { count: count.toLocaleString("fr-FR") });

  // Présents, absents, retards : la couleur suit la catégorie (jamais son rang), pour ne pas changer d'une période à l'autre.
  const attendance: Slice[] = [
    { key: "present", label: t("Présents"), value: stats.attendance.present, color: seriesColor(0) },
    { key: "absent", label: t("Absents"), value: stats.attendance.absent, color: seriesColor(1) },
    { key: "late", label: t("Retards"), value: stats.attendance.late, color: seriesColor(2) },
  ].filter((slice) => slice.value > 0);

  const expenseSlices = stats.expenses
    ? toSlices(stats.expenses.by_category.map((category) => ({ key: category.id, label: category.name, value: category.total })))
    : [];

  return (
    <section className="mt-8" aria-labelledby="charts-heading">
      <h2 id="charts-heading" className="mb-3 text-base font-semibold text-foreground">
        {t("Graphiques")}
      </h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {hasMoney && (
          <Card accent="accounting" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{money.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ColumnChart ariaLabel={money.title} series={money.series} data={money.data} formatValue={formatMoney} />
            </CardContent>
          </Card>
        )}

        {stats.expenses && (
          <Card accent="attendance">
            <CardHeader>
              <CardTitle>{t("Dépenses par catégorie")}</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                ariaLabel={t("Répartition des dépenses par catégorie")}
                slices={expenseSlices}
                formatValue={formatMoney}
                formatCenter={formatTick}
                totalLabel={t("dépensés")}
                emptyMessage={t("Aucune dépense sur la période.")}
              />
            </CardContent>
          </Card>
        )}

        <Card accent="primary" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("Effectif par classe")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.students_by_class.length === 0 ? (
              <p className="text-sm text-muted">{t("Aucune classe avec des élèves inscrits.")}</p>
            ) : (
              <ColumnChart
                ariaLabel={t("Effectif par classe")}
                integer
                series={[{ key: "students", label: t("Élèves"), color: seriesColor(0) }]}
                data={stats.students_by_class.map((entry) => ({ label: entry.name, values: { students: entry.count } }))}
                formatValue={formatCount}
              />
            )}
          </CardContent>
        </Card>

        <Card accent="attendance">
          <CardHeader>
            <CardTitle>{t("Présences")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              ariaLabel={t("Répartition des présences, absences et retards")}
              slices={attendance}
              formatValue={(count) => count.toLocaleString("fr-FR")}
              totalLabel={t("pointages")}
              emptyMessage={t("Aucun pointage sur la période.")}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
