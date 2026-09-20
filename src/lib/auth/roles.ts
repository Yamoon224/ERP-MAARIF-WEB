import type { StaffRole } from "@/lib/api/types";

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Administrateur",
  teacher: "Enseignant",
  accountant: "Comptable",
};

/** "Administrateur, Enseignant" : rôles d'un compte du personnel, en français. */
export function formatRoles(roles: readonly string[] | undefined): string {
  if (!roles || roles.length === 0) return "Personnel";

  return roles.map((role) => ROLE_LABELS[role as StaffRole] ?? role).join(", ");
}
