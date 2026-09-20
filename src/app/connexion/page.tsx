"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
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
  } = useForm<StaffLoginInput>({ resolver: zodResolver(staffLoginSchema) });

  async function onSubmit(values: StaffLoginInput) {
    setServerError(null);

    try {
      const { token, user } = await staffLogin(values.email, values.password);
      setSession(token, "staff", user);
      router.push("/tableau-de-bord");
    } catch (error) {
      setServerError(getErrorMessage(error, "Identifiants invalides."));
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Card accent="primary" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Connexion personnel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && <Alert>{serverError}</Alert>}

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="nom@exemple.com" {...register("email")} />
              <FieldError>{errors.email?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <PasswordInput id="password" autoComplete="current-password" placeholder="Votre mot de passe" {...register("password")} />
              <FieldError>{errors.password?.message}</FieldError>
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Vous etes parent ?{" "}
            <Link href="/portail/connexion" className="font-medium text-primary hover:underline">
              Acceder au portail
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
