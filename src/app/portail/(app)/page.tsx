"use client";

import Link from "next/link";
import { NotebookPen, ClipboardCheck, Megaphone, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/auth/store";
import type { StudentAccount } from "@/lib/api/types";

export default function ParentHomePage() {
  const student = useAuthStore((state) => state.user as StudentAccount | null);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        Bonjour, suivi de {student?.first_name} {student?.last_name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Matricule {student?.matricule}
        {student?.school_class ? ` — ${student.school_class.name}` : ""}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/portail/bulletin">
          <Card accent="grades" className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotebookPen className="size-4 text-accent-grades" /> Bulletin
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">Notes et moyennes par matiere.</CardContent>
          </Card>
        </Link>

        <Link href="/portail/presences">
          <Card accent="attendance" className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-4 text-accent-attendance" /> Presences
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">Historique des presences et absences.</CardContent>
          </Card>
        </Link>

        <Link href="/portail/convocations">
          <Card accent="discipline" className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="size-4 text-accent-discipline" /> Convocations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">Convocations de l&apos;etablissement.</CardContent>
          </Card>
        </Link>

        <Link href="/portail/sanctions">
          <Card accent="discipline" className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-accent-discipline" /> Sanctions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">Historique des sanctions disciplinaires.</CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
