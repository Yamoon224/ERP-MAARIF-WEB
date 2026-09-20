import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-foreground">ERP Maarif</h1>
          <p className="mt-2 text-muted">Suivi scolaire des eleves, en temps reel.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card accent="primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-5 text-primary" />
                Espace personnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted">
                Administrateurs et enseignants : gestion des eleves, des notes, des presences et de la discipline.
              </p>
              <Link href="/connexion">
                <Button className="w-full">Se connecter</Button>
              </Link>
            </CardContent>
          </Card>

          <Card accent="grades">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-5 text-accent-grades" />
                Espace parent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted">
                Connectez-vous avec le matricule de votre enfant pour suivre sa scolarite.
              </p>
              <Link href="/portail/connexion">
                <Button variant="outline" className="w-full">
                  Acceder au portail
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
