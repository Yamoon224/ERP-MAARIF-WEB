import type { StaffRole } from "@/lib/api/types";

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Administrateur",
  teacher: "Enseignant",
  accountant: "Comptable",
};

/** Libellé d'un rôle : traduit pour les rôles système, le nom lui-même pour un rôle créé par un administrateur. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role as StaffRole] ?? role;
}

/** "Administrateur, Enseignant" : rôles d'un compte du personnel, en français. */
export function formatRoles(roles: readonly string[] | undefined): string {
  if (!roles || roles.length === 0) return "Personnel";

  return roles.map(roleLabel).join(", ");
}
