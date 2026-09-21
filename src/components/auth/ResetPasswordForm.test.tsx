import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { server } from "@/test/msw/server";

async function fillAndSubmit(password: string, confirmation = password) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nouveau mot de passe"), password);
  await user.type(screen.getByLabelText("Confirmer le mot de passe"), confirmation);
  await user.click(screen.getByRole("button", { name: /Enregistrer le mot de passe/ }));
}

describe("ResetPasswordForm", () => {
  it("lets the staff choose a new password from the emailed link", async () => {
    render(<ResetPasswordForm audience="staff" token="jeton-valide" identity="admin@maarif.test" />);

    await fillAndSubmit("nouveau-secret");

    expect(await screen.findByRole("heading", { name: "Mot de passe modifié" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Se connecter/ })).toHaveAttribute("href", "/login");
  });

  it("lets the parent choose a new password from the link sent to the guardian", async () => {
    render(<ResetPasswordForm audience="parent" token="jeton-valide" identity="MAA-2026-000001" />);

    await fillAndSubmit("nouveau-secret");

    expect(await screen.findByRole("heading", { name: "Mot de passe modifié" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Se connecter/ })).toHaveAttribute("href", "/portal/login");
  });

  it("sends the token and the identity carried by the link", async () => {
    let received: Record<string, string> = {};
    server.use(
      http.post("http://localhost:8000/api/reset-password", async ({ request }) => {
        received = (await request.json()) as Record<string, string>;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    render(<ResetPasswordForm audience="staff" token="jeton-valide" identity="admin@maarif.test" />);

    await fillAndSubmit("nouveau-secret");
    await screen.findByRole("heading", { name: "Mot de passe modifié" });

    expect(received).toEqual({
      email: "admin@maarif.test",
      token: "jeton-valide",
      password: "nouveau-secret",
      password_confirmation: "nouveau-secret",
    });
  });

  it("blocks a short password and a mismatched confirmation", async () => {
    render(<ResetPasswordForm audience="staff" token="jeton-valide" identity="admin@maarif.test" />);

    await fillAndSubmit("court");
    expect(await screen.findByText("8 caractères minimum.")).toBeInTheDocument();
  });

  it("flags a confirmation that differs from the password", async () => {
    render(<ResetPasswordForm audience="staff" token="jeton-valide" identity="admin@maarif.test" />);

    await fillAndSubmit("nouveau-secret", "autre-chose");

    expect(await screen.findByText("Les deux mots de passe ne correspondent pas.")).toBeInTheDocument();
  });

  it("shows the API's message and offers a new link when the token is rejected", async () => {
    render(<ResetPasswordForm audience="staff" token="jeton-perime" identity="admin@maarif.test" />);

    await fillAndSubmit("nouveau-secret");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Ce lien de réinitialisation est invalide ou a expiré.");
    expect(screen.getByRole("link", { name: "Demander un nouveau lien" })).toHaveAttribute("href", "/forgot-password");
  });

  it("explains that the link is incomplete when the token is missing", () => {
    render(<ResetPasswordForm audience="parent" token="" identity="MAA-2026-000001" />);

    expect(screen.getByRole("heading", { name: "Lien invalide" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Demander un nouveau lien/ })).toHaveAttribute("href", "/portal/forgot-password");
    expect(screen.queryByLabelText("Nouveau mot de passe")).not.toBeInTheDocument();
  });
});
