"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { useLayoutStore } from "@/lib/layout/store";

interface TopbarProps {
  name: string;
  subtitle: string;
  profileHref: string;
  settingsHref: string;
  onLogout: () => void | Promise<void>;
}

const ICON_BUTTON =
  "inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

/**
 * Barre du haut. À gauche, le bouton qui réduit la barre latérale à ses icônes
 * (ou ouvre le menu sur mobile) ; à droite, le thème et le menu du profil.
 */
export function Topbar({ name, subtitle, profileHref, settingsHref, onLogout }: TopbarProps) {
  const collapsed = useLayoutStore((state) => state.collapsed);
  const toggleCollapsed = useLayoutStore((state) => state.toggleCollapsed);
  const setMobileOpen = useLayoutStore((state) => state.setMobileOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu" className={`${ICON_BUTTON} md:hidden`}>
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Déplier la barre latérale" : "Réduire la barre latérale en icônes"}
          aria-pressed={collapsed}
          title={collapsed ? "Déplier la barre latérale" : "Réduire la barre latérale"}
          className={`${ICON_BUTTON} hidden md:inline-flex`}
        >
          {collapsed ? <PanelLeftOpen className="size-5" aria-hidden="true" /> : <PanelLeftClose className="size-5" aria-hidden="true" />}
        </button>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu name={name} subtitle={subtitle} profileHref={profileHref} settingsHref={settingsHref} onLogout={onLogout} />
      </div>
    </header>
  );
}
