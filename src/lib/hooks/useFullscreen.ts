"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Plein écran de la page entière. `isSupported` est faux quand le navigateur ou le contexte l'interdit (certains
 * navigateurs mobiles) : l'interface grise alors la commande plutôt que de la laisser sans effet.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement !== null && document.fullscreenElement !== undefined);

    setIsSupported(Boolean(document.fullscreenEnabled));
    sync();
    document.addEventListener("fullscreenchange", sync);

    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Refusé par le navigateur (pas de geste de l'utilisateur, politique du site) : rien à faire de plus.
    }
  }, []);

  return { isFullscreen, isSupported, toggle };
}
