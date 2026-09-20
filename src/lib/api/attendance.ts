import { apiClient } from "@/lib/api/client";
import type { AttendanceRecord, AttendanceStatus, PaginatedResponse } from "@/lib/api/types";

export interface AttendanceListParams {
  student_id?: string;
  status?: AttendanceStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface AttendancePayload {
  student_id: string;
  date: string;
  status: AttendanceStatus;
  justified?: boolean;
  reason?: string | null;
}

export async function listAttendance(params: AttendanceListParams) {
  const { data } = await apiClient.get<PaginatedResponse<AttendanceRecord>>("/attendance-records", { params });
  return data;
}

export async function recordAttendance(payload: AttendancePayload) {
  const { data } = await apiClient.post<{ data: AttendanceRecord }>("/attendance-records", payload);
  return data.data;
}

export async function updateAttendance(id: string, payload: Partial<AttendancePayload>) {
  const { data } = await apiClient.put<{ data: AttendanceRecord }>(`/attendance-records/${id}`, payload);
  return data.data;
}

export async function deleteAttendance(id: string) {
  await apiClient.delete(`/attendance-records/${id}`);
}

export async function listMyAttendance(params: { status?: AttendanceStatus; date_from?: string; date_to?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<AttendanceRecord>>("/parent/attendance", { params });
  return data;
}
