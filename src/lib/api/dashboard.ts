import { apiClient } from "@/lib/api/client";
import type { DashboardStats, PeriodParams } from "@/lib/api/types";

/** Indicateurs du tableau de bord sur la période choisie (année scolaire, trimestre ou mois). */
export async function getDashboardStats(params: PeriodParams) {
  const { data } = await apiClient.get<{ data: DashboardStats }>("/dashboard", { params });
  return data.data;
}
