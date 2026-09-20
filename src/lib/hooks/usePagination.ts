import { useState } from "react";

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 30, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Etat de pagination (page courante + nombre d'elements par page) partage par
 * toutes les pages de liste. Changer la taille de page revient a la page 1, et
 * `resetKey` (recherche, eleve selectionne...) fait de meme quand il change.
 */
export function usePagination(resetKey?: unknown) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState<number>(DEFAULT_PAGE_SIZE);
  const [previousResetKey, setPreviousResetKey] = useState(resetKey);

  if (previousResetKey !== resetKey) {
    setPreviousResetKey(resetKey);
    setPage(1);
  }

  function setPerPage(value: number) {
    setPerPageState(value);
    setPage(1);
  }

  return { page, perPage, setPage, setPerPage };
}
