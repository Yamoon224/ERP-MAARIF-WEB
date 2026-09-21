import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck, GraduationCap, NotebookPen, ShieldAlert, Users, Wallet } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const HIGHLIGHTS = [
  { icon: NotebookPen, label: "Notes" },
  { icon: ClipboardCheck, label: "Présences" },
  { icon: ShieldAlert, label: "Discipline" },
  { icon: Wallet, label: "Scolarité" },
];

/**
 * Page d'accueil : la photo occupe tout l'écran et sert de décor. Elle est
 * décorative (alt vide), le texte porte l'information.
 *
 * Le fond de la photo est blanc et le sujet (l'enfant) est au centre : le
 * texte s'aligne à gauche sur un voile à la couleur du thème (`background`),
 * les cartes de connexion se placent à droite sur du verre dépoli, et le
 * centre reste dégagé sur grand écran. Le voile suit le thème : léger en
 * clair, appuyé en Blue Dark pour que le fond blanc n'éblouisse pas.
 */
export default function HomePage() {
  return (
    <main className="relative isolate flex flex-1 flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src="/home/welcome.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-background/30 dark:bg-background/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/50 to-background/80 lg:bg-gradient-to-r lg:from-background/95 lg:via-background/70 lg:via-35% lg:to-transparent lg:to-70%" />
      </div>

      <header className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-14">
        <span className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold tracking-tight text-foreground">ERP Maarif</span>
        </span>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center px-6 pt-6 pb-12 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="max-w-xl">
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance text-foreground xl:text-5xl">
              Le suivi scolaire, simple et en temps réel.
            </h1>
            <p className="mt-4 text-lg text-foreground/80">
              Notes, présences, discipline et scolarité réunies dans un seul espace : l&apos;établissement et les
              familles partagent la même information, au même moment.
            </p>

            <ul className="mt-8 flex flex-wrap gap-2.5">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm"
                >
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid w-full gap-5 sm:grid-cols-2 lg:max-w-sm lg:grid-cols-1">
            <Card accent="primary" className="bg-surface/85 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-5 text-primary" aria-hidden="true" />
                  Espace personnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted">
                  Administrateurs et enseignants : gestion des élèves, des notes, des présences et de la discipline.
                </p>
                <Link href="/login">
                  <Button className="w-full">Se connecter</Button>
                </Link>
              </CardContent>
            </Card>

            <Card accent="grades" className="bg-surface/85 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="size-5 text-accent-grades" aria-hidden="true" />
                  Espace parent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted">
                  Connectez-vous avec le matricule de votre enfant pour suivre sa scolarité.
                </p>
                <Link href="/portal/login">
                  <Button variant="outline" className="w-full">
                    Accéder au portail
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
