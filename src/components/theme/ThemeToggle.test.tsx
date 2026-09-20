import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsView } from "@/components/settings/SettingsView";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { THEME_STORAGE_KEY } from "@/lib/theme/theme";

function stubPrefersDark(prefersDark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: prefersDark,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe("theme switching", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    stubPrefersDark(false);
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("switches from Light to Blue Dark and back, and remembers the choice", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /Changer de thème/ }));

    expect(document.documentElement).toHaveAttribute("data-theme", "blue-dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("blue-dark");

    await user.click(screen.getByRole("button", { name: /Changer de thème/ }));

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("starts from the system theme when nothing is stored, as before", async () => {
    stubPrefersDark(true);
    const user = userEvent.setup();
    render(<ThemeToggle />);

    // Le système est sombre : le premier clic mène donc au thème clair.
    await user.click(screen.getByRole("button", { name: /Changer de thème/ }));

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("lets the settings page pick Light, Blue Dark or Automatique", async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    expect(screen.getByRole("radio", { name: /Automatique/ })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("radio", { name: /Blue Dark/ }));

    expect(screen.getByRole("radio", { name: /Blue Dark/ })).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement).toHaveAttribute("data-theme", "blue-dark");

    await user.click(screen.getByRole("radio", { name: /Light/ }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    await user.click(screen.getByRole("radio", { name: /Automatique/ }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(document.documentElement).toHaveAttribute("data-theme", "light"); // le système est clair
  });
});
