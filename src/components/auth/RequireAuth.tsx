"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type ActorType } from "@/lib/auth/store";

interface RequireAuthProps {
  actorType: ActorType;
  redirectTo: string;
  children: ReactNode;
}

/**
 * Protege une section entiere (personnel ou portail parent) derriere une
 * session du bon type. Le rendu attend une verification cote client avant
 * d'afficher quoi que ce soit : sans cela, une page protegee s'afficherait un
 * instant avant la redirection, le temps que le store persiste se rehydrate.
 */
export function RequireAuth({ actorType, redirectTo, children }: RequireAuthProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const storedActorType = useAuthStore((state) => state.actorType);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // La session est lue dans le store au moment de l'effet, pas via les valeurs
    // du rendu : pendant l'hydratation, zustand ne rend que l'etat initial (sans
    // jeton) pour rester identique au HTML du serveur. Se fier a ces valeurs
    // renverrait vers la connexion, a chaque rechargement de page, un
    // utilisateur pourtant connecte (le jeton est bien dans le stockage local).
    const session = useAuthStore.getState();

    if (!session.token || session.actorType !== actorType) {
      router.replace(redirectTo);
      return;
    }

    setIsChecked(true);
  }, [token, storedActorType, actorType, redirectTo, router]);

  if (!isChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Chargement...
      </div>
    );
  }

  return <>{children}</>;
}
