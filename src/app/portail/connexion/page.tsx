"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { parentLoginSchema, type ParentLoginInput } from "@/lib/validation/auth";
import { parentLogin } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/error";
import { useAuthStore } from "@/lib/auth/store";

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
      router.push("/portail");
    } catch (error) {
      setServerError(getErrorMessage(error, "Matricule ou mot de passe incorrect."));
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Card accent="grades" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Portail parent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && <Alert>{serverError}</Alert>}

            <div>
              <Label htmlFor="matricule">Matricule de l&apos;eleve</Label>
              <Input id="matricule" autoComplete="username" placeholder="MAA-2026-000123" {...register("matricule")} />
              <FieldError>{errors.matricule?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              <FieldError>{errors.password?.message}</FieldError>
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Vous etes du personnel ?{" "}
            <Link href="/connexion" className="font-medium text-primary hover:underline">
              Connexion personnel
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
