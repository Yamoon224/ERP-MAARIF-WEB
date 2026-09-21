"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronsUpDown, CircleUser, LogOut, Settings, User } from "lucide-react";
import { useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils/cn";

interface UserMenuProps {
  /**
   * `topbar` : icône ronde dont le menu s'ouvre vers le bas, aligné à droite.
   * `sidebar` : profil épinglé en bas de la barre latérale, dont le menu s'ouvre vers le haut.
   */
  variant?: "topbar" | "sidebar";
  /** Barre latérale réduite à ses icônes : seul l'avatar reste, et le menu s'ouvre à droite de la barre. */
  collapsed?: boolean;
  name: string;
  subtitle: string;
  profileHref: string;
  settingsHref: string;
  onLogout: () => void | Promise<void>;
}

const ITEM_CLASS =
  "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-none";

/**
 * Menu du profil : Profil, Paramètres, Déconnexion. Le même menu s'ouvre depuis l'icône de la barre du haut
 * et depuis le profil épinglé en bas de la barre latérale ; seuls le déclencheur et le sens d'ouverture changent.
 */
export function UserMenu({ variant = "topbar", collapsed = false, name, subtitle, profileHref, settingsHref, onLogout }: UserMenuProps) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    containerRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function close({ restoreFocus = false } = {}) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close({ restoreFocus: true });
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    const items = Array.from(containerRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  const isSidebar = variant === "sidebar";

  return (
    <div ref={containerRef} className="relative">
      {isSidebar ? (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`${t("Menu du profil")} : ${name}`}
          title={collapsed ? `${name} — ${t("Menu du profil")}` : undefined}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex w-full items-center rounded-md py-2 text-left transition-colors hover:bg-foreground/5",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
            collapsed ? "justify-center px-0" : "gap-3 px-2",
            open && "bg-foreground/5",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-primary">
            <User className="size-5" aria-hidden="true" />
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                <span className="block truncate text-xs text-muted">{subtitle}</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden="true" />
            </>
          )}
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t("Menu du profil")}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors",
            "hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
            open && "bg-foreground/5 text-foreground",
          )}
        >
          <CircleUser className="size-6" aria-hidden="true" />
        </button>
      )}

      {open && (
        <div
          role="menu"
          aria-label={t("Profil")}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute z-50 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg",
            !isSidebar && "right-0 mt-2 w-60",
            // Vers le haut, puisque le profil est collé au bas de l'écran ; à droite de la barre quand elle est réduite.
            isSidebar && !collapsed && "bottom-full left-0 mb-2 w-full min-w-56",
            isSidebar && collapsed && "bottom-0 left-full ml-3 w-60",
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>

          <Link role="menuitem" href={profileHref} onClick={() => close()} className={ITEM_CLASS}>
            <User className="size-4 text-muted" aria-hidden="true" /> {t("Profil")}
          </Link>
          <Link role="menuitem" href={settingsHref} onClick={() => close()} className={ITEM_CLASS}>
            <Settings className="size-4 text-muted" aria-hidden="true" /> {t("Paramètres")}
          </Link>

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              void onLogout();
            }}
            className={cn(ITEM_CLASS, "text-danger")}
          >
            <LogOut className="size-4" aria-hidden="true" /> {t("Déconnexion")}
          </button>
        </div>
      )}
    </div>
  );
}
