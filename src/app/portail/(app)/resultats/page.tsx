"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { StudentResultsCard } from "@/components/results/StudentResultsCard";

export default function ParentResultsPage() {
  return (
    <div>
      <PageHeader
        title="Résultats"
        description="Moyennes et rang de votre enfant par trimestre, par semestre et sur l'année."
      />
      <StudentResultsCard source="parent" />
    </div>
  );
}
