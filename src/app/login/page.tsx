"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
import { staffLoginSchema, type StaffLoginInput } from "@/lib/validation/auth";
import { staffLogin } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/error";
import { useAuthStore } from "@/lib/auth/store";

export default function StaffLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffLoginInput>({ resolver: zodResolver(staffLoginSchema), defaultValues: { remember: false } });

  async function onSubmit(values: StaffLoginInput) {
    setServerError(null);

    try {
      const { token, user } = await staffLogin(values.email, values.password, values.remember);
      setSession(token, "staff", user, values.remember);
      router.push("/dashboard");
    } catch (error) {
      setServerError(getErrorMessage(error, "Identifiants invalides."));
    }
  }

  return (
    <AuthShell
      audience="staff"
      title="Connexion"
      subtitle="Espace réservé au personnel de l'établissement. Entrez votre e-mail et votre mot de passe."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <AuthField id="email" label="E-mail" icon={Mail} error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nom@exemple.com"
            className="h-11 pl-10"
            {...register("email")}
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

        <div className="flex items-center justify-between gap-4">
          <Checkbox label="Se souvenir de moi" {...register("remember")} />
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Se connecter
          {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>
    </AuthShell>
  );
}
