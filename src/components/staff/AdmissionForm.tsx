"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { listAcademicYears } from "@/lib/api/academics";
import type { AdmissionPayload } from "@/lib/api/admissions";
import { getErrorMessage } from "@/lib/api/error";
import type { AcademicYear } from "@/lib/api/types";
import { admissionSchema, type AdmissionFormInput } from "@/lib/validation/admissions";

interface AdmissionFormProps {
  /** Valeurs de départ (modification) ; vide pour une nouvelle candidature. */
  defaultValues?: Partial<AdmissionFormInput>;
  submitLabel: string;
  failureMessage: string;
  onSubmit: (payload: AdmissionPayload) => Promise<void>;
  onCancel: () => void;
}

/** Formulaire d'un dossier de candidature, partagé par la création et la modification. */
export function AdmissionForm({ defaultValues, submitLabel, failureMessage, onSubmit, onCancel }: AdmissionFormProps) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AdmissionFormInput>({ resolver: zodResolver(admissionSchema), defaultValues });

  useEffect(() => {
    listAcademicYears()
      .then((loaded) => {
        setYears(loaded);
        // Année courante par défaut, sans écraser ce qui est déjà saisi ni l'année d'un dossier existant.
        const suggested = (loaded.find((year) => year.is_current) ?? loaded[0])?.label;
        if (suggested && !getValues("academic_year")) setValue("academic_year", suggested);
      })
      .catch(() => setYears([]));
  }, [getValues, setValue]);

  async function submit(values: AdmissionFormInput) {
    setServerError(null);

    try {
      await onSubmit({
        ...values,
        birth_date: values.birth_date || null,
        previous_school: values.previous_school || null,
        guardian_email: values.guardian_email || null,
        address: values.address || null,
        notes: values.notes || null,
      });
    } catch (error) {
      setServerError(getErrorMessage(error, failureMessage));
    }
  }

  return (
    <Card accent="primary">
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
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
            <Button type="button" variant="secondary" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
