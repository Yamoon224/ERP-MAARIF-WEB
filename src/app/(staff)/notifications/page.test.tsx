import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationsPage from "@/app/(staff)/notifications/page";
import { server } from "@/test/msw/server";
import type { NotificationLog } from "@/lib/api/types";

const API_URL = "http://localhost:8000/api";

const LOGS: NotificationLog[] = [
  {
    id: "1",
    student: { id: "s1", name: "Awa Camara" },
    admission: null,
    channel: "email",
    type: "convocation",
    recipient: "tuteur@example.test",
    subject: "Convocation - Awa Camara",
    body: "Convocation pour Awa Camara le 12/03/2026 a 09:00.",
    status: "sent",
    attempts: 1,
    error: null,
    sent_at: "2026-03-10T09:00:05Z",
    read_at: null,
    is_read: false,
    created_at: "2026-03-10T09:00:00Z",
  },
  {
    id: "2",
    student: null,
    admission: { id: "a1", name: "Mariama Barry", reference: "ADM-2026-000001" },
    channel: "sms",
    type: "admission",
    recipient: "+224620000000",
    subject: "Admission - Mariama Barry",
    body: "Admission de Mariama Barry : candidature admise.",
    status: "failed",
    attempts: 1,
    error: "Operateur SMS indisponible",
    sent_at: null,
    read_at: null,
    is_read: false,
    created_at: "2026-03-11T10:00:00Z",
  },
];

function mockApi(logRequests: URLSearchParams[] = [], summaryRequests: URLSearchParams[] = []) {
  server.use(
    http.get(`${API_URL}/notification-logs/summary`, ({ request }) => {
      summaryRequests.push(new URL(request.url).searchParams);
      return HttpResponse.json({ data: { total: 2, by_status: { sent: 1, failed: 1, pending: 0 } } });
    }),
    http.get(`${API_URL}/notification-logs`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      logRequests.push(params);
      const status = params.get("status");
      const read = params.get("read");
      let rows = status ? LOGS.filter((log) => log.status === status) : LOGS;
      if (read !== null) rows = rows.filter((log) => log.is_read === (read === "true"));

      return HttpResponse.json({ data: rows, meta: { current_page: 1, last_page: 1, per_page: 10, total: rows.length } });
    }),
    http.post(`${API_URL}/notification-logs/:id/read`, ({ params }) => {
      const log = LOGS.find((candidate) => candidate.id === params.id);
      if (log) {
        log.is_read = true;
        log.read_at = "2026-03-12T08:00:00Z";
      }
      return HttpResponse.json({ data: log });
    }),
    http.delete(`${API_URL}/notification-logs/:id/read`, ({ params }) => {
      const log = LOGS.find((candidate) => candidate.id === params.id);
      if (log) {
        log.is_read = false;
        log.read_at = null;
      }
      return HttpResponse.json({ data: log });
    }),
  );
}

describe("NotificationsPage", () => {
  afterEach(() => {
    for (const log of LOGS) {
      log.is_read = false;
      log.read_at = null;
    }
  });

  it("lists the messages with who they concern, the message text and the failure reason", async () => {
    mockApi();
    render(<NotificationsPage />);

    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Awa Camara")).toHaveAttribute("href", "/students/s1");
    // Un candidat pas encore inscrit renvoie vers son dossier, avec sa référence.
    expect(within(table).getByText("Mariama Barry")).toHaveAttribute("href", "/admissions/a1");
    expect(within(table).getByText("ADM-2026-000001")).toBeInTheDocument();
    expect(within(table).getByText("tuteur@example.test")).toBeInTheDocument();
    expect(within(table).getByText("Admission")).toBeInTheDocument();
    expect(within(table).getByText("Envoyé")).toBeInTheDocument();
    expect(within(table).getByText("Échec")).toBeInTheDocument();
    expect(within(table).getByText("Échec : Operateur SMS indisponible")).toBeInTheDocument();
    expect(within(table).getByText("Convocation pour Awa Camara le 12/03/2026 a 09:00.")).toBeInTheDocument();
  });

  it("shows the counts per status", async () => {
    mockApi();
    render(<NotificationsPage />);

    expect(await screen.findByText("2 message(s) au total")).toBeInTheDocument();
    expect(screen.getByText("En échec")).toBeInTheDocument();
  });

  it("asks the API for the chosen status only, and keeps the counts independent of that status", async () => {
    const logRequests: URLSearchParams[] = [];
    const summaryRequests: URLSearchParams[] = [];
    mockApi(logRequests, summaryRequests);
    const user = userEvent.setup();
    render(<NotificationsPage />);

    await screen.findByText("Awa Camara");
    await user.selectOptions(screen.getByLabelText("Statut"), "failed");

    await waitFor(() => expect(screen.queryByText("Awa Camara")).not.toBeInTheDocument());
    expect(screen.getByText("Mariama Barry")).toBeInTheDocument();
    expect(logRequests.at(-1)?.get("status")).toBe("failed");
    expect(summaryRequests.every((params) => !params.has("status"))).toBe(true);
  });

  it("marks a message as read, then back as unread", async () => {
    mockApi();
    const user = userEvent.setup();
    render(<NotificationsPage />);

    const table = await screen.findByRole("table");
    const row = (await within(table).findByText("Awa Camara")).closest("tr")!;
    expect(within(row).getByText("Non lu")).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: "Marquer comme lu le message à tuteur@example.test" }));
    expect(await within(row).findByText("Lu")).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: "Marquer comme non lu le message à tuteur@example.test" }));
    expect(await within(row).findByText("Non lu")).toBeInTheDocument();
  });

  it("filters by read status", async () => {
    const logRequests: URLSearchParams[] = [];
    mockApi(logRequests);
    const user = userEvent.setup();
    render(<NotificationsPage />);

    await screen.findByText("Awa Camara");
    await user.selectOptions(screen.getByLabelText("Lu"), "unread");

    await waitFor(() => expect(logRequests.at(-1)?.get("read")).toBe("false"));
    expect(screen.getByText("Awa Camara")).toBeInTheDocument();
  });

  it("filters by type and channel", async () => {
    const logRequests: URLSearchParams[] = [];
    mockApi(logRequests);
    const user = userEvent.setup();
    render(<NotificationsPage />);

    await screen.findByText("Awa Camara");
    await user.selectOptions(screen.getByLabelText("Type"), "admission");
    await waitFor(() => expect(logRequests.at(-1)?.get("type")).toBe("admission"));
    await user.selectOptions(screen.getByLabelText("Canal"), "sms");
    await waitFor(() => expect(logRequests.at(-1)?.get("channel")).toBe("sms"));
    expect(logRequests.at(-1)?.get("type")).toBe("admission");
  });
});
