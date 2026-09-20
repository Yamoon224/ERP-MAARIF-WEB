import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse, SchoolClass, Subject, Term } from "@/lib/api/types";

// --- Classes -----------------------------------------------------------

export async function listSchoolClasses(params: { search?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<SchoolClass>>("/classes", { params });
  return data;
}

export async function createSchoolClass(payload: { name: string; level: string; academic_year: string; main_teacher_id?: string | null }) {
  const { data } = await apiClient.post<{ data: SchoolClass }>("/classes", payload);
  return data.data;
}

export async function updateSchoolClass(id: string, payload: Partial<{ name: string; level: string; academic_year: string; main_teacher_id: string | null }>) {
  const { data } = await apiClient.put<{ data: SchoolClass }>(`/classes/${id}`, payload);
  return data.data;
}

export async function deleteSchoolClass(id: string) {
  await apiClient.delete(`/classes/${id}`);
}

// --- Matieres ------------------------------------------------------------

export async function listSubjects(params: { search?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Subject>>("/subjects", { params });
  return data;
}

export async function createSubject(payload: { name: string; code: string; coefficient: number }) {
  const { data } = await apiClient.post<{ data: Subject }>("/subjects", payload);
  return data.data;
}

export async function updateSubject(id: string, payload: Partial<{ name: string; code: string; coefficient: number }>) {
  const { data } = await apiClient.put<{ data: Subject }>(`/subjects/${id}`, payload);
  return data.data;
}

export async function deleteSubject(id: string) {
  await apiClient.delete(`/subjects/${id}`);
}

// --- Trimestres ----------------------------------------------------------

export async function listAllTerms() {
  const { data } = await apiClient.get<{ data: Term[] }>("/terms");
  return data.data;
}

export async function listTermsPaginated(params: { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Term>>("/terms/paginated", { params });
  return data;
}

export async function createTerm(payload: { name: string; academic_year: string; starts_at: string; ends_at: string; is_current?: boolean }) {
  const { data } = await apiClient.post<{ data: Term }>("/terms", payload);
  return data.data;
}

export async function updateTerm(id: string, payload: Partial<{ name: string; academic_year: string; starts_at: string; ends_at: string; is_current: boolean }>) {
  const { data } = await apiClient.put<{ data: Term }>(`/terms/${id}`, payload);
  return data.data;
}

export async function deleteTerm(id: string) {
  await apiClient.delete(`/terms/${id}`);
}
