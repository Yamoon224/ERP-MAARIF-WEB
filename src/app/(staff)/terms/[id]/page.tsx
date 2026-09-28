"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TermAttendanceTab } from "@/components/staff/term/TermAttendanceTab";
import { TermClassesTab } from "@/components/staff/term/TermClassesTab";
import { TermSanctionsTab, TermSummonsTab } from "@/components/staff/term/TermDisciplineTabs";
import { TermGradesTab } from "@/components/staff/term/TermGradesTab";
import { TermStudentsTab } from "@/components/staff/term/TermStudentsTab";
import { TermSubjectsTab } from "@/components/staff/term/TermSubjectsTab";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/Tabs";
import { getTerm, getTermOverview } from "@/lib/api/academics";
import type { StaffUser, Term, TermOverview } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useT } from "@/lib/i18n/store";
import { formatAverage, formatDate } from "@/lib/utils/format";

const ID_PREFIX = "term";

/**
 * Détail d'un trimestre : classes, matières, élèves (avec leurs notes),
 * notes, sanctions, convocations et présences. Chaque onglet ne charge ses
 * données qu'à l'ouverture, et n'apparaît que si le compte a le droit de
 * consulter la ressource correspondante.
 */
export default function TermDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useT();
  const { id } = use(params);
  const user = useAuthStore((state) => state.user as StaffUser | null);

  const [term, setTerm] = useState<Term | null>(null);
  const [overview, setOverview] = useState<TermOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState("classes");

  useEffect(() => {
    setError(null);
    Promise.all([getTerm(id), getTermOverview(id)])
      .then(([loadedTerm, loadedOverview]) => {
        setTerm(loadedTerm);
        setOverview(loadedOverview);
      })
      .catch(() => setError(t("Impossible de charger ce trimestre.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const tabs = useMemo<TabItem[]>(() => {
    const items: TabItem[] = [
      { id: "classes", label: t("Classes"), count: overview?.classes },
      { id: "subjects", label: t("Matières"), count: overview?.subjects },
      { id: "students", label: t("Élèves"), count: overview?.students },
    ];

    if (hasPermission(user, "grades.manage")) items.push({ id: "grades", label: t("Notes"), count: overview?.grades });
    if (hasPermission(user, "discipline.manage")) {
      items.push({ id: "sanctions", label: t("Sanctions"), count: overview?.sanctions });
      items.push({ id: "summons", label: t("Convocations"), count: overview?.summons });
    }
    if (hasPermission(user, "attendance.manage")) items.push({ id: "attendance", label: t("Présences") });

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview, user]);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <Link href="/terms" className="text-sm font-medium text-primary hover:underline">
          {t("Retour aux trimestres")}
        </Link>
      </div>
    );
  }

  if (!term || !overview) return <p className="text-sm text-muted">{t("Chargement...")}</p>;

  return (
    <div>
      <Link href="/terms" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> {t("Tous les trimestres")}
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">
          {term.name} <span className="font-normal text-muted">— {term.academic_year}</span>
        </h1>
        {term.is_current && <Badge tone="success">{t("Courant")}</Badge>}
        <span className="text-sm text-muted">{t("du {from} au {to}", { from: formatDate(term.starts_at), to: formatDate(term.ends_at) })}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("Élèves inscrits")}
          value={overview.students}
          hint={t("{classes} classe(s) · {subjects} matière(s)", { classes: overview.classes, subjects: overview.subjects })}
          accent="primary"
        />
        <StatCard
          label={t("Moyenne générale")}
          value={formatAverage(overview.average)}
          hint={t("{count} note(s) saisie(s)", { count: overview.grades })}
          accent="grades"
        />
        <StatCard
          label={t("Absences")}
          value={overview.attendance.absent}
          hint={t("{unjustified} non justifiée(s) · {late} retard(s)", {
            unjustified: overview.attendance.unjustified_absences,
            late: overview.attendance.late,
          })}
          accent="attendance"
        />
        {overview.sanctions !== null && overview.summons !== null && (
          <StatCard
            label={t("Discipline")}
            value={overview.sanctions}
            hint={t("sanction(s) · {summons} convocation(s)", { summons: overview.summons })}
            accent="discipline"
          />
        )}
      </div>

      <div className="mt-8">
        <Tabs tabs={tabs} active={active} onChange={setActive} idPrefix={ID_PREFIX} />

        <TabPanel idPrefix={ID_PREFIX} id="classes" active={active}>
          <TermClassesTab term={term} />
        </TabPanel>
        <TabPanel idPrefix={ID_PREFIX} id="subjects" active={active}>
          <TermSubjectsTab termId={term.id} />
        </TabPanel>
        <TabPanel idPrefix={ID_PREFIX} id="students" active={active}>
          <TermStudentsTab term={term} />
        </TabPanel>
        <TabPanel idPrefix={ID_PREFIX} id="grades" active={active}>
          <TermGradesTab term={term} />
        </TabPanel>
        <TabPanel idPrefix={ID_PREFIX} id="sanctions" active={active}>
          <TermSanctionsTab termId={term.id} />
        </TabPanel>
        <TabPanel idPrefix={ID_PREFIX} id="summons" active={active}>
          <TermSummonsTab termId={term.id} />
        </TabPanel>
        <TabPanel idPrefix={ID_PREFIX} id="attendance" active={active}>
          <TermAttendanceTab termId={term.id} />
        </TabPanel>
      </div>
    </div>
  );
}
