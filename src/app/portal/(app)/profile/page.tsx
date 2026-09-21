"use client";

import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { changeParentPassword } from "@/lib/api/auth";
import type { StudentAccount } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";

export default function ParentProfilePage() {
  const student = useAuthStore((state) => state.user as StudentAccount | null);

  if (!student) return null;

  return (
    <div>
      <PageHeader title="Profil" description="Le compte du portail est celui de votre enfant : son matricule sert d'identifiant." />

      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <Card accent="primary" className="h-full">
          <CardHeader>
            <CardTitle>Élève suivi</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-muted">Nom</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {student.first_name} {student.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Matricule</dt>
                <dd className="mt-0.5 font-mono font-medium text-foreground">{student.matricule}</dd>
              </div>
              <div>
                <dt className="text-muted">Classe</dt>
                <dd className="mt-0.5 font-medium text-foreground">{student.school_class?.name ?? "Non affecté"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <ChangePasswordCard onChange={changeParentPassword} className="h-full" />
      </div>
    </div>
  );
}
