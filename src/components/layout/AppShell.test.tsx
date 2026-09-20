import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/layout/AppShell";
import { STAFF_NAV, visibleGroups } from "@/components/layout/nav";
import { useLayoutStore } from "@/lib/layout/store";
import type { StaffUser } from "@/lib/api/types";

const admin: StaffUser = {
  id: "1",
  name: "Admin Maarif",
  email: "admin@maarif.test",
  phone: null,
  type: "staff",
  roles: ["admin"],
  permissions: ["students.view", "academics.view", "grades.manage", "attendance.manage", "discipline.manage", "accounting.view", "users.manage"],
};

function renderShell(onLogout = vi.fn()) {
  render(
    <AppShell
      groups={visibleGroups(STAFF_NAV, admin)}
      brandSubtitle="Espace personnel"
      user={{ name: "Admin Maarif", subtitle: "Administrateur" }}
      profileHref="/profil"
      settingsHref="/parametres"
      onLogout={onLogout}
    >
      <p>Contenu de la page</p>
    </AppShell>,
  );

  return { onLogout };
}

describe("AppShell", () => {
  beforeEach(() => {
    useLayoutStore.setState({ collapsed: false, mobileOpen: false });
  });

  it("groups the sidebar entries under their headings", () => {
    renderShell();

    const nav = screen.getByRole("navigation", { name: "Navigation principale" });
    const groups = within(nav).getAllByRole("group");

    expect(groups.map((group) => group.getAttribute("aria-labelledby"))).toHaveLength(6);
    expect(within(nav).getByText("Vie scolaire")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Absences" })).toHaveAttribute("href", "/absences");
    expect(within(nav).getByRole("link", { name: "Impayés" })).toHaveAttribute("href", "/comptabilite/impayes");
  });

  it("pins the profile icon at the bottom of a sidebar that only scrolls its navigation", () => {
    renderShell();

    const sidebar = screen.getByRole("complementary", { name: "Barre latérale" });
    const nav = within(sidebar).getByRole("navigation");
    const profile = within(sidebar).getByRole("link", { name: /Admin Maarif/ });

    // Barre collée en haut et haute comme l'écran : elle ne défile pas avec la page.
    expect(sidebar).toHaveClass("sticky", "top-0", "h-screen");
    // Seule la navigation défile ; le profil est hors de la zone défilante.
    expect(nav).toHaveClass("overflow-y-auto");
    expect(nav).not.toContainElement(profile);
    expect(profile).toHaveAttribute("href", "/profil");
  });

  it("collapses the sidebar to its icons from the button on the left of the top bar", async () => {
    const user = userEvent.setup();
    renderShell();

    const sidebar = screen.getByRole("complementary", { name: "Barre latérale" });
    expect(sidebar).toHaveAttribute("data-collapsed", "false");

    await user.click(screen.getByRole("button", { name: "Réduire la barre latérale en icônes" }));

    expect(sidebar).toHaveAttribute("data-collapsed", "true");
    // Les libellés restent lisibles pour les lecteurs d'écran, et en infobulle.
    const link = within(sidebar).getByRole("link", { name: "Absences" });
    expect(link).toHaveAttribute("title", "Absences");
    expect(within(sidebar).queryByText("Vie scolaire", { selector: "p" })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("erp-maarif-layout") ?? "{}").state.collapsed).toBe(true);

    await user.click(screen.getByRole("button", { name: "Déplier la barre latérale" }));

    expect(sidebar).toHaveAttribute("data-collapsed", "false");
  });

  it("opens the navigation as a drawer on small screens", async () => {
    const user = userEvent.setup();
    renderShell();

    expect(screen.queryByRole("complementary", { name: "Menu" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ouvrir le menu" }));

    const drawer = screen.getByRole("complementary", { name: "Menu" });
    expect(within(drawer).getByRole("link", { name: "Tableau de bord" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("complementary", { name: "Menu" })).not.toBeInTheDocument();
  });

  it("offers Profil, Paramètres and Déconnexion from the profile icon on the right", async () => {
    const user = userEvent.setup();
    const { onLogout } = renderShell();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Menu du profil" }));

    const menu = screen.getByRole("menu", { name: "Profil" });
    expect(within(menu).getByRole("menuitem", { name: "Profil" })).toHaveAttribute("href", "/profil");
    expect(within(menu).getByRole("menuitem", { name: "Paramètres" })).toHaveAttribute("href", "/parametres");

    await user.click(within(menu).getByRole("menuitem", { name: "Déconnexion" }));

    expect(onLogout).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the profile menu with Escape and gives the focus back to its button", async () => {
    const user = userEvent.setup();
    renderShell();

    const trigger = screen.getByRole("button", { name: "Menu du profil" });
    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Profil" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Paramètres" })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes the profile menu when clicking elsewhere", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Menu du profil" }));
    await user.click(screen.getByText("Contenu de la page"));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
