import {
  Award,
  Banknote,
  BookOpen,
  Bell,
  CalendarRange,
  ClipboardCheck,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  Megaphone,
  NotebookPen,
  School,
  ShieldAlert,
  TriangleAlert,
  UserPlus,
  UserX,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";
import type { StaffUser } from "@/lib/api/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  /** Actif seulement sur cette URL exacte (ex. la page d'accueil d'une section qui a des sous-pages). */
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Menu du personnel, regroupé par domaine : ce qui va dans le même sens
 * (structure, pédagogie, vie scolaire, argent, administration) est côte à côte.
 */
export const STAFF_NAV: NavGroup[] = [
  {
    label: "Général",
    items: [{ href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    label: "Élèves & classes",
    items: [
      { href: "/admissions", label: "Admissions", icon: UserPlus, permission: "admissions.view" },
      { href: "/students", label: "Élèves", icon: GraduationCap, permission: "students.view" },
      { href: "/classes", label: "Classes", icon: School, permission: "academics.view" },
    ],
  },
  {
    label: "Pédagogie",
    items: [
      { href: "/subjects", label: "Matières", icon: BookOpen, permission: "academics.view" },
      { href: "/terms", label: "Trimestres", icon: CalendarRange, permission: "academics.view" },
      { href: "/grades", label: "Notes", icon: NotebookPen, permission: "grades.manage" },
      { href: "/results", label: "Résultats", icon: Award, permission: "results.view" },
    ],
  },
  {
    label: "Vie scolaire",
    items: [
      { href: "/attendance", label: "Présences", icon: ClipboardCheck, permission: "attendance.manage" },
      { href: "/absences", label: "Absences", icon: UserX, permission: "attendance.manage" },
      { href: "/discipline/summons", label: "Convocations", icon: Megaphone, permission: "discipline.manage" },
      { href: "/discipline/sanctions", label: "Sanctions", icon: ShieldAlert, permission: "discipline.manage" },
    ],
  },
  {
    label: "Comptabilité",
    items: [
      { href: "/accounting", label: "Vue d'ensemble", icon: Wallet, permission: "accounting.view", exact: true },
      { href: "/accounting/payments", label: "Paiements", icon: HandCoins, permission: "accounting.view" },
      { href: "/accounting/unpaid", label: "Impayés", icon: TriangleAlert, permission: "accounting.view" },
      { href: "/accounting/fees", label: "Frais de scolarité", icon: Banknote, permission: "accounting.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "Utilisateurs", icon: Users, permission: "users.manage" },
      { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications.view" },
    ],
  },
];

export const PARENT_NAV: NavGroup[] = [
  {
    label: "Général",
    items: [{ href: "/portal", label: "Accueil", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Suivi scolaire",
    items: [
      { href: "/portal/report-card", label: "Bulletin", icon: NotebookPen },
      { href: "/portal/results", label: "Résultats", icon: Award },
      { href: "/portal/attendance", label: "Présences", icon: ClipboardCheck },
      { href: "/portal/summons", label: "Convocations", icon: Megaphone },
      { href: "/portal/sanctions", label: "Sanctions", icon: ShieldAlert },
    ],
  },
  {
    label: "Scolarité",
    items: [{ href: "/portal/tuition", label: "Frais de scolarité", icon: Wallet }],
  },
];

/** Ne garde que les entrées autorisées, et les groupes qu'il en reste quelque chose. */
export function visibleGroups(groups: NavGroup[], user: StaffUser | null): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(user, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
