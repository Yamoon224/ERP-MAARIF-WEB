import { EN_MESSAGES } from "@/lib/i18n/messages.en";

/** Langues de l'interface. Le français est la langue source : chaque texte de l'application est écrit en français. */
export type Locale = "fr" | "en";

export const LOCALES: ReadonlyArray<{ value: Locale; label: string; /** Attribut `lang` de <html>. */ htmlLang: string }> = [
  { value: "fr", label: "Français", htmlLang: "fr" },
  { value: "en", label: "English (US)", htmlLang: "en-US" },
];

export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: unknown): value is Locale {
  return value === "fr" || value === "en";
}

const DICTIONARIES: Record<Locale, Readonly<Record<string, string>>> = { fr: {}, en: EN_MESSAGES };

/**
 * Traduit un texte écrit en français : la phrase française est elle-même la clé, ce qui laisse chaque écran lisible
 * tel quel et fait retomber sur le français tout texte qui n'a pas (encore) de traduction. `{nom}` est remplacé
 * par `params.nom`.
 */
export function translate(locale: Locale, text: string, params?: Record<string, string | number>): string {
  const translated = DICTIONARIES[locale][text] ?? text;

  if (!params) return translated;

  return translated.replace(/\{(\w+)\}/g, (placeholder, name: string) => (name in params ? String(params[name]) : placeholder));
}
