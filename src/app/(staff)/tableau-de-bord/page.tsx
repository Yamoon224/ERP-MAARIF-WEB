"use client";

import { GraduationCap, NotebookPen, ClipboardCheck, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/auth/store";
import type { StaffUser } from "@/lib/api/types";

export default function StaffDashboardPage() {
  const user = useAuthStore((state) => state.user as StaffUser | null);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Bonjour, {user?.name}</h1>
      <p className="mt-1 text-sm text-muted">Vue d&apos;ensemble de l&apos;etablissement.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card accent="primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" /> Eleves
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">Gerer les dossiers et inscriptions.</CardContent>
        </Card>

        <Card accent="grades">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookPen className="size-4 text-accent-grades" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">Saisir et consulter les releves de notes.</CardContent>
        </Card>

        <Card accent="attendance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-accent-attendance" /> Presences
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">Pointer les presences et absences du jour.</CardContent>
        </Card>

        <Card accent="discipline">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="size-4 text-accent-discipline" /> Discipline
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">Convocations et sanctions disciplinaires.</CardContent>
        </Card>
      </div>
    </div>
  );
}
