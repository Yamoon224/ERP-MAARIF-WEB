"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { Check, PanelLeft, PanelTop, RotateCcw, X } from "lucide-react";
import { Flag } from "@/components/ui/Flag";
import { ACCENT_OPTIONS, BACKGROUND_PRESETS, DEFAULT_APPEARANCE, toneOf, type BackgroundRegion } from "@/lib/appearance/palettes";
import { useAppearanceStore } from "@/lib/appearance/store";
import { useFullscreen } from "@/lib/hooks/useFullscreen";
import { useLocaleStore, useT } from "@/lib/i18n/store";
import { LOCALES } from "@/lib/i18n/translate";
import { useLayoutStore } from "@/lib/layout/store";
import { THEME_OPTIONS } from "@/lib/theme/theme";
import { useTheme } from "@/lib/theme/useTheme";
import { cn } from "@/lib/utils/cn";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border px-5 py-4 last:border-b-0">
      <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}

/** Interrupteur : un bouton `role="switch"` plutôt qu'une case, pour un réglage qui s'applique aussitôt. */
function Switch({ label, description, checked, onChange, disabled }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label id={id} className={cn("text-sm font-medium text-foreground", disabled && "opacity-60")}>
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-labelledby={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-foreground/15",
        )}
      >
        <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}

const REGIONS: ReadonlyArray<{ region: BackgroundRegion; label: string; field: "sidebarHeaderBg" | "topbarBg" | "sidebarBg"; verticalOnly?: boolean }> = [
  { region: "sidebarHeader", label: "Haut de la barre latérale", field: "sidebarHeaderBg", verticalOnly: true },
  { region: "topbar", label: "Barre du haut", field: "topbarBg" },
  { region: "sidebar", label: "Barre latérale", field: "sidebarBg" },
];

/** Choix du fond d'une zone : quelques couleurs d'un clic, une couleur libre, ou le retour au thème. */
function BackgroundPicker({ label, value, onChange }: { label: string; value: string | null; onChange: (color: string | null) => void }) {
  const { t } = useT();

  return (
    <div role="group" aria-label={label} className="mb-4 last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
            value === null ? "bg-brand-soft text-primary" : "text-muted hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          {t("Défaut")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {BACKGROUND_PRESETS.map((preset) => {
          const selected = value === preset.value;

          return (
            <button
              key={preset.value}
              type="button"
              title={t(preset.label)}
              aria-label={`${label} : ${t(preset.label)}`}
              aria-pressed={selected}
              onClick={() => onChange(preset.value)}
              style={{ backgroundColor: preset.value }}
              className={cn(
                "flex size-7 items-center justify-center rounded-full border border-black/20 transition-transform hover:scale-110",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                selected && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
              )}
            >
              {selected && <Check className={cn("size-3.5", toneOf(preset.value) === "dark" ? "text-white" : "text-black")} aria-hidden="true" />}
            </button>
          );
        })}

        <label className="relative inline-flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-muted text-xs text-muted hover:text-foreground">
          <span aria-hidden="true">+</span>
          <input
            type="color"
            aria-label={`${label} : ${t("couleur personnalisée")}`}
            value={value ?? "#ffffff"}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Panneau de configuration de l'application, à droite (ouvert par la roue crantée de la barre du haut) : couleur
 * principale, disposition du menu, fonds des barres, thème, plein écran et langue. Chaque réglage s'applique
 * aussitôt, page visible derrière, et se mémorise sur l'appareil.
 */
export function ConfigBar() {
  const { t, locale } = useT();
  const open = useLayoutStore((state) => state.configOpen);
  const setOpen = useLayoutStore((state) => state.setConfigOpen);
  const collapsed = useLayoutStore((state) => state.collapsed);
  const setCollapsed = useLayoutStore((state) => state.setCollapsed);
  const appearance = useAppearanceStore();
  const setLocale = useLocaleStore((state) => state.setLocale);
  const { preference, setPreference } = useTheme();
  const { isFullscreen, isSupported, toggle: toggleFullscreen } = useFullscreen();
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();

  const horizontal = appearance.navLayout === "horizontal";
  const isDefault =
    !collapsed &&
    (Object.keys(DEFAULT_APPEARANCE) as Array<keyof typeof DEFAULT_APPEARANCE>).every((key) => appearance[key] === DEFAULT_APPEARANCE[key]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Fond à peine teinté : les changements restent visibles derrière le panneau. */}
      <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} aria-hidden="true" />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-96 max-w-[92vw] flex-col border-l border-border bg-surface shadow-xl focus:outline-none"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              {t("Configuration")}
            </h2>
            <p className="mt-1 text-xs text-muted">{t("Enregistrée sur cet appareil.")}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("Fermer la configuration")}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Section title={t("Couleur principale")}>
            <div role="radiogroup" aria-label={t("Couleur principale")} className="grid grid-cols-6 gap-2.5">
              {ACCENT_OPTIONS.map((option) => {
                const selected = appearance.accent === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={t(option.label)}
                    title={t(option.label)}
                    onClick={() => appearance.setAccent(option.id)}
                    style={{ backgroundColor: option.swatch }}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full transition-transform hover:scale-110",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      selected && "ring-2 ring-foreground ring-offset-2 ring-offset-surface",
                    )}
                  >
                    {selected && <Check className="size-4 text-white" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title={t("Menu de navigation")}>
            <div role="radiogroup" aria-label={t("Disposition du menu")} className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "vertical", label: "Menu latéral", icon: PanelLeft },
                  { value: "horizontal", label: "Menu horizontal", icon: PanelTop },
                ] as const
              ).map((option) => {
                const selected = appearance.navLayout === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => appearance.setNavLayout(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-md border px-3 py-3 text-sm font-medium text-foreground transition-colors",
                      selected ? "selected-brand" : "border-border hover:bg-foreground/5",
                    )}
                  >
                    <option.icon className="size-6" aria-hidden="true" />
                    {t(option.label)}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <Switch
                label={t("Réduire la barre latérale")}
                description={horizontal ? t("Sans effet avec la barre horizontale.") : t("Ne garde que les icônes.")}
                checked={collapsed}
                disabled={horizontal}
                onChange={setCollapsed}
              />
            </div>
          </Section>

          <Section title={t("Arrière-plans")}>
            {REGIONS.filter((entry) => !(horizontal && entry.verticalOnly)).map((entry) => (
              <BackgroundPicker
                key={entry.region}
                label={t(entry.label)}
                value={appearance[entry.field]}
                onChange={(color) => appearance.setBackground(entry.region, color)}
              />
            ))}
          </Section>

          <Section title={t("Thème")}>
            <div role="radiogroup" aria-label={t("Thème de l'application")} className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={preference === option.value}
                  onClick={() => setPreference(option.value)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-xs font-medium text-foreground transition-colors",
                    preference === option.value ? "selected-brand" : "border-border hover:bg-foreground/5",
                  )}
                >
                  {t(option.label)}
                </button>
              ))}
            </div>
          </Section>

          <Section title={t("Affichage")}>
            <Switch
              label={t("Plein écran")}
              description={isSupported ? undefined : t("Non disponible sur ce navigateur.")}
              checked={isFullscreen}
              disabled={!isSupported}
              onChange={() => void toggleFullscreen()}
            />
          </Section>

          <Section title={t("Langue")}>
            <div role="radiogroup" aria-label={t("Langue")} className="grid grid-cols-2 gap-3">
              {LOCALES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={locale === option.value}
                  onClick={() => setLocale(option.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium text-foreground transition-colors",
                    locale === option.value ? "selected-brand" : "border-border hover:bg-foreground/5",
                  )}
                >
                  <Flag locale={option.value} />
                  {option.label}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={() => {
              appearance.reset();
              setCollapsed(false);
            }}
            disabled={isDefault}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> {t("Réinitialiser l'apparence")}
          </button>
        </footer>
      </aside>
    </div>
  );
}
