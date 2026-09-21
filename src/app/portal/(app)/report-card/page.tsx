"use client";

import { useEffect, useState } from "react";
import { BulletinExportButtons } from "@/components/grades/BulletinExportButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { downloadMyBulletin, getMyBulletin } from "@/lib/api/grades";
import type { Bulletin } from "@/lib/api/types";
import { usePeriodFilter } from "@/lib/period/usePeriodFilter";
import { formatAverage } from "@/lib/utils/format";

export default function ParentBulletinPage() {
  // Un bulletin est propre à un trimestre : année scolaire, puis trimestre.
  const period = usePeriodFilter({ source: "parent", forceMode: "term" });
  const termId = period.params.term_id;

  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!termId) return;

    let cancelled = false;
    setError(null);
    getMyBulletin(termId)
      .then((loaded) => {
        if (!cancelled) setBulletin(loaded);
      })
      .catch(() => {
        if (!cancelled) {
          setBulletin(null);
          setError("Bulletin indisponible pour ce trimestre.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [termId]);

  return (
    <div>
      <PageHeader title="Bulletin" description="Notes et moyennes de votre enfant, trimestre par trimestre." />

      <PeriodFilter filter={period} modes={["term"]} className="mb-6" />

      <Card accent="grades">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Relevé de notes</CardTitle>
          <BulletinExportButtons
            fileName="bulletin"
            load={(format) => downloadMyBulletin(termId, format)}
            disabled={!bulletin || !!error}
          />
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-muted">{error}</p>}

          {!error && bulletin && bulletin.subjects.length === 0 && (
            <p className="text-sm text-muted">Aucune note enregistrée pour ce trimestre.</p>
          )}

          {!error && bulletin && bulletin.subjects.length > 0 && (
            <div className="space-y-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs tracking-wide text-muted uppercase">
                    <th className="py-1.5 font-medium">Matière</th>
                    <th className="py-1.5 font-medium">Coefficient</th>
                    <th className="py-1.5 font-medium">Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin.subjects.map((subject) => (
                    <tr key={subject.code} className="border-t border-border">
                      <td className="py-1.5">{subject.subject}</td>
                      <td className="py-1.5">{subject.coefficient}</td>
                      <td className="py-1.5 font-medium">{subject.average}/20</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="rounded-md bg-background p-4 text-base font-semibold text-foreground">
                Moyenne générale : {formatAverage(bulletin.overall_average)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
