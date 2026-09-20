import { cn } from "@/lib/utils/cn";

interface LogoProps {
  /** Taille de l'icône (classes Tailwind `size-*`). */
  className?: string;
}

/**
 * Logo ERP Maarif : un livre ouvert surmonté d'une étincelle (le savoir, sens
 * du mot "maarif"). Même dessin que public/logo.svg et l'icône de l'onglet, en
 * aplat : un dégradé demande un identifiant, et plusieurs logos sur la même
 * page (barre fixe + tiroir mobile) partageraient le même, ce qui casse le
 * rendu dès que le premier est masqué.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9 shrink-0", className)} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="15" fill="#2563eb" />
      <path d="M32 27C26.5 22.5 18.5 21.5 11 24V47C18.5 44.5 26.5 45.5 32 50Z" fill="#fff" />
      <path d="M32 27C37.5 22.5 45.5 21.5 53 24V47C45.5 44.5 37.5 45.5 32 50Z" fill="#fff" fillOpacity=".9" />
      <path d="M32 27V50" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M32 6L34.4 11.6L40 14L34.4 16.4L32 22L29.6 16.4L24 14L29.6 11.6Z" fill="#fbbf24" />
    </svg>
  );
}

/** Logo suivi du nom de l'application. */
export function BrandMark({ subtitle, showText = true }: { subtitle?: string; showText?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Logo />
      {showText && (
        <span className="flex flex-col leading-tight">
          <span className="text-base font-semibold text-foreground">ERP Maarif</span>
          {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
        </span>
      )}
    </span>
  );
}
