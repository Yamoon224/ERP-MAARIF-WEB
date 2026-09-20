import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ParentLoginPage from "@/app/portail/connexion/page";
import { useAuthStore } from "@/lib/auth/store";
import { mockRouter } from "@/test/mocks/navigation";

describe("ParentLoginPage", () => {
  it("logs the parent in with the student's matricule and password", async () => {
    const user = userEvent.setup();
    render(<ParentLoginPage />);

    await user.type(screen.getByLabelText("Matricule de l'eleve"), "MAA-2026-000001");
    await user.type(screen.getByLabelText("Mot de passe"), "password");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/portail"));

    const state = useAuthStore.getState();
    expect(state.actorType).toBe("parent");
    expect(state.user).toMatchObject({ matricule: "MAA-2026-000001", first_name: "Fatoumata" });
  });

  it("shows a neutral error message for an unknown matricule", async () => {
    const user = userEvent.setup();
    render(<ParentLoginPage />);

    await user.type(screen.getByLabelText("Matricule de l'eleve"), "MAA-0000-000000");
    await user.type(screen.getByLabelText("Mot de passe"), "password");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Matricule ou mot de passe incorrect.");
    expect(useAuthStore.getState().token).toBeNull();
  });
});
