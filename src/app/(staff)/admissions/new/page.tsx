"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdmissionForm } from "@/components/staff/AdmissionForm";
import { createAdmission } from "@/lib/api/admissions";
import { useT } from "@/lib/i18n/store";

export default function NewAdmissionPage() {
  const { t } = useT();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Nouvelle candidature")}
        description={t("Le dossier est créé « En attente » ; il sera ensuite étudié puis décidé.")}
      />

      <AdmissionForm
        submitLabel={t("Enregistrer la candidature")}
        failureMessage={t("Impossible d'enregistrer cette candidature.")}
        onSubmit={async (payload) => {
          const admission = await createAdmission(payload);
          router.push(`/admissions/${admission.id}`);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
