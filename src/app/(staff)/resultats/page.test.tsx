import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResultsPage from "@/app/(staff)/resultats/page";
import { useAuthStore } from "@/lib/auth/store";
import { server } from "@/test/msw/server";
import type { ClassResults } from "@/lib/api/types";

const API_URL = "http://localhost:8000/api";

const TERMS = [
  { id: "t1", name: "1er trimestre", starts_at: "2025-10-01", ends_at: "2025-12-31", is_current: false },
  { id: "t2", name: "2eme trimestre", starts_at: "2026-01-01", ends_at: "2026-03-31", is_current: true },
  { id: "t3", name: "3eme trimestre", starts_at: "2026-04-01", ends_at: "2026-06-30", is_current: false },
];

function classResults(kind: "term" | "semester" | "annual"): ClassResults {
  const annual = kind === "annual";

  return {
    school_class: { id: "c1", name: "6eme A", level: "6eme", academic_year: "2025-2026" },
    period: { kind, key: kind, label: kind, academic_year: "2025-2026", term_ids: [] },
    pass_mark: 10,
    stats: { students: 2, ranked: 2, average: 12.5, highest: 15, lowest: 10, passed: 2, pass_rate: 100 },
    rows: [
      {
        enrollment_id: "e1",
        student: { id: "s1", name: "Awa Camara", matricule: "MAA-2026-000001", is_active: true },
        average: 15,
        rank: 1,
        mention: "Bien",
        grades_count: 4,
        subjects_count: 2,
        suggested_decision: annual ? { value: "admitted", label: "Admis en classe supérieure" } : null,
        decision: null,
      },
      {
        enrollment_id: "e2",
        student: { id: "s2", name: "Bakary Diallo", matricule: "MAA-2026-000002", is_active: true },
        average: 10,
        rank: 2,
        mention: "Passable",
        grades_count: 3,
        subjects_count: 2,
        suggested_decision: annual ? { value: "admitted", label: "Admis en classe supérieure" } : null,
        decision: null,
      },
    ],
  };
}

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

function mockApi(requests: URLSearchParams[]) {
  server.use(
    http.get(`${API_URL}/academic-years`, () =>
      HttpResponse.json({ data: [{ label: "2025-2026", starts_at: "2025-10-01", ends_at: "2026-06-30", is_current: true, terms: TERMS }] }),
    ),
    http.get(`${API_URL}/classes`, () =>
      HttpResponse.json({
        data: [{ id: "c1", name: "6eme A", level: "6eme", academic_year: "2025-2026", monthly_fee: 0 }],
        meta: { current_page: 1, last_page: 1, per_page: 100, total: 1 },
      }),
    ),
    http.get(`${API_URL}/results`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);

      return HttpResponse.json({ data: classResults(params.get("period") as "term" | "semester" | "annual") });
    }),
  );
}

describe("ResultsPage", () => {
  it("shows the annual ranking of the class by default, with its statistics", async () => {
    const requests: URLSearchParams[] = [];
    mockApi(requests);
    signIn(["results.view"]);
    render(<ResultsPage />);

    expect(await screen.findByText("Awa Camara")).toBeInTheDocument();
    expect(screen.getByText("Bakary Diallo")).toBeInTheDocument();
    // La meilleure moyenne est aussi celle du premier de la classe : on la lit dans le tableau.
    expect(within(screen.getByRole("table")).getByText("15.00/20")).toBeInTheDocument();
    expect(screen.getByText("100 %")).toBeInTheDocument();
    expect(screen.getByText("1er")).toBeInTheDocument();
    expect(requests[0].get("period")).toBe("annual");
    expect(requests[0].get("school_class_id")).toBe("c1");
    // Sans le droit de décision, on lit la suggestion sans pouvoir la modifier.
    expect(screen.getAllByText(/Suggéré : Admis en classe supérieure/)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Valider les décisions/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Passage à l'année suivante")).not.toBeInTheDocument();
  });

  it("requests the first semester (terms 1 and 2), then a chosen term", async () => {
    const requests: URLSearchParams[] = [];
    mockApi(requests);
    signIn(["results.view"]);
    const user = userEvent.setup();
    render(<ResultsPage />);
    await screen.findByText("Awa Camara");

    await user.click(screen.getByRole("tab", { name: "Semestre" }));
    await waitFor(() => expect(requests.at(-1)?.get("period")).toBe("semester"));
    expect(requests.at(-1)?.get("semester")).toBe("1");

    await user.click(screen.getByRole("tab", { name: "Trimestre" }));
    await waitFor(() => expect(requests.at(-1)?.get("period")).toBe("term"));
    expect(requests.at(-1)?.get("term_id")).toBe("t1");

    await user.selectOptions(screen.getByRole("combobox", { name: "Trimestre" }), "t3");
    await waitFor(() => expect(requests.at(-1)?.get("term_id")).toBe("t3"));
    // Hors de l'année, la décision de passage n'a pas de sens.
    expect(screen.queryByText("Décision de passage")).not.toBeInTheDocument();
  });

  it("lets a manager record a promotion decision and validate the suggested ones", async () => {
    const requests: URLSearchParams[] = [];
    mockApi(requests);
    signIn(["results.view", "results.manage"]);
    const saved: Array<{ url: string; body: unknown }> = [];

    server.use(
      http.put(`${API_URL}/enrollments/e2/decision`, async ({ request }) => {
        saved.push({ url: request.url, body: await request.json() });
        return HttpResponse.json({ data: { enrollment_id: "e2", value: "repeat", label: "Redoublant", note: null, average: 10, decided_at: "2026-07-01T10:00:00Z" } });
      }),
      http.post(`${API_URL}/classes/c1/decisions/validate`, () => HttpResponse.json({ data: { validated: 2 } })),
    );
    const user = userEvent.setup();
    render(<ResultsPage />);
    await screen.findByText("Awa Camara");

    await user.selectOptions(screen.getByLabelText("Décision pour Bakary Diallo"), "repeat");
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0].body).toEqual({ decision: "repeat", note: null });

    await user.click(screen.getByRole("button", { name: /Valider les décisions suggérées/ }));
    expect(await screen.findByRole("status")).toHaveTextContent("2 décision(s) enregistrée(s).");

    // Le passage à l'année suivante est proposé sur la période annuelle seulement.
    expect(screen.getByText("Passage à l'année suivante")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Trimestre" }));
    await waitFor(() => expect(screen.queryByText("Passage à l'année suivante")).not.toBeInTheDocument());
  });
});
