/**
 * Themes de l'application : "light" et "blue-dark" (sombre a dominante bleue).
 *
 * La preference stockee peut aussi valoir "system" (defaut, comme avant l'ajout
 * du selecteur) : le theme suit alors celui du systeme d'exploitation.
 */
export type Theme = "light" | "blue-dark";
export type ThemePreference = Theme | "system";

export const THEME_STORAGE_KEY = "erp-maarif-theme";

export const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string; description: string }> = [
  { value: "light", label: "Light", description: "Fond clair, idéal en pleine lumière." },
  { value: "blue-dark", label: "Blue Dark", description: "Fond bleu nuit, plus reposant le soir." },
  { value: "system", label: "Automatique", description: "Suit le thème de votre appareil." },
];

/** Toute valeur inconnue (stockage corrompu, ancienne version) retombe sur "system". */
export function parsePreference(raw: string | null | undefined): ThemePreference {
  return raw === "light" || raw === "blue-dark" ? raw : "system";
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): Theme {
  if (preference === "system") return prefersDark ? "blue-dark" : "light";
  return preference;
}

/**
 * Script execute dans <head> avant le premier rendu : pose `data-theme` pour
 * que la page ne s'affiche jamais un instant dans le mauvais theme.
 * Doit rester equivalent a parsePreference + resolveTheme ci-dessus.
 */
export const NO_FLASH_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=p==="light"||p==="blue-dark"?p:(d?"blue-dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
