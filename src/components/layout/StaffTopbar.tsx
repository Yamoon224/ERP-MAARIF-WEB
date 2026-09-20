"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/auth/store";
import { staffLogout } from "@/lib/api/auth";
import type { StaffUser } from "@/lib/api/types";

export function StaffTopbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user as StaffUser | null);
  const clear = useAuthStore((state) => state.clear);

  async function handleLogout() {
    try {
      await staffLogout();
    } finally {
      clear();
      router.replace("/connexion");
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{user?.name}</p>
          <p className="text-xs text-muted">{user?.roles.join(", ")}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          Deconnexion
        </Button>
      </div>
    </header>
  );
}
