"use client";

import { type HTMLAttributes } from "react";
import { useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils/cn";

type Accent = "primary" | "grades" | "attendance" | "discipline" | "academics" | "users" | "accounting" | "neutral";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
}

/**
 * Le liseret bleu est un pseudo-élément en dégradé posé sur la bordure haute
 * (transparente) : une bordure ne peut pas porter de dégradé. Les autres
 * domaines gardent une couleur unie, qui les distingue du bleu.
 */
const BLUE_TOP_BAR =
  "border-t-transparent relative before:absolute before:-top-1 before:-inset-x-px before:h-1 before:rounded-t-md before:bg-brand before:content-['']";

const accentBorderClasses: Record<Accent, string> = {
  primary: BLUE_TOP_BAR,
  grades: BLUE_TOP_BAR,
  attendance: "border-t-accent-attendance",
  discipline: "border-t-accent-discipline",
  academics: "border-t-accent-academics",
  users: "border-t-accent-users",
  accounting: "border-t-accent-accounting",
  neutral: "border-t-border",
};

/**
 * Carte standard de l'application : coins doucement arrondis (rounded-md,
 * plus discret que les rounded-full des actions) et un liseret de couleur en
 * bordure superieure qui identifie le domaine d'un coup d'oeil dans un
 * tableau de bord qui mélange notes, presences et discipline.
 */
export function Card({ className, accent = "neutral", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border border-t-4 bg-surface shadow-sm",
        accentBorderClasses[accent],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-4 pb-2", className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const { t } = useT();

  return (
    <h3 className={cn("text-sm font-semibold text-foreground", className)} {...props}>
      {typeof children === "string" ? t(children) : children}
    </h3>
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}
