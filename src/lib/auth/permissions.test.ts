import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/auth/permissions";
import type { StaffUser } from "@/lib/api/types";

function buildUser(permissions: string[]): StaffUser {
  return {
    id: "1",
    name: "Admin Maarif",
    email: "admin@maarif.test",
    phone: null,
    type: "staff",
    roles: ["admin"],
    permissions,
  };
}

describe("hasPermission", () => {
  it("returns true when the user holds the permission", () => {
    expect(hasPermission(buildUser(["students.manage"]), "students.manage")).toBe(true);
  });

  it("returns false when the user does not hold the permission", () => {
    expect(hasPermission(buildUser(["students.view"]), "students.manage")).toBe(false);
  });

  it("returns false when there is no authenticated user", () => {
    expect(hasPermission(null, "students.manage")).toBe(false);
  });
});
