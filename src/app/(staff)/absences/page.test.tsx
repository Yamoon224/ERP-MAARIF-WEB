import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import AbsencesPage from "@/app/(staff)/absences/page";
import { server } from "@/test/msw/server";
import { ACADEMIC_YEARS, API_URL, paged, signInAs } from "@/test/fixtures";

const summary = {
  total: 10,
  present: 6,
  absent: 3,
  late: 1,
  justified_absences: 1,
  unjustified_absences: 2,
  top_absentees: [{ student: { id: "s1", name: "Fatoumata Camara", matricule: "MAA-2026-000001" }, absences: 2, unjustified: 1, lates: 0 }],
};

const records = [
  { id: "r1", student: { id: "s1", name: "Fatoumata Camara", matricule: "MAA-2026-000001" }, date: "2026-11-04", status: "absent", justified: false, reason: null },
  { id: "r2", student: { id: "s2", name: "Moussa Diallo", matricule: "MAA-2026-000002" }, date: "2026-11-05", status: "absent", justified: true, reason: "Certificat medical" },
];

let listQueries: URLSearchParams[] = [];
let summaryQueries: URLSearchParams[] = [];
let updateBody: Record<string, unknown> | null = null;

describe("AbsencesPage", () => {
  beforeEach(() => {
    listQueries = [];
    summaryQueries = [];
    updateBody = null;
    signInAs(["attendance.manage", "academics.view"], ["teacher"]);

    server.use(
      http.get(`${API_URL}/academic-years`, () => HttpResponse.json({ data: ACADEMIC_YEARS })),
      http.get(`${API_URL}/classes`, () => HttpResponse.json(paged([]))),
      http.get(`${API_URL}/attendance-records/summary`, ({ request }) => {
        summaryQueries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ data: summary });
      }),
      http.get(`${API_URL}/attendance-records`, ({ request }) => {
        listQueries.push(new URL(request.url).searchParams);
        return HttpResponse.json(paged(records));
      }),
      http.put(`${API_URL}/attendance-records/r1`, async ({ request }) => {
        updateBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { ...records[0], ...updateBody } });
      }),
    );
  });

  it("lists absences of the current academic year with the summary of the period", async () => {
    render(<AbsencesPage />);

    expect(await screen.findByRole("link", { name: "Moussa Diallo" })).toBeInTheDocument();

    // Bilan : 3 absences dont 1 justifiée, 2 à régulariser, 1 retard, 60 % de présence.
    expect(screen.getByText("Non justifiées").closest("div")?.parentElement).toHaveTextContent("2");
    expect(screen.getByText("60 %")).toBeInTheDocument();
    expect(screen.getByText(/2 abs\. \(1 non just\.\)/)).toBeInTheDocument();

    // Par défaut : les absences (pas les retards) de l'année en cours.
    const query = listQueries.at(-1);
    expect(query?.get("academic_year")).toBe("2026-2027");
    expect(query?.get("status")).toBe("absent");
    expect(query?.has("term_id")).toBe(false);
    // Le bilan ignore le filtre de statut : il compte justement les statuts.
    expect(summaryQueries.at(-1)?.has("status")).toBe(false);
  });

  it("narrows the list to a month", async () => {
    const user = userEvent.setup();
    render(<AbsencesPage />);
    await screen.findByRole("link", { name: "Moussa Diallo" });

    await user.click(screen.getByRole("radio", { name: "Mois" }));
    await user.selectOptions(screen.getByLabelText("Mois"), "2026-11");

    await waitFor(() => expect(listQueries.at(-1)?.get("month")).toBe("2026-11"));
    expect(listQueries.at(-1)?.get("academic_year")).toBe("2026-2027");
    expect(summaryQueries.at(-1)?.get("month")).toBe("2026-11");
  });

  it("filters by justification using 0 and 1, the values the API accepts", async () => {
    const user = userEvent.setup();
    render(<AbsencesPage />);
    await screen.findByRole("link", { name: "Moussa Diallo" });

    await user.selectOptions(screen.getByLabelText("Justification"), "0");

    await waitFor(() => expect(listQueries.at(-1)?.get("justified")).toBe("0"));
  });

  it("justifies an absence with a reason", async () => {
    const user = userEvent.setup();
    render(<AbsencesPage />);

    const row = (await screen.findByRole("link", { name: "Fatoumata Camara", hidden: false })).closest("tr") as HTMLElement;
    expect(within(row).getByText("Non justifiée")).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: /Justifier/ }));
    await user.type(within(row).getByLabelText("Motif de la justification"), "Rendez-vous médical{Enter}");

    await waitFor(() => expect(updateBody).toEqual({ justified: true, reason: "Rendez-vous médical" }));
  });

  it("offers to withdraw a justification that was already granted", async () => {
    render(<AbsencesPage />);

    const row = (await screen.findByRole("link", { name: "Moussa Diallo" })).closest("tr") as HTMLElement;

    expect(within(row).getByText("Justifiée")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: /Retirer/ })).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: /Justifier/ })).not.toBeInTheDocument();
  });
});
