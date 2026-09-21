/**
 * Palettes de la couleur principale (le bleu de la marque) et fonds personnalisables des barres.
 *
 * Ce module ne dépend de rien et ses fonctions `applyAppearance` et `toneOf` sont sérialisées telles quelles dans
 * le script d'avant-rendu (voir APPEARANCE_SCRIPT) : elles doivent rester autonomes (aucune référence à un autre
 * symbole du module).
 */

export type AccentId = "blue" | "indigo" | "violet" | "rose" | "red" | "orange" | "amber" | "emerald" | "teal" | "cyan" | "slate";
export type NavLayout = "vertical" | "horizontal";
/** Zones dont le fond se règle : haut de la barre latérale (logo), barre du haut, barre latérale. */
export type BackgroundRegion = "sidebarHeader" | "topbar" | "sidebar";

export interface AppearanceState {
  accent: AccentId;
  navLayout: NavLayout;
  sidebarHeaderBg: string | null;
  topbarBg: string | null;
  sidebarBg: string | null;
}

export const DEFAULT_APPEARANCE: AppearanceState = {
  accent: "blue",
  navLayout: "vertical",
  sidebarHeaderBg: null,
  topbarBg: null,
  sidebarBg: null,
};

export const APPEARANCE_STORAGE_KEY = "erp-maarif-appearance";

/** Nuances d'une couleur : `main` porte le texte blanc des boutons, `hover` le assombrit, `deep` ouvre le dégradé. */
interface Shades {
  deep: string;
  hover: string;
  main: string;
  s500: string;
  s400: string;
  s300: string;
  s200: string;
  /** Presque blanc, teinté : fin du dégradé en thème clair. */
  end: string;
}

const SHADES: Record<AccentId, Shades> = {
  blue: { deep: "#1e40af", hover: "#1d4ed8", main: "#2563eb", s500: "#3b82f6", s400: "#60a5fa", s300: "#93c5fd", s200: "#bfdbfe", end: "#eaf2ff" },
  indigo: { deep: "#3730a3", hover: "#3730a3", main: "#4f46e5", s500: "#6366f1", s400: "#818cf8", s300: "#a5b4fc", s200: "#c7d2fe", end: "#eef0ff" },
  violet: { deep: "#5b21b6", hover: "#6d28d9", main: "#7c3aed", s500: "#8b5cf6", s400: "#a78bfa", s300: "#c4b5fd", s200: "#ddd6fe", end: "#f5f0ff" },
  rose: { deep: "#9f1239", hover: "#be123c", main: "#e11d48", s500: "#f43f5e", s400: "#fb7185", s300: "#fda4af", s200: "#fecdd3", end: "#fff0f2" },
  red: { deep: "#991b1b", hover: "#b91c1c", main: "#dc2626", s500: "#ef4444", s400: "#f87171", s300: "#fca5a5", s200: "#fecaca", end: "#fef1f1" },
  orange: { deep: "#9a3412", hover: "#9a3412", main: "#c2410c", s500: "#f97316", s400: "#fb923c", s300: "#fdba74", s200: "#fed7aa", end: "#fff5ea" },
  amber: { deep: "#92400e", hover: "#92400e", main: "#b45309", s500: "#f59e0b", s400: "#fbbf24", s300: "#fcd34d", s200: "#fde68a", end: "#fffaea" },
  emerald: { deep: "#065f46", hover: "#065f46", main: "#047857", s500: "#10b981", s400: "#34d399", s300: "#6ee7b7", s200: "#a7f3d0", end: "#ecfdf5" },
  teal: { deep: "#115e59", hover: "#115e59", main: "#0f766e", s500: "#14b8a6", s400: "#2dd4bf", s300: "#5eead4", s200: "#99f6e4", end: "#effcfa" },
  cyan: { deep: "#155e75", hover: "#155e75", main: "#0e7490", s500: "#06b6d4", s400: "#22d3ee", s300: "#67e8f9", s200: "#a5f3fc", end: "#ecfcff" },
  slate: { deep: "#1e293b", hover: "#334155", main: "#475569", s500: "#64748b", s400: "#94a3b8", s300: "#cbd5e1", s200: "#e2e8f0", end: "#f1f5f9" },
};

/** Libellés en français (traduits à l'affichage). */
export const ACCENT_OPTIONS: ReadonlyArray<{ id: AccentId; label: string; swatch: string }> = (
  [
    ["blue", "Bleu"],
    ["indigo", "Indigo"],
    ["violet", "Violet"],
    ["rose", "Rose"],
    ["red", "Rouge"],
    ["orange", "Orange"],
    ["amber", "Ambre"],
    ["emerald", "Émeraude"],
    ["teal", "Sarcelle"],
    ["cyan", "Cyan"],
    ["slate", "Ardoise"],
  ] as const
).map(([id, label]) => ({ id, label, swatch: SHADES[id].main }));

export function isAccentId(value: unknown): value is AccentId {
  return typeof value === "string" && value in SHADES;
}

export type AccentTokens = Record<"--primary" | "--primary-hover" | "--grad-1" | "--grad-2" | "--grad-3" | "--grad-end", string>;

/**
 * Jetons de couleur de chaque palette, par thème. Le clair part d'un bleu profond vers un blanc teinté ; le sombre
 * est éclairci pour garder le contraste (comme le Blue Dark d'origine).
 */
export const ACCENT_TOKENS: Record<AccentId, { light: AccentTokens; "blue-dark": AccentTokens }> = Object.fromEntries(
  (Object.keys(SHADES) as AccentId[]).map((id) => {
    const s = SHADES[id];

    return [
      id,
      {
        light: { "--primary": s.main, "--primary-hover": s.hover, "--grad-1": s.deep, "--grad-2": s.main, "--grad-3": s.s400, "--grad-end": s.end },
        "blue-dark": { "--primary": s.s400, "--primary-hover": s.s300, "--grad-1": s.s500, "--grad-2": s.s400, "--grad-3": s.s200, "--grad-end": "#ffffff" },
      },
    ];
  }),
) as Record<AccentId, { light: AccentTokens; "blue-dark": AccentTokens }>;

/** Fonds proposés d'un clic ; `Défaut` (aucun) rend la barre au thème. */
export const BACKGROUND_PRESETS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Blanc", value: "#ffffff" },
  { label: "Gris clair", value: "#f1f5f9" },
  { label: "Bleu ciel", value: "#dbeafe" },
  { label: "Bleu nuit", value: "#0f1e3d" },
  { label: "Ardoise", value: "#1e293b" },
  { label: "Noir", value: "#0b0f19" },
  { label: "Vert forêt", value: "#064e3b" },
  { label: "Bordeaux", value: "#7f1d1d" },
];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Couleur `#rrggbb` valide (minuscules), sinon `null` : jamais autre chose dans une variable CSS. */
export function sanitizeColor(value: unknown): string | null {
  return typeof value === "string" && HEX_COLOR.test(value) ? value.toLowerCase() : null;
}

/**
 * `dark` si le texte doit être clair sur ce fond, `light` sinon (luminance relative WCAG, seuil 0,4 : au-dessus,
 * du texte foncé garde un meilleur contraste que du blanc). Autonome : sérialisée dans le script d'avant-rendu.
 */
export function toneOf(color: string): "light" | "dark" {
  const channel = (start: number) => {
    const value = parseInt(color.slice(start, start + 2), 16) / 255;

    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5) < 0.4 ? "dark" : "light";
}

/**
 * Pose l'apparence sur <html> : jetons de la palette (retirés pour le bleu d'origine, que la feuille de style
 * porte déjà), fonds des barres et `data-tone-*` qui règle la couleur du texte sur chaque fond (voir globals.css).
 * Autonome : sérialisée dans le script d'avant-rendu, qui l'exécute avant le premier affichage.
 */
export function applyAppearance(
  root: HTMLElement,
  state: Partial<AppearanceState>,
  theme: string,
  tokens: Record<string, Record<string, Record<string, string>>>,
  tone: (color: string) => string,
): void {
  const style = root.style;
  const names = ["--primary", "--primary-hover", "--grad-1", "--grad-2", "--grad-3", "--grad-end"];
  const accent = state.accent && state.accent !== "blue" ? tokens[state.accent] : undefined;
  const palette = accent ? accent[theme === "blue-dark" ? "blue-dark" : "light"] : undefined;

  for (const name of names) {
    if (palette && palette[name]) style.setProperty(name, palette[name]);
    else style.removeProperty(name);
  }

  const regions: Array<[string, string, string | null | undefined]> = [
    ["sidebar-header", "--sidebar-header-bg", state.sidebarHeaderBg],
    ["topbar", "--topbar-bg", state.topbarBg],
    ["sidebar", "--sidebar-bg", state.sidebarBg],
  ];

  for (const [region, property, color] of regions) {
    if (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)) {
      style.setProperty(property, color);
      root.setAttribute("data-tone-" + region, tone(color));
    } else {
      style.removeProperty(property);
      root.removeAttribute("data-tone-" + region);
    }
  }
}

/**
 * Script exécuté dans <head> avant le premier rendu (après NO_FLASH_SCRIPT, qui pose `data-theme`) : la couleur
 * choisie et les fonds des barres sont là dès le premier affichage, sans passage par le bleu d'origine.
 */
export const APPEARANCE_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)});if(!raw)return;var state=(JSON.parse(raw)||{}).state||{};var apply=${applyAppearance.toString()};var tone=${toneOf.toString()};apply(document.documentElement,state,document.documentElement.getAttribute("data-theme")||"light",${JSON.stringify(ACCENT_TOKENS)},tone);}catch(e){}})();`;
