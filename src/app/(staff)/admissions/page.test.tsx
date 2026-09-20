import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdmissionsPage from "@/app/(staff)/admissions/page";
import { useAuthStore } from "@/lib/auth/store";
import { server } from "@/test/msw/server";
import type { Admission } from "@/lib/api/types";

const API_URL = "http://localhost:8000/api";

function admission(overrides: Partial<Admission>): Admission {
  return {
    id: "1",
    reference: "ADM-2026-000001",
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
    status: "pending",
    status_label: "En attente",
    submitted_on: "2026-01-15",
    decision_note: null,
    decided_at: null,
    enrolled_at: null,
    ...overrides,
  };
}

const APPLICATIONS = [
  admission({}),
  admission({ id: "2", reference: "ADM-2026-000002", first_name: "Ousmane", last_name: "Diallo", full_name: "Ousmane Diallo", status: "accepted" }),
];

function mockApi(seenParams: URLSearchParams[] = []) {
  server.use(
    http.get(`${API_URL}/academic-years`, () =>
      HttpResponse.json({ data: [{ label: "2025-2026", starts_at: "2025-10-01", ends_at: "2026-06-30", is_current: true, terms: [] }] }),
    ),
    http.get(`${API_URL}/admissions/summary`, () =>
      HttpResponse.json({
        data: { total: 2, by_status: { pending: 1, under_review: 0, accepted: 1, waitlisted: 0, rejected: 0, enrolled: 0 } },
      }),
    ),
    http.get(`${API_URL}/admissions`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      seenParams.push(params);
      const status = params.get("status");
      const rows = status ? APPLICATIONS.filter((application) => application.status === status) : APPLICATIONS;

      return HttpResponse.json({ data: rows, meta: { current_page: 1, last_page: 1, per_page: 10, total: rows.length } });
    }),
  );
}

describe("AdmissionsPage", () => {
  it("lists the applications with their status and a summary per status", async () => {
    mockApi();
    render(<AdmissionsPage />);

    expect(await screen.findByText("Mariama Barry")).toBeInTheDocument();
    expect(screen.getByText("Ousmane Diallo")).toBeInTheDocument();
    expect(screen.getByText("ADM-2026-000001")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Voir le dossier" })).toHaveLength(2);

    // Le statut apparaît dans le tableau ; la synthèse porte le compteur de chaque statut.
    const table = screen.getByRole("table");
    expect(within(table).getByText("En attente")).toBeInTheDocument();
    expect(within(table).getByText("Admis")).toBeInTheDocument();
    // « Liste d'attente » : une carte de synthèse et une option du filtre de statut.
    expect(await screen.findAllByText("Liste d'attente")).toHaveLength(2);
  });

  it("asks the API for the chosen status only", async () => {
    const seen: URLSearchParams[] = [];
    mockApi(seen);
    const user = userEvent.setup();
    render(<AdmissionsPage />);

    await screen.findByText("Mariama Barry");
    await user.selectOptions(screen.getByLabelText("Statut"), "accepted");

    await waitFor(() => expect(screen.queryByText("Mariama Barry")).not.toBeInTheDocument());
    expect(screen.getByText("Ousmane Diallo")).toBeInTheDocument();
    expect(seen.at(-1)?.get("status")).toBe("accepted");
  });

  it("only offers to create an application to users who may manage admissions", async () => {
    mockApi();
    const { unmount } = render(<AdmissionsPage />);
    await screen.findByText("Mariama Barry");
    expect(screen.queryByRole("link", { name: /Nouvelle candidature/ })).not.toBeInTheDocument();
    unmount();

    useAuthStore.getState().setSession("token", "staff", {
      id: "1",
      name: "Admin",
      email: "admin@maarif.test",
      phone: null,
      type: "staff",
      roles: ["admin"],
      permissions: ["admissions.view", "admissions.manage"],
    });
    render(<AdmissionsPage />);

    expect(await screen.findByRole("link", { name: /Nouvelle candidature/ })).toHaveAttribute("href", "/admissions/nouveau");
  });
});
