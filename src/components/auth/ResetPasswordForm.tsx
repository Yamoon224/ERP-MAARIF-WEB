"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleCheck, Lock } from "lucide-react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell, type AuthAudience } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { resetParentPassword, resetStaffPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/error";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";

const LINKS = {
  staff: { login: "/login", forgot: "/forgot-password" },
  parent: { login: "/portal/login", forgot: "/portal/forgot-password" },
} as const satisfies Record<AuthAudience, unknown>;

interface ResetPasswordFormProps {
  audience: AuthAudience;
  /** Jeton du lien reçu ; vide si le lien est tronqué ou ouvert à la main. */
  token: string;
  /** E-mail (personnel) ou matricule (parent) porté par le lien : l'API vérifie le jeton pour cet identifiant. */
  identity: string;
}

/** Choix d'un nouveau mot de passe depuis le lien reçu par e-mail ou SMS. */
export function ResetPasswordForm({ audience, token, identity }: ResetPasswordFormProps) {
  const links = LINKS[audience];
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);

    try {
      if (audience === "staff") {
        await resetStaffPassword({ email: identity, token, ...values });
      } else {
        await resetParentPassword({ matricule: identity, token, ...values });
      }

      setIsDone(true);
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible de modifier le mot de passe pour le moment. Réessayez dans un instant."));
    }
  }

  if (!token || !identity) {
    return (
      <AuthShell audience={audience} title="Lien invalide" subtitle="Ce lien de réinitialisation est incomplet ou a expiré.">
        <Link href={links.forgot} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          Demander un nouveau lien
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </AuthShell>
    );
  }

  if (isDone) {
    return (
      <AuthShell audience={audience} title="Mot de passe modifié" subtitle="Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.">
        <div role="status" className="mb-6 flex items-center gap-3 rounded-md border border-border bg-surface p-5 text-sm text-foreground">
          <CircleCheck className="size-6 shrink-0 text-success" aria-hidden="true" />
          Les sessions ouvertes ailleurs ont été fermées.
        </div>
        <Link
          href={links.login}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-medium text-primary-foreground transition-[filter] hover:brightness-110"
        >
          Se connecter
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell audience={audience} title="Nouveau mot de passe" subtitle="Choisissez un mot de passe d'au moins 8 caractères.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && (
          <Alert>
            {serverError}{" "}
            <Link href={links.forgot} className="font-medium underline">
              Demander un nouveau lien
            </Link>
          </Alert>
        )}

        <AuthField id="password" label="Nouveau mot de passe" icon={Lock} error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" className="h-11 pl-10" {...register("password")} />
        </AuthField>

        <AuthField id="password_confirmation" label="Confirmer le mot de passe" icon={Lock} error={errors.password_confirmation?.message}>
          <PasswordInput id="password_confirmation" autoComplete="new-password" className="h-11 pl-10" {...register("password_confirmation")} />
        </AuthField>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Enregistrer le mot de passe
          {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>
    </AuthShell>
  );
}
