import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { server } from "@/test/msw/server";

describe("ForgotPasswordForm", () => {
  it("asks the staff for their e-mail and confirms without revealing whether the account exists", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm audience="staff" />);

    await user.type(screen.getByLabelText("E-mail"), "inconnu@exemple.com");
    await user.click(screen.getByRole("button", { name: /Envoyer le lien/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("Si un compte correspond à cette adresse");
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Retour à la connexion/ })).toHaveAttribute("href", "/login");
  });

  it("asks the parent for the student's matricule and sends the reminder to the guardian", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm audience="parent" />);

    await user.type(screen.getByLabelText("Matricule de l'élève"), "MAA-2026-000001");
    await user.click(screen.getByRole("button", { name: /Envoyer le lien/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("envoyé au tuteur de l'élève");
    expect(screen.getByRole("link", { name: /Retour à la connexion/ })).toHaveAttribute("href", "/portal/login");
  });

  it("blocks an empty or malformed request", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm audience="staff" />);

    await user.click(screen.getByRole("button", { name: /Envoyer le lien/ }));
    expect(await screen.findByText("L'e-mail est requis.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("E-mail"), "pas-un-email");
    await user.click(screen.getByRole("button", { name: /Envoyer le lien/ }));
    expect(await screen.findByText("Adresse e-mail invalide.")).toBeInTheDocument();
  });

  it("keeps the form and shows an error when the API cannot be reached", async () => {
    server.use(http.post("http://localhost:8000/api/forgot-password", () => HttpResponse.error()));
    const user = userEvent.setup();
    render(<ForgotPasswordForm audience="staff" />);

    await user.type(screen.getByLabelText("E-mail"), "admin@maarif.test");
    await user.click(screen.getByRole("button", { name: /Envoyer le lien/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible d'envoyer le lien");
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });
});
