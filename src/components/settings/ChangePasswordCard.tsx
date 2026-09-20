"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldError, Label } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import type { ApiError } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/error";
import type { ChangePasswordPayload } from "@/lib/api/auth";
import { passwordSchema, type PasswordFormInput } from "@/lib/validation/profile";

interface ChangePasswordCardProps {
  /** Appel API propre à chaque espace (personnel ou parent). */
  onChange: (payload: ChangePasswordPayload) => Promise<void>;
}

/** Changement de mot de passe : l'ancien est exigé, et les autres sessions sont fermées côté serveur. */
export function ChangePasswordCard({ onChange }: ChangePasswordCardProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormInput>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(values: PasswordFormInput) {
    setServerError(null);
    setDone(false);

    try {
      await onChange(values);
      reset();
      setDone(true);
    } catch (error) {
      // L'ancien mot de passe faux est une erreur de champ, pas une panne.
      const fieldErrors = isAxiosError<ApiError>(error) ? error.response?.data?.errors : undefined;
      if (fieldErrors?.current_password?.[0]) {
        setError("current_password", { message: fieldErrors.current_password[0] });
        return;
      }

      setServerError(getErrorMessage(error, "Impossible de changer le mot de passe."));
    }
  }

  return (
    <Card accent="primary">
      <CardHeader>
        <CardTitle>Mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
          {serverError && <Alert>{serverError}</Alert>}
          {done && (
            <p role="status" className="flex items-center gap-2 text-sm text-success">
              <Check className="size-4" aria-hidden="true" /> Mot de passe modifié. Vos autres sessions ont été fermées.
            </p>
          )}

          <div>
            <Label htmlFor="current_password">Mot de passe actuel</Label>
            <PasswordInput id="current_password" autoComplete="current-password" {...register("current_password")} />
            <FieldError>{errors.current_password?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <PasswordInput id="password" autoComplete="new-password" placeholder="8 caractères minimum" {...register("password")} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="password_confirmation">Confirmer le nouveau mot de passe</Label>
            <PasswordInput id="password_confirmation" autoComplete="new-password" {...register("password_confirmation")} />
            <FieldError>{errors.password_confirmation?.message}</FieldError>
          </div>

          <Button type="submit" loading={isSubmitting}>
            Changer le mot de passe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
