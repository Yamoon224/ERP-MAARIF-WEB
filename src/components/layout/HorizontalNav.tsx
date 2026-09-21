"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { isNavItemActive, type NavGroup } from "@/components/layout/nav";
import { useT } from "@/lib/i18n/store";
import { cn } from "@/lib/utils/cn";

const TRIGGER =
  "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

/**
 * Menu en barre horizontale (disposition « horizontale » du panneau de configuration), à la place de la barre
 * latérale. Une entrée seule reste un lien direct ; un groupe devient un menu déroulant. Réservé aux écrans
 * larges : sur mobile, le tiroir de la barre latérale fait le travail.
 */
export function HorizontalNav({ groups }: { groups: NavGroup[] }) {
  const { t } = useT();
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);

  // Naviguer referme le menu ouvert.
  useEffect(() => {
    setOpenGroup(null);
  }, [pathname]);

  useEffect(() => {
    if (!openGroup) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenGroup(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openGroup]);

  return (
    <nav
      ref={barRef}
      aria-label={t("Navigation principale")}
      className="region-sidebar sticky top-16 z-20 hidden border-b border-border px-4 md:block md:px-6"
    >
      <ul className="flex flex-wrap items-center gap-1 py-1.5">
        {groups.map((group) => {
          const groupActive = group.items.some((item) => isNavItemActive(pathname, item));

          if (group.items.length === 1) {
            const item = group.items[0];
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item);

            return (
              <li key={group.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(TRIGGER, active ? "bg-brand-soft text-primary" : "text-muted hover:bg-foreground/5 hover:text-foreground")}
                >
                  <Icon className="size-4" aria-hidden="true" /> {t(item.label)}
                </Link>
              </li>
            );
          }

          const isOpen = openGroup === group.label;

          return (
            <li key={group.label} className="relative">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => setOpenGroup(isOpen ? null : group.label)}
                className={cn(
                  TRIGGER,
                  groupActive ? "bg-brand-soft text-primary" : "text-muted hover:bg-foreground/5 hover:text-foreground",
                  isOpen && "bg-foreground/5",
                )}
              >
                {t(group.label)}
                <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
              </button>

              {isOpen && (
                <ul
                  aria-label={t(group.label)}
                  className="absolute top-full left-0 z-50 mt-1 min-w-52 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg"
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isNavItemActive(pathname, item);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-none",
                            active ? "font-medium text-primary" : "text-foreground",
                          )}
                        >
                          <Icon className="size-4 text-muted" aria-hidden="true" /> {t(item.label)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
