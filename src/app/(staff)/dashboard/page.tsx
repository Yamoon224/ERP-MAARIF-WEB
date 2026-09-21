"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, GraduationCap, Megaphone, NotebookPen, ShieldAlert, TriangleAlert, Wallet } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { StatCard } from "@/components/ui/StatCard";
import { getDashboardStats } from "@/lib/api/dashboard";
import type { DashboardStats, StaffUser } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { formatAverage, formatDate, formatMoney, formatPercent } from "@/lib/utils/format";

export default function StaffDashboardPage() {
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
        if (!cancelled) setError("Impossible de charger les indicateurs.");
      });

    return () => {
      cancelled = true;
    };
  }, [period.isReady, period.params]);

  return (
    <div>
      <PageHeader title={`Bonjour, ${user?.name ?? ""}`} description="Vue d'ensemble de l'établissement sur la période choisie." />

      <PeriodFilter filter={period} className="mb-6" />

      {error && <Alert className="mb-6">{error}</Alert>}

      {stats && (
        <>
          {stats.period && (
            <p className="mb-4 text-sm text-muted">
              Période : du {formatDate(stats.period.from)} au {formatDate(stats.period.to)}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/students" className="block">
              <StatCard
                label="Élèves inscrits"
                value={stats.students}
                hint={`${stats.classes} classe(s) · ${stats.academic_year ?? ""}`}
                icon={<GraduationCap className="size-4" />}
                accent="primary"
                className="h-full transition-shadow hover:shadow-md"
              />
            </Link>
            <StatCard
              label="Moyenne générale"
              value={formatAverage(stats.grades.average)}
              hint={`${stats.grades.count} note(s) saisie(s)`}
              icon={<NotebookPen className="size-4" />}
              accent="grades"
            />
            <Link href="/absences" className="block">
              <StatCard
                label="Absences"
                value={stats.attendance.absent}
                hint={`${stats.attendance.unjustified_absences} non justifiée(s) · ${stats.attendance.late} retard(s)`}
                icon={<ClipboardCheck className="size-4" />}
                accent="attendance"
                className="h-full transition-shadow hover:shadow-md"
              />
            </Link>
            {stats.discipline && (
              <StatCard
                label="Sanctions"
                value={stats.discipline.sanctions}
                hint={`${stats.discipline.summons} convocation(s), dont ${stats.discipline.summons_pending} en attente`}
                icon={<ShieldAlert className="size-4" />}
                accent="discipline"
              />
            )}
          </div>

          {stats.accounting && (
            <section className="mt-8" aria-labelledby="accounting-heading">
              <h2 id="accounting-heading" className="mb-3 text-base font-semibold text-foreground">
                Comptabilité
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Encaissements"
                  value={formatMoney(stats.accounting.collected)}
                  hint="Scolarité encaissée sur la période"
                  icon={<Wallet className="size-4" />}
                  accent="accounting"
                />
                <Link href="/accounting/unpaid" className="block">
                  <StatCard
                    label="Impayés"
                    value={formatMoney(stats.accounting.arrears)}
                    hint="Mois terminés non réglés"
                    icon={<TriangleAlert className="size-4" />}
                    accent="discipline"
                    className="h-full transition-shadow hover:shadow-md"
                  />
                </Link>
                <StatCard
                  label="Taux de recouvrement"
                  value={formatPercent(stats.accounting.recovery_rate)}
                  hint="Réglé / dû sur les mois de la période"
                  accent="accounting"
                />
              </div>
            </section>
          )}

          {!stats.discipline && !stats.accounting && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Megaphone className="size-4" aria-hidden="true" /> Les indicateurs affichés dépendent de vos droits d&apos;accès.
            </p>
          )}
        </>
      )}
    </div>
  );
}
