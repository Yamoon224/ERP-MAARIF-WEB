import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse, Sanction, SanctionType, Summon } from "@/lib/api/types";

// --- Convocations --------------------------------------------------------

export interface SummonPayload {
  student_id: string;
  reason: string;
  scheduled_at: string;
  location?: string | null;
}

export async function listSummons(params: { student_id?: string; status?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Summon>>("/summons", { params });
  return data;
}

export async function createSummon(payload: SummonPayload) {
  const { data } = await apiClient.post<{ data: Summon }>("/summons", payload);
  return data.data;
}

export async function updateSummon(id: string, payload: Partial<SummonPayload & { status: string }>) {
  const { data } = await apiClient.put<{ data: Summon }>(`/summons/${id}`, payload);
  return data.data;
}

export async function deleteSummon(id: string) {
  await apiClient.delete(`/summons/${id}`);
}

export async function listMySummons(params: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Summon>>("/parent/summons", { params });
  return data;
}

// --- Sanctions -------------------------------------------------------------

export interface SanctionPayload {
  student_id: string;
  type: SanctionType;
  reason: string;
  start_date: string;
  end_date?: string | null;
}

export async function listSanctions(params: { student_id?: string; type?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Sanction>>("/sanctions", { params });
  return data;
}

export async function createSanction(payload: SanctionPayload) {
  const { data } = await apiClient.post<{ data: Sanction }>("/sanctions", payload);
  return data.data;
}

export async function updateSanction(id: string, payload: Partial<SanctionPayload>) {
  const { data } = await apiClient.put<{ data: Sanction }>(`/sanctions/${id}`, payload);
  return data.data;
}

export async function deleteSanction(id: string) {
  await apiClient.delete(`/sanctions/${id}`);
}

export async function listMySanctions(params: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Sanction>>("/parent/sanctions", { params });
  return data;
}
