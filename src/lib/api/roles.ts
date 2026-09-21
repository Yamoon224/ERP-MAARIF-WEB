import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse, Permission, Role } from "@/lib/api/types";

export interface RoleListParams {
  search?: string;
  sort?: "name" | "permissions_count" | "users_count" | "created_at";
  direction?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export async function listRoles(params: RoleListParams = {}) {
  const { data } = await apiClient.get<PaginatedResponse<Role>>("/roles", { params });
  return data;
}

/** Le rôle avec la liste de ses permissions. */
export async function getRole(id: string) {
  const { data } = await apiClient.get<{ data: Role }>(`/roles/${id}`);
  return data.data;
}

export async function createRole(payload: { name: string; permissions?: string[] }) {
  const { data } = await apiClient.post<{ data: Role }>("/roles", payload);
  return data.data;
}

export async function updateRole(id: string, payload: { name: string }) {
  const { data } = await apiClient.put<{ data: Role }>(`/roles/${id}`, payload);
  return data.data;
}

export async function deleteRole(id: string) {
  await apiClient.delete(`/roles/${id}`);
}

/** Catalogue de toutes les permissions existantes. */
export async function listPermissions() {
  const { data } = await apiClient.get<{ data: Permission[] }>("/permissions");
  return data.data;
}

/** Remplace toutes les permissions du rôle par cette liste. */
export async function syncRolePermissions(id: string, permissions: string[]) {
  const { data } = await apiClient.put<{ data: Role }>(`/roles/${id}/permissions`, { permissions });
  return data.data;
}

/** Ajoute ces permissions au rôle, sans toucher à celles qu'il a déjà. */
export async function grantRolePermissions(id: string, permissions: string[]) {
  const { data } = await apiClient.post<{ data: Role }>(`/roles/${id}/permissions`, { permissions });
  return data.data;
}

/** Retire une permission au rôle. */
export async function revokeRolePermission(roleId: string, permissionId: string) {
  const { data } = await apiClient.delete<{ data: Role }>(`/roles/${roleId}/permissions/${permissionId}`);
  return data.data;
}
