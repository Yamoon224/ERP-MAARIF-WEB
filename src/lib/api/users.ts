import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse, StaffUser } from "@/lib/api/types";

export interface UserListParams {
  search?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface UserPayload {
  name: string;
  email: string;
  phone?: string | null;
  password?: string;
  roles: string[];
  is_active?: boolean;
}

export async function listUsers(params: UserListParams) {
  const { data } = await apiClient.get<PaginatedResponse<StaffUser>>("/users", { params });
  return data;
}

export async function createUser(payload: UserPayload) {
  const { data } = await apiClient.post<{ data: StaffUser }>("/users", payload);
  return data.data;
}

export async function updateUser(id: string, payload: Partial<UserPayload>) {
  const { data } = await apiClient.put<{ data: StaffUser }>(`/users/${id}`, payload);
  return data.data;
}

/** Nouveau mot de passe d'un compte, choisi par un administrateur. Les sessions du compte sont fermées. */
export async function resetUserPassword(id: string, payload: { password: string; password_confirmation: string }) {
  await apiClient.post(`/users/${id}/reset-password`, payload);
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/users/${id}`);
}
