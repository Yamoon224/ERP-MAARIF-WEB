"use client";

import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  id: string;
  label: string;
  /** Petit compteur affiché à côté du libellé. */
  count?: number | null;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  /** Préfixe des identifiants ARIA : relie chaque onglet à son panneau (`${idPrefix}-panel-${id}`). */
  idPrefix: string;
  className?: string;
}

/** Onglets accessibles : flèches gauche/droite, Début et Fin déplacent la sélection. */
export function Tabs({ tabs, active, onChange, idPrefix, className }: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;

    event.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div role="tablist" aria-label="Sections" className={cn("flex gap-1 overflow-x-auto border-b border-border", className)}>
      {tabs.map((tab, index) => {
        const isActive = tab.id === active;

        return (
          <button
            key={tab.id}
            ref={(element) => {
              refs.current[tab.id] = element;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors",
              // Le trait de l'onglet actif est un pseudo-élément : une bordure ne peut pas porter de dégradé.
              isActive
                ? "text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand after:content-['']"
                : "text-muted hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count !== null && (
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Panneau associé à un onglet (`Tabs` avec le même `idPrefix`). */
export function TabPanel({ idPrefix, id, active, children }: { idPrefix: string; id: string; active: string; children: ReactNode }) {
  if (id !== active) return null;

  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} className="pt-5">
      {children}
    </div>
  );
}
