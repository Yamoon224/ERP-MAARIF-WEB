import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import StaffDashboardPage from "@/app/(staff)/dashboard/page";
import type { DashboardStats } from "@/lib/api/types";
import { server } from "@/test/msw/server";
import { ACADEMIC_YEARS, API_URL, signInAs } from "@/test/fixtures";

const STATS: DashboardStats = {
  academic_year: "2026-2027",
  period: { from: "2026-10-01", to: "2027-06-30" },
  students: 30,
  classes: 2,
  students_by_class: [
    { id: "c1", name: "5eme B", count: 12 },
    { id: "c2", name: "6eme A", count: 18 },
  ],
  grades: { count: 40, average: 12.5 },
  attendance: { present: 80, absent: 15, late: 5, unjustified_absences: 4 },
  discipline: { sanctions: 2, summons: 3, summons_pending: 1 },
  accounting: {
    collected: 3_000_000,
    arrears: 500_000,
    recovery_rate: 85,
    by_month: [
      { month: "2026-10", total: 2_000_000 },
      { month: "2026-11", total: 1_000_000 },
    ],
    by_method: [],
  },
  expenses: {
    total: 800_000,
    count: 4,
    by_category: [
      { id: "k1", name: "Fournitures scolaires", total: 500_000, count: 2 },
      { id: "k2", name: "Registres et imprimés", total: 300_000, count: 2 },
    ],
    by_month: [
      { month: "2026-09", total: 300_000 },
      { month: "2026-10", total: 500_000 },
    ],
  },
};

function serve(stats: DashboardStats) {
  server.use(
    http.get(`${API_URL}/academic-years`, () => HttpResponse.json({ data: ACADEMIC_YEARS })),
    http.get(`${API_URL}/dashboard`, () => HttpResponse.json({ data: stats })),
  );
}

describe("StaffDashboardPage charts", () => {
  beforeEach(() => signInAs(["accounting.view", "expenses.view", "discipline.manage"]));

  it("draws the headcount by class and the attendance breakdown", async () => {
    serve(STATS);
    render(<StaffDashboardPage />);

    const headcount = await screen.findByRole("img", { name: "Effectif par classe" });
    expect(headcount).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Effectif par classe", hidden: true })).toHaveTextContent("18 élèves");

    const attendance = screen.getByRole("img", { name: "Répartition des présences, absences et retards" });
    expect(attendance).toBeInTheDocument();
    // 80 présents sur 100 pointages.
    expect(screen.getByText("Présents").closest("li")).toHaveTextContent("80 %");
    expect(screen.getByText("Absents").closest("li")).toHaveTextContent("15 %");
  });

  it("puts collections and expenses side by side, month by month, in one chart", async () => {
    serve(STATS);
    render(<StaffDashboardPage />);

    expect(await screen.findByRole("img", { name: "Encaissements et dépenses par mois" })).toBeInTheDocument();

    const table = screen.getByRole("table", { name: "Encaissements et dépenses par mois", hidden: true });
    // Septembre : des dépenses de rentrée, pas encore d'encaissement ; les mois des deux séries sont réunis.
    const september = within(table).getByRole("row", { name: /septembre 2026/, hidden: true });
    expect(september).toHaveTextContent(/2026\D*0\D+300\D000/);
    expect(within(table).getAllByRole("row", { hidden: true })).toHaveLength(4); // en-tête + sept., oct., nov.
  });

  it("breaks the expenses down by category and shows the balance", async () => {
    serve(STATS);
    render(<StaffDashboardPage />);

    expect(await screen.findByRole("img", { name: "Répartition des dépenses par catégorie" })).toBeInTheDocument();
    expect(screen.getByText("Fournitures scolaires").closest("li")).toHaveTextContent("63 %");

    // 3 000 000 encaissés - 800 000 dépensés.
    const balance = screen.getByText("Solde").parentElement?.parentElement as HTMLElement;
    expect(balance).toHaveTextContent(/2\s?200\s?000/);
  });

  it("hides the money charts from someone without access to accounting or expenses", async () => {
    signInAs([], ["teacher"]);
    serve({ ...STATS, discipline: null, accounting: null, expenses: null });
    render(<StaffDashboardPage />);

    expect(await screen.findByRole("img", { name: "Effectif par classe" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Encaissements|dépenses/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Solde")).not.toBeInTheDocument();
  });

  it("only charts what exists: no attendance ring without any roll call, no class bars without a class", async () => {
    serve({ ...STATS, attendance: { present: 0, absent: 0, late: 0, unjustified_absences: 0 }, students_by_class: [] });
    render(<StaffDashboardPage />);

    expect(await screen.findByText("Aucun pointage sur la période.")).toBeInTheDocument();
    expect(screen.getByText("Aucune classe avec des élèves inscrits.")).toBeInTheDocument();
  });
});
