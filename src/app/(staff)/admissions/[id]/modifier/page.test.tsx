import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditAdmissionPage from "@/app/(staff)/admissions/[id]/modifier/page";
import { mockRouter } from "@/test/mocks/navigation";
import { server } from "@/test/msw/server";
import type { Admission } from "@/lib/api/types";

const API_URL = "http://localhost:8000/api";

const PENDING: Admission = {
  id: "7",
  reference: "ADM-2026-000007",
  academic_year: "2025-2026",
  level: "6eme",
  first_name: "Mariama",
  last_name: "Barry",
  full_name: "Mariama Barry",
  gender: "F",
  birth_date: "2014-05-12",
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
  notified_at: null,
  enrolled_at: null,
};

async function renderPage() {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <EditAdmissionPage params={Promise.resolve({ id: "7" })} />
      </Suspense>,
    );
  });
}

function mockYears() {
  return http.get(`${API_URL}/academic-years`, () =>
    HttpResponse.json({ data: [{ label: "2025-2026", starts_at: "2025-10-01", ends_at: "2026-06-30", is_current: true, terms: [] }] }),
  );
}

describe("EditAdmissionPage", () => {
  it("prefills the form with the application, saves the changes and goes back to the file", async () => {
    let saved: unknown;
    server.use(
      mockYears(),
      http.get(`${API_URL}/admissions/7`, () => HttpResponse.json({ data: PENDING })),
      http.put(`${API_URL}/admissions/7`, async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json({ data: { ...PENDING, guardian_name: "Nouveau tuteur" } });
      }),
    );
    const user = userEvent.setup();

    await renderPage();

    const guardian = await screen.findByLabelText("Nom du tuteur");
    expect(guardian).toHaveValue("Alpha Barry");
    expect(screen.getByLabelText("Prénom")).toHaveValue("Mariama");
    expect(screen.getByLabelText("Date de naissance")).toHaveValue("2014-05-12");
    // L'année du dossier est conservée : la suggestion d'année courante ne l'écrase pas.
    expect(screen.getByLabelText("Année scolaire visée")).toHaveValue("2025-2026");

    await user.clear(guardian);
    await user.type(guardian, "Nouveau tuteur");
    await user.click(screen.getByRole("button", { name: "Enregistrer les modifications" }));

    await screen.findByRole("heading", { name: "Modifier Mariama Barry" });
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/admissions/7"));
    expect(saved).toMatchObject({ guardian_name: "Nouveau tuteur", first_name: "Mariama", guardian_email: null, birth_date: "2014-05-12" });
  });

  it("shows the API error and stays on the form when the save is refused", async () => {
    server.use(
      mockYears(),
      http.get(`${API_URL}/admissions/7`, () => HttpResponse.json({ data: PENDING })),
      http.put(`${API_URL}/admissions/7`, () =>
        HttpResponse.json({ message: "Erreur de validation.", error_code: "validation_failed", errors: { guardian_phone: ["Numéro invalide."] } }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();

    await renderPage();
    await user.click(await screen.findByRole("button", { name: "Enregistrer les modifications" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("refuses to edit a candidate who is already enrolled", async () => {
    server.use(
      mockYears(),
      http.get(`${API_URL}/admissions/7`, () => HttpResponse.json({ data: { ...PENDING, status: "enrolled", status_label: "Inscrit" } })),
    );

    await renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("déjà inscrit");
    expect(screen.queryByRole("button", { name: "Enregistrer les modifications" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Retour au dossier/ })).toHaveAttribute("href", "/admissions/7");
  });
});
