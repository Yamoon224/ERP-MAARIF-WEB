import { useCallback, useEffect, useState } from "react";
import type { PaginatedResponse } from "@/lib/api/types";

/**
 * Charge une ressource paginee et l'actualise a chaque changement de
 * dependance (page, recherche, filtres...). Centralise l'etat de chargement
 * et le repli sur une liste vide en cas d'erreur, pour que chaque page de
 * liste (eleves, notes, presences...) n'ait qu'a fournir sa fonction d'appel.
 */
export function usePaginatedResource<T>(
  fetcher: () => Promise<PaginatedResponse<T>>,
  deps: unknown[],
) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<T>["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    fetcher()
      .then((response) => {
        if (isCancelled) return;
        setData(response.data);
        setMeta(response.meta);
      })
      .catch(() => {
        if (isCancelled) return;
        setError("Impossible de charger les donnees.");
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  return { data, meta, isLoading, error, reload };
}
