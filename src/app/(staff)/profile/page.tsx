"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { changeStaffPassword, updateStaffProfile } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/error";
import type { StaffUser } from "@/lib/api/types";
import { roleLabel } from "@/lib/auth/roles";
import { useAuthStore } from "@/lib/auth/store";
import { profileSchema, type ProfileFormInput } from "@/lib/validation/profile";

export default function StaffProfilePage() {
  const user = useAuthStore((state) => state.user as StaffUser | null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" },
  });

  async function onSubmit(values: ProfileFormInput) {
    setServerError(null);
    setSaved(false);

    try {
      const updated = await updateStaffProfile({ name: values.name, email: values.email, phone: values.phone || null });

      // Le nom et l'e-mail affichés dans la barre du haut viennent du store de session.
      const { token, actorType, setSession } = useAuthStore.getState();
      if (token && actorType) setSession(token, actorType, updated);
      setSaved(true);
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible d'enregistrer le profil."));
    }
  }

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profil" description="Vos informations de connexion et votre mot de passe." />

      <div className="max-w-3xl space-y-6">
        <Card accent="primary">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
              {serverError && (
                <div className="sm:col-span-2">
                  <Alert>{serverError}</Alert>
                </div>
              )}

              <div>
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" autoComplete="name" {...register("name")} />
                <FieldError>{errors.name?.message}</FieldError>
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                <FieldError>{errors.email?.message}</FieldError>
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" autoComplete="tel" placeholder="+224 600 00 00 00" {...register("phone")} />
                <FieldError>{errors.phone?.message}</FieldError>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Rôle</p>
                <div className="flex h-10 flex-wrap items-center gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role} tone="info">
                      {roleLabel(role)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 sm:col-span-2">
                <Button type="submit" loading={isSubmitting}>
                  Enregistrer
                </Button>
                {saved && (
                  <p role="status" className="flex items-center gap-1.5 text-sm text-success">
                    <Check className="size-4" aria-hidden="true" /> Profil enregistré.
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <ChangePasswordCard onChange={changeStaffPassword} />
      </div>
    </div>
  );
}
