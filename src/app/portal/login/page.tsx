"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ClipboardCheck, IdCard, Lock, NotebookPen, Wallet } from "lucide-react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
import { parentLoginSchema, type ParentLoginInput } from "@/lib/validation/auth";
import { parentLogin } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/error";
import { useAuthStore } from "@/lib/auth/store";

const HIGHLIGHTS = [
  { icon: NotebookPen, label: "Bulletins" },
  { icon: ClipboardCheck, label: "Présences" },
  { icon: Wallet, label: "Frais de scolarité" },
];

export default function ParentLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ParentLoginInput>({ resolver: zodResolver(parentLoginSchema) });

  async function onSubmit(values: ParentLoginInput) {
    setServerError(null);

    try {
      const { token, student } = await parentLogin(values.matricule, values.password);
      setSession(token, "parent", student);
      router.push("/portal");
    } catch (error) {
      setServerError(getErrorMessage(error, "Matricule ou mot de passe incorrect."));
    }
  }

  return (
    <AuthShell
      audience="parent"
      image="/auth/parent.jpg"
      imageClassName="object-left"
      headline="La scolarité de votre enfant, en toute clarté."
      tagline="Bulletins, présences, convocations et frais de scolarité, consultables à tout moment."
      highlights={HIGHLIGHTS}
      title="Portail parent"
      subtitle="Connectez-vous avec le matricule de votre enfant. Le mot de passe vous est remis par l'établissement."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <AuthField id="matricule" label="Matricule de l'élève" icon={IdCard} error={errors.matricule?.message}>
          <Input
            id="matricule"
            autoComplete="username"
            placeholder="MAA-2026-000123"
            className="h-11 pl-10"
            {...register("matricule")}
          />
        </AuthField>

        <AuthField id="password" label="Mot de passe" icon={Lock} error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            className="h-11 pl-10"
            {...register("password")}
          />
        </AuthField>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Se connecter
          {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>
    </AuthShell>
  );
}
