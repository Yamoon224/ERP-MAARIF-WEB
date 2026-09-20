import { Suspense } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import TermDetailPage from "@/app/(staff)/trimestres/[id]/page";
import { server } from "@/test/msw/server";
import { API_URL, paged, signInAs } from "@/test/fixtures";

const term = { id: "t1", name: "1er trimestre", academic_year: "2025-2026", starts_at: "2025-10-01", ends_at: "2025-12-31", is_current: false };

const overview = {
  classes: 2,
  subjects: 3,
  students: 25,
  grades: 120,
  average: 13.42,
  attendance: { present: 300, absent: 12, late: 5, unjustified_absences: 7 },
  sanctions: 4,
  summons: 6,
};

/**
 * La page lit ses paramètres avec `use(params)` : le rendu suspend jusqu'à ce que la promesse soit
 * résolue, ce qui exige d'attendre dans `act` pour que React relance le rendu.
 */
async function mount() {
  await act(async () => {
    render(
      <Suspense fallback={<p>Suspense...</p>}>
        <TermDetailPage params={Promise.resolve({ id: "t1" })} />
      </Suspense>,
    );
  });
}

async function renderPage() {
  await mount();
  await screen.findByRole("heading", { name: /1er trimestre/ });
}

describe("TermDetailPage", () => {
  beforeEach(() => {
    server.use(
      http.get(`${API_URL}/terms/t1`, () => HttpResponse.json({ data: term })),
      http.get(`${API_URL}/terms/t1/overview`, () => HttpResponse.json({ data: overview })),
      http.get(`${API_URL}/classes`, () =>
        HttpResponse.json(paged([{ id: "c1", name: "6eme A", level: "6eme", academic_year: "2025-2026", monthly_fee: 0, students_count: 25, main_teacher: { id: "u", name: "Mariam Diallo" } }])),
      ),
      http.get(`${API_URL}/terms/t1/subjects`, () =>
        HttpResponse.json({ data: [{ id: "m1", name: "Mathematiques", code: "MATH", coefficient: 4, classes_count: 2, grades_count: 50, average: 12.5 }] }),
      ),
      http.get(`${API_URL}/terms/t1/students`, () =>
        HttpResponse.json(
          paged([{ enrollment_id: "en1", student: { id: "s1", name: "Fatoumata Camara", matricule: "MAA-2025-000001", is_active: true }, school_class: { id: "c1", name: "6eme A" }, average: 15.25, absences: 2 }]),
        ),
      ),
      http.get(`${API_URL}/students/s1/bulletin`, () =>
        HttpResponse.json({
          data: {
            student: { id: "s1", name: "Fatoumata Camara", matricule: "MAA-2025-000001" },
            term_id: "t1",
            subjects: [{ subject: "Mathematiques", code: "MATH", coefficient: 4, average: 16, grades_count: 3 }],
            overall_average: 15.25,
          },
        }),
      ),
      http.get(`${API_URL}/grades`, () =>
        HttpResponse.json(
          paged([
            {
              id: "g1",
              student: { id: "s1", name: "Fatoumata Camara", matricule: "MAA-2025-000001" },
              subject: { id: "m1", name: "Mathematiques", code: "MATH" },
              term: { id: "t1", name: "1er trimestre" },
              type: "devoir",
              label: null,
              value: 16,
              max_value: 20,
              normalized_on_20: 16,
              recorded_at: "2025-11-05",
              comment: null,
            },
          ]),
        ),
      ),
      http.get(`${API_URL}/subjects`, () => HttpResponse.json(paged([]))),
      http.get(`${API_URL}/sanctions`, () => HttpResponse.json(paged([]))),
      http.get(`${API_URL}/summons`, () => HttpResponse.json(paged([]))),
      http.get(`${API_URL}/attendance-records/summary`, () =>
        HttpResponse.json({ data: { total: 317, present: 300, absent: 12, late: 5, justified_absences: 5, unjustified_absences: 7, top_absentees: [] } }),
      ),
      http.get(`${API_URL}/attendance-records`, () => HttpResponse.json(paged([]))),
    );
  });

  it("presents the term with its counters", async () => {
    signInAs(["academics.view", "students.view", "grades.manage", "discipline.manage", "attendance.manage"]);
    await renderPage();

    expect(screen.getByText("— 2025-2026")).toBeInTheDocument();
    expect(screen.getByText(/du 01\/10\/2025 au 31\/12\/2025/)).toBeInTheDocument();
    expect(screen.getByText("13.42/20")).toBeInTheDocument();
    expect(screen.getByText(/7 non justifiée\(s\) · 5 retard\(s\)/)).toBeInTheDocument();
  });

  it("offers every section to an administrator, with counters", async () => {
    signInAs(["academics.view", "students.view", "grades.manage", "discipline.manage", "attendance.manage"]);
    await renderPage();

    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");

    expect(tabs.map((tab) => tab.textContent?.replace(/\d+$/, ""))).toEqual([
      "Classes",
      "Matières",
      "Élèves",
      "Notes",
      "Sanctions",
      "Convocations",
      "Présences",
    ]);
    expect(screen.getByRole("tab", { name: /Élèves/ })).toHaveTextContent("25");
  });

  it("hides the sections a teacher may not open", async () => {
    signInAs(["academics.view", "students.view", "grades.manage", "attendance.manage"], ["teacher"]);
    await renderPage();

    expect(screen.queryByRole("tab", { name: /Sanctions/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Convocations/ })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Notes/ })).toBeInTheDocument();
  });

  it("lists the classes of the term's academic year first, then the subjects", async () => {
    signInAs(["academics.view", "students.view"]);
    const user = userEvent.setup();
    await renderPage();

    expect(await screen.findByText("6eme A")).toBeInTheDocument();
    expect(screen.getByText("Mariam Diallo")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Matières/ }));

    expect(await screen.findByText("Mathematiques")).toBeInTheDocument();
    expect(screen.getByText("12.50/20")).toBeInTheDocument();
  });

  it("shows each student's average and unfolds their report card", async () => {
    signInAs(["academics.view", "students.view"]);
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByRole("tab", { name: /Élèves/ }));

    const row = (await screen.findByText("Fatoumata Camara")).closest("tr") as HTMLElement;
    expect(within(row).getByText("15.25/20")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Dossier" })).toHaveAttribute("href", "/eleves/s1");

    await user.click(within(row).getByRole("button", { name: /Afficher les notes de Fatoumata Camara/ }));

    expect(await screen.findByText("16/20")).toBeInTheDocument();
    expect(screen.getAllByText("Moyenne générale")).toHaveLength(2); // la carte du trimestre + le bulletin de l'élève

    await user.click(within(row).getByRole("button", { name: /Masquer les notes/ }));
    await waitFor(() => expect(screen.queryByText("16/20")).not.toBeInTheDocument());
  });

  it("moves between sections with the arrow keys", async () => {
    signInAs(["academics.view", "students.view"]);
    const user = userEvent.setup();
    await renderPage();

    screen.getByRole("tab", { name: /Classes/ }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: /Matières/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Matières/ })).toHaveFocus();
  });

  it("reads the grades of the term in their own section", async () => {
    signInAs(["academics.view", "students.view", "grades.manage"]);
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByRole("tab", { name: /Notes/ }));

    expect(await screen.findByText("16/20")).toBeInTheDocument();
    expect(screen.getByText("05/11/2025")).toBeInTheDocument();
  });

  it("says so when the term cannot be loaded", async () => {
    signInAs(["academics.view"]);
    server.use(http.get(`${API_URL}/terms/t1`, () => HttpResponse.json({ message: "Ressource introuvable." }, { status: 404 })));
    await mount();

    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de charger ce trimestre.");
  });
});
