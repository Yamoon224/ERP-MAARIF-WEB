"use client";

import { type ReactNode } from "react";
import { ConfigBar } from "@/components/layout/ConfigBar";
import { HorizontalNav } from "@/components/layout/HorizontalNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar, type TopbarNotifications } from "@/components/layout/Topbar";
import { shortcutItems, type NavGroup } from "@/components/layout/nav";
import { useAppearanceStore } from "@/lib/appearance/store";

interface AppShellProps {
  groups: NavGroup[];
  /** URL des pages proposées en raccourci dans la barre du haut (celles non autorisées sont ignorées). */
  shortcutHrefs?: string[];
  /** Cloche de notifications de la barre du haut ; absente = pas de cloche. */
  notifications?: TopbarNotifications;
  /** Sous-titre du logo : "Espace personnel", "Espace parent". */
  brandSubtitle: string;
  user: { name: string; subtitle: string };
  profileHref: string;
  settingsHref: string;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}

/**
 * Charpente commune aux deux espaces (personnel et parent) : barre latérale à
 * gauche, barre du haut et contenu à droite. `min-w-0` laisse un tableau large
 * défiler dans sa propre zone au lieu d'élargir toute la page.
 */
export function AppShell({ groups, shortcutHrefs = [], notifications, brandSubtitle, user, profileHref, settingsHref, onLogout, children }: AppShellProps) {
  const horizontal = useAppearanceStore((state) => state.navLayout) === "horizontal";

  return (
    <div className="flex min-h-screen">
      <Sidebar groups={groups} brandSubtitle={brandSubtitle} profile={{ ...user, href: profileHref, settingsHref, onLogout }} horizontal={horizontal} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          horizontal={horizontal}
          brandSubtitle={brandSubtitle}
          shortcuts={shortcutItems(groups, shortcutHrefs)}
          notifications={notifications}
          name={user.name}
          subtitle={user.subtitle}
          profileHref={profileHref}
          settingsHref={settingsHref}
          onLogout={onLogout}
        />
        {horizontal && <HorizontalNav groups={groups} />}
        <main className="flex-1 bg-background p-4 md:p-6">{children}</main>
      </div>
      <ConfigBar />
    </div>
  );
}
