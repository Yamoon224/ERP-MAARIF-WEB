import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClassAssignments } from "@/components/staff/ClassAssignments";
import { server } from "@/test/msw/server";
import { API_URL } from "@/test/fixtures";
import type { StaffUser, Subject, TeachingAssignment } from "@/lib/api/types";

const maths: Subject = { id: "s-maths", name: "Maths", code: "MATH", coefficient: 4 };
const french: Subject = { id: "s-french", name: "Français", code: "FR", coefficient: 3 };

function teacher(id: string, name: string): StaffUser {
  return { id, name, email: `${id}@maarif.test`, phone: null, type: "staff", roles: ["teacher"], permissions: [] };
}

const mariam = teacher("t-1", "Mariam Diallo");
const ousmane = teacher("t-2", "Ousmane Camara");

/** Sert les matières et les affectations d'une classe ; `assigned` évolue avec les PUT et DELETE. */
function serveClass(assigned: TeachingAssignment[]) {
  const puts: string[] = [];
  const deletes: string[] = [];

  server.use(
    http.get(`${API_URL}/subjects`, () =>
      HttpResponse.json({ data: [maths, french], meta: { current_page: 1, last_page: 1, per_page: 100, total: 2 } }),
    ),
    http.get(`${API_URL}/classes/c-1/subjects`, () => HttpResponse.json({ data: assigned })),
    http.put(`${API_URL}/classes/c-1/subjects/:subjectId`, async ({ params, request }) => {
      const { teacher_id: teacherId } = (await request.json()) as { teacher_id: string };
      puts.push(`${params.subjectId}:${teacherId}`);
      const subject = params.subjectId === maths.id ? maths : french;
      const owner = teacherId === mariam.id ? mariam : ousmane;

      return HttpResponse.json({ data: { id: "a-new", subject, teacher: { id: owner.id, name: owner.name } } });
    }),
    http.delete(`${API_URL}/classes/c-1/subjects/:subjectId`, ({ params }) => {
      deletes.push(String(params.subjectId));

      return new HttpResponse(null, { status: 204 });
    }),
  );

  return { puts, deletes };
}

const mathsByMariam: TeachingAssignment = { id: "a-1", subject: maths, teacher: { id: mariam.id, name: mariam.name } };

describe("ClassAssignments", () => {
  it("lists every subject with its teacher and counts the ones that have none", async () => {
    serveClass([mathsByMariam]);
    render(<ClassAssignments schoolClassId="c-1" canManage teachers={[mariam, ousmane]} />);

    expect(await screen.findByLabelText("Enseignant de Maths")).toHaveValue(mariam.id);
    expect(screen.getByLabelText("Enseignant de Français")).toHaveValue("");
    expect(screen.getByText(/1 matière sur 2 a un enseignant/)).toBeInTheDocument();
  });

  it("gives a subject to a teacher, who can teach several subjects in the same class", async () => {
    const user = userEvent.setup();
    const { puts } = serveClass([mathsByMariam]);
    render(<ClassAssignments schoolClassId="c-1" canManage teachers={[mariam, ousmane]} />);

    await user.selectOptions(await screen.findByLabelText("Enseignant de Français"), mariam.id);

    await waitFor(() => expect(screen.getByLabelText("Enseignant de Français")).toHaveValue(mariam.id));
    expect(puts).toEqual(["s-french:t-1"]);
    expect(screen.getByLabelText("Enseignant de Maths")).toHaveValue(mariam.id);
  });

  it("replaces the teacher of a subject rather than adding a second one", async () => {
    const user = userEvent.setup();
    const { puts } = serveClass([mathsByMariam]);
    render(<ClassAssignments schoolClassId="c-1" canManage teachers={[mariam, ousmane]} />);

    await user.selectOptions(await screen.findByLabelText("Enseignant de Maths"), ousmane.id);

    await waitFor(() => expect(screen.getByLabelText("Enseignant de Maths")).toHaveValue(ousmane.id));
    expect(puts).toEqual(["s-maths:t-2"]);
    expect(screen.getByText(/1 matière sur 2 a un enseignant/)).toBeInTheDocument();
  });

  it("removes the assignment when « Non affecté » is chosen", async () => {
    const user = userEvent.setup();
    const { deletes } = serveClass([mathsByMariam]);
    render(<ClassAssignments schoolClassId="c-1" canManage teachers={[mariam]} />);

    await user.selectOptions(await screen.findByLabelText("Enseignant de Maths"), "");

    await waitFor(() => expect(screen.getByText(/0 matière sur 2 a un enseignant/)).toBeInTheDocument());
    expect(deletes).toEqual(["s-maths"]);
  });

  it("shows the server's message when the assignment is refused", async () => {
    const user = userEvent.setup();
    serveClass([]);
    server.use(
      http.put(`${API_URL}/classes/c-1/subjects/:subjectId`, () =>
        HttpResponse.json(
          { message: "Ce compte n'a pas le rôle enseignant.", error_code: "validation_failed", errors: {} },
          { status: 422 },
        ),
      ),
    );
    render(<ClassAssignments schoolClassId="c-1" canManage teachers={[mariam]} />);

    await user.selectOptions(await screen.findByLabelText("Enseignant de Maths"), mariam.id);

    expect(await screen.findByRole("alert")).toHaveTextContent("Ce compte n'a pas le rôle enseignant.");
    expect(screen.getByLabelText("Enseignant de Maths")).toHaveValue("");
  });

  it("is read-only for someone who cannot manage and marks the subjects they teach", async () => {
    serveClass([mathsByMariam]);
    render(<ClassAssignments schoolClassId="c-1" canManage={false} teachers={[]} currentUserId={mariam.id} />);

    expect(await screen.findByText("Mariam Diallo")).toBeInTheDocument();
    expect(screen.getByText("Vous")).toBeInTheDocument();
    expect(screen.getByText("Non affecté")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
