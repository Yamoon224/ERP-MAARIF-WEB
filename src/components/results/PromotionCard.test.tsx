import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromotionCard, summaryLines } from "@/components/results/PromotionCard";
import { server } from "@/test/msw/server";
import type { AcademicYear, PromotionSummary } from "@/lib/api/types";

const API_URL = "http://localhost:8000/api";

const SOURCE = { id: "c-old", name: "6eme A", academic_year: "2025-2026" };

function year(label: string): AcademicYear {
  return { label, starts_at: "", ends_at: "", is_current: false, terms: [] };
}

const SUMMARY: PromotionSummary = {
  promoted: 3,
  repeated: 1,
  excluded: 0,
  undecided: 2,
  already_enrolled: 0,
  without_class: 0,
  inactive: 0,
};

function mockClasses() {
  return http.get(`${API_URL}/classes`, ({ request }) => {
    const academicYear = new URL(request.url).searchParams.get("academic_year");
    const data =
      academicYear === "2026-2027"
        ? [
            { id: "c5", name: "5eme A", level: "5eme", academic_year: "2026-2027", monthly_fee: 0 },
            { id: "c6", name: "6eme A", level: "6eme", academic_year: "2026-2027", monthly_fee: 0 },
          ]
        : [];

    return HttpResponse.json({ data, meta: { current_page: 1, last_page: 1, per_page: 100, total: data.length } });
  });
}

describe("summaryLines", () => {
  it("omits the counters that are zero and flags what is left to do", () => {
    expect(summaryLines(SUMMARY)).toEqual([
      { text: "3 élève(s) admis réinscrit(s) en classe supérieure", warning: false },
      { text: "1 redoublant(s) réinscrit(s)", warning: false },
      { text: "2 élève(s) sans décision enregistrée : validez les décisions puis relancez le passage", warning: true },
    ]);
  });
});

describe("PromotionCard", () => {
  it("only targets a later year, and cannot run before the admitted class is chosen", async () => {
    server.use(mockClasses());
    render(<PromotionCard sourceClass={SOURCE} years={[year("2024-2025"), year("2025-2026"), year("2026-2027")]} />);

    const years = screen.getByLabelText("Année d'accueil");
    expect(Array.from((years as HTMLSelectElement).options).map((option) => option.value)).toEqual(["2026-2027"]);
    expect(screen.getByRole("button", { name: /Réinscrire pour 2026-2027/ })).toBeDisabled();
    // La classe apparaît dans les deux listes : celle des admis et celle des redoublants.
    expect(await screen.findAllByRole("option", { name: "5eme A" })).toHaveLength(2);
  });

  it("sends the chosen classes and shows what was done and what remains", async () => {
    let body: unknown;
    server.use(
      mockClasses(),
      http.post(`${API_URL}/classes/c-old/promotions`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: SUMMARY });
      }),
    );
    const user = userEvent.setup();
    const promoted: PromotionSummary[] = [];
    render(<PromotionCard sourceClass={SOURCE} years={[year("2025-2026"), year("2026-2027")]} onPromoted={(summary) => promoted.push(summary)} />);

    await screen.findAllByRole("option", { name: "5eme A" });
    await user.selectOptions(screen.getByLabelText("Classe des admis"), "c5");
    await user.selectOptions(screen.getByLabelText("Classe des redoublants"), "c6");
    await user.click(screen.getByRole("button", { name: /Réinscrire pour 2026-2027/ }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("3 élève(s) admis réinscrit(s) en classe supérieure");
    expect(status).toHaveTextContent("2 élève(s) sans décision enregistrée");
    expect(body).toEqual({ admitted_class_id: "c5", repeat_class_id: "c6" });
    expect(promoted).toEqual([SUMMARY]);
  });

  it("does not reinscribe repeaters unless a class is chosen for them", async () => {
    let body: unknown;
    server.use(
      mockClasses(),
      http.post(`${API_URL}/classes/c-old/promotions`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: SUMMARY });
      }),
    );
    const user = userEvent.setup();
    render(<PromotionCard sourceClass={SOURCE} years={[year("2026-2027")]} />);

    await screen.findAllByRole("option", { name: "5eme A" });
    await user.selectOptions(screen.getByLabelText("Classe des admis"), "c5");
    await user.click(screen.getByRole("button", { name: /Réinscrire pour 2026-2027/ }));

    await screen.findByRole("status");
    expect(body).toEqual({ admitted_class_id: "c5", repeat_class_id: null });
  });

  it("shows the API error when the classes are refused", async () => {
    server.use(
      mockClasses(),
      http.post(`${API_URL}/classes/c-old/promotions`, () =>
        HttpResponse.json({ message: "Les classes d'accueil doivent appartenir à une année postérieure.", error_code: "promotion_invalid_target", context: {} }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    render(<PromotionCard sourceClass={SOURCE} years={[year("2026-2027")]} />);

    await screen.findAllByRole("option", { name: "5eme A" });
    await user.selectOptions(screen.getByLabelText("Classe des admis"), "c5");
    await user.click(screen.getByRole("button", { name: /Réinscrire pour 2026-2027/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("année postérieure");
  });

  it("explains that a later year must exist first", () => {
    render(<PromotionCard sourceClass={SOURCE} years={[year("2025-2026")]} />);

    expect(screen.getByText(/Aucune année postérieure à 2025-2026/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Réinscrire/ })).not.toBeInTheDocument();
  });
});
