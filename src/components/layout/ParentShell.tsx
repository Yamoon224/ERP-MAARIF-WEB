"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PARENT_NAV, visibleGroups } from "@/components/layout/nav";
import { parentLogout } from "@/lib/api/auth";
import type { StudentAccount } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";

/** Portail parent : suivi de l'élève dont le matricule a servi à la connexion. */
export function ParentShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const student = useAuthStore((state) => state.user as StudentAccount | null);
  const clear = useAuthStore((state) => state.clear);

  async function handleLogout() {
    try {
      await parentLogout();
    } finally {
      clear();
      router.replace("/portal/login");
    }
  }

  return (
    <AppShell
      groups={visibleGroups(PARENT_NAV, null)}
      brandSubtitle="Espace parent"
      user={{
        name: student ? `${student.first_name} ${student.last_name}` : "Élève",
        subtitle: student?.matricule ?? "",
      }}
      profileHref="/portal/profile"
      settingsHref="/portal/settings"
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}
