import { type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Accent = NonNullable<ComponentProps<typeof Card>["accent"]>;

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: Accent;
  className?: string;
}

/** Indicateur chiffré : libellé, valeur en gros, précision facultative. */
export function StatCard({ label, value, hint, icon, accent = "neutral", className }: StatCardProps) {
  return (
    <Card accent={accent} className={cn("px-5 py-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <p className="mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
