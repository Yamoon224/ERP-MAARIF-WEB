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
import { formatAverage, formatDate } from "@/lib/utils/format";

const ID_PREFIX = "term";

/**
 * Détail d'un trimestre : classes, matières, élèves (avec leurs notes),
 * notes, sanctions, convocations et présences. Chaque onglet ne charge ses
 * données qu'à l'ouverture, et n'apparaît que si le compte a le droit de
 * consulter la ressource correspondante.
 */
export default function TermDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
      .catch(() => setError("Impossible de charger ce trimestre."));
  }, [id]);

  const tabs = useMemo<TabItem[]>(() => {
    const items: TabItem[] = [
      { id: "classes", label: "Classes", count: overview?.classes },
      { id: "subjects", label: "Matières", count: overview?.subjects },
      { id: "students", label: "Élèves", count: overview?.students },
    ];

    if (hasPermission(user, "grades.manage")) items.push({ id: "grades", label: "Notes", count: overview?.grades });
    if (hasPermission(user, "discipline.manage")) {
      items.push({ id: "sanctions", label: "Sanctions", count: overview?.sanctions });
      items.push({ id: "summons", label: "Convocations", count: overview?.summons });
    }
    if (hasPermission(user, "attendance.manage")) items.push({ id: "attendance", label: "Présences" });

    return items;
  }, [overview, user]);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <Link href="/trimestres" className="text-sm font-medium text-primary hover:underline">
          Retour aux trimestres
        </Link>
      </div>
    );
  }

  if (!term || !overview) return <p className="text-sm text-muted">Chargement...</p>;

  return (
    <div>
      <Link href="/trimestres" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Tous les trimestres
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">
          {term.name} <span className="font-normal text-muted">— {term.academic_year}</span>
        </h1>
        {term.is_current && <Badge tone="success">Courant</Badge>}
        <span className="text-sm text-muted">
          du {formatDate(term.starts_at)} au {formatDate(term.ends_at)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Élèves inscrits" value={overview.students} hint={`${overview.classes} classe(s) · ${overview.subjects} matière(s)`} accent="primary" />
        <StatCard label="Moyenne générale" value={formatAverage(overview.average)} hint={`${overview.grades} note(s) saisie(s)`} accent="grades" />
        <StatCard
          label="Absences"
          value={overview.attendance.absent}
          hint={`${overview.attendance.unjustified_absences} non justifiée(s) · ${overview.attendance.late} retard(s)`}
          accent="attendance"
        />
        {overview.sanctions !== null && overview.summons !== null && (
          <StatCard label="Discipline" value={overview.sanctions} hint={`sanction(s) · ${overview.summons} convocation(s)`} accent="discipline" />
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
