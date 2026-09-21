import Image from "next/image";
import Link from "next/link";
import { type ComponentType, type ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils/cn";

interface Highlight {
  icon: ComponentType<{ className?: string }>;
  label: string;
}

interface AuthShellProps {
  /** Quel formulaire est affiché : met en avant l'onglet correspondant. */
  audience: "staff" | "parent";
  /** Photo d'ambiance du panneau de gauche, servie depuis /public/auth. */
  image: string;
  /** Recadrage : où la photo garde son sujet quand le panneau est plus haut que large. */
  imageClassName?: string;
  /** Message d'accroche superposé à la photo. */
  headline: string;
  tagline: string;
  highlights: Highlight[];
  /** Titre et sous-titre du formulaire. */
  title: string;
  subtitle: string;
  children: ReactNode;
}

const AUDIENCES = [
  { key: "staff", label: "Personnel", href: "/login" },
  { key: "parent", label: "Parents", href: "/portal/login" },
] as const;

/**
 * Mise en page commune des pages de connexion : sur grand écran, la photo
 * occupe 7 colonnes sur 12 et le formulaire les 5 autres. Sur mobile et
 * tablette la photo disparaît (et n'est pas téléchargée : image paresseuse
 * masquée), le formulaire garde toute la largeur.
 *
 * La photo est décorative (alt vide) : le texte qui la recouvre porte
 * l'information. Le dégradé sombre est fixe, indépendant du thème, car c'est
 * lui qui garantit le contraste du texte blanc sur n'importe quelle photo.
 */
export function AuthShell({
  audience,
  image,
  imageClassName,
  headline,
  tagline,
  highlights,
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <main className="grid flex-1 lg:grid-cols-12">
      <aside className="relative hidden overflow-hidden bg-slate-900 text-white lg:col-span-7 lg:block">
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 58vw, 0px"
          className={cn("object-cover", imageClassName)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/10" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950/60 to-transparent" aria-hidden="true" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">ERP Maarif</span>
          </div>

          <div className="max-w-xl">
            <h2 className="text-4xl leading-tight font-semibold tracking-tight text-balance xl:text-5xl">{headline}</h2>
            <p className="mt-4 text-lg text-white/80">{tagline}</p>

            <ul className="mt-8 flex flex-wrap gap-2.5">
              {highlights.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm"
                >
                  <Icon className="size-4" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:col-span-5 lg:min-h-0">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="flex items-center gap-3 lg:invisible">
            <Logo />
            <span className="text-base font-semibold text-foreground">ERP Maarif</span>
          </span>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10">
          <div className="auth-rise w-full max-w-sm">
            <nav aria-label="Type de compte" className="mb-8 grid grid-cols-2 rounded-full border border-border bg-surface p-1 text-sm font-medium">
              {AUDIENCES.map((item) => {
                const active = item.key === audience;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full py-2 text-center transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 mb-8 text-sm text-muted">{subtitle}</p>

            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
