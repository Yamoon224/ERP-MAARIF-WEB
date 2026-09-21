import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import AttendancePage from "@/app/(staff)/attendance/page";
import { server } from "@/test/msw/server";
import { API_URL, paged, signInAs } from "@/test/fixtures";

const classes = [
  { id: "c-old", name: "6eme A", level: "6eme", academic_year: "2025-2026", monthly_fee: 0 },
  { id: "c1", name: "5eme A", level: "5eme", academic_year: "2026-2027", monthly_fee: 0 },
];

const rollCall = [
  { student: { id: "s1", name: "Fatoumata Camara", matricule: "MAA-2026-000001" }, record: null },
  { student: { id: "s2", name: "Moussa Diallo", matricule: "MAA-2026-000002" }, record: { id: "r2", status: "retard", justified: false, reason: "Bus" } },
];

let bulkBody: { school_class_id: string; date: string; records: Array<Record<string, unknown>> } | null = null;
let rollCallQuery: URLSearchParams | null = null;

describe("AttendancePage (appel de classe)", () => {
  beforeEach(() => {
    bulkBody = null;
    rollCallQuery = null;
    signInAs(["attendance.manage", "academics.view"], ["teacher"]);

    server.use(
      http.get(`${API_URL}/classes`, () => HttpResponse.json(paged(classes, 100))),
      http.get(`${API_URL}/attendance-records/roll-call`, ({ request }) => {
        rollCallQuery = new URL(request.url).searchParams;
        return HttpResponse.json({ data: rollCall });
      }),
      http.post(`${API_URL}/attendance-records/bulk`, async ({ request }) => {
        bulkBody = (await request.json()) as NonNullable<typeof bulkBody>;
        return HttpResponse.json({ data: [] });
      }),
    );
  });

  it("offers the most recent classes first and loads the roll call of the chosen class and date", async () => {
    const user = userEvent.setup();
    render(<AttendancePage />);

    const select = await screen.findByLabelText("Classe");
    await waitFor(() => expect(within(select).getAllByRole("option")).toHaveLength(3));
    expect(within(select).getAllByRole("option")[1]).toHaveTextContent("5eme A (2026-2027)");

    await user.selectOptions(select, "c1");

    expect(await screen.findByText("Fatoumata Camara")).toBeInTheDocument();
    expect(rollCallQuery?.get("school_class_id")).toBe("c1");
    expect(rollCallQuery?.get("date")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("pre-fills students already pointed today, everybody else starts present", async () => {
    const user = userEvent.setup();
    render(<AttendancePage />);
    await user.selectOptions(await screen.findByLabelText("Classe"), await screen.findByRole("option", { name: /5eme A/ }));

    await screen.findByText("Moussa Diallo");

    expect(within(screen.getByRole("radiogroup", { name: "Statut de Fatoumata Camara" })).getByRole("radio", { name: "Présent" })).toHaveAttribute("aria-checked", "true");
    expect(within(screen.getByRole("radiogroup", { name: "Statut de Moussa Diallo" })).getByRole("radio", { name: "Retard" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Motif pour Moussa Diallo")).toHaveValue("Bus");
    expect(screen.getByText(/1 déjà pointé\(s\) ce jour/)).toBeInTheDocument();
  });

  it("saves the whole class in a single request", async () => {
    const user = userEvent.setup();
    render(<AttendancePage />);
    await user.selectOptions(await screen.findByLabelText("Classe"), await screen.findByRole("option", { name: /5eme A/ }));
    await screen.findByText("Fatoumata Camara");

    await user.click(within(screen.getByRole("radiogroup", { name: "Statut de Fatoumata Camara" })).getByRole("radio", { name: "Absent" }));
    await user.type(screen.getByLabelText("Motif pour Fatoumata Camara"), "Maladie");
    await user.click(screen.getByLabelText("Absence justifiée pour Fatoumata Camara"));
    await user.click(screen.getByRole("button", { name: /Enregistrer l'appel/ }));

    await waitFor(() => expect(bulkBody).not.toBeNull());
    expect(bulkBody?.school_class_id).toBe("c1");
    expect(bulkBody?.records).toEqual([
      { student_id: "s1", status: "absent", justified: true, reason: "Maladie" },
      { student_id: "s2", status: "retard", justified: false, reason: "Bus" },
    ]);
    expect(await screen.findByText(/Appel enregistré \(2 élèves\)/)).toBeInTheDocument();
  });

  it("marks everybody present in one click, dropping reasons and justifications", async () => {
    const user = userEvent.setup();
    render(<AttendancePage />);
    await user.selectOptions(await screen.findByLabelText("Classe"), await screen.findByRole("option", { name: /5eme A/ }));
    await screen.findByText("Moussa Diallo");

    await user.click(screen.getByRole("button", { name: /Tout marquer présent/ }));
    await user.click(screen.getByRole("button", { name: /Enregistrer l'appel/ }));

    await waitFor(() => expect(bulkBody).not.toBeNull());
    expect(bulkBody?.records.every((record) => record.status === "present" && record.justified === false && record.reason === null)).toBe(true);
  });

  it("shows the server's refusal", async () => {
    server.use(
      http.post(`${API_URL}/attendance-records/bulk`, () =>
        HttpResponse.json({ message: "Certains eleves ne sont pas inscrits dans la classe de l'appel.", error_code: "student_not_in_class" }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    render(<AttendancePage />);
    await user.selectOptions(await screen.findByLabelText("Classe"), await screen.findByRole("option", { name: /5eme A/ }));
    await screen.findByText("Fatoumata Camara");

    await user.click(screen.getByRole("button", { name: /Enregistrer l'appel/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("ne sont pas inscrits");
  });
});
