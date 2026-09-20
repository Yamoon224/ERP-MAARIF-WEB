"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, NotebookPen, ClipboardCheck, Megaphone, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/portail", label: "Accueil", icon: LayoutDashboard },
  { href: "/portail/bulletin", label: "Bulletin", icon: NotebookPen },
  { href: "/portail/presences", label: "Presences", icon: ClipboardCheck },
  { href: "/portail/convocations", label: "Convocations", icon: Megaphone },
  { href: "/portail/sanctions", label: "Sanctions", icon: ShieldAlert },
];

export function ParentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex h-16 items-center px-6 text-lg font-semibold text-foreground">Espace parent</div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
