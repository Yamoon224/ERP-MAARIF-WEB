"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CircleCheck, IdCard, Mail } from "lucide-react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell, type AuthAudience } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { requestParentPasswordReset, requestStaffPasswordReset } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/error";
import { parentForgotPasswordSchema, staffForgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";

const CONTENT = {
  staff: {
    subtitle: "Entrez l'e-mail de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.",
    label: "E-mail",
    icon: Mail,
    placeholder: "nom@exemple.com",
    autoComplete: "email",
    type: "email",
    schema: staffForgotPasswordSchema,
    request: requestStaffPasswordReset,
    loginHref: "/login",
  },
  parent: {
    subtitle:
      "Entrez le matricule de votre enfant : un lien pour choisir un nouveau mot de passe sera envoyé au tuteur, par e-mail ou par SMS, aux coordonnées enregistrées par l'établissement.",
    label: "Matricule de l'élève",
    icon: IdCard,
    placeholder: "MAA-2026-000123",
    autoComplete: "username",
    type: "text",
    schema: parentForgotPasswordSchema,
    request: requestParentPasswordReset,
    loginHref: "/portal/login",
  },
} as const satisfies Record<AuthAudience, unknown>;

/**
 * Demande d'un lien de réinitialisation. L'écran de confirmation est le même
 * que le compte existe ou non : la réponse de l'API l'est déjà, et l'afficher
 * tel quel évite de transformer ce formulaire public en oracle de comptes.
 */
export function ForgotPasswordForm({ audience }: { audience: AuthAudience }) {
  const content = CONTENT[audience];
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(content.schema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);

    try {
      setConfirmation(await content.request(values.identifier));
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible d'envoyer le lien pour le moment. Réessayez dans un instant."));
    }
  }

  return (
    <AuthShell audience={audience} title="Mot de passe oublié" subtitle={content.subtitle}>
      {confirmation ? (
        <div role="status" className="rounded-md border border-border bg-surface p-5">
          <CircleCheck className="size-6 text-success" aria-hidden="true" />
          <p className="mt-3 text-sm text-foreground">{confirmation}</p>
          <p className="mt-2 text-sm text-muted">
            Le lien est à usage unique et expire rapidement. Pensez à vérifier vos courriers indésirables.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && <Alert>{serverError}</Alert>}

          <AuthField id="identifier" label={content.label} icon={content.icon} error={errors.identifier?.message}>
            <Input
              id="identifier"
              type={content.type}
              autoComplete={content.autoComplete}
              placeholder={content.placeholder}
              className="h-11 pl-10"
              {...register("identifier")}
            />
          </AuthField>

          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Envoyer le lien
            {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>
        </form>
      )}

      <Link href={content.loginHref} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Retour à la connexion
      </Link>
    </AuthShell>
  );
}
