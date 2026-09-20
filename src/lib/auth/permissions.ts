import type { StaffUser } from "@/lib/api/types";

export function hasPermission(user: StaffUser | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false;
}
