import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffLoginPage from "@/app/login/page";
import { useAuthStore } from "@/lib/auth/store";
import { mockRouter } from "@/test/mocks/navigation";

describe("StaffLoginPage", () => {
  it("logs the user in and stores the session on valid credentials", async () => {
    const user = userEvent.setup();
    render(<StaffLoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "admin@maarif.test");
    await user.type(screen.getByLabelText("Mot de passe"), "password");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/dashboard"));

    const state = useAuthStore.getState();
    expect(state.actorType).toBe("staff");
    expect(state.token).toBe("fake-staff-token");
    // Session du personnel : `user` est l'union personnel | élève, seul le premier a un `name`.
    expect(state.user && "name" in state.user ? state.user.name : undefined).toBe("Admin Maarif");
  });

  it("shows the API's error message and keeps the user on the page when credentials are wrong", async () => {
    const user = userEvent.setup();
    render(<StaffLoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "admin@maarif.test");
    await user.type(screen.getByLabelText("Mot de passe"), "mauvais-mot-de-passe");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Identifiants invalides.");
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("blocks submission and surfaces field errors when the form is empty", async () => {
    const user = userEvent.setup();
    render(<StaffLoginPage />);

    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("L'e-mail est requis.")).toBeInTheDocument();
    expect(screen.getByText("Le mot de passe est requis.")).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
