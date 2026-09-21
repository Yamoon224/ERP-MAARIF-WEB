"use client";

import { type ReactNode, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { STAFF_NAV, STAFF_SHORTCUTS, visibleGroups } from "@/components/layout/nav";
import { loadStaffFeed } from "@/components/layout/notificationSources";
import { staffLogout } from "@/lib/api/auth";
import type { StaffUser } from "@/lib/api/types";
import { formatRoles } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";

/** Espace du personnel : menu filtré par permissions, profil et déconnexion du compte connecté. */
export function StaffShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user as StaffUser | null);
  const clear = useAuthStore((state) => state.clear);

  async function handleLogout() {
    try {
      await staffLogout();
    } finally {
      clear();
      router.replace("/login");
    }
  }

  const load = useCallback(() => loadStaffFeed(user), [user]);
  // « Voir tout » mène au journal des messages, ou à défaut aux paiements (compte comptable).
  const notifications = useMemo(
    () => ({
      load,
      footer: hasPermission(user, "notifications.view")
        ? { href: "/notifications", label: "Voir toutes les notifications" }
        : hasPermission(user, "accounting.view")
          ? { href: "/accounting/payments", label: "Voir les paiements" }
          : undefined,
    }),
    [load, user],
  );

  return (
    <AppShell
      notifications={notifications}
      groups={visibleGroups(STAFF_NAV, user)}
      shortcutHrefs={STAFF_SHORTCUTS}
      brandSubtitle="Espace personnel"
      user={{ name: user?.name ?? "Utilisateur", subtitle: formatRoles(user?.roles) }}
      profileHref="/profile"
      settingsHref="/settings"
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}
