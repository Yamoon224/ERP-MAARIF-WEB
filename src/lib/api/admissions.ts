import { apiClient } from "@/lib/api/client";
import type { Admission, AdmissionEnrollment, AdmissionStatus, AdmissionSummary, PaginatedResponse } from "@/lib/api/types";

export interface AdmissionListParams {
  search?: string;
  status?: AdmissionStatus;
  academic_year?: string;
  page?: number;
  per_page?: number;
}

export interface AdmissionPayload {
  academic_year: string;
  level: string;
  first_name: string;
  last_name: string;
  gender: "M" | "F";
  birth_date?: string | null;
  previous_school?: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export async function listAdmissions(params: AdmissionListParams) {
  const { data } = await apiClient.get<PaginatedResponse<Admission>>("/admissions", { params });
  return data;
}

export async function getAdmissionSummary(academicYear?: string) {
  const { data } = await apiClient.get<{ data: AdmissionSummary }>("/admissions/summary", {
    params: { academic_year: academicYear },
  });
  return data.data;
}

export async function getAdmission(id: string) {
  const { data } = await apiClient.get<{ data: Admission }>(`/admissions/${id}`);
  return data.data;
}

export async function createAdmission(payload: AdmissionPayload) {
  const { data } = await apiClient.post<{ data: Admission }>("/admissions", payload);
  return data.data;
}

export async function deleteAdmission(id: string) {
  await apiClient.delete(`/admissions/${id}`);
}

/** Instruit le dossier. Un refus doit être motivé (`note`). */
export async function changeAdmissionStatus(id: string, status: Exclude<AdmissionStatus, "pending" | "enrolled">, note?: string) {
  const { data } = await apiClient.post<{ data: Admission }>(`/admissions/${id}/status`, { status, note: note || null });
  return data.data;
}

/** Transforme une candidature admise en élève inscrit dans la classe choisie. */
export async function enrollAdmission(id: string, schoolClassId: string) {
  const { data } = await apiClient.post<{ data: AdmissionEnrollment }>(`/admissions/${id}/enroll`, {
    school_class_id: schoolClassId,
  });
  return data.data;
}
