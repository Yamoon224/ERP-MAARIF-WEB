"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/auth/store";
import { parentLogout } from "@/lib/api/auth";
import type { StudentAccount } from "@/lib/api/types";

export function ParentTopbar() {
  const router = useRouter();
  const student = useAuthStore((state) => state.user as StudentAccount | null);
  const clear = useAuthStore((state) => state.clear);

  async function handleLogout() {
    try {
      await parentLogout();
    } finally {
      clear();
      router.replace("/portail/connexion");
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            {student?.first_name} {student?.last_name}
          </p>
          <p className="text-xs text-muted">{student?.matricule}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          Deconnexion
        </Button>
      </div>
    </header>
  );
}
