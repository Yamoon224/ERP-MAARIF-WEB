import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Accent = "primary" | "grades" | "attendance" | "discipline" | "academics" | "users" | "accounting" | "neutral";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
}

const accentBorderClasses: Record<Accent, string> = {
  primary: "border-t-primary",
  grades: "border-t-accent-grades",
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

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}
