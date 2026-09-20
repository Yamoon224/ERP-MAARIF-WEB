"use client";

import { Monitor, Moon, PanelLeftClose, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useLayoutStore } from "@/lib/layout/store";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme/theme";
import { useTheme } from "@/lib/theme/useTheme";
import { cn } from "@/lib/utils/cn";

const THEME_ICONS: Record<ThemePreference, typeof Sun> = { light: Sun, "blue-dark": Moon, system: Monitor };

/** Préférences d'affichage, communes au personnel et aux parents : thème et barre latérale. */
export function SettingsView() {
  const { preference, setPreference } = useTheme();
  const collapsed = useLayoutStore((state) => state.collapsed);
  const setCollapsed = useLayoutStore((state) => state.setCollapsed);

  return (
    <div>
      <PageHeader title="Paramètres" description="Ces préférences sont enregistrées sur cet appareil." />

      <div className="max-w-3xl space-y-6">
        <Card accent="primary">
          <CardHeader>
            <CardTitle>Thème</CardTitle>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label="Thème de l'application" className="grid gap-3 sm:grid-cols-3">
              {THEME_OPTIONS.map((option) => {
                const Icon = THEME_ICONS[option.value];
                const selected = preference === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPreference(option.value)}
                    className={cn(
                      "rounded-md border px-4 py-3 text-left transition-colors",
                      selected ? "border-primary bg-primary/10" : "border-border hover:bg-foreground/5",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Icon className="size-4" aria-hidden="true" /> {option.label}
                    </span>
                    <span className="mt-1 block text-xs text-muted">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card accent="primary">
          <CardHeader>
            <CardTitle>Barre latérale</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={collapsed}
                onChange={(event) => setCollapsed(event.target.checked)}
                className="mt-0.5 size-4 rounded border-border"
              />
              <span className="text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <PanelLeftClose className="size-4" aria-hidden="true" /> Réduire la barre latérale à ses icônes
                </span>
                <span className="mt-0.5 block text-muted">
                  Vous pouvez aussi la réduire à tout moment avec le bouton à gauche de la barre du haut.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
