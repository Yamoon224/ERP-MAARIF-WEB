"use client";

import { useEffect, useState } from "react";
import { ACCENT_TOKENS, applyAppearance, toneOf } from "@/lib/appearance/palettes";
import { useAppearanceStore } from "@/lib/appearance/store";
import { LOCALES } from "@/lib/i18n/translate";
import { useLocaleStore } from "@/lib/i18n/store";
import { useTheme } from "@/lib/theme/useTheme";

/**
 * Relit l'apparence et la langue mémorisées (les magasins sautent l'hydratation pour que le premier rendu client
 * égale le rendu serveur), puis garde <html> à jour : jetons de couleur (qui dépendent du thème, clair ou sombre),
 * fonds des barres et attribut `lang`.
 */
export function AppearanceSync() {
  const { theme } = useTheme();
  const appearance = useAppearanceStore();
  const locale = useLocaleStore((state) => state.locale);

  // Tant que la valeur mémorisée n'est pas relue, le magasin porte les valeurs par défaut : les appliquer
  // effacerait ce que le script d'avant-rendu vient de poser.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void Promise.all([useAppearanceStore.persist.rehydrate(), useLocaleStore.persist.rehydrate()]).then(() => setHydrated(true));
  }, []);

  const { accent, navLayout, sidebarHeaderBg, topbarBg, sidebarBg } = appearance;
  useEffect(() => {
    if (!hydrated) return;
    applyAppearance(document.documentElement, { accent, navLayout, sidebarHeaderBg, topbarBg, sidebarBg }, theme, ACCENT_TOKENS, toneOf);
  }, [hydrated, accent, navLayout, sidebarHeaderBg, topbarBg, sidebarBg, theme]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = LOCALES.find((option) => option.value === locale)?.htmlLang ?? "fr";
  }, [hydrated, locale]);

  return null;
}
