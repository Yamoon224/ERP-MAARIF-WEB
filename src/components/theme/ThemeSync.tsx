"use client";

import { useEffect } from "react";
import { applyTheme, useTheme } from "@/lib/theme/useTheme";

/**
 * Garde l'attribut `data-theme` de <html> a jour quand le theme effectif
 * change sans action de l'utilisateur : preference "Automatique" et theme du
 * systeme qui bascule (coucher du soleil), ou autre onglet qui change de theme.
 */
export function ThemeSync() {
  const { theme } = useTheme();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}
