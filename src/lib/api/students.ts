import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse, Student } from "@/lib/api/types";

export interface StudentListParams {
  search?: string;
  school_class_id?: string;
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
