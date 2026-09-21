import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import RolesPage from "@/app/(staff)/roles/page";
import type { Permission, Role } from "@/lib/api/types";
import { server } from "@/test/msw/server";
import { API_URL, paged, signInAs } from "@/test/fixtures";

const PERMISSIONS: Permission[] = [
  { id: "p1", name: "students.view", description: "Consulter le dossier des élèves.", group: "students", group_label: "Élèves" },
  { id: "p2", name: "students.manage", description: "Inscrire un élève.", group: "students", group_label: "Élèves" },
  { id: "p3", name: "grades.manage", description: "Saisir les notes.", group: "grades", group_label: "Notes" },
];

let roles: Role[] = [];
let grants: Record<string, string[]> = {};
let requests: Array<{ method: string; url: string; body: unknown }> = [];

function summary(role: Role): Role {
  return { ...role, permissions: undefined, permissions_count: grants[role.id]?.length ?? 0 };
}

function seed() {
  roles = [
    { id: "r1", name: "admin", label: "Administrateur", is_system: true, users_count: 1 },
    { id: "r2", name: "teacher", label: "Enseignant", is_system: true, users_count: 4 },
    { id: "r3", name: "Secrétaire", label: "Secrétaire", is_system: false, users_count: 0 },
  ];
  grants = { r1: PERMISSIONS.map((permission) => permission.name), r2: ["students.view", "grades.manage"], r3: [] };
}

function rowOf(label: string): HTMLElement {
  return screen.getByText(label, { selector: "span" }).closest("tr") as HTMLElement;
}

describe("RolesPage", () => {
  beforeEach(() => {
    seed();
    requests = [];
    signInAs(["roles.manage"]);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    server.use(
      http.get(`${API_URL}/permissions`, () => HttpResponse.json({ data: PERMISSIONS })),
      http.get(`${API_URL}/roles`, () => HttpResponse.json(paged(roles.map(summary)))),
      http.get(`${API_URL}/roles/:id`, ({ params }) => {
        const role = roles.find((candidate) => candidate.id === params.id)!;
        return HttpResponse.json({ data: { ...role, permissions: grants[role.id] } });
      }),
      http.post(`${API_URL}/roles`, async ({ request }) => {
        const body = (await request.json()) as { name: string };
        requests.push({ method: "POST", url: "/roles", body });
        const created: Role = { id: "r9", name: body.name, label: body.name, is_system: false, users_count: 0 };
        roles = [...roles, created];
        grants.r9 = [];
        return HttpResponse.json({ data: { ...created, permissions: [] } }, { status: 201 });
      }),
      http.put(`${API_URL}/roles/:id`, async ({ request, params }) => {
        const body = (await request.json()) as { name: string };
        requests.push({ method: "PUT", url: `/roles/${params.id}`, body });
        roles = roles.map((role) => (role.id === params.id ? { ...role, name: body.name, label: body.name } : role));
        return HttpResponse.json({ data: roles.find((role) => role.id === params.id) });
      }),
      http.delete(`${API_URL}/roles/:id`, ({ params }) => {
        requests.push({ method: "DELETE", url: `/roles/${params.id}`, body: null });
        roles = roles.filter((role) => role.id !== params.id);
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(`${API_URL}/roles/:id/permissions`, async ({ request, params }) => {
        const body = (await request.json()) as { permissions: string[] };
        requests.push({ method: "POST", url: `/roles/${params.id}/permissions`, body });
        const id = String(params.id);
        grants[id] = [...new Set([...grants[id], ...body.permissions])];
        return HttpResponse.json({ data: { ...roles.find((role) => role.id === id), permissions: grants[id] } });
      }),
      http.delete(`${API_URL}/roles/:id/permissions/:permissionId`, ({ params }) => {
        requests.push({ method: "DELETE", url: `/roles/${params.id}/permissions/${params.permissionId}`, body: null });
        const id = String(params.id);
        const permission = PERMISSIONS.find((candidate) => candidate.id === params.permissionId)!;
        grants[id] = grants[id].filter((name) => name !== permission.name);
        return HttpResponse.json({ data: { ...roles.find((role) => role.id === id), permissions: grants[id] } });
      }),
      http.put(`${API_URL}/roles/:id/permissions`, async ({ request, params }) => {
        const body = (await request.json()) as { permissions: string[] };
        requests.push({ method: "PUT", url: `/roles/${params.id}/permissions`, body });
        grants[String(params.id)] = body.permissions;
        return HttpResponse.json({ data: { ...roles.find((role) => role.id === params.id), permissions: body.permissions } });
      }),
    );
  });

  it("lists the roles with their type, permissions and users", async () => {
    render(<RolesPage />);

    const teacher = await screen.findByText("Enseignant", { selector: "span" }).then((cell) => cell.closest("tr") as HTMLElement);
    expect(within(teacher).getByText("Système")).toBeInTheDocument();
    expect(teacher).toHaveTextContent("2");
    expect(teacher).toHaveTextContent("4");
    expect(within(rowOf("Secrétaire")).getByText("Personnalisé")).toBeInTheDocument();
  });

  it("only lets custom roles be renamed or deleted", async () => {
    render(<RolesPage />);
    await screen.findByText("Secrétaire", { selector: "span" });

    expect(within(rowOf("Enseignant")).queryByRole("button", { name: /Renommer|Supprimer/ })).not.toBeInTheDocument();
    expect(within(rowOf("Secrétaire")).getByRole("button", { name: "Renommer Secrétaire" })).toBeInTheDocument();
    expect(within(rowOf("Secrétaire")).getByRole("button", { name: "Supprimer Secrétaire" })).toBeInTheDocument();
  });

  it("creates a role and opens its permissions right away", async () => {
    const user = userEvent.setup();
    render(<RolesPage />);
    await screen.findByText("Secrétaire", { selector: "span" });

    await user.type(screen.getByLabelText("Nouveau rôle"), "Surveillant général");
    await user.click(screen.getByRole("button", { name: /Créer le rôle/ }));

    expect(await screen.findByRole("region", { name: "Permissions du rôle Surveillant général" })).toBeInTheDocument();
    expect(requests).toEqual([{ method: "POST", url: "/roles", body: { name: "Surveillant général" } }]);
  });

  it("refuses a name that is too short without calling the API", async () => {
    const user = userEvent.setup();
    render(<RolesPage />);
    await screen.findByText("Secrétaire", { selector: "span" });

    await user.type(screen.getByLabelText("Nouveau rôle"), "A");
    await user.click(screen.getByRole("button", { name: /Créer le rôle/ }));

    expect(await screen.findByText("Le nom doit compter au moins 2 caractères.")).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it("shows the server's refusal when the name is already taken", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_URL}/roles`, () =>
        HttpResponse.json({ message: "Le nom du rôle est déjà utilisé.", error_code: "validation_failed", errors: {} }, { status: 422 }),
      ),
    );
    render(<RolesPage />);
    await screen.findByText("Secrétaire", { selector: "span" });

    await user.type(screen.getByLabelText("Nouveau rôle"), "teacher");
    await user.click(screen.getByRole("button", { name: /Créer le rôle/ }));

    expect(await screen.findByText("Le nom du rôle est déjà utilisé.")).toBeInTheDocument();
  });

  it("renames a custom role", async () => {
    const user = userEvent.setup();
    render(<RolesPage />);
    await screen.findByText("Secrétaire", { selector: "span" });

    await user.click(screen.getByRole("button", { name: "Renommer Secrétaire" }));
    const input = screen.getByLabelText("Nom de Secrétaire");
    await user.clear(input);
    await user.type(input, "Secrétaire général");
    await user.click(screen.getByRole("button", { name: "Enregistrer Secrétaire" }));

    expect(await screen.findByText("Secrétaire général", { selector: "span" })).toBeInTheDocument();
    expect(requests).toEqual([{ method: "PUT", url: "/roles/r3", body: { name: "Secrétaire général" } }]);
  });

  it("deletes a custom role after confirmation", async () => {
    const user = userEvent.setup();
    render(<RolesPage />);
    await screen.findByText("Secrétaire", { selector: "span" });

    await user.click(screen.getByRole("button", { name: "Supprimer Secrétaire" }));

    await waitFor(() => expect(screen.queryByText("Secrétaire", { selector: "span" })).not.toBeInTheDocument());
    expect(window.confirm).toHaveBeenCalledWith("Supprimer le rôle « Secrétaire » ?");
    expect(requests).toEqual([{ method: "DELETE", url: "/roles/r3", body: null }]);
  });

  it("does not delete a role when the confirmation is declined", async () => {
    const user = userEvent.setup();
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<RolesPage />);
    await screen.findByText("Secrétaire", { selector: "span" });

    await user.click(screen.getByRole("button", { name: "Supprimer Secrétaire" }));

    expect(requests).toEqual([]);
    expect(screen.getByText("Secrétaire", { selector: "span" })).toBeInTheDocument();
  });

  it("shows the server's refusal when a role is still assigned", async () => {
    const user = userEvent.setup();
    server.use(
      http.delete(`${API_URL}/roles/:id`, () =>
        HttpResponse.json(
          { message: "Ce rôle est attribué à 2 utilisateurs : retirez-le de leurs comptes avant de le supprimer.", error_code: "role_in_use", context: {} },
          { status: 409 },
        ),
      ),
    );
    render(<RolesPage />);
    await screen.findByText("Secrétaire", { selector: "span" });

    await user.click(screen.getByRole("button", { name: "Supprimer Secrétaire" }));

    expect(await screen.findByText(/Ce rôle est attribué à 2 utilisateurs/)).toBeInTheDocument();
    expect(screen.getByText("Secrétaire", { selector: "span" })).toBeInTheDocument();
  });

  describe("permissions", () => {
    async function openPermissionsOf(label: string) {
      const user = userEvent.setup();
      render(<RolesPage />);
      await screen.findByText(label, { selector: "span" });
      await user.click(screen.getByRole("button", { name: `Permissions de ${label}` }));

      const editor = await screen.findByRole("region", { name: `Permissions du rôle ${label}` });
      await within(editor).findByRole("checkbox", { name: /students\.view/ });

      return { user, editor };
    }

    it("groups the catalogue and checks what the role already has", async () => {
      const { editor } = await openPermissionsOf("Enseignant");

      expect(within(editor).getByText("Élèves", { selector: "legend" })).toBeInTheDocument();
      expect(within(editor).getByText("Notes", { selector: "legend" })).toBeInTheDocument();
      expect(within(editor).getByRole("checkbox", { name: /students\.view/ })).toBeChecked();
      expect(within(editor).getByRole("checkbox", { name: /grades\.manage/ })).toBeChecked();
      expect(within(editor).getByRole("checkbox", { name: /students\.manage/ })).not.toBeChecked();
    });

    it("grants a permission the moment its box is checked", async () => {
      const { user, editor } = await openPermissionsOf("Enseignant");

      await user.click(within(editor).getByRole("checkbox", { name: /students\.manage/ }));

      await waitFor(() => expect(within(editor).getByRole("checkbox", { name: /students\.manage/ })).toBeChecked());
      expect(requests).toEqual([{ method: "POST", url: "/roles/r2/permissions", body: { permissions: ["students.manage"] } }]);
      // L'effectif de la liste suit.
      await waitFor(() => expect(rowOf("Enseignant")).toHaveTextContent("3"));
    });

    it("revokes a permission the moment its box is unchecked", async () => {
      const { user, editor } = await openPermissionsOf("Enseignant");

      await user.click(within(editor).getByRole("checkbox", { name: /grades\.manage/ }));

      await waitFor(() => expect(within(editor).getByRole("checkbox", { name: /grades\.manage/ })).not.toBeChecked());
      expect(requests).toEqual([{ method: "DELETE", url: "/roles/r2/permissions/p3", body: null }]);
    });

    it("grants a whole group in one request", async () => {
      const { user, editor } = await openPermissionsOf("Enseignant");

      await user.click(within(editor).getByRole("button", { name: "Tout attribuer (Élèves)" }));

      await waitFor(() => expect(within(editor).getByRole("checkbox", { name: /students\.manage/ })).toBeChecked());
      expect(requests).toEqual([{ method: "PUT", url: "/roles/r2/permissions", body: { permissions: ["students.view", "grades.manage", "students.manage"] } }]);
      expect(within(editor).getByRole("button", { name: "Tout retirer (Élèves)" })).toBeInTheDocument();
    });

    it("puts the box back when the server refuses the change", async () => {
      server.use(
        http.post(`${API_URL}/roles/:id/permissions`, () =>
          HttpResponse.json({ message: "Vous n'avez pas les droits necessaires pour cette action.", error_code: "forbidden", context: {} }, { status: 403 }),
        ),
      );
      const { user, editor } = await openPermissionsOf("Enseignant");

      await user.click(within(editor).getByRole("checkbox", { name: /students\.manage/ }));

      expect(await screen.findByText("Vous n'avez pas les droits necessaires pour cette action.")).toBeInTheDocument();
      expect(within(editor).getByRole("checkbox", { name: /students\.manage/ })).not.toBeChecked();
    });

    it("locks the administrator's permissions", async () => {
      const { editor } = await openPermissionsOf("Administrateur");

      expect(within(editor).getByText(/possède toutes les permissions/)).toBeInTheDocument();
      for (const checkbox of within(editor).getAllByRole("checkbox")) {
        expect(checkbox).toBeChecked();
        expect(checkbox).toBeDisabled();
      }
      for (const button of within(editor).getAllByRole("button", { name: /Tout retirer/ })) {
        expect(button).toBeDisabled();
      }
    });

    it("closes the editor", async () => {
      const { user } = await openPermissionsOf("Enseignant");

      await user.click(screen.getByRole("button", { name: "Fermer l'éditeur de permissions" }));

      expect(screen.queryByRole("region", { name: /Permissions du rôle/ })).not.toBeInTheDocument();
    });
  });
});
