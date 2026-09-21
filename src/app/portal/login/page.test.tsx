import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ParentLoginPage from "@/app/portal/login/page";
import { useAuthStore } from "@/lib/auth/store";
import { mockRouter } from "@/test/mocks/navigation";

describe("ParentLoginPage", () => {
  it("logs the parent in with the student's matricule and password", async () => {
    const user = userEvent.setup();
    render(<ParentLoginPage />);

    await user.type(screen.getByLabelText("Matricule de l'élève"), "MAA-2026-000001");
    await user.type(screen.getByLabelText("Mot de passe"), "password");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/portal"));

    const state = useAuthStore.getState();
    expect(state.actorType).toBe("parent");
    expect(state.user).toMatchObject({ matricule: "MAA-2026-000001", first_name: "Fatoumata" });
  });

  it("shows a neutral error message for an unknown matricule", async () => {
    const user = userEvent.setup();
    render(<ParentLoginPage />);

    await user.type(screen.getByLabelText("Matricule de l'élève"), "MAA-0000-000000");
    await user.type(screen.getByLabelText("Mot de passe"), "password");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Matricule ou mot de passe incorrect.");
    expect(useAuthStore.getState().token).toBeNull();
  });
});
