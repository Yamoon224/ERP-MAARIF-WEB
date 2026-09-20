import { describe, expect, it } from "vitest";
import { PARENT_NAV, STAFF_NAV, isNavItemActive, visibleGroups } from "@/components/layout/nav";
import type { StaffUser } from "@/lib/api/types";

function staff(permissions: string[]): StaffUser {
  return { id: "1", name: "Test", email: "t@t.test", phone: null, type: "staff", roles: [], permissions };
}

const labels = (user: StaffUser) => visibleGroups(STAFF_NAV, user).map((group) => group.label);

describe("staff navigation", () => {
  it("groups the menu by domain", () => {
    expect(STAFF_NAV.map((group) => group.label)).toEqual([
      "Général",
      "Élèves & classes",
      "Pédagogie",
      "Vie scolaire",
      "Comptabilité",
      "Administration",
    ]);
  });

  it("never lists the same page twice", () => {
    const hrefs = STAFF_NAV.flatMap((group) => group.items.map((item) => item.href));

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("only shows an accountant the accounting group and what they may read", () => {
    const accountant = staff(["students.view", "academics.view", "accounting.view", "accounting.manage"]);

    expect(labels(accountant)).toEqual(["Général", "Élèves & classes", "Pédagogie", "Comptabilité"]);
    expect(visibleGroups(STAFF_NAV, accountant).find((group) => group.label === "Comptabilité")?.items).toHaveLength(4);
  });

  it("hides the discipline and accounting entries from a teacher", () => {
    const teacher = staff(["students.view", "academics.view", "grades.manage", "attendance.manage"]);
    const visible = visibleGroups(STAFF_NAV, teacher);
    const hrefs = visible.flatMap((group) => group.items.map((item) => item.href));

    expect(hrefs).toContain("/absences");
    expect(hrefs).not.toContain("/discipline/sanctions");
    expect(labels(teacher)).not.toContain("Comptabilité");
    expect(labels(teacher)).not.toContain("Administration");
  });

  it("drops a group once none of its entries is allowed", () => {
    expect(labels(staff([]))).toEqual(["Général"]);
  });
});

describe("parent navigation", () => {
  it("shows every entry without permission checks", () => {
    const items = PARENT_NAV.flatMap((group) => group.items);

    expect(items.some((item) => item.permission)).toBe(false);
    expect(visibleGroups(PARENT_NAV, null).flatMap((group) => group.items)).toHaveLength(items.length);
    expect(items.map((item) => item.href)).toEqual(expect.arrayContaining(["/portail/bulletin", "/portail/presences", "/portail/scolarite"]));
  });
});

describe("isNavItemActive", () => {
  const item = { href: "/comptabilite", label: "Vue d'ensemble", icon: STAFF_NAV[0].items[0].icon, exact: true };

  it("matches a section and its sub-pages", () => {
    expect(isNavItemActive("/eleves", { ...item, href: "/eleves", exact: false })).toBe(true);
    expect(isNavItemActive("/eleves/abc", { ...item, href: "/eleves", exact: false })).toBe(true);
  });

  it("does not confuse two pages sharing a prefix", () => {
    expect(isNavItemActive("/elevesX", { ...item, href: "/eleves", exact: false })).toBe(false);
  });

  it("keeps an exact entry from lighting up on its sub-pages", () => {
    expect(isNavItemActive("/comptabilite", item)).toBe(true);
    expect(isNavItemActive("/comptabilite/paiements", item)).toBe(false);
  });
});
