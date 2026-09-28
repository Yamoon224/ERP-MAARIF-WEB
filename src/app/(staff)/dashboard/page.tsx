"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, GraduationCap, Megaphone, NotebookPen, PiggyBank, Receipt, ShieldAlert, TriangleAlert, Wallet } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { StatCard } from "@/components/ui/StatCard";
import { DashboardCharts } from "@/components/staff/DashboardCharts";
import { getDashboardStats } from "@/lib/api/dashboard";
import type { DashboardStats, StaffUser } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { useT } from "@/lib/i18n/store";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { formatAverage, formatDate, formatMoney, formatPercent } from "@/lib/utils/format";

export default function StaffDashboardPage() {
  const { t } = useT();
  const user = useAuthStore((state) => state.user as StaffUser | null);
  const period = usePeriodFilter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!period.isReady) return;

    let cancelled = false;
    setError(null);
    getDashboardStats(period.params)
      .then((loaded) => {
        if (!cancelled) setStats(loaded);
      })
      .catch(() => {
        if (!cancelled) setError(t("Impossible de charger les indicateurs."));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.isReady, period.params]);

  return (
    <div>
      <PageHeader
        title={t("Bonjour, {name}", { name: user?.name ?? "" })}
        description={t("Vue d'ensemble de l'établissement sur la période choisie.")}
      />

      <PeriodFilter filter={period} className="mb-6" />

      {error && <Alert className="mb-6">{error}</Alert>}

      {stats && (
        <>
          {stats.period && (
            <p className="mb-4 text-sm text-muted">
              {t("Période : du {from} au {to}", { from: formatDate(stats.period.from), to: formatDate(stats.period.to) })}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/students" className="block">
              <StatCard
                label={t("Élèves inscrits")}
                value={stats.students}
                hint={t("{classes} classe(s) · {year}", { classes: stats.classes, year: stats.academic_year ?? "" })}
                icon={<GraduationCap className="size-4" />}
                accent="primary"
                className="h-full transition-shadow hover:shadow-md"
              />
            </Link>
            <StatCard
              label={t("Moyenne générale")}
              value={formatAverage(stats.grades.average)}
              hint={t("{count} note(s) saisie(s)", { count: stats.grades.count })}
              icon={<NotebookPen className="size-4" />}
              accent="grades"
            />
            <Link href="/absences" className="block">
              <StatCard
                label={t("Absences")}
                value={stats.attendance.absent}
                hint={t("{unjustified} non justifiée(s) · {late} retard(s)", {
                  unjustified: stats.attendance.unjustified_absences,
                  late: stats.attendance.late,
                })}
                icon={<ClipboardCheck className="size-4" />}
                accent="attendance"
                className="h-full transition-shadow hover:shadow-md"
              />
            </Link>
            {stats.discipline && (
              <StatCard
                label={t("Sanctions")}
                value={stats.discipline.sanctions}
                hint={t("{summons} convocation(s), dont {pending} en attente", {
                  summons: stats.discipline.summons,
                  pending: stats.discipline.summons_pending,
                })}
                icon={<ShieldAlert className="size-4" />}
                accent="discipline"
              />
            )}
          </div>

          <DashboardCharts stats={stats} />

          {(stats.accounting || stats.expenses) && (
            <section className="mt-8" aria-labelledby="accounting-heading">
              <h2 id="accounting-heading" className="mb-3 text-base font-semibold text-foreground">
                {t("Comptabilité")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.accounting && (
                  <>
                    <StatCard
                      label={t("Encaissements")}
                      value={formatMoney(stats.accounting.collected)}
                      hint={t("Scolarité encaissée sur la période")}
                      icon={<Wallet className="size-4" />}
                      accent="accounting"
                    />
                    <Link href="/accounting/unpaid" className="block">
                      <StatCard
                        label={t("Impayés")}
                        value={formatMoney(stats.accounting.arrears)}
                        hint={t("Mois terminés non réglés")}
                        icon={<TriangleAlert className="size-4" />}
                        accent="discipline"
                        className="h-full transition-shadow hover:shadow-md"
                      />
                    </Link>
                    <StatCard
                      label={t("Taux de recouvrement")}
                      value={formatPercent(stats.accounting.recovery_rate)}
                      hint={t("Réglé / dû sur les mois de la période")}
                      accent="accounting"
                    />
                  </>
                )}
                {stats.expenses && (
                  <Link href="/expenses" className="block">
                    <StatCard
                      label={t("Dépenses")}
                      value={formatMoney(stats.expenses.total)}
                      hint={t("{count} achat(s) et dépense(s) sur la période", { count: stats.expenses.count })}
                      icon={<Receipt className="size-4" />}
                      accent="attendance"
                      className="h-full transition-shadow hover:shadow-md"
                    />
                  </Link>
                )}
                {stats.accounting && stats.expenses && (
                  <StatCard
                    label={t("Solde")}
                    value={formatMoney(stats.accounting.collected - stats.expenses.total)}
                    hint={t("Encaissé moins dépensé sur la période")}
                    icon={<PiggyBank className="size-4" />}
                    accent={stats.accounting.collected - stats.expenses.total < 0 ? "discipline" : "accounting"}
                  />
                )}
              </div>
            </section>
          )}

          {!stats.discipline && !stats.accounting && !stats.expenses && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Megaphone className="size-4" aria-hidden="true" /> {t("Les indicateurs affichés dépendent de vos droits d'accès.")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
