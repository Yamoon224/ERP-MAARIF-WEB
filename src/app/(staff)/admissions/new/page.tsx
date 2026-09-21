"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdmissionForm } from "@/components/staff/AdmissionForm";
import { createAdmission } from "@/lib/api/admissions";

export default function NewAdmissionPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nouvelle candidature" description="Le dossier est créé « En attente » ; il sera ensuite étudié puis décidé." />

      <AdmissionForm
        submitLabel="Enregistrer la candidature"
        failureMessage="Impossible d'enregistrer cette candidature."
        onSubmit={async (payload) => {
          const admission = await createAdmission(payload);
          router.push(`/admissions/${admission.id}`);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
