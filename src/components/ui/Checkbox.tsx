import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

/** Case à cocher avec son libellé cliquable ; la couleur de coche suit le thème. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, ...props }, ref) => (
  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground select-none">
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "size-4 cursor-pointer rounded border-border accent-primary",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
      {...props}
    />
    {label}
  </label>
));

Checkbox.displayName = "Checkbox";
