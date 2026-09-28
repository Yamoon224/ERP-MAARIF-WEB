"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { StudentResultsCard } from "@/components/results/StudentResultsCard";
import { useT } from "@/lib/i18n/store";

export default function ParentResultsPage() {
  const { t } = useT();

  return (
    <div>
      <PageHeader
        title={t("Résultats")}
        description={t("Moyennes et rang de votre enfant par trimestre, par semestre et sur l'année.")}
      />
      <StudentResultsCard source="parent" />
    </div>
  );
}
