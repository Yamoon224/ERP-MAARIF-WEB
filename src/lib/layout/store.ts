import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LayoutState {
  /** Barre latérale réduite à ses icônes (bureau). Mémorisé d'une visite à l'autre. */
  collapsed: boolean;
  /** Tiroir de navigation ouvert (mobile). Jamais mémorisé. */
  mobileOpen: boolean;
  /** Panneau de configuration de l'application ouvert. Jamais mémorisé. */
  configOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  setConfigOpen: (open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      configOpen: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
      setConfigOpen: (configOpen) => set({ configOpen }),
    }),
    {
      name: "erp-maarif-layout",
      partialize: (state) => ({ collapsed: state.collapsed }),
    },
  ),
);
