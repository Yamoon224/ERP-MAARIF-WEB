import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StaffProfilePage from "@/app/(staff)/profile/page";
import StaffSettingsPage from "@/app/(staff)/settings/page";
import { signInAs } from "@/test/fixtures";

/** La grille qui porte les cartes de la page : le plus proche ancêtre commun à tous leurs titres. */
function gridOf(...titles: string[]): HTMLElement {
  const cards = titles.map((title) => screen.getByRole("heading", { name: title, level: 3 }).closest(".border-t-4") as HTMLElement);
  const grid = cards[0].parentElement as HTMLElement;

  for (const card of cards) expect(card.parentElement).toBe(grid);

  return grid;
}

describe("Profile and settings pages share one layout", () => {
  it("puts the profile's two cards on the same row, at equal height", () => {
    signInAs(["students.view"]);
    render(<StaffProfilePage />);

    const grid = gridOf("Informations personnelles", "Mot de passe");

    expect(grid).toHaveClass("grid", "lg:grid-cols-2", "items-stretch");
    for (const card of Array.from(grid.children)) expect(card).toHaveClass("h-full");
  });

  it("puts the settings' two cards on the same row, at equal height", () => {
    render(<StaffSettingsPage />);

    const grid = gridOf("Thème", "Barre latérale");

    expect(grid).toHaveClass("grid", "lg:grid-cols-2", "items-stretch");
    for (const card of Array.from(grid.children)) expect(card).toHaveClass("h-full");
  });

  it("uses the same grid classes on both pages", () => {
    signInAs(["students.view"]);
    const profile = render(<StaffProfilePage />);
    const profileGrid = gridOf("Informations personnelles", "Mot de passe").className;
    profile.unmount();

    render(<StaffSettingsPage />);

    expect(gridOf("Thème", "Barre latérale").className).toBe(profileGrid);
  });
});
