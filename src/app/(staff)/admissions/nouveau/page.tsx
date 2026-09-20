"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { listAcademicYears } from "@/lib/api/academics";
import { createAdmission } from "@/lib/api/admissions";
import { getErrorMessage } from "@/lib/api/error";
import type { AcademicYear } from "@/lib/api/types";
import { admissionSchema, type AdmissionFormInput } from "@/lib/validation/admissions";

export default function NewAdmissionPage() {
  const router = useRouter();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AdmissionFormInput>({ resolver: zodResolver(admissionSchema) });

  useEffect(() => {
    listAcademicYears()
      .then((loaded) => {
        setYears(loaded);
        // Année courante par défaut, sans écraser ce que l'utilisateur a déjà saisi.
        const suggested = (loaded.find((year) => year.is_current) ?? loaded[0])?.label;
        if (suggested && !getValues("academic_year")) setValue("academic_year", suggested);
      })
      .catch(() => setYears([]));
  }, [getValues, setValue]);

  async function onSubmit(values: AdmissionFormInput) {
    setServerError(null);

    try {
      const admission = await createAdmission({
        ...values,
        birth_date: values.birth_date || null,
        previous_school: values.previous_school || null,
        guardian_email: values.guardian_email || null,
        address: values.address || null,
        notes: values.notes || null,
      });

      router.push(`/admissions/${admission.id}`);
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible d'enregistrer cette candidature."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nouvelle candidature" description="Le dossier est créé « En attente » ; il sera ensuite étudié puis décidé." />

      <Card accent="primary">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {serverError && <Alert>{serverError}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="academic_year">Année scolaire visée</Label>
                <Input id="academic_year" list="admission-years" placeholder="2025-2026" {...register("academic_year")} />
                <datalist id="admission-years">
                  {years.map((year) => (
                    <option key={year.label} value={year.label} />
                  ))}
                </datalist>
                <FieldError>{errors.academic_year?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="level">Niveau demandé</Label>
                <Input id="level" placeholder="6ème" {...register("level")} />
                <FieldError>{errors.level?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="first_name">Prénom</Label>
                <Input id="first_name" placeholder="Prénom du candidat" {...register("first_name")} />
                <FieldError>{errors.first_name?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="last_name">Nom</Label>
                <Input id="last_name" placeholder="Nom de famille" {...register("last_name")} />
                <FieldError>{errors.last_name?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="gender">Sexe</Label>
                <Select id="gender" {...register("gender")}>
                  <option value="">Sélectionner...</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </Select>
                <FieldError>{errors.gender?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input id="birth_date" type="date" {...register("birth_date")} />
                <FieldError>{errors.birth_date?.message}</FieldError>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="previous_school">Établissement d&apos;origine (optionnel)</Label>
                <Input id="previous_school" placeholder="École ou collège fréquenté" {...register("previous_school")} />
              </div>
            </div>

            <hr className="border-border" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="guardian_name">Nom du tuteur</Label>
                <Input id="guardian_name" placeholder="Nom complet du tuteur" {...register("guardian_name")} />
                <FieldError>{errors.guardian_name?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="guardian_phone">Téléphone du tuteur</Label>
                <Input id="guardian_phone" placeholder="Numéro de téléphone" {...register("guardian_phone")} />
                <FieldError>{errors.guardian_phone?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="guardian_email">E-mail du tuteur</Label>
                <Input id="guardian_email" type="email" placeholder="tuteur@exemple.com" {...register("guardian_email")} />
                <FieldError>{errors.guardian_email?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" placeholder="Rue, quartier, ville" {...register("address")} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Remarques (optionnel)</Label>
                <Textarea id="notes" placeholder="Informations utiles pour l'étude du dossier" {...register("notes")} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Enregistrer la candidature
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
