import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import UsersPage from "@/app/(staff)/users/page";
import type { Role, StaffUser } from "@/lib/api/types";
import { server } from "@/test/msw/server";
import { API_URL, paged, signInAs } from "@/test/fixtures";

let users: StaffUser[] = [];
let requests: Array<{ method: string; url: string; body: unknown }> = [];

const ROLES: Role[] = [
  { id: "r1", name: "admin", label: "Administrateur", is_system: true },
  { id: "r2", name: "teacher", label: "Enseignant", is_system: true },
  { id: "r3", name: "accountant", label: "Comptable", is_system: true },
  { id: "r4", name: "Secrétaire", label: "Secrétaire", is_system: false },
];

function account(id: string, name: string, roles: string[], overrides: Partial<StaffUser> = {}): StaffUser {
  return { id, name, email: `${id}@maarif.test`, phone: null, type: "staff", roles, permissions: [], is_active: true, ...overrides };
}

function rowOf(name: string): HTMLElement {
  return screen.getByText(name).closest("tr") as HTMLElement;
}

describe("UsersPage", () => {
  beforeEach(() => {
    users = [account("u1", "Aïssatou Bah", ["teacher"]), account("u2", "Mamadou Sow", ["accountant", "Secrétaire"], { is_active: false })];
    requests = [];
    signInAs(["users.manage"]);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    server.use(
      http.get(`${API_URL}/roles`, () => HttpResponse.json(paged(ROLES, 100))),
      http.get(`${API_URL}/users`, () => HttpResponse.json(paged(users))),
      http.post(`${API_URL}/users`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        requests.push({ method: "POST", url: "/users", body });
        const created = account("u9", String(body.name), body.roles as string[], { email: String(body.email) });
        users = [...users, created];
        return HttpResponse.json({ data: created }, { status: 201 });
      }),
      http.put(`${API_URL}/users/:id`, async ({ request, params }) => {
        const body = (await request.json()) as Partial<StaffUser>;
        requests.push({ method: "PUT", url: `/users/${params.id}`, body });
        users = users.map((user) => (user.id === params.id ? { ...user, ...body } : user));
        return HttpResponse.json({ data: users.find((user) => user.id === params.id) });
      }),
      http.post(`${API_URL}/users/:id/reset-password`, async ({ request, params }) => {
        requests.push({ method: "POST", url: `/users/${params.id}/reset-password`, body: await request.json() });
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete(`${API_URL}/users/:id`, ({ params }) => {
        requests.push({ method: "DELETE", url: `/users/${params.id}`, body: null });
        users = users.filter((user) => user.id !== params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
  });

  it("lists the accounts with their roles and status", async () => {
    render(<UsersPage />);

    const row = await screen.findByText("Aïssatou Bah").then((cell) => cell.closest("tr") as HTMLElement);
    expect(within(row).getByText("Enseignant")).toBeInTheDocument();
    expect(within(row).getByText("Actif")).toBeInTheDocument();
    expect(within(rowOf("Mamadou Sow")).getByText("Comptable")).toBeInTheDocument();
    expect(within(rowOf("Mamadou Sow")).getByText("Secrétaire")).toBeInTheDocument();
    expect(within(rowOf("Mamadou Sow")).getByText("Inactif")).toBeInTheDocument();
  });

  it("no longer carries the creation form on the page: it opens in a modal", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);
    await screen.findByText("Aïssatou Bah");

    expect(screen.queryByLabelText("Mot de passe initial")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nouvel utilisateur" }));

    const modal = screen.getByRole("dialog", { name: "Nouvel utilisateur" });
    expect(within(modal).getByLabelText("Nom complet")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Mot de passe initial")).toBeInTheDocument();
  });

  describe("creating an account", () => {
    async function openCreation() {
      const user = userEvent.setup();
      render(<UsersPage />);
      await screen.findByText("Aïssatou Bah");
      await user.click(screen.getByRole("button", { name: "Nouvel utilisateur" }));

      return { user, modal: screen.getByRole("dialog", { name: "Nouvel utilisateur" }) };
    }

    it("offers every role, the custom ones included", async () => {
      const { modal } = await openCreation();

      await waitFor(() => expect(within(modal).getByRole("checkbox", { name: "Secrétaire" })).toBeInTheDocument());
      for (const label of ["Administrateur", "Enseignant", "Comptable"]) {
        expect(within(modal).getByRole("checkbox", { name: label })).toBeInTheDocument();
      }
      expect(within(modal).getByRole("checkbox", { name: "Enseignant" })).toBeChecked();
    });

    it("asks for what is missing without calling the API", async () => {
      const { user, modal } = await openCreation();

      await user.click(within(modal).getByRole("button", { name: "Créer le compte" }));

      expect(await within(modal).findByText("Le nom est requis.")).toBeInTheDocument();
      expect(within(modal).getByText("L'e-mail est requis.")).toBeInTheDocument();
      expect(within(modal).getByText("8 caractères minimum.")).toBeInTheDocument();
      expect(requests).toEqual([]);
    });

    it("creates the account, closes the modal and confirms", async () => {
      const { user, modal } = await openCreation();

      await user.type(within(modal).getByLabelText("Nom complet"), "Fanta Camara");
      await user.type(within(modal).getByLabelText("E-mail"), "fanta@maarif.test");
      await user.type(within(modal).getByLabelText("Mot de passe initial"), "motdepasse-solide");
      await waitFor(() => expect(within(modal).getByRole("checkbox", { name: "Secrétaire" })).toBeInTheDocument());
      await user.click(within(modal).getByRole("checkbox", { name: "Secrétaire" }));
      await user.click(within(modal).getByRole("button", { name: "Créer le compte" }));

      expect(await screen.findByRole("status")).toHaveTextContent("Le compte de Fanta Camara a été créé.");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(requests).toEqual([
        {
          method: "POST",
          url: "/users",
          body: { name: "Fanta Camara", email: "fanta@maarif.test", phone: null, roles: ["teacher", "Secrétaire"], is_active: true, password: "motdepasse-solide" },
        },
      ]);
      expect(await screen.findByText("Fanta Camara")).toBeInTheDocument();
    });

    it("shows the server's complaint under the field, and keeps the modal open", async () => {
      server.use(
        http.post(`${API_URL}/users`, () =>
          HttpResponse.json(
            { message: "The email has already been taken.", error_code: "validation_failed", errors: { email: ["Cette adresse e-mail est déjà utilisée."] } },
            { status: 422 },
          ),
        ),
      );
      const { user, modal } = await openCreation();

      await user.type(within(modal).getByLabelText("Nom complet"), "Fanta Camara");
      await user.type(within(modal).getByLabelText("E-mail"), "aissatou@maarif.test");
      await user.type(within(modal).getByLabelText("Mot de passe initial"), "motdepasse-solide");
      await user.click(within(modal).getByRole("button", { name: "Créer le compte" }));

      expect(await within(modal).findByText("Cette adresse e-mail est déjà utilisée.")).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Nouvel utilisateur" })).toBeInTheDocument();
    });

    it("closes without creating anything when cancelled", async () => {
      const { user, modal } = await openCreation();

      await user.click(within(modal).getByRole("button", { name: "Annuler" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(requests).toEqual([]);
    });
  });

  describe("editing an account", () => {
    async function openEdition(name: string) {
      const user = userEvent.setup();
      render(<UsersPage />);
      await screen.findByText(name);
      await user.click(within(rowOf(name)).getByRole("button", { name: `Modifier ${name}` }));

      return { user, modal: screen.getByRole("dialog", { name: "Modifier le compte" }) };
    }

    it("opens the account in a modal, pre-filled, without a password field", async () => {
      const { modal } = await openEdition("Mamadou Sow");

      expect(within(modal).getByLabelText("Nom complet")).toHaveValue("Mamadou Sow");
      expect(within(modal).getByLabelText("E-mail")).toHaveValue("u2@maarif.test");
      expect(within(modal).queryByLabelText("Mot de passe initial")).not.toBeInTheDocument();
      await waitFor(() => expect(within(modal).getByRole("checkbox", { name: "Comptable" })).toBeChecked());
      expect(within(modal).getByRole("checkbox", { name: "Enseignant" })).not.toBeChecked();
      expect(within(modal).getByRole("checkbox", { name: /Compte actif/ })).not.toBeChecked();
    });

    it("saves the changes and confirms", async () => {
      const { user, modal } = await openEdition("Aïssatou Bah");

      const name = within(modal).getByLabelText("Nom complet");
      await user.clear(name);
      await user.type(name, "Aïssatou Bah-Diallo");
      await user.type(within(modal).getByLabelText("Téléphone"), "+224600000000");
      await user.click(within(modal).getByRole("button", { name: "Enregistrer" }));

      expect(await screen.findByRole("status")).toHaveTextContent("Le compte de Aïssatou Bah-Diallo a été modifié.");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(requests).toEqual([
        {
          method: "PUT",
          url: "/users/u1",
          body: { name: "Aïssatou Bah-Diallo", email: "u1@maarif.test", phone: "+224600000000", roles: ["teacher"], is_active: true },
        },
      ]);
    });

    it("refuses an account left without any role", async () => {
      const { user, modal } = await openEdition("Aïssatou Bah");

      await user.click(within(modal).getByRole("checkbox", { name: "Enseignant" }));
      await user.click(within(modal).getByRole("button", { name: "Enregistrer" }));

      expect(await within(modal).findByText("Sélectionnez au moins un rôle.")).toBeInTheDocument();
      expect(requests).toEqual([]);
    });
  });

  describe("resetting a password", () => {
    async function openReset(name: string) {
      const user = userEvent.setup();
      render(<UsersPage />);
      await screen.findByText(name);
      await user.click(within(rowOf(name)).getByRole("button", { name: `Réinitialiser le mot de passe de ${name}` }));

      return { user, modal: screen.getByRole("dialog", { name: "Réinitialiser le mot de passe" }) };
    }

    it("names the account and warns that its sessions will be closed", async () => {
      const { modal } = await openReset("Aïssatou Bah");

      expect(modal).toHaveAccessibleDescription("Nouveau mot de passe de Aïssatou Bah. Ses sessions ouvertes seront fermées.");
    });

    it("refuses a short or unconfirmed password without calling the API", async () => {
      const { user, modal } = await openReset("Aïssatou Bah");

      await user.type(within(modal).getByLabelText("Nouveau mot de passe"), "court");
      await user.type(within(modal).getByLabelText("Confirmer le nouveau mot de passe"), "autre");
      await user.click(within(modal).getByRole("button", { name: "Réinitialiser" }));

      expect(await within(modal).findByText("8 caractères minimum.")).toBeInTheDocument();
      expect(within(modal).getByText("Les deux mots de passe ne correspondent pas.")).toBeInTheDocument();
      expect(requests).toEqual([]);
    });

    it("sets the new password, closes the modal and confirms", async () => {
      const { user, modal } = await openReset("Aïssatou Bah");

      await user.type(within(modal).getByLabelText("Nouveau mot de passe"), "nouveau-mot-de-passe");
      await user.type(within(modal).getByLabelText("Confirmer le nouveau mot de passe"), "nouveau-mot-de-passe");
      await user.click(within(modal).getByRole("button", { name: "Réinitialiser" }));

      expect(await screen.findByRole("status")).toHaveTextContent("Le mot de passe de Aïssatou Bah a été réinitialisé.");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(requests).toEqual([
        { method: "POST", url: "/users/u1/reset-password", body: { password: "nouveau-mot-de-passe", password_confirmation: "nouveau-mot-de-passe" } },
      ]);
    });

    it("shows the server's refusal", async () => {
      server.use(
        http.post(`${API_URL}/users/:id/reset-password`, () =>
          HttpResponse.json({ message: "Le mot de passe est trop faible.", error_code: "validation_failed", errors: { password: ["Le mot de passe est trop faible."] } }, { status: 422 }),
        ),
      );
      const { user, modal } = await openReset("Aïssatou Bah");

      await user.type(within(modal).getByLabelText("Nouveau mot de passe"), "12345678");
      await user.type(within(modal).getByLabelText("Confirmer le nouveau mot de passe"), "12345678");
      await user.click(within(modal).getByRole("button", { name: "Réinitialiser" }));

      expect(await within(modal).findByText("Le mot de passe est trop faible.")).toBeInTheDocument();
    });
  });

  describe("deleting an account", () => {
    it("deletes it after confirmation", async () => {
      const user = userEvent.setup();
      render(<UsersPage />);
      await screen.findByText("Mamadou Sow");

      await user.click(within(rowOf("Mamadou Sow")).getByRole("button", { name: "Supprimer le compte de Mamadou Sow" }));

      await waitFor(() => expect(screen.queryByText("Mamadou Sow")).not.toBeInTheDocument());
      expect(window.confirm).toHaveBeenCalledWith("Supprimer le compte de Mamadou Sow ?");
      expect(screen.getByRole("status")).toHaveTextContent("Le compte de Mamadou Sow a été supprimé.");
    });

    it("does nothing when the confirmation is declined", async () => {
      const user = userEvent.setup();
      vi.mocked(window.confirm).mockReturnValue(false);
      render(<UsersPage />);
      await screen.findByText("Mamadou Sow");

      await user.click(within(rowOf("Mamadou Sow")).getByRole("button", { name: "Supprimer le compte de Mamadou Sow" }));

      expect(requests).toEqual([]);
    });

    it("shows the server's refusal, e.g. deleting one's own account", async () => {
      server.use(
        http.delete(`${API_URL}/users/:id`, () =>
          HttpResponse.json({ message: "Vous ne pouvez pas supprimer votre propre compte.", error_code: "user_self_delete", context: {} }, { status: 409 }),
        ),
      );
      const user = userEvent.setup();
      render(<UsersPage />);
      await screen.findByText("Aïssatou Bah");

      await user.click(within(rowOf("Aïssatou Bah")).getByRole("button", { name: "Supprimer le compte de Aïssatou Bah" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Vous ne pouvez pas supprimer votre propre compte.");
      expect(screen.getByText("Aïssatou Bah")).toBeInTheDocument();
    });
  });
});
