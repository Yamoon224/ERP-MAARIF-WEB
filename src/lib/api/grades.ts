import { apiClient } from "@/lib/api/client";
import type { Bulletin, Grade, GradeType, PaginatedResponse, PeriodParams } from "@/lib/api/types";

export interface GradeListParams extends PeriodParams {
  student_id?: string;
  subject_id?: string;
  school_class_id?: string;
  type?: GradeType;
  page?: number;
  per_page?: number;
}

export interface GradePayload {
  student_id: string;
  subject_id: string;
  term_id: string;
  type: GradeType;
  label?: string | null;
  value: number;
  max_value: number;
  recorded_at: string;
  comment?: string | null;
}

export async function listGrades(params: GradeListParams) {
  const { data } = await apiClient.get<PaginatedResponse<Grade>>("/grades", { params });
  return data;
}

export async function createGrade(payload: GradePayload) {
  const { data } = await apiClient.post<{ data: Grade }>("/grades", payload);
  return data.data;
}

export async function updateGrade(id: string, payload: Partial<GradePayload>) {
  const { data } = await apiClient.put<{ data: Grade }>(`/grades/${id}`, payload);
  return data.data;
}

export async function deleteGrade(id: string) {
  await apiClient.delete(`/grades/${id}`);
}

export async function getStudentBulletin(studentId: string, termId?: string) {
  const { data } = await apiClient.get<{ data: Bulletin }>(`/students/${studentId}/bulletin`, {
    params: termId ? { term_id: termId } : undefined,
  });
  return data.data;
}

export async function getMyBulletin(termId?: string) {
  const { data } = await apiClient.get<{ data: Bulletin }>("/parent/bulletin", {
    params: termId ? { term_id: termId } : undefined,
  });
  return data.data;
}
