import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { StaffUser, StudentAccount } from "@/lib/api/types";

export type ActorType = "staff" | "parent";
export type AuthUser = StaffUser | StudentAccount;

interface AuthState {
  token: string | null;
  actorType: ActorType | null;
  user: AuthUser | null;
  /** "Se souvenir de moi" : la session survit à la fermeture du navigateur. */
  remember: boolean;
  setSession: (token: string, actorType: ActorType, user: AuthUser, remember?: boolean) => void;
  clear: () => void;
}

/**
 * Où ranger la session : le stockage local (survit à la fermeture du
 * navigateur) si "Se souvenir de moi" est coché, celui de l'onglet sinon. La
 * lecture regarde les deux, l'écriture n'en garde qu'un : sans cela, une
 * session ordinaire ouverte après une session retenue laisserait l'ancien
 * jeton traîner dans le stockage local.
 */
const sessionStorageChoice: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(name) ?? window.sessionStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;

    const { state } = JSON.parse(value) as { state: { remember?: boolean } };
    const [keep, drop] =
      state.remember === false ? [window.sessionStorage, window.localStorage] : [window.localStorage, window.sessionStorage];

    keep.setItem(name, value);
    drop.removeItem(name);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
    window.sessionStorage.removeItem(name);
  },
};

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
      remember: true,
      // Retenue par défaut : les appels qui n'ont pas de case à cocher gardent le comportement d'origine.
      setSession: (token, actorType, user, remember = true) => set({ token, actorType, user, remember }),
      clear: () => set({ token: null, actorType: null, user: null, remember: true }),
    }),
    { name: "erp-maarif-auth", storage: createJSONStorage(() => sessionStorageChoice) },
  ),
);
