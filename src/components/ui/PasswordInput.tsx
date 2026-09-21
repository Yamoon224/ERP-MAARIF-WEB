"use client";

import { type InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils/cn";

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ className, ...props }, ref) => {
    const { t } = useT();
    const [visible, setVisible] = useState(false);
    const Icon = visible ? EyeOff : Eye;

    return (
      <div className="relative">
        <Input ref={ref} type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
        <button
          type="button"
          aria-label={visible ? t("Masquer le mot de passe") : t("Afficher le mot de passe")}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
