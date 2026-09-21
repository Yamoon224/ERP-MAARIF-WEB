"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  isAccentId,
  sanitizeColor,
  type AccentId,
  type AppearanceState,
  type BackgroundRegion,
  type NavLayout,
} from "@/lib/appearance/palettes";

interface AppearanceStore extends AppearanceState {
  setAccent: (accent: AccentId) => void;
  setNavLayout: (layout: NavLayout) => void;
  /** Fond d'une zone ; `null` la rend au thème. Toute valeur qui n'est pas `#rrggbb` est ignorée. */
  setBackground: (region: BackgroundRegion, color: string | null) => void;
  reset: () => void;
}

const BACKGROUND_KEYS: Record<BackgroundRegion, "sidebarHeaderBg" | "topbarBg" | "sidebarBg"> = {
  sidebarHeader: "sidebarHeaderBg",
  topbar: "topbarBg",
  sidebar: "sidebarBg",
};

/**
 * Apparence de l'application (couleur principale, disposition du menu, fonds des barres), mémorisée sur
 * l'appareil. `skipHydration` : le premier rendu client doit égaler le rendu serveur ; la valeur mémorisée est
 * relue juste après (voir AppearanceSync). Les couleurs, elles, sont déjà posées avant le premier rendu par
 * APPEARANCE_SCRIPT.
 */
export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set) => ({
      ...DEFAULT_APPEARANCE,
      setAccent: (accent) => set({ accent: isAccentId(accent) ? accent : DEFAULT_APPEARANCE.accent }),
      setNavLayout: (navLayout) => set({ navLayout: navLayout === "horizontal" ? "horizontal" : "vertical" }),
      setBackground: (region, color) => set({ [BACKGROUND_KEYS[region]]: color === null ? null : sanitizeColor(color) }),
      reset: () => set({ ...DEFAULT_APPEARANCE }),
    }),
    {
      name: APPEARANCE_STORAGE_KEY,
      skipHydration: true,
      partialize: (state) => ({
        accent: state.accent,
        navLayout: state.navLayout,
        sidebarHeaderBg: state.sidebarHeaderBg,
        topbarBg: state.topbarBg,
        sidebarBg: state.sidebarBg,
      }),
      // Un stockage corrompu ou d'une ancienne version ne doit jamais casser l'affichage.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppearanceState>;

        return {
          ...current,
          accent: isAccentId(saved.accent) ? saved.accent : current.accent,
          navLayout: saved.navLayout === "horizontal" ? "horizontal" : current.navLayout,
          sidebarHeaderBg: sanitizeColor(saved.sidebarHeaderBg),
          topbarBg: sanitizeColor(saved.topbarBg),
          sidebarBg: sanitizeColor(saved.sidebarBg),
        };
      },
    },
  ),
);
