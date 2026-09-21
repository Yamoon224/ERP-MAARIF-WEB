import { isAxiosError } from "axios";
import type { ApiError } from "@/lib/api/types";

/** Message lisible a partir d'une erreur Axios, avec repli pour les pannes reseau. */
export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue. Veuillez reessayer."): string {
  if (isAxiosError<ApiError>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
}

/** Erreurs de validation du serveur, une par champ (la première de chaque liste) : `{ email: "Cette adresse est déjà utilisée." }`. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError<ApiError>(error)) return {};

  return Object.fromEntries(
    Object.entries(error.response?.data?.errors ?? {}).flatMap(([field, messages]) => (messages[0] ? [[field, messages[0]]] : [])),
  );
}
