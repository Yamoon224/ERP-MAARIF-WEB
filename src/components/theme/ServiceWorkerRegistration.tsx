"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker qui rend l'appli installable (PWA) et sert
 * une page hors-ligne minimale en cas de perte de connexion.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Echec silencieux : l'appli reste fonctionnelle sans le service worker.
    });
  }, []);

  return null;
}
