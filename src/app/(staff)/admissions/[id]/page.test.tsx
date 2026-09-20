import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdmissionDetailPage from "@/app/(staff)/admissions/[id]/page";
import { useAuthStore } from "@/lib/auth/store";
import { server } from "@/test/msw/server";
import type { Admission } from "@/lib/api/types";

const API_URL = "http://localhost:8000/api";

const ACCEPTED: Admission = {
  id: "7",
  reference: "ADM-2026-000007",
  academic_year: "2025-2026",
  level: "6eme",
  first_name: "Mariama",
  last_name: "Barry",
  full_name: "Mariama Barry",
  gender: "F",
  birth_date: null,
  previous_school: null,
  guardian_name: "Alpha Barry",
  guardian_phone: "+224620000000",
  guardian_email: null,
  address: null,
  notes: null,
  status: "accepted",
  status_label: "Admis",
  submitted_on: "2026-01-15",
  decision_note: null,
  decided_at: null,
  enrolled_at: null,
};

function signIn(permissions: string[]) {
  useAuthStore.getState().setSession("token", "staff", {
    id: "1",
    name: "Admin",
    email: "admin@maarif.test",
    phone: null,
    type: "staff",
    roles: ["admin"],
    permissions,
  });
}

async function renderPage() {
  render(
    <Suspense fallback={null}>
      <AdmissionDetailPage params={Promise.resolve({ id: "7" })} />
    </Suspense>,
  );
  await screen.findByRole("heading", { name: "Mariama Barry" });
}

describe("AdmissionDetailPage", () => {
  it("enrolls an accepted candidate in the chosen class and shows the portal credentials once", async () => {
    signIn(["admissions.view", "admissions.manage"]);
    let enrolledClassId: string | undefined;

    server.use(
      http.get(`${API_URL}/admissions/7`, () => HttpResponse.json({ data: ACCEPTED })),
      http.get(`${API_URL}/classes`, () =>
        HttpResponse.json({
          data: [{ id: "c1", name: "6eme A", level: "6eme", academic_year: "2025-2026", monthly_fee: 0 }],
          meta: { current_page: 1, last_page: 1, per_page: 100, total: 1 },
        }),
      ),
      http.post(`${API_URL}/admissions/7/enroll`, async ({ request }) => {
        enrolledClassId = ((await request.json()) as { school_class_id: string }).school_class_id;

        return HttpResponse.json(
          {
            data: {
              application: { ...ACCEPTED, status: "enrolled", status_label: "Inscrit", student: { id: "s1", matricule: "MAA-2026-000042" } },
              student: { id: "s1", matricule: "MAA-2026-000042" },
              initial_password: "Secret12345",
            },
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();

    await renderPage();
    await user.click(await screen.findByRole("button", { name: /Inscrire l'élève/ }));

    expect(await screen.findByText("Matricule : MAA-2026-000042")).toBeInTheDocument();
    expect(screen.getByText("Mot de passe : Secret12345")).toBeInTheDocument();
    expect(enrolledClassId).toBe("c1");
    // Une fois inscrit, le dossier n'offre plus d'action d'instruction.
    expect(screen.queryByRole("button", { name: "Admettre" })).not.toBeInTheDocument();
  });

  it("requires a note before rejecting and does not call the API without one", async () => {
    signIn(["admissions.view", "admissions.manage"]);
    let statusCalls = 0;

    server.use(
      http.get(`${API_URL}/admissions/7`, () => HttpResponse.json({ data: { ...ACCEPTED, status: "pending", status_label: "En attente" } })),
      http.post(`${API_URL}/admissions/7/status`, () => {
        statusCalls += 1;
        return HttpResponse.json({ data: { ...ACCEPTED, status: "rejected", status_label: "Refusé" } });
      }),
    );
    const user = userEvent.setup();

    await renderPage();
    await user.click(screen.getByRole("button", { name: "Refuser" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Un refus doit être motivé");
    expect(statusCalls).toBe(0);

    await user.type(screen.getByLabelText(/Note/), "Classe complète");
    await user.click(screen.getByRole("button", { name: "Refuser" }));

    await screen.findByText("Refusé");
    expect(statusCalls).toBe(1);
  });

  it("hides the actions from users who may only view admissions", async () => {
    signIn(["admissions.view"]);
    server.use(http.get(`${API_URL}/admissions/7`, () => HttpResponse.json({ data: ACCEPTED })));

    await renderPage();

    expect(screen.queryByRole("button", { name: "Admettre" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Inscrire l'élève/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Supprimer le dossier/ })).not.toBeInTheDocument();
  });
});
