import { apiClient } from "@/lib/api/client";
import type { NotificationLog, NotificationSummary, PaginatedResponse } from "@/lib/api/types";

export interface NotificationLogParams {
  search?: string;
  type?: NotificationLog["type"];
  channel?: NotificationLog["channel"];
  status?: NotificationLog["status"];
  student_id?: string;
  page?: number;
  per_page?: number;
}

/** Journal des messages envoyés aux tuteurs, du plus récent au plus ancien. */
export async function listNotificationLogs(params: NotificationLogParams) {
  const { data } = await apiClient.get<PaginatedResponse<NotificationLog>>("/notification-logs", { params });
  return data;
}

/** Compteurs par statut, sur les mêmes filtres que la liste sauf le statut. */
export async function getNotificationSummary(params: Omit<NotificationLogParams, "status" | "page" | "per_page">) {
  const { data } = await apiClient.get<{ data: NotificationSummary }>("/notification-logs/summary", { params });
  return data.data;
}

/**
 * Renvoie un message en échec. Le contact du tuteur est relu à ce moment : un
 * numéro corrigé depuis l'échec est pris en compte. La réponse dit si le renvoi
 * a abouti (`sent`) ou a échoué de nouveau (`failed`).
 */
export async function resendNotification(id: string) {
  const { data } = await apiClient.post<{ data: NotificationLog }>(`/notification-logs/${id}/resend`);
  return data.data;
}
