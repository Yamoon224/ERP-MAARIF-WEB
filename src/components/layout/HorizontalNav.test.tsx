import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HorizontalNav } from "@/components/layout/HorizontalNav";
import { STAFF_NAV, visibleGroups } from "@/components/layout/nav";
import { useLocaleStore } from "@/lib/i18n/store";
import type { StaffUser } from "@/lib/api/types";

const admin: StaffUser = {
  id: "1",
  name: "Admin",
  email: "a@maarif.test",
  phone: null,
  type: "staff",
  roles: ["admin"],
  permissions: ["students.view", "academics.view", "grades.manage", "attendance.manage", "discipline.manage", "accounting.view", "users.manage", "roles.manage"],
};

function renderBar(name = "Navigation principale") {
  render(<HorizontalNav groups={visibleGroups(STAFF_NAV, admin)} />);

  return screen.getByRole("navigation", { name });
}

describe("HorizontalNav", () => {
  beforeEach(() => useLocaleStore.setState({ locale: "fr" }));

  it("shows a lone entry as a direct link and each group as a dropdown", () => {
    const bar = renderBar();

    expect(within(bar).getByRole("link", { name: "Tableau de bord" })).toHaveAttribute("href", "/dashboard");
    for (const group of ["Élèves & classes", "Pédagogie", "Vie scolaire", "Comptabilité", "Administration"]) {
      const trigger = within(bar).getByRole("button", { name: group });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
    // Rien du contenu des groupes tant qu'ils sont fermés.
    expect(within(bar).queryByRole("link", { name: "Notes" })).not.toBeInTheDocument();
  });

  it("opens one group at a time", async () => {
    const user = userEvent.setup();
    const bar = renderBar();

    await user.click(within(bar).getByRole("button", { name: "Pédagogie" }));
    expect(within(bar).getByRole("link", { name: "Notes" })).toHaveAttribute("href", "/grades");
    expect(within(bar).getByRole("button", { name: "Pédagogie" })).toHaveAttribute("aria-expanded", "true");

    await user.click(within(bar).getByRole("button", { name: "Administration" }));
    expect(within(bar).queryByRole("link", { name: "Notes" })).not.toBeInTheDocument();
    expect(within(bar).getByRole("link", { name: "Rôles" })).toHaveAttribute("href", "/roles");
  });

  it("closes with the same button, Escape, or a click elsewhere", async () => {
    const user = userEvent.setup();
    const bar = renderBar();
    const trigger = within(bar).getByRole("button", { name: "Pédagogie" });

    await user.click(trigger);
    await user.click(trigger);
    expect(within(bar).queryByRole("link", { name: "Notes" })).not.toBeInTheDocument();

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(within(bar).queryByRole("link", { name: "Notes" })).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(document.body);
    expect(within(bar).queryByRole("link", { name: "Notes" })).not.toBeInTheDocument();
  });

  it("follows the language", async () => {
    useLocaleStore.setState({ locale: "en" });
    const bar = renderBar("Main navigation");

    expect(within(bar).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Teaching" })).toBeInTheDocument();
  });
});
