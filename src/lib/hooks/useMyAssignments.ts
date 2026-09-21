import { useEffect, useState } from "react";
import { listMyAssignments } from "@/lib/api/academics";
import type { TeachingAssignment } from "@/lib/api/types";

/**
 * Ce que l'utilisateur connecté enseigne. `null` tant que la réponse n'est pas
 * arrivée (ou quand `enabled` est faux : un administrateur n'est limité par
 * aucune affectation, inutile de les charger).
 */
export function useMyAssignments(enabled = true) {
  const [assignments, setAssignments] = useState<TeachingAssignment[] | null>(null);

  useEffect(() => {
    if (!enabled) return;

    listMyAssignments()
      .then(setAssignments)
      .catch(() => setAssignments([]));
  }, [enabled]);

  return enabled ? assignments : null;
}
