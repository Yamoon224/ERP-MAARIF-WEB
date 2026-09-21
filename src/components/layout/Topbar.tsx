"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { isNavItemActive, type NavItem } from "@/components/layout/nav";
import { useLayoutStore } from "@/lib/layout/store";
import { cn } from "@/lib/utils/cn";

interface TopbarProps {
  shortcuts?: NavItem[];
  name: string;
  subtitle: string;
  profileHref: string;
  settingsHref: string;
  onLogout: () => void | Promise<void>;
}

const ICON_BUTTON =
  "size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

/**
 * Barre du haut. À gauche, le bouton qui réduit la barre latérale à ses icônes
 * (ou ouvre le menu sur mobile), puis les raccourcis vers les pages les plus
 * utilisées ; à droite, le thème et le menu du profil.
 *
 * Les raccourcis apparaissent dès la tablette : en icônes (libellé en
 * infobulle et pour les lecteurs d'écran), avec leur libellé sur grand écran.
 * Sur mobile la place manque, le tiroir du menu fait le travail.
 */
export function Topbar({ shortcuts = [], name, subtitle, profileHref, settingsHref, onLogout }: TopbarProps) {
  const pathname = usePathname();
  const collapsed = useLayoutStore((state) => state.collapsed);
  const toggleCollapsed = useLayoutStore((state) => state.toggleCollapsed);
  const setMobileOpen = useLayoutStore((state) => state.setMobileOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu" className={`${ICON_BUTTON} inline-flex md:hidden`}>
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

        {shortcuts.length > 0 && (
          <nav aria-label="Raccourcis" className="ml-2 hidden items-center gap-0.5 border-l border-border pl-3 md:flex">
            {shortcuts.map((item) => {
              const active = isNavItemActive(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                    active ? "bg-primary/10 text-primary" : "text-muted hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu name={name} subtitle={subtitle} profileHref={profileHref} settingsHref={settingsHref} onLogout={onLogout} />
      </div>
    </header>
  );
}
