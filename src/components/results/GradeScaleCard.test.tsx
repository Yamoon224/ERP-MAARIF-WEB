import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GradeScaleCard } from "@/components/results/GradeScaleCard";
import { server } from "@/test/msw/server";
import type { SchoolClass } from "@/lib/api/types";

const API_URL = "http://localhost:8000/api";

const SCHOOL_CLASS = { id: "c-6a", name: "6eme A" };
const SIBLING: SchoolClass = { id: "c-6b", name: "6eme B", level: "6eme", academic_year: "2025-2026", monthly_fee: 0 };

function mockBands(bands: unknown[]) {
  return http.get(`${API_URL}/classes/${SCHOOL_CLASS.id}/grade-scale`, () => HttpResponse.json({ data: bands }));
}

describe("GradeScaleCard", () => {
  it("loads the class's existing bands", async () => {
    server.use(
      mockBands([
        {
          id: "b1",
          min_average: 2,
          max_average: 9,
          label: "Redouble",
          decision: { value: "repeat", label: "Redoublant" },
        },
      ]),
    );
    render(<GradeScaleCard schoolClass={SCHOOL_CLASS} siblingClasses={[]} />);

    expect(await screen.findByDisplayValue("Redouble")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("9")).toBeInTheDocument();
  });

  it("explains that a class without bands keeps the school's default scale", async () => {
    server.use(mockBands([]));
    render(<GradeScaleCard schoolClass={SCHOOL_CLASS} siblingClasses={[]} />);

    expect(await screen.findByText(/Aucune tranche/)).toBeInTheDocument();
  });

  it("saves the edited bands and shows the confirmation", async () => {
    let body: unknown;
    server.use(
      mockBands([]),
      http.put(`${API_URL}/classes/${SCHOOL_CLASS.id}/grade-scale`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          data: [{ id: "b1", min_average: 2, max_average: 9, label: "Redouble", decision: null }],
        });
      }),
    );
    const user = userEvent.setup();
    render(<GradeScaleCard schoolClass={SCHOOL_CLASS} siblingClasses={[]} />);

    await screen.findByText(/Aucune tranche/);
    await user.click(screen.getByRole("button", { name: /Ajouter une tranche/ }));

    const row = screen.getByPlaceholderText("Bien, Redouble...").closest("tr")!;
    const minInput = within(row).getAllByRole("spinbutton")[0];
    const maxInput = within(row).getAllByRole("spinbutton")[1];
    await user.clear(minInput);
    await user.type(minInput, "2");
    await user.clear(maxInput);
    await user.type(maxInput, "9");
    await user.type(within(row).getByPlaceholderText("Bien, Redouble..."), "Redouble");

    await user.click(screen.getByRole("button", { name: /Enregistrer le barème/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("Barème enregistré.");
    expect(body).toEqual({ bands: [{ min_average: 2, max_average: 9, label: "Redouble", decision: null }] });
  });

  it("shows the server error when the bands overlap", async () => {
    server.use(
      mockBands([]),
      http.put(`${API_URL}/classes/${SCHOOL_CLASS.id}/grade-scale`, () =>
        HttpResponse.json(
          { message: "Les tranches du barème se chevauchent : chaque moyenne ne doit appartenir qu'à une seule tranche.", error_code: "grade_scale_overlap", context: {} },
          { status: 422 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<GradeScaleCard schoolClass={SCHOOL_CLASS} siblingClasses={[]} />);

    await screen.findByText(/Aucune tranche/);
    await user.click(screen.getByRole("button", { name: /Enregistrer le barème/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("chevauchent");
  });

  it("duplicates the scale to the classes selected", async () => {
    let targetIds: unknown;
    server.use(
      mockBands([]),
      http.post(`${API_URL}/classes/${SCHOOL_CLASS.id}/grade-scale/duplicate`, async ({ request }) => {
        targetIds = (await request.json() as { target_class_ids: string[] }).target_class_ids;
        return HttpResponse.json({ data: { duplicated: true } });
      }),
    );
    const user = userEvent.setup();
    render(<GradeScaleCard schoolClass={SCHOOL_CLASS} siblingClasses={[SIBLING]} />);

    await screen.findByText(/Aucune tranche/);
    await user.click(screen.getByRole("checkbox", { name: "6eme B" }));
    await user.click(screen.getByRole("button", { name: /Dupliquer/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("1 classe(s)");
    expect(targetIds).toEqual(["c-6b"]);
  });
});
