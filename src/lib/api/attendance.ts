import { apiClient } from "@/lib/api/client";
import type {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary,
  PaginatedResponse,
  PeriodParams,
  RollCallRow,
} from "@/lib/api/types";

export interface AttendanceListParams extends PeriodParams {
  student_id?: string;
  school_class_id?: string;
  status?: AttendanceStatus;
  /** 1 : justifiées, 0 : non justifiées (un booléen serait envoyé en "true"/"false", refusé par l'API). */
  justified?: 0 | 1;
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

export async function listMyAttendance(
  params: PeriodParams & { status?: AttendanceStatus; date_from?: string; date_to?: string; page?: number; per_page?: number },
) {
  const { data } = await apiClient.get<PaginatedResponse<AttendanceRecord>>("/parent/attendance", { params });
  return data;
}

/** Bilan des absences et retards sur la période filtrée. */
export async function getAttendanceSummary(params: Omit<AttendanceListParams, "page" | "per_page">) {
  const { data } = await apiClient.get<{ data: AttendanceSummary }>("/attendance-records/summary", { params });
  return data.data;
}

/** Feuille d'appel : élèves actifs de la classe avec leur pointage du jour. */
export async function getRollCall(schoolClassId: string, date: string) {
  const { data } = await apiClient.get<{ data: RollCallRow[] }>("/attendance-records/roll-call", {
    params: { school_class_id: schoolClassId, date },
  });
  return data.data;
}

export interface ClassAttendancePayload {
  school_class_id: string;
  date: string;
  records: Array<{ student_id: string; status: AttendanceStatus; justified?: boolean; reason?: string | null }>;
}

/** Enregistre l'appel d'une classe entière (tout ou rien). */
export async function recordClassAttendance(payload: ClassAttendancePayload) {
  const { data } = await apiClient.post<{ data: AttendanceRecord[] }>("/attendance-records/bulk", payload);
  return data.data;
}
