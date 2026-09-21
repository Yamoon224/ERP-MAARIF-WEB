"use client";

import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils/cn";

type Tone = "danger" | "warning" | "success" | "info" | "neutral";

export interface NotificationItem {
  id: string;
  title: string;
  detail?: string;
  /** Date-heure ISO, affichée en heure locale. */
  at?: string;
  tone: Tone;
  href?: string;
}

/** Ce que la cloche affiche : les derniers événements, et combien demandent une action. */
export interface NotificationFeed {
  items: NotificationItem[];
  /** Nombre d'éléments à traiter (échecs d'envoi, paiements à vérifier, convocations...) : c'est la pastille rouge. */
  attention: number;
}

interface NotificationBellProps {
  load: () => Promise<NotificationFeed>;
  /** Lien « Voir tout » en bas du panneau. */
  footer?: { href: string; label: string };
  /** Délai entre deux actualisations (ms). */
  refreshMs?: number;
}

const TONE_DOT: Record<Tone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
  info: "bg-brand",
  neutral: "bg-muted",
};

function formatWhen(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Cloche de la barre du haut : une pastille indique ce qui demande une action,
 * et le panneau liste les derniers événements. Le contenu vient de `load`,
 * propre à chaque espace (personnel, parent) et à ses droits. Une panne de
 * l'API laisse la cloche telle quelle : elle ne doit jamais gêner la page.
 */
export function NotificationBell({ load, footer, refreshMs = 60_000 }: NotificationBellProps) {
  const { t } = useT();
  const [feed, setFeed] = useState<NotificationFeed>({ items: [], attention: 0 });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const refresh = useCallback(() => {
    load()
      .then(setFeed)
      .catch(() => undefined);
  }, [load]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, refreshMs);

    return () => window.clearInterval(timer);
  }, [refresh, refreshMs]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  function toggle() {
    if (!open) refresh();
    setOpen((current) => !current);
  }

  const label = feed.attention > 0 ? t("Notifications, {count} à traiter", { count: feed.attention }) : t("Notifications");

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        title={t("Notifications")}
        onClick={toggle}
        className={cn(
          "relative inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors",
          "hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
          open && "bg-foreground/5 text-foreground",
        )}
      >
        <Bell className="size-5" aria-hidden="true" />
        {feed.attention > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 font-semibold text-primary-foreground ring-2 ring-surface"
          >
            {feed.attention > 9 ? "9+" : feed.attention}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={t("Notifications")}
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-border bg-surface shadow-lg sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{t("Notifications")}</p>
            {feed.attention > 0 && <span className="text-xs font-medium text-danger">{feed.attention} à traiter</span>}
          </div>

          {feed.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">{t("Rien de nouveau pour le moment.")}</p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {feed.items.map((item) => {
                const content = (
                  <>
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", TONE_DOT[item.tone])} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                      {item.detail && <span className="block truncate text-xs text-muted">{item.detail}</span>}
                      {item.at && <span className="mt-0.5 block text-xs text-muted">{formatWhen(item.at)}</span>}
                    </span>
                  </>
                );
                const itemClass = "flex items-start gap-3 px-4 py-3 text-left";

                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} onClick={() => setOpen(false)} className={cn(itemClass, "hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-none")}>
                        {content}
                      </Link>
                    ) : (
                      <div className={itemClass}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {footer && (
            <Link
              href={footer.href}
              onClick={() => setOpen(false)}
              className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-none"
            >
              {footer.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
