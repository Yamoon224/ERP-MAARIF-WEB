"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HandCoins, Plus, Receipt, TrendingUp, TriangleAlert } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { BarChart } from "@/components/ui/BarChart";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { StatCard } from "@/components/ui/StatCard";
import { getAccountingSummary } from "@/lib/api/accounting";
import type { AccountingSummary, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useSchoolClassOptions } from "@/lib/hooks/useSchoolClassOptions";
import { PAYMENT_METHOD_LABEL, PAYMENT_PERIOD_LABEL } from "@/lib/labels";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { formatDate, formatMoney, formatMonthShort, formatPercent } from "@/lib/utils/format";

/** Part de chaque ligne par rapport au total encaissé, pour la barre de proportion. */
function Breakdown({ rows, total }: { rows: Array<{ key: string; label: string; total: number; count: number }>; total: number }) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const share = total > 0 ? (row.total / total) * 100 : 0;

        return (
          <li key={row.key}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-foreground">{row.label}</span>
              <span className="text-muted">
                {formatMoney(row.total)} · {row.count} paiement(s)
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
              <div className="h-full rounded-full bg-accent-accounting" style={{ width: `${share}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function AccountingOverviewPage() {
  const user = useAuthStore((state) => state.user as StaffUser | null);
  const canManage = hasPermission(user, "accounting.manage");
  const period = usePeriodFilter();
  const classes = useSchoolClassOptions();

  const [schoolClassId, setSchoolClassId] = useState("");
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(() => ({ ...period.params, school_class_id: schoolClassId || undefined }), [period.params, schoolClassId]);

  useEffect(() => {
    if (!period.isReady) return;

    let cancelled = false;
    setError(null);
    getAccountingSummary(filters)
      .then((loaded) => {
        if (!cancelled) setSummary(loaded);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les indicateurs comptables.");
      });

    return () => {
      cancelled = true;
    };
  }, [period.isReady, filters]);

  return (
    <div>
      <PageHeader
        title="Comptabilité"
        description="Encaissements de la scolarité, taux de recouvrement et impayés."
        actions={
          canManage && (
            <Link href="/comptabilite/paiements/nouveau">
              <Button>
                <Plus className="size-4" /> Nouveau paiement
              </Button>
            </Link>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-stretch gap-3">
        <PeriodFilter filter={period} className="flex-1" />
        <label className="flex flex-col justify-center rounded-md border border-border bg-surface px-4 py-3 text-xs font-medium text-muted">
          Classe
          <Select className="mt-1 h-9 w-44" value={schoolClassId} onChange={(event) => setSchoolClassId(event.target.value)}>
            <option value="">Toutes les classes</option>
            {classes
              .filter((schoolClass) => !period.year || schoolClass.academic_year === period.year.label)
              .map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
          </Select>
        </label>
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}

      {summary && (
        <>
          {summary.period && (
            <p className="mb-4 text-sm text-muted">
              Du {formatDate(summary.period.from)} au {formatDate(summary.period.to)}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Encaissé"
              value={formatMoney(summary.collected.total)}
              hint={`${summary.collected.count} paiement(s)`}
              icon={<HandCoins className="size-4" />}
              accent="accounting"
            />
            <StatCard
              label="Dû sur la période"
              value={formatMoney(summary.expected.total)}
              hint={`${formatMoney(summary.expected.settled)} déjà réglé`}
              icon={<Receipt className="size-4" />}
              accent="grades"
            />
            <StatCard
              label="Taux de recouvrement"
              value={formatPercent(summary.expected.rate)}
              hint="Réglé / dû sur les mois de la période"
              icon={<TrendingUp className="size-4" />}
              accent="accounting"
            />
            <Link href="/comptabilite/impayes" className="block">
              <StatCard
                label="Impayés"
                value={formatMoney(summary.arrears.amount)}
                hint={`${summary.arrears.students} élève(s) · ${summary.arrears.months} mois en retard`}
                icon={<TriangleAlert className="size-4" />}
                accent="discipline"
                className="h-full transition-shadow hover:shadow-md"
              />
            </Link>
          </div>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
            <Card accent="accounting" className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Encaissements mois par mois</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.by_month.length === 0 ? (
                  <p className="text-sm text-muted">Aucun encaissement.</p>
                ) : (
                  <BarChart
                    ariaLabel="Encaissements par mois"
                    data={summary.by_month.map((entry) => ({
                      label: formatMonthShort(entry.month),
                      value: entry.total,
                      title: formatMoney(entry.total),
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card accent="accounting">
                <CardHeader>
                  <CardTitle>Par formule de paiement</CardTitle>
                </CardHeader>
                <CardContent>
                  <Breakdown
                    total={summary.collected.total}
                    rows={summary.by_period_type.map((row) => ({ ...row, label: PAYMENT_PERIOD_LABEL[row.key] }))}
                  />
                </CardContent>
              </Card>

              <Card accent="accounting">
                <CardHeader>
                  <CardTitle>Par mode de paiement</CardTitle>
                </CardHeader>
                <CardContent>
                  <Breakdown
                    total={summary.collected.total}
                    rows={summary.by_method.map((row) => ({ ...row, label: PAYMENT_METHOD_LABEL[row.key] }))}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
