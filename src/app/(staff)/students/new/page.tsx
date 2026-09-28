"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { studentSchema, type StudentFormInput } from "@/lib/validation/students";
import { createStudent } from "@/lib/api/students";
import { getErrorMessage } from "@/lib/api/error";
import { useSchoolClassOptions } from "@/lib/hooks/useSchoolClassOptions";
import { useT } from "@/lib/i18n/store";

export default function NewStudentPage() {
  const { t } = useT();
  const router = useRouter();
  const schoolClasses = useSchoolClassOptions();
  const [serverError, setServerError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ matricule: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormInput>({ resolver: zodResolver(studentSchema) });

  async function onSubmit(values: StudentFormInput) {
    setServerError(null);

    try {
      const student = await createStudent({
        ...values,
        birth_date: values.birth_date || null,
        school_class_id: values.school_class_id || null,
        guardian_email: values.guardian_email || null,
        address: values.address || null,
      });

      setCredentials({ matricule: student.matricule, password: student.initial_password });
    } catch (error) {
      setServerError(getErrorMessage(error, t("Impossible d'inscrire cet élève.")));
    }
  }

  if (credentials) {
    return (
      <div className="mx-auto max-w-lg">
        <Card accent="primary">
          <CardHeader>
            <CardTitle>{t("Élève inscrit")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted">
              {t("Remettez ces identifiants au tuteur : ils ne seront plus jamais affichés en clair.")}
            </p>
            <div className="rounded-md border border-border bg-background p-4 font-mono text-sm">
              <p>{t("Matricule : {matricule}", { matricule: credentials.matricule })}</p>
              <p>{t("Mot de passe : {password}", { password: credentials.password })}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/students")}>{t("Retour à la liste")}</Button>
              <Button variant="secondary" onClick={() => setCredentials(null)}>
                {t("Inscrire un autre élève")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-foreground">{t("Inscrire un élève")}</h1>

      <Card accent="primary">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {serverError && <Alert>{serverError}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="first_name">Prénom</Label>
                <Input id="first_name" placeholder={t("Prénom de l'élève")} {...register("first_name")} />
                <FieldError>{errors.first_name?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="last_name">Nom</Label>
                <Input id="last_name" placeholder={t("Nom de famille")} {...register("last_name")} />
                <FieldError>{errors.last_name?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="gender">Sexe</Label>
                <Select id="gender" {...register("gender")}>
                  <option value="">{t("Sélectionner...")}</option>
                  <option value="M">{t("Masculin")}</option>
                  <option value="F">{t("Féminin")}</option>
                </Select>
                <FieldError>{errors.gender?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input id="birth_date" type="date" {...register("birth_date")} />
                <FieldError>{errors.birth_date?.message}</FieldError>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="school_class_id">Classe</Label>
                <Select id="school_class_id" {...register("school_class_id")}>
                  <option value="">{t("Non affecté")}</option>
                  {schoolClasses.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name} ({schoolClass.academic_year})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <hr className="border-border" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="guardian_name">Nom du tuteur</Label>
                <Input id="guardian_name" placeholder={t("Nom complet du tuteur")} {...register("guardian_name")} />
                <FieldError>{errors.guardian_name?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="guardian_phone">Téléphone du tuteur</Label>
                <Input id="guardian_phone" placeholder={t("Numéro de téléphone")} {...register("guardian_phone")} />
                <FieldError>{errors.guardian_phone?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="guardian_email">E-mail du tuteur</Label>
                <Input id="guardian_email" type="email" placeholder="tuteur@exemple.com" {...register("guardian_email")} />
                <FieldError>{errors.guardian_email?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" placeholder={t("Rue, quartier, ville")} {...register("address")} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                {t("Annuler")}
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {t("Inscrire l'élève")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
