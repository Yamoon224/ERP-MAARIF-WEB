import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/layout/AppShell";
import { STAFF_NAV, STAFF_SHORTCUTS, visibleGroups } from "@/components/layout/nav";
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

function renderShell(onLogout = vi.fn(), user: StaffUser = admin) {
  render(
    <AppShell
      groups={visibleGroups(STAFF_NAV, user)}
      shortcutHrefs={STAFF_SHORTCUTS}
      brandSubtitle="Espace personnel"
      user={{ name: "Admin Maarif", subtitle: "Administrateur" }}
      profileHref="/profile"
      settingsHref="/settings"
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
    expect(within(nav).getByRole("link", { name: "Impayés" })).toHaveAttribute("href", "/accounting/unpaid");
  });

  it("puts shortcuts to the essential pages in the top bar", () => {
    renderShell();

    const shortcuts = screen.getByRole("navigation", { name: "Raccourcis" });

    expect(within(shortcuts).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(STAFF_SHORTCUTS);
    expect(within(shortcuts).getByRole("link", { name: "Notes" })).toHaveAttribute("title", "Notes");
    expect(shortcuts.closest("header")).not.toBeNull();
  });

  it("only offers the shortcuts the user may open", () => {
    renderShell(vi.fn(), { ...admin, roles: ["teacher"], permissions: ["students.view", "grades.manage"] });

    const shortcuts = screen.getByRole("navigation", { name: "Raccourcis" });

    expect(within(shortcuts).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/dashboard",
      "/students",
      "/grades",
    ]);
  });

  it("pins the profile icon at the bottom of a sidebar that only scrolls its navigation", () => {
    renderShell();

    const sidebar = screen.getByRole("complementary", { name: "Barre latérale" });
    const nav = within(sidebar).getByRole("navigation");
    const profile = within(sidebar).getByRole("button", { name: /Admin Maarif/ });

    // Barre collée en haut et haute comme l'écran : elle ne défile pas avec la page.
    expect(sidebar).toHaveClass("sticky", "top-0", "h-screen");
    // Seule la navigation défile ; le profil est hors de la zone défilante.
    expect(nav).toHaveClass("overflow-y-auto");
    expect(nav).not.toContainElement(profile);
    expect(profile).toHaveTextContent("Administrateur");
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
    expect(within(menu).getByRole("menuitem", { name: "Profil" })).toHaveAttribute("href", "/profile");
    expect(within(menu).getByRole("menuitem", { name: "Paramètres" })).toHaveAttribute("href", "/settings");

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
  describe("profile at the bottom of the sidebar", () => {
    const sidebarTrigger = () =>
      within(screen.getByRole("complementary", { name: "Barre latérale" })).getByRole("button", { name: "Menu du profil : Admin Maarif" });

    it("opens the same menu as the top bar icon, upwards", async () => {
      const user = userEvent.setup();
      const { onLogout } = renderShell();

      expect(sidebarTrigger()).toHaveAttribute("aria-haspopup", "menu");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      await user.click(sidebarTrigger());

      const menu = screen.getByRole("menu", { name: "Profil" });
      expect(sidebarTrigger()).toHaveAttribute("aria-expanded", "true");
      expect(menu).toHaveClass("bottom-full");
      expect(within(menu).getByText("Admin Maarif")).toBeInTheDocument();
      expect(within(menu).getByText("Administrateur")).toBeInTheDocument();
      expect(within(menu).getByRole("menuitem", { name: "Profil" })).toHaveAttribute("href", "/profile");
      expect(within(menu).getByRole("menuitem", { name: "Paramètres" })).toHaveAttribute("href", "/settings");

      await user.click(within(menu).getByRole("menuitem", { name: "Déconnexion" }));

      expect(onLogout).toHaveBeenCalledOnce();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("closes with Escape and gives the focus back to the profile", async () => {
      const user = userEvent.setup();
      renderShell();

      await user.click(sidebarTrigger());
      expect(screen.getByRole("menuitem", { name: "Profil" })).toHaveFocus();

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(sidebarTrigger()).toHaveFocus();
    });

    it("closes when clicking elsewhere", async () => {
      const user = userEvent.setup();
      renderShell();

      await user.click(sidebarTrigger());
      await user.click(screen.getByText("Contenu de la page"));

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("keeps working from the avatar alone when the sidebar is collapsed, opening beside the sidebar", async () => {
      const user = userEvent.setup();
      useLayoutStore.setState({ collapsed: true, mobileOpen: false });
      renderShell();

      expect(within(sidebarTrigger()).queryByText("Admin Maarif")).not.toBeInTheDocument();

      await user.click(sidebarTrigger());

      const menu = screen.getByRole("menu", { name: "Profil" });
      expect(menu).toHaveClass("left-full");
      expect(within(menu).getByRole("menuitem", { name: "Déconnexion" })).toBeInTheDocument();
    });

    it("leaves the top bar menu independent of the sidebar one", async () => {
      const user = userEvent.setup();
      renderShell();

      await user.click(sidebarTrigger());
      await user.click(screen.getByRole("button", { name: "Menu du profil" }));

      expect(screen.getAllByRole("menu")).toHaveLength(1);
      expect(screen.getByRole("menu")).toHaveClass("right-0");
    });
  });
});
