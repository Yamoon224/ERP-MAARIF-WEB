import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-primary-foreground hover:brightness-110 focus-visible:outline-primary",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-background focus-visible:outline-primary",
  outline:
    "border border-brand text-primary hover:brightness-95 focus-visible:outline-primary",
  ghost: "bg-transparent text-foreground hover:bg-foreground/5 focus-visible:outline-primary",
  // primary-foreground (et non white) : sur le rouge clair de Blue Dark, le blanc manquerait de contraste.
  danger: "bg-danger text-primary-foreground hover:opacity-90 focus-visible:outline-danger",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3.5 text-sm gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // rounded-full : identite visuelle des actions dans toute l'appli.
          "inline-flex items-center justify-center rounded-full font-medium transition-[filter,background-color]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
