import { apiClient } from "@/lib/api/client";
import type { Enrollment, PaginatedResponse, Student } from "@/lib/api/types";

export interface StudentListParams {
  search?: string;
  school_class_id?: string;
  /** Élèves inscrits pour cette année scolaire (`2025-2026`). */
  academic_year?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface StudentPayload {
  first_name: string;
  last_name: string;
  gender: "M" | "F";
  birth_date?: string | null;
  school_class_id?: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string | null;
  address?: string | null;
}

export async function listStudents(params: StudentListParams) {
  const { data } = await apiClient.get<PaginatedResponse<Student>>("/students", { params });
  return data;
}

export async function getStudent(id: string) {
  const { data } = await apiClient.get<{ data: Student }>(`/students/${id}`);
  return data.data;
}

export async function createStudent(payload: StudentPayload) {
  const { data } = await apiClient.post<{ data: Student & { initial_password: string } }>("/students", payload);
  return data.data;
}

export async function updateStudent(id: string, payload: Partial<StudentPayload & { is_active: boolean }>) {
  const { data } = await apiClient.put<{ data: Student }>(`/students/${id}`, payload);
  return data.data;
}

export async function deleteStudent(id: string) {
  await apiClient.delete(`/students/${id}`);
}

export async function resetStudentPassword(id: string) {
  const { data } = await apiClient.post<{ data: { initial_password: string } }>(`/students/${id}/reset-password`);
  return data.data;
}

/** Historique d'inscriptions de l'élève, année la plus récente en premier. */
export async function listEnrollments(studentId: string) {
  const { data } = await apiClient.get<{ data: Enrollment[] }>(`/students/${studentId}/enrollments`);
  return data.data;
}

/** Réinscrit l'élève dans une classe (nouvelle année scolaire, ou changement de classe). */
export async function enrollStudent(studentId: string, schoolClassId: string) {
  const { data } = await apiClient.post<{ data: Enrollment }>(`/students/${studentId}/enrollments`, {
    school_class_id: schoolClassId,
  });
  return data.data;
}
