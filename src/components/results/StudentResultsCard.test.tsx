import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudentResultsCard, formatRank } from "@/components/results/StudentResultsCard";
import { server } from "@/test/msw/server";
import type { StudentResults } from "@/lib/api/types";

const API_URL = "http://localhost:8000/api";

const YEAR = { label: "2025-2026", starts_at: "2025-10-01", ends_at: "2026-06-30", is_current: true, terms: [] };

function results(overrides: Partial<StudentResults> = {}): StudentResults {
  return {
    student: { id: "s1", name: "Awa Camara", matricule: "MAA-2026-000001" },
    academic_year: "2025-2026",
    school_class: { id: "c1", name: "6eme A", level: "6eme" },
    pass_mark: 10,
    periods: [
      {
        kind: "term",
        key: "t1",
        label: "1er trimestre",
        academic_year: "2025-2026",
        term_ids: ["t1"],
        average: 12,
        rank: 3,
        ranked_count: 24,
        mention: "Assez bien",
        subjects: [{ subject_id: "m1", subject: "Mathematiques", code: "MATH", coefficient: 2, average: 12, grades_count: 2 }],
      },
      {
        kind: "annual",
        key: "annual",
        label: "Annuel 2025-2026",
        academic_year: "2025-2026",
        term_ids: ["t1"],
        average: 14.5,
        rank: 1,
        ranked_count: 24,
        mention: "Bien",
        subjects: [{ subject_id: "m1", subject: "Mathematiques", code: "MATH", coefficient: 2, average: 14.5, grades_count: 4 }],
      },
    ],
    suggested_decision: { value: "admitted", label: "Admis en classe supérieure" },
    decision: null,
    ...overrides,
  };
}

describe("formatRank", () => {
  it("writes the rank with its ordinal suffix and the number of ranked pupils", () => {
    expect(formatRank(1, 24)).toBe("1er / 24");
    expect(formatRank(3, 24)).toBe("3e / 24");
    expect(formatRank(2, null)).toBe("2e");
    expect(formatRank(null, 24)).toBe("—");
  });
});

describe("StudentResultsCard", () => {
  it("lists each period with its average, rank and mention, then the subjects of the selected one", async () => {
    server.use(
      http.get(`${API_URL}/academic-years`, () => HttpResponse.json({ data: [YEAR] })),
      http.get(`${API_URL}/students/s1/results`, () => HttpResponse.json({ data: results() })),
    );
    const user = userEvent.setup();
    render(<StudentResultsCard source="staff" studentId="s1" />);

    expect(await screen.findByText("Annuel 2025-2026")).toBeInTheDocument();
    expect(screen.getByText("14.50/20")).toBeInTheDocument();
    expect(screen.getByText("1er / 24")).toBeInTheDocument();
    // Par défaut, le détail suit la dernière période : l'année.
    expect(screen.getByText(/Détail par matière — Annuel 2025-2026/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "1er trimestre" }));
    expect(screen.getByText(/Détail par matière — 1er trimestre/)).toBeInTheDocument();
    expect(screen.getByText("3e / 24")).toBeInTheDocument();
  });

  it("shows the suggested decision to the staff only", async () => {
    server.use(
      http.get(`${API_URL}/academic-years`, () => HttpResponse.json({ data: [YEAR] })),
      http.get(`${API_URL}/parent/academic-years`, () => HttpResponse.json({ data: [YEAR] })),
      http.get(`${API_URL}/students/s1/results`, () => HttpResponse.json({ data: results() })),
      http.get(`${API_URL}/parent/results`, () => HttpResponse.json({ data: results() })),
    );

    const { unmount } = render(<StudentResultsCard source="staff" studentId="s1" />);
    expect(await screen.findByText("Suggéré : Admis en classe supérieure")).toBeInTheDocument();
    unmount();

    render(<StudentResultsCard source="parent" />);
    await screen.findByText("Annuel 2025-2026");
    expect(screen.queryByText(/Suggéré/)).not.toBeInTheDocument();
  });

  it("shows the validated decision to the parent", async () => {
    const decided = results({
      decision: { value: "admitted", label: "Admis en classe supérieure", note: null, average: 14.5, decided_at: "2026-07-01T10:00:00Z" },
    });
    server.use(
      http.get(`${API_URL}/parent/academic-years`, () => HttpResponse.json({ data: [YEAR] })),
      http.get(`${API_URL}/parent/results`, () => HttpResponse.json({ data: decided })),
    );

    render(<StudentResultsCard source="parent" />);

    expect(await screen.findByText("Admis en classe supérieure")).toBeInTheDocument();
  });

  it("explains itself when the student has no ranking yet", async () => {
    const unranked = results({
      school_class: null,
      periods: [{ ...results().periods[0], rank: null, ranked_count: null }],
      suggested_decision: null,
    });
    server.use(
      http.get(`${API_URL}/academic-years`, () => HttpResponse.json({ data: [YEAR] })),
      http.get(`${API_URL}/students/s1/results`, () => HttpResponse.json({ data: unranked })),
    );

    render(<StudentResultsCard source="staff" studentId="s1" />);

    expect(await screen.findByText("Non inscrit cette année")).toBeInTheDocument();
  });
});
