import { type ComponentType, type ReactNode } from "react";
import { FieldError, Label } from "@/components/ui/Field";

interface AuthFieldProps {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  error?: string;
  /** Le champ (Input ou PasswordInput), à qui il faut donner `h-11 pl-10` pour laisser la place à l'icône. */
  children: ReactNode;
}

/** Champ de formulaire de connexion : libellé, icône à gauche, message d'erreur. */
export function AuthField({ id, label, icon: Icon, error, children }: AuthFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {children}
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted" />
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
