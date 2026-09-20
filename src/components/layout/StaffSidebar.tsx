"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  CalendarRange,
  NotebookPen,
  ClipboardCheck,
  Megaphone,
  ShieldAlert,
  Users,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/lib/auth/store";
import { hasPermission } from "@/lib/auth/permissions";
import type { StaffUser } from "@/lib/api/types";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/eleves", label: "Eleves", icon: GraduationCap, permission: "students.view" },
  { href: "/notes", label: "Notes", icon: NotebookPen, permission: "grades.manage" },
  { href: "/presences", label: "Presences", icon: ClipboardCheck, permission: "attendance.manage" },
  { href: "/discipline/convocations", label: "Convocations", icon: Megaphone, permission: "discipline.manage" },
  { href: "/discipline/sanctions", label: "Sanctions", icon: ShieldAlert, permission: "discipline.manage" },
  { href: "/classes", label: "Classes", icon: School, permission: "academics.view" },
  { href: "/matieres", label: "Matieres", icon: BookOpen, permission: "academics.view" },
  { href: "/trimestres", label: "Trimestres", icon: CalendarRange, permission: "academics.view" },
  { href: "/utilisateurs", label: "Utilisateurs", icon: Users, permission: "users.manage" },
];

export function StaffSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user as StaffUser | null);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex h-16 items-center px-6 text-lg font-semibold text-foreground">
        ERP Maarif
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.filter((item) => !item.permission || hasPermission(user, item.permission)).map((item) => {
          const isActive = pathname.startsWith(item.href);
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
