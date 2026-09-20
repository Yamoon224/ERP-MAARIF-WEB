import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { server } from "@/test/msw/server";
import { ACADEMIC_YEARS, API_URL } from "@/test/fixtures";
import { resetPeriodStore, usePeriodFilter, type UsePeriodFilterOptions } from "@/lib/period/usePeriodFilter";

/** Petit écran qui expose les paramètres que les pages enverraient à l'API. */
function Harness(options: UsePeriodFilterOptions & { modes?: Array<"year" | "term" | "month"> }) {
  const { modes, ...hookOptions } = options;
  const filter = usePeriodFilter(hookOptions);

  return (
    <>
      <PeriodFilter filter={filter} modes={modes} />
      <output data-testid="params">{filter.isReady ? JSON.stringify(filter.params) : "loading"}</output>
    </>
  );
}

const params = () => JSON.parse(screen.getByTestId("params").textContent ?? "{}");

describe("PeriodFilter", () => {
  beforeEach(() => {
    resetPeriodStore();
    server.use(http.get(`${API_URL}/academic-years`, () => HttpResponse.json({ data: ACADEMIC_YEARS })));
  });

  it("starts on the current academic year, whole year", async () => {
    render(<Harness />);

    await waitFor(() => expect(params()).toEqual({ academic_year: "2026-2027" }));
    expect(screen.getByLabelText("Année scolaire")).toHaveValue("2026-2027");
    expect(screen.getByRole("radio", { name: "Année" })).toHaveAttribute("aria-checked", "true");
  });

  it("filters by term: the year's three terms are offered and the term id is sent", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await waitFor(() => expect(params().academic_year).toBe("2026-2027"));

    await user.click(screen.getByRole("radio", { name: "Trimestre" }));

    const termSelect = screen.getByLabelText("Trimestre");
    expect(Array.from(termSelect.querySelectorAll("option")).map((option) => option.textContent)).toEqual([
      "1er trimestre",
      "2eme trimestre",
      "3eme trimestre",
    ]);
    expect(params()).toEqual({ academic_year: "2026-2027", term_id: "t-2026-1" }); // le trimestre en cours

    await user.selectOptions(termSelect, "t-2026-3");

    expect(params()).toEqual({ academic_year: "2026-2027", term_id: "t-2026-3" });
  });

  it("filters by month: the months of the school year are offered, from October to June", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await waitFor(() => expect(params().academic_year).toBe("2026-2027"));

    await user.click(screen.getByRole("radio", { name: "Mois" }));

    const monthSelect = screen.getByLabelText("Mois");
    const options = Array.from(monthSelect.querySelectorAll("option"));
    expect(options).toHaveLength(9);
    expect(options[0]).toHaveTextContent("octobre 2026");
    expect(options[8]).toHaveTextContent("juin 2027");

    await user.selectOptions(monthSelect, "2027-01");

    expect(params()).toEqual({ academic_year: "2026-2027", month: "2027-01" });
  });

  it("re-anchors the term and the month when the academic year changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await waitFor(() => expect(params().academic_year).toBe("2026-2027"));
    await user.click(screen.getByRole("radio", { name: "Trimestre" }));
    await user.selectOptions(screen.getByLabelText("Trimestre"), "t-2026-3");

    await user.selectOptions(screen.getByLabelText("Année scolaire"), "2025-2026");

    // Un trimestre n'existe que dans son année : on retombe sur le premier de l'année choisie.
    expect(params()).toEqual({ academic_year: "2025-2026", term_id: "t-2025-1" });

    await user.click(screen.getByRole("radio", { name: "Mois" }));
    expect(params()).toEqual({ academic_year: "2025-2026", month: "2025-10" });
  });

  it("keeps the selection when moving to another screen", async () => {
    const user = userEvent.setup();
    const first = render(<Harness />);
    await waitFor(() => expect(params().academic_year).toBe("2026-2027"));
    await user.selectOptions(screen.getByLabelText("Année scolaire"), "2025-2026");
    first.unmount();

    render(<Harness />);

    await waitFor(() => expect(params()).toEqual({ academic_year: "2025-2026" }));
  });

  it("can force one level, e.g. a report card only exists per term", async () => {
    render(<Harness forceMode="term" modes={["term"]} />);

    await waitFor(() => expect(params()).toEqual({ academic_year: "2026-2027", term_id: "t-2026-1" }));
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Trimestre")).toBeInTheDocument();
  });

  it("says so when no academic year exists yet", async () => {
    server.use(http.get(`${API_URL}/academic-years`, () => HttpResponse.json({ data: [] })));
    render(<Harness />);

    expect(await screen.findByText(/Aucune année scolaire/)).toBeInTheDocument();
  });

  it("reads the parent portal's own route", async () => {
    server.use(http.get(`${API_URL}/parent/academic-years`, () => HttpResponse.json({ data: [ACADEMIC_YEARS[1]] })));
    render(<Harness source="parent" />);

    await waitFor(() => expect(params()).toEqual({ academic_year: "2025-2026" }));
  });
});
