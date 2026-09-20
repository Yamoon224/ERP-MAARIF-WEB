import { isAxiosError } from "axios";
import type { ApiError } from "@/lib/api/types";

/** Message lisible a partir d'une erreur Axios, avec repli pour les pannes reseau. */
export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue. Veuillez reessayer."): string {
  if (isAxiosError<ApiError>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
}
