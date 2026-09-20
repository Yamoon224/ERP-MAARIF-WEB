"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleUser, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface UserMenuProps {
  name: string;
  subtitle: string;
  profileHref: string;
  settingsHref: string;
  onLogout: () => void | Promise<void>;
}

const ITEM_CLASS =
  "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-none";

/** Icône de profil dans la barre du haut, avec un menu : Profil, Paramètres, Déconnexion. */
export function UserMenu({ name, subtitle, profileHref, settingsHref, onLogout }: UserMenuProps) {
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

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu du profil"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors",
          "hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
          open && "bg-foreground/5 text-foreground",
        )}
      >
        <CircleUser className="size-6" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profil"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>

          <Link role="menuitem" href={profileHref} onClick={() => close()} className={ITEM_CLASS}>
            <User className="size-4 text-muted" aria-hidden="true" /> Profil
          </Link>
          <Link role="menuitem" href={settingsHref} onClick={() => close()} className={ITEM_CLASS}>
            <Settings className="size-4 text-muted" aria-hidden="true" /> Paramètres
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
            <LogOut className="size-4" aria-hidden="true" /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
