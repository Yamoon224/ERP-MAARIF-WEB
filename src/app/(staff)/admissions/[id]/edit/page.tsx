"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdmissionForm } from "@/components/staff/AdmissionForm";
import { getAdmission, updateAdmission } from "@/lib/api/admissions";
import type { Admission } from "@/lib/api/types";
import type { AdmissionFormInput } from "@/lib/validation/admissions";

/** Valeurs du formulaire d'après un dossier : les champs vides de l'API deviennent des chaînes vides. */
function toFormValues(admission: Admission): AdmissionFormInput {
  return {
    academic_year: admission.academic_year,
    level: admission.level,
    first_name: admission.first_name,
    last_name: admission.last_name,
    gender: admission.gender,
    birth_date: admission.birth_date ?? "",
    previous_school: admission.previous_school ?? "",
    guardian_name: admission.guardian_name,
    guardian_phone: admission.guardian_phone,
    guardian_email: admission.guardian_email ?? "",
    address: admission.address ?? "",
    notes: admission.notes ?? "",
  };
}

export default function EditAdmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getAdmission(id)
      .then(setAdmission)
      .catch(() => setFailed(true));
  }, [id]);

  if (failed) return <Alert>Candidature introuvable.</Alert>;
  if (!admission) return <p className="text-sm text-muted">Chargement...</p>;

  const back = `/admissions/${id}`;

  // Un dossier inscrit est figé : l'élève créé est devenu la source de vérité.
  if (admission.status === "enrolled") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert>Ce candidat est déjà inscrit : son dossier ne peut plus être modifié.</Alert>
        <Link href={back} className="text-sm font-medium text-primary hover:underline">
          ← Retour au dossier
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Modifier ${admission.full_name}`} description={`${admission.reference} · statut actuel : ${admission.status_label}`} />

      <AdmissionForm
        defaultValues={toFormValues(admission)}
        submitLabel="Enregistrer les modifications"
        failureMessage="Impossible de modifier cette candidature."
        onSubmit={async (payload) => {
          await updateAdmission(id, payload);
          router.push(back);
        }}
        onCancel={() => router.push(back)}
      />
    </div>
  );
}
