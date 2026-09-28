"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { StatCard } from "@/components/ui/StatCard";
import { TabPanel, Tabs } from "@/components/ui/Tabs";
import { GradeScaleCard } from "@/components/results/GradeScaleCard";
import { PromotionCard } from "@/components/results/PromotionCard";
import { formatRank } from "@/components/results/StudentResultsCard";
import { listAcademicYears, listClassesOfYear } from "@/lib/api/academics";
import { getErrorMessage } from "@/lib/api/error";
import { getClassResults, saveDecision, validateClassDecisions } from "@/lib/api/results";
import type { AcademicYear, ClassResultRow, ClassResults, PromotionDecisionValue, ResultPeriodKind, SchoolClass, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useT } from "@/lib/i18n/store";
import { DECISION_LABEL, DECISION_TONE } from "@/lib/labels";
import { usePagination } from "@/lib/hooks/usePagination";
import { formatAverage, formatPercent } from "@/lib/utils/format";

const SEMESTERS: ReadonlyArray<{ value: 1 | 2; label: string; termsNeeded: number }> = [
  { value: 1, label: "1er semestre (trimestres 1 et 2)", termsNeeded: 2 },
  { value: 2, label: "2ème semestre (trimestres 2 et 3)", termsNeeded: 3 },
];

const DECISIONS: PromotionDecisionValue[] = ["admitted", "repeat", "excluded"];

/**
 * Résultats d'une classe : classement par trimestre, par semestre (1 = T1+T2,
 * 2 = T2+T3) ou sur l'année, avec la décision de passage en fin d'année.
 */
export default function ResultsPage() {
  const { t } = useT();
  const canManage = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "results.manage");

  const KIND_TABS = [
    { id: "term", label: t("Trimestre") },
    { id: "semester", label: t("Semestre") },
    { id: "annual", label: t("Annuel") },
  ];

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [kind, setKind] = useState<ResultPeriodKind>("annual");
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [semester, setSemester] = useState<1 | 2>(1);

  const [results, setResults] = useState<ClassResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    listAcademicYears()
      .then(setYears)
      .catch(() => setYears([]));
  }, []);

  const yearLabel = selectedYear ?? (years.find((year) => year.is_current) ?? years[0])?.label ?? null;
  const year = years.find((candidate) => candidate.label === yearLabel) ?? null;
  const terms = year?.terms ?? [];

  useEffect(() => {
    if (!yearLabel) return;

    listClassesOfYear(yearLabel)
      .then(setClasses)
      .catch(() => setClasses([]));
  }, [yearLabel]);

  const yearClasses = classes.filter((schoolClass) => schoolClass.academic_year === yearLabel);
  const classId = selectedClassId ?? yearClasses[0]?.id ?? null;
  const termId = selectedTermId ?? terms[0]?.id ?? null;
  const semesterAvailable = SEMESTERS.some((option) => terms.length >= option.termsNeeded && option.value === semester);
  const isReady = Boolean(classId) && (kind !== "term" || termId !== null) && (kind !== "semester" || semesterAvailable);

  useEffect(() => {
    if (!classId || !isReady) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getClassResults({
      school_class_id: classId,
      period: kind,
      term_id: kind === "term" ? (termId ?? undefined) : undefined,
      semester: kind === "semester" ? semester : undefined,
    })
      .then((response) => {
        if (!cancelled) setResults(response);
      })
      .catch((failure) => {
        if (cancelled) return;
        setResults(null);
        setError(getErrorMessage(failure, t("Impossible de calculer ces résultats.")));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, isReady, kind, termId, semester, reloadToken]);

  const { page, perPage, setPage, setPerPage } = usePagination(`${classId}|${kind}|${termId}|${semester}`);
  const rows = useMemo(() => results?.rows ?? [], [results]);
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);
  const meta = { current_page: page, last_page: Math.max(Math.ceil(rows.length / perPage), 1), per_page: perPage, total: rows.length };

  const isAnnual = results?.period.kind === "annual";

  async function handleDecision(row: ClassResultRow, value: string) {
    if (!value) return;

    setError(null);
    setNotice(null);

    try {
      await saveDecision(row.enrollment_id, value as PromotionDecisionValue);
      setReloadToken((token) => token + 1);
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible d'enregistrer cette décision.")));
    }
  }

  async function handleValidate() {
    if (!classId) return;

    setIsValidating(true);
    setError(null);
    setNotice(null);

    try {
      const count = await validateClassDecisions(classId);
      setNotice(
        count === 0
          ? t("Aucune décision à valider : elles sont toutes déjà enregistrées.")
          : t("{count} décision(s) enregistrée(s).", { count }),
      );
      setReloadToken((token) => token + 1);
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible de valider les décisions.")));
    } finally {
      setIsValidating(false);
    }
  }

  const columns: DataTableColumn<ClassResultRow>[] = [
    { key: "rank", header: "Rang", render: (row) => formatRank(row.rank, null) },
    {
      key: "student",
      header: "Élève",
      render: (row) => (
        <div>
          <Link href={`/students/${row.student.id}`} className="font-medium text-primary hover:underline">
            {row.student.name}
          </Link>
          <p className="font-mono text-xs text-muted">{row.student.matricule}</p>
        </div>
      ),
    },
    { key: "average", header: "Moyenne", render: (row) => <span className="font-medium">{formatAverage(row.average)}</span> },
    { key: "mention", header: "Mention", render: (row) => row.mention ?? "-" },
    { key: "grades", header: "Notes", render: (row) => row.grades_count },
    ...(isAnnual
      ? [
          {
            key: "decision",
            header: "Décision de passage",
            render: (row: ClassResultRow) => {
              if (!canManage) {
                if (row.decision) return <Badge tone={DECISION_TONE[row.decision.value]}>{row.decision.label}</Badge>;
                return row.suggested_decision ? (
                  <span className="text-muted">{t("Suggéré : {label}", { label: row.suggested_decision.label })}</span>
                ) : (
                  "-"
                );
              }

              return (
                <Select
                  aria-label={t("Décision pour {name}", { name: row.student.name })}
                  className="h-9 w-56"
                  value={row.decision?.value ?? ""}
                  onChange={(event) => handleDecision(row, event.target.value)}
                >
                  <option value="">
                    {row.suggested_decision ? t("Suggéré : {label}", { label: row.suggested_decision.label }) : t("À décider")}
                  </option>
                  {DECISIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(DECISION_LABEL[value])}
                    </option>
                  ))}
                </Select>
              );
            },
          },
        ]
      : []),
  ];

  const stats = results?.stats;

  return (
    <div>
      <PageHeader
        title={t("Résultats")}
        description={t("Classement d'une classe par trimestre, par semestre ou sur l'année, et décisions de passage en classe supérieure.")}
      />

      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-3 rounded-md border border-border bg-surface px-4 py-3">
        <label className="flex flex-col text-xs font-medium text-muted">
          {t("Année scolaire")}
          <Select
            className="mt-1 h-9 w-40"
            value={yearLabel ?? ""}
            disabled={years.length === 0}
            onChange={(event) => {
              setSelectedYear(event.target.value);
              setSelectedClassId(null);
              setSelectedTermId(null);
            }}
          >
            {years.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col text-xs font-medium text-muted">
          {t("Classe")}
          <Select
            className="mt-1 h-9 w-48"
            value={classId ?? ""}
            disabled={yearClasses.length === 0}
            onChange={(event) => setSelectedClassId(event.target.value)}
          >
            {yearClasses.length === 0 && <option value="">{t("Aucune classe")}</option>}
            {yearClasses.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </Select>
        </label>

        {kind === "term" && (
          <label className="flex flex-col text-xs font-medium text-muted">
            {t("Trimestre")}
            <Select className="mt-1 h-9 w-48" value={termId ?? ""} onChange={(event) => setSelectedTermId(event.target.value)}>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </Select>
          </label>
        )}

        {kind === "semester" && (
          <label className="flex flex-col text-xs font-medium text-muted">
            {t("Semestre")}
            <Select
              className="mt-1 h-9 w-72"
              value={semester}
              onChange={(event) => setSemester(Number(event.target.value) === 2 ? 2 : 1)}
            >
              {SEMESTERS.map((option) => (
                <option key={option.value} value={option.value} disabled={terms.length < option.termsNeeded}>
                  {t(option.label)}
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>

      <Tabs tabs={KIND_TABS} active={kind} onChange={(id) => setKind(id as ResultPeriodKind)} idPrefix="results" />

      <TabPanel idPrefix="results" id={kind} active={kind}>
        {years.length > 0 && yearClasses.length === 0 && (
          <p className="rounded-md border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
            {t("Aucune classe pour l'année {year}.", { year: yearLabel ?? "" })}
          </p>
        )}

        {kind === "semester" && !semesterAvailable && yearClasses.length > 0 && (
          <Alert className="mb-4">{t("Cette année n'a pas assez de trimestres pour calculer ce semestre.")}</Alert>
        )}
        {error && <Alert className="mb-4">{error}</Alert>}
        {notice && (
          <p role="status" className="mb-4 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground">
            {notice}
          </p>
        )}

        {stats && (
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              accent="grades"
              label={t("Moyenne de la classe")}
              value={formatAverage(stats.average)}
              hint={t("{ranked} élève(s) classé(s) sur {students}", { ranked: stats.ranked, students: stats.students })}
            />
            <StatCard accent="academics" label={t("Meilleure moyenne")} value={formatAverage(stats.highest)} />
            <StatCard accent="discipline" label={t("Moyenne la plus faible")} value={formatAverage(stats.lowest)} />
            <StatCard
              accent="primary"
              label={t("Taux de réussite")}
              value={formatPercent(stats.pass_rate)}
              hint={t("{passed} élève(s) à {passMark}/20 ou plus", { passed: stats.passed, passMark: results?.pass_mark ?? 0 })}
            />
          </div>
        )}

        {isAnnual && canManage && rows.length > 0 && (
          <div className="mb-4 flex justify-end">
            <Button type="button" variant="secondary" size="sm" loading={isValidating} onClick={handleValidate}>
              <CheckCheck className="size-4" /> {t("Valider les décisions suggérées")}
            </Button>
          </div>
        )}

        {classId && (
          <>
            <DataTable exportName="Résultats"
              columns={columns}
              rows={pageRows}
              rowKey={(row) => row.enrollment_id}
              isLoading={isLoading}
              emptyMessage="Aucun élève inscrit dans cette classe."
            />
            {rows.length > 0 && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}

            {isAnnual && canManage && results && rows.length > 0 && (
              <div className="mt-5">
                <GradeScaleCard
                  key={`scale-${results.school_class.id}`}
                  schoolClass={results.school_class}
                  siblingClasses={yearClasses.filter((schoolClass) => schoolClass.id !== results.school_class.id)}
                />
                <PromotionCard key={results.school_class.id} sourceClass={results.school_class} years={years} />
              </div>
            )}
          </>
        )}
      </TabPanel>
    </div>
  );
}
