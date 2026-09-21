"use client";

import { useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LOCALE, isLocale, translate, type Locale } from "@/lib/i18n/translate";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

/**
 * Langue choisie, mémorisée sur l'appareil. `skipHydration` : le rendu serveur est en français, donc le premier
 * rendu client aussi ; la langue mémorisée est relue juste après (voir AppearanceSync), sans écart d'hydratation.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale: isLocale(locale) ? locale : DEFAULT_LOCALE }),
    }),
    { name: "erp-maarif-locale", skipHydration: true },
  ),
);

/** `t("Tableau de bord")` : le texte dans la langue courante. Se met à jour quand la langue change. */
export function useT() {
  const locale = useLocaleStore((state) => state.locale);

  const t = useCallback((text: string, params?: Record<string, string | number>) => translate(locale, text, params), [locale]);

  return { t, locale };
}
