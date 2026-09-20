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
    items: [{ href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    label: "Élèves & classes",
    items: [
      { href: "/admissions", label: "Admissions", icon: UserPlus, permission: "admissions.view" },
      { href: "/eleves", label: "Élèves", icon: GraduationCap, permission: "students.view" },
      { href: "/classes", label: "Classes", icon: School, permission: "academics.view" },
    ],
  },
  {
    label: "Pédagogie",
    items: [
      { href: "/matieres", label: "Matières", icon: BookOpen, permission: "academics.view" },
      { href: "/trimestres", label: "Trimestres", icon: CalendarRange, permission: "academics.view" },
      { href: "/notes", label: "Notes", icon: NotebookPen, permission: "grades.manage" },
      { href: "/resultats", label: "Résultats", icon: Award, permission: "results.view" },
    ],
  },
  {
    label: "Vie scolaire",
    items: [
      { href: "/presences", label: "Présences", icon: ClipboardCheck, permission: "attendance.manage" },
      { href: "/absences", label: "Absences", icon: UserX, permission: "attendance.manage" },
      { href: "/discipline/convocations", label: "Convocations", icon: Megaphone, permission: "discipline.manage" },
      { href: "/discipline/sanctions", label: "Sanctions", icon: ShieldAlert, permission: "discipline.manage" },
    ],
  },
  {
    label: "Comptabilité",
    items: [
      { href: "/comptabilite", label: "Vue d'ensemble", icon: Wallet, permission: "accounting.view", exact: true },
      { href: "/comptabilite/paiements", label: "Paiements", icon: HandCoins, permission: "accounting.view" },
      { href: "/comptabilite/impayes", label: "Impayés", icon: TriangleAlert, permission: "accounting.view" },
      { href: "/comptabilite/frais", label: "Frais de scolarité", icon: Banknote, permission: "accounting.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/utilisateurs", label: "Utilisateurs", icon: Users, permission: "users.manage" },
      { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications.view" },
    ],
  },
];

export const PARENT_NAV: NavGroup[] = [
  {
    label: "Général",
    items: [{ href: "/portail", label: "Accueil", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Suivi scolaire",
    items: [
      { href: "/portail/bulletin", label: "Bulletin", icon: NotebookPen },
      { href: "/portail/resultats", label: "Résultats", icon: Award },
      { href: "/portail/presences", label: "Présences", icon: ClipboardCheck },
      { href: "/portail/convocations", label: "Convocations", icon: Megaphone },
      { href: "/portail/sanctions", label: "Sanctions", icon: ShieldAlert },
    ],
  },
  {
    label: "Scolarité",
    items: [{ href: "/portail/scolarite", label: "Frais de scolarité", icon: Wallet }],
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
