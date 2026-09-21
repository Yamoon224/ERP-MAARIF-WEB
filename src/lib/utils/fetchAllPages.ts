import type { PaginatedResponse } from "@/lib/api/types";

const EXPORT_PAGE_SIZE = 100;
/** Garde-fou : 100 pages de 100 lignes suffisent a un export sans risquer une boucle sur une reponse incoherente. */
const MAX_PAGES = 100;

/**
 * Charge toutes les pages d'une liste paginee par le serveur, pour un export qui ne doit pas se limiter a la
 * page affichee. `fetchPage` recoit le numero de page et la taille de page a demander.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const first = await fetchPage(1, EXPORT_PAGE_SIZE);
  const rows = [...first.data];
  const lastPage = Math.min(first.meta.last_page, MAX_PAGES);

  for (let page = 2; page <= lastPage; page += 1) {
    rows.push(...(await fetchPage(page, EXPORT_PAGE_SIZE)).data);
  }

  return rows;
}
