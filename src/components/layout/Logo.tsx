import { cn } from "@/lib/utils/cn";

interface LogoProps {
  /** Taille de l'icône (classes Tailwind `size-*`). */
  className?: string;
}

/**
 * Logo ERP Maarif : un livre ouvert surmonté d'une étincelle (le savoir, sens
 * du mot "maarif"). Même dessin que public/logo.svg et l'icône de l'onglet.
 *
 * Le fond bleu en dégradé est celui du conteneur HTML, pas un dégradé SVG : un
 * dégradé SVG demande un identifiant, et plusieurs logos sur la même page
 * (barre fixe + tiroir mobile) partageraient le même, ce qui casse le rendu
 * dès que le premier est masqué. Il s'arrête au bleu clair (et non au blanc)
 * pour que le livre blanc reste lisible.
 */
export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn("inline-flex size-9 shrink-0 rounded-[23%]", className)}
      style={{ backgroundImage: "linear-gradient(135deg, var(--grad-1) 0%, var(--grad-2) 55%, var(--grad-3) 100%)" }}
    >
      <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true" focusable="false">
        <path d="M32 27C26.5 22.5 18.5 21.5 11 24V47C18.5 44.5 26.5 45.5 32 50Z" fill="#fff" />
        <path d="M32 27C37.5 22.5 45.5 21.5 53 24V47C45.5 44.5 37.5 45.5 32 50Z" fill="#fff" fillOpacity=".9" />
        <path d="M32 27V50" stroke="#1e40af" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M32 6L34.4 11.6L40 14L34.4 16.4L32 22L29.6 16.4L24 14L29.6 11.6Z" fill="#fbbf24" />
      </svg>
    </span>
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
