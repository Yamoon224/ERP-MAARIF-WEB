"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldError, Label } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { getErrorMessage, getFieldErrors } from "@/lib/api/error";
import type { StaffUser } from "@/lib/api/types";
import { resetUserPassword } from "@/lib/api/users";
import { useT } from "@/lib/i18n/store";
import { resetPasswordSchema, type ResetPasswordFormInput } from "@/lib/validation/users";

interface ResetPasswordModalProps {
  user: StaffUser;
  onClose: () => void;
  onDone: (user: StaffUser) => void;
}

/** Nouveau mot de passe d'un compte, choisi par l'administrateur. Les sessions ouvertes du compte sont fermées. */
export function ResetPasswordModal({ user, onClose, onDone }: ResetPasswordModalProps) {
  const { t } = useT();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", password_confirmation: "" } });

  async function onSubmit(values: ResetPasswordFormInput) {
    setServerError(null);

    try {
      await resetUserPassword(user.id, values);
      onDone(user);
    } catch (error) {
      const fieldError = getFieldErrors(error).password;

      if (fieldError) setError("password", { message: fieldError });
      else setServerError(getErrorMessage(error, t("Impossible de réinitialiser le mot de passe.")));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t("Réinitialiser le mot de passe")}
      description={t("Nouveau mot de passe de {name}. Ses sessions ouvertes seront fermées.", { name: user.name })}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <div>
          <Label htmlFor="reset-password">{t("Nouveau mot de passe")}</Label>
          <PasswordInput id="reset-password" autoComplete="new-password" placeholder={t("8 caractères minimum")} {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="reset-password-confirmation">{t("Confirmer le nouveau mot de passe")}</Label>
          <PasswordInput id="reset-password-confirmation" autoComplete="new-password" {...register("password_confirmation")} />
          <FieldError>{errors.password_confirmation?.message}</FieldError>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("Annuler")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <KeyRound className="size-4" aria-hidden="true" /> {t("Réinitialiser")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
