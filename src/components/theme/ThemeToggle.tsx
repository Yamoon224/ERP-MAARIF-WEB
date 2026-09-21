"use client";

import { Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n/store";
import { useTheme } from "@/lib/theme/useTheme";
import { cn } from "@/lib/utils/cn";

/**
 * Bascule Light / Blue Dark. Les deux icones sont toujours dans le DOM et
 * c'est le variant `dark:` (piloté par `data-theme`) qui montre la bonne : le
 * rendu serveur et le premier rendu client sont identiques, sans clignotement.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { toggle } = useTheme();
  const { t } = useT();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("Changer de thème (Light / Blue Dark)")}
      title={t("Changer de thème")}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors",
        "hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        className,
      )}
    >
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
    </button>
  );
}
