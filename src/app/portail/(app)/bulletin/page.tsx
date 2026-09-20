"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { getMyBulletin } from "@/lib/api/grades";
import { listAllTerms } from "@/lib/api/academics";
import type { Bulletin, Term } from "@/lib/api/types";

export default function ParentBulletinPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllTerms().then((allTerms) => {
      setTerms(allTerms);
      const current = allTerms.find((term) => term.is_current) ?? allTerms[0];
      if (current) setSelectedTermId(current.id);
    });
  }, []);

  useEffect(() => {
    if (!selectedTermId) return;
    setError(null);
    getMyBulletin(selectedTermId)
      .then(setBulletin)
      .catch(() => setError("Bulletin indisponible pour ce trimestre."));
  }, [selectedTermId]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Bulletin</h1>
        <Select className="w-56" value={selectedTermId} onChange={(event) => setSelectedTermId(event.target.value)}>
          {terms.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name} ({term.academic_year})
            </option>
          ))}
        </Select>
      </div>

      <Card accent="grades">
        <CardHeader>
          <CardTitle>Releve de notes</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-muted">{error}</p>}

          {!error && bulletin && bulletin.subjects.length === 0 && (
            <p className="text-sm text-muted">Aucune note enregistree pour ce trimestre.</p>
          )}

          {!error && bulletin && bulletin.subjects.length > 0 && (
            <div className="space-y-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs tracking-wide text-muted uppercase">
                    <th className="py-1.5 font-medium">Matiere</th>
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
                Moyenne generale : {bulletin.overall_average}/20
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
