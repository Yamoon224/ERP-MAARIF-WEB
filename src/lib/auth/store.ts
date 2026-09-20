import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StaffUser, StudentAccount } from "@/lib/api/types";

export type ActorType = "staff" | "parent";
export type AuthUser = StaffUser | StudentAccount;

interface AuthState {
  token: string | null;
  actorType: ActorType | null;
  user: AuthUser | null;
  setSession: (token: string, actorType: ActorType, user: AuthUser) => void;
  clear: () => void;
}

/**
 * Session unique pour les deux publics de l'application (personnel et
 * parents) : `actorType` distingue lequel est connecte, ce qui evite de
 * dupliquer la logique de stockage du jeton pour chaque portail.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      actorType: null,
      user: null,
      setSession: (token, actorType, user) => set({ token, actorType, user }),
      clear: () => set({ token: null, actorType: null, user: null }),
    }),
    { name: "erp-maarif-auth" },
  ),
);
