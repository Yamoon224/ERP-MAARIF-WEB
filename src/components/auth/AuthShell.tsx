import Image from "next/image";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface AuthShellProps {
  /** Photo d'ambiance du panneau de gauche, servie depuis /public/auth. */
  image: string;
  /** Recadrage : où la photo garde son sujet quand le panneau est plus haut que large. */
  imageClassName?: string;
  children: ReactNode;
}

/**
 * Mise en page commune des pages de connexion : sur grand écran, la photo
 * occupe 7 colonnes sur 12 et le formulaire les 5 autres. Sur mobile et
 * tablette la photo disparaît (et n'est pas téléchargée : image paresseuse
 * masquée), le formulaire garde toute la largeur.
 *
 * La photo est décorative (alt vide) : elle n'apporte aucune information.
 */
export function AuthShell({ image, imageClassName, children }: AuthShellProps) {
  return (
    <main className="grid flex-1 lg:grid-cols-12">
      <div className="relative hidden lg:col-span-7 lg:block">
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 58vw, 0px"
          className={cn("object-cover", imageClassName)}
        />
      </div>

      <div className="flex items-center justify-center px-4 py-16 lg:col-span-5">{children}</div>
    </main>
  );
}
