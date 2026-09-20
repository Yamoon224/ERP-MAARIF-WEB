"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  THEME_STORAGE_KEY,
  parsePreference,
  resolveTheme,
  type Theme,
  type ThemePreference,
} from "@/lib/theme/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const media = typeof window.matchMedia === "function" ? window.matchMedia(DARK_QUERY) : null;
  media?.addEventListener("change", listener);
  // Un autre onglet change le theme : celui-ci le suit.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    media?.removeEventListener("change", listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readPreference(): ThemePreference {
  try {
    return parsePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    // Stockage indisponible (navigation privee, politique du navigateur) : theme systeme.
    return "system";
  }
}

function readPrefersDark(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(DARK_QUERY).matches;
}

/** Pose le theme sur <html> ; appele par le selecteur et par ThemeSync. */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function setThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Non persistant : le theme reste applique pour cette session.
  }

  applyTheme(resolveTheme(preference, readPrefersDark()));
  notify();
}

/**
 * Preference de theme et theme effectif. Lu via useSyncExternalStore : le
 * rendu serveur suppose "system"/"light", et le client se re-synchronise
 * sans avertissement d'hydratation.
 */
export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as ThemePreference);
  const prefersDark = useSyncExternalStore(subscribe, readPrefersDark, () => false);
  const theme = resolveTheme(preference, prefersDark);

  const toggle = useCallback(() => {
    setThemePreference(resolveTheme(readPreference(), readPrefersDark()) === "light" ? "blue-dark" : "light");
  }, []);

  return { preference, theme, setPreference: setThemePreference, toggle };
}
