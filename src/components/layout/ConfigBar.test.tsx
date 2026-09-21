import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/layout/AppShell";
import { STAFF_NAV, STAFF_SHORTCUTS, visibleGroups } from "@/components/layout/nav";
import { DEFAULT_APPEARANCE } from "@/lib/appearance/palettes";
import { useAppearanceStore } from "@/lib/appearance/store";
import { useLocaleStore } from "@/lib/i18n/store";
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

function renderShell() {
  render(
    <AppShell
      groups={visibleGroups(STAFF_NAV, admin)}
      shortcutHrefs={STAFF_SHORTCUTS}
      brandSubtitle="Espace personnel"
      user={{ name: "Admin Maarif", subtitle: "Administrateur" }}
      profileHref="/profile"
      settingsHref="/settings"
      onLogout={vi.fn()}
    >
      <p>Contenu de la page</p>
    </AppShell>,
  );
}

async function openConfig() {
  const user = userEvent.setup();
  renderShell();
  await user.click(screen.getByRole("button", { name: "Configuration de l'application" }));

  return { user, panel: screen.getByRole("dialog", { name: "Configuration" }) };
}

describe("ConfigBar", () => {
  beforeEach(() => {
    useAppearanceStore.setState({ ...DEFAULT_APPEARANCE });
    useLocaleStore.setState({ locale: "fr" });
    useLayoutStore.setState({ collapsed: false, mobileOpen: false, configOpen: false });
  });

  afterEach(() => {
    document.documentElement.removeAttribute("lang");
  });

  it("opens from the gear in the top bar, on the right, and closes with Escape, the cross or the backdrop", async () => {
    const user = userEvent.setup();
    renderShell();

    expect(screen.queryByRole("dialog", { name: "Configuration" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Configuration de l'application" }));
    const panel = screen.getByRole("dialog", { name: "Configuration" });
    expect(panel).toHaveClass("right-0");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Configuration" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Configuration de l'application" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Configuration de l'application" }));
    await user.click(screen.getByRole("button", { name: "Fermer la configuration" }));
    expect(screen.queryByRole("dialog", { name: "Configuration" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Configuration de l'application" }));
    await user.click(document.querySelector(".fixed.inset-0 > .bg-black\\/20") as HTMLElement);
    expect(screen.queryByRole("dialog", { name: "Configuration" })).not.toBeInTheDocument();
  });

  describe("main color", () => {
    it("proposes a palette of colors, the current one being checked", async () => {
      const { panel } = await openConfig();
      const palette = within(panel).getByRole("radiogroup", { name: "Couleur principale" });

      expect(within(palette).getAllByRole("radio")).toHaveLength(11);
      expect(within(palette).getByRole("radio", { name: "Bleu" })).toBeChecked();
    });

    it("switches the app's color when one is picked, and remembers it", async () => {
      const { user, panel } = await openConfig();

      await user.click(within(panel).getByRole("radio", { name: "Émeraude" }));

      expect(within(panel).getByRole("radio", { name: "Émeraude" })).toBeChecked();
      expect(within(panel).getByRole("radio", { name: "Bleu" })).not.toBeChecked();
      expect(useAppearanceStore.getState().accent).toBe("emerald");
      expect(JSON.parse(window.localStorage.getItem("erp-maarif-appearance") ?? "{}").state.accent).toBe("emerald");
    });
  });

  describe("menu layout", () => {
    it("turns the sidebar into a horizontal bar, and back", async () => {
      const { user, panel } = await openConfig();
      expect(screen.getByRole("complementary", { name: "Barre latérale" })).toBeInTheDocument();

      await user.click(within(panel).getByRole("radio", { name: "Menu horizontal" }));

      expect(screen.queryByRole("complementary", { name: "Barre latérale" })).not.toBeInTheDocument();
      const bar = screen.getByRole("navigation", { name: "Navigation principale" });
      expect(bar).toHaveClass("region-sidebar");
      expect(within(bar).getByRole("link", { name: "Tableau de bord" })).toHaveAttribute("href", "/dashboard");
      // Le logo passe dans la barre du haut.
      expect(screen.getByText("ERP Maarif")).toBeInTheDocument();

      await user.click(within(panel).getByRole("radio", { name: "Menu latéral" }));

      expect(screen.getByRole("complementary", { name: "Barre latérale" })).toBeInTheDocument();
    });

    it("collapses the sidebar to its icons from a switch, unavailable with the horizontal bar", async () => {
      const { user, panel } = await openConfig();
      const collapse = within(panel).getByRole("switch", { name: "Réduire la barre latérale" });

      await user.click(collapse);

      expect(collapse).toBeChecked();
      expect(screen.getByRole("complementary", { name: "Barre latérale" })).toHaveAttribute("data-collapsed", "true");

      await user.click(within(panel).getByRole("radio", { name: "Menu horizontal" }));
      expect(within(panel).getByRole("switch", { name: "Réduire la barre latérale" })).toBeDisabled();
    });
  });

  describe("backgrounds", () => {
    it("changes the background of the top of the sidebar, the top bar and the sidebar independently", async () => {
      const { user, panel } = await openConfig();

      await user.click(within(panel).getByRole("button", { name: "Barre du haut : Bleu nuit" }));
      await user.click(within(panel).getByRole("button", { name: "Barre latérale : Ardoise" }));
      await user.click(within(panel).getByRole("button", { name: "Haut de la barre latérale : Bordeaux" }));

      expect(useAppearanceStore.getState()).toMatchObject({ topbarBg: "#0f1e3d", sidebarBg: "#1e293b", sidebarHeaderBg: "#7f1d1d" });
      expect(within(panel).getByRole("button", { name: "Barre du haut : Bleu nuit" })).toHaveAttribute("aria-pressed", "true");
    });

    it("takes any custom color", async () => {
      const { panel } = await openConfig();

      const picker = within(panel).getByLabelText("Barre du haut : couleur personnalisée");
      await act(async () => {
        // Un <input type="color"> n'a pas de clic utile en test : on lui donne la valeur choisie.
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        setValue.call(picker, "#123456");
        picker.dispatchEvent(new Event("input", { bubbles: true }));
      });

      expect(useAppearanceStore.getState().topbarBg).toBe("#123456");
    });

    it("gives a bar back to the theme with Default", async () => {
      const { user, panel } = await openConfig();
      useAppearanceStore.setState({ sidebarBg: "#0f1e3d" });

      const sidebarPicker = within(panel).getByRole("group", { name: "Barre latérale" });
      await user.click(within(sidebarPicker).getByRole("button", { name: "Défaut" }));

      expect(useAppearanceStore.getState().sidebarBg).toBeNull();
    });

    it("hides the sidebar header background when there is no sidebar to put it on", async () => {
      const { user, panel } = await openConfig();
      expect(within(panel).getByRole("group", { name: "Haut de la barre latérale" })).toBeInTheDocument();

      await user.click(within(panel).getByRole("radio", { name: "Menu horizontal" }));

      expect(within(panel).queryByRole("group", { name: "Haut de la barre latérale" })).not.toBeInTheDocument();
    });

    it("carries the region classes that the chosen backgrounds are painted on", async () => {
      await openConfig();

      expect(document.querySelector("header.region-topbar")).not.toBeNull();
      expect(screen.getByRole("complementary", { name: "Barre latérale" })).toHaveClass("region-sidebar");
    });
  });

  describe("full screen", () => {
    afterEach(() => {
      // @ts-expect-error retire les substituts posés par ces tests
      delete document.fullscreenEnabled;
      // @ts-expect-error idem
      delete document.fullscreenElement;
    });

    it("is disabled where the browser cannot do it", async () => {
      const { panel } = await openConfig();

      expect(within(panel).getByRole("switch", { name: "Plein écran" })).toBeDisabled();
      expect(within(panel).getByText("Non disponible sur ce navigateur.")).toBeInTheDocument();
    });

    it("enters and leaves full screen", async () => {
      Object.defineProperty(document, "fullscreenEnabled", { value: true, configurable: true });
      Object.defineProperty(document, "fullscreenElement", { value: null, writable: true, configurable: true });
      const request = vi.fn(async () => {
        Object.defineProperty(document, "fullscreenElement", { value: document.documentElement, writable: true, configurable: true });
        document.dispatchEvent(new Event("fullscreenchange"));
      });
      const exit = vi.fn(async () => {
        Object.defineProperty(document, "fullscreenElement", { value: null, writable: true, configurable: true });
        document.dispatchEvent(new Event("fullscreenchange"));
      });
      document.documentElement.requestFullscreen = request;
      document.exitFullscreen = exit;

      const { user, panel } = await openConfig();
      const toggle = within(panel).getByRole("switch", { name: "Plein écran" });
      expect(toggle).toBeEnabled();
      expect(toggle).not.toBeChecked();

      await user.click(toggle);
      expect(request).toHaveBeenCalledOnce();
      expect(within(panel).getByRole("switch", { name: "Plein écran" })).toBeChecked();

      await user.click(within(panel).getByRole("switch", { name: "Plein écran" }));
      expect(exit).toHaveBeenCalledOnce();
      expect(within(panel).getByRole("switch", { name: "Plein écran" })).not.toBeChecked();
    });
  });

  describe("language", () => {
    it("offers French and American English with their flags, French being current", async () => {
      const { panel } = await openConfig();
      const languages = within(panel).getByRole("radiogroup", { name: "Langue" });

      const french = within(languages).getByRole("radio", { name: "Français" });
      const english = within(languages).getByRole("radio", { name: "English (US)" });
      expect(french).toBeChecked();
      expect(english).not.toBeChecked();
      expect(french.querySelector('svg[data-flag="fr"]')).not.toBeNull();
      expect(english.querySelector('svg[data-flag="us"]')).not.toBeNull();
    });

    it("switches the interface to English at once, and back", async () => {
      const { user, panel } = await openConfig();

      await user.click(within(panel).getByRole("radio", { name: "English (US)" }));

      expect(useLocaleStore.getState().locale).toBe("en");
      expect(screen.getByRole("dialog", { name: "Configuration" })).toBeInTheDocument();
      expect(within(panel).getByRole("radiogroup", { name: "Main color" })).toBeInTheDocument();
      // La barre latérale et la barre du haut suivent.
      const sidebar = screen.getByRole("complementary", { name: "Sidebar" });
      expect(within(sidebar).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
      expect(within(sidebar).getByText("Staff area")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Profile menu" })).toBeInTheDocument();

      await user.click(within(panel).getByRole("radio", { name: "Français" }));

      expect(within(sidebar).getByRole("link", { name: "Tableau de bord" })).toBeInTheDocument();
    });

    it("remembers the language on the device", async () => {
      const { user, panel } = await openConfig();

      await user.click(within(panel).getByRole("radio", { name: "English (US)" }));

      expect(JSON.parse(window.localStorage.getItem("erp-maarif-locale") ?? "{}").state.locale).toBe("en");
    });
  });

  describe("theme and reset", () => {
    it("offers the theme too", async () => {
      const { panel } = await openConfig();

      expect(within(panel).getByRole("radiogroup", { name: "Thème de l'application" })).toBeInTheDocument();
    });

    it("puts the appearance back to its defaults", async () => {
      const { user, panel } = await openConfig();
      const reset = within(panel).getByRole("button", { name: "Réinitialiser l'apparence" });
      expect(reset).toBeDisabled();

      await user.click(within(panel).getByRole("radio", { name: "Rose" }));
      await user.click(within(panel).getByRole("radio", { name: "Menu horizontal" }));
      await user.click(within(panel).getByRole("button", { name: "Barre du haut : Noir" }));
      expect(reset).toBeEnabled();

      await user.click(reset);

      expect(useAppearanceStore.getState()).toMatchObject(DEFAULT_APPEARANCE);
      expect(reset).toBeDisabled();
    });
  });
});
