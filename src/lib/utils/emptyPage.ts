import type { PaginatedResponse } from "@/lib/api/types";

/** Page vide, rendue tant qu'un filtre n'est pas prêt : la liste s'affiche sans requête inutile. */
export function emptyPage<T>(perPage = 10): PaginatedResponse<T> {
  return { data: [], meta: { current_page: 1, last_page: 1, per_page: perPage, total: 0 } };
}
