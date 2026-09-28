"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdmissionForm } from "@/components/staff/AdmissionForm";
import { getAdmission, updateAdmission } from "@/lib/api/admissions";
import type { Admission } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
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
  const { t } = useT();
  const { id } = use(params);
  const router = useRouter();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getAdmission(id)
      .then(setAdmission)
      .catch(() => setFailed(true));
  }, [id]);

  if (failed) return <Alert>{t("Candidature introuvable.")}</Alert>;
  if (!admission) return <p className="text-sm text-muted">{t("Chargement...")}</p>;

  const back = `/admissions/${id}`;

  // Un dossier inscrit est figé : l'élève créé est devenu la source de vérité.
  if (admission.status === "enrolled") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert>{t("Ce candidat est déjà inscrit : son dossier ne peut plus être modifié.")}</Alert>
        <Link href={back} className="text-sm font-medium text-primary hover:underline">
          {t("← Retour au dossier")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Modifier {name}", { name: admission.full_name })}
        description={t("{reference} · statut actuel : {status}", { reference: admission.reference, status: admission.status_label })}
      />

      <AdmissionForm
        defaultValues={toFormValues(admission)}
        submitLabel={t("Enregistrer les modifications")}
        failureMessage={t("Impossible de modifier cette candidature.")}
        onSubmit={async (payload) => {
          await updateAdmission(id, payload);
          router.push(back);
        }}
        onCancel={() => router.push(back)}
      />
    </div>
  );
}
