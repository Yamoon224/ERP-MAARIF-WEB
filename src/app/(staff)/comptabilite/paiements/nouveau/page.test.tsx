import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import NewPaymentPage from "@/app/(staff)/comptabilite/paiements/nouveau/page";
import { mockRouter } from "@/test/mocks/navigation";
import { server } from "@/test/msw/server";
import { API_URL, signInAs } from "@/test/fixtures";

const statement = {
  enrollment: {
    id: "e1",
    academic_year: "2025-2026",
    enrolled_on: "2025-09-20",
    school_class: { id: "c1", name: "6eme A", level: "6eme", monthly_fee: 50000 },
  },
  installments: [
    { id: "i1", month: "2025-10", amount: 50000, status: "paid", paid_at: "2025-10-05", payment: { id: "p0", receipt_number: "REC-2025-000001" } },
    { id: "i2", month: "2025-11", amount: 50000, status: "overdue", paid_at: null, payment: null },
    { id: "i3", month: "2025-12", amount: 50000, status: "due", paid_at: null, payment: null },
  ],
  totals: { total: 150000, paid: 50000, remaining: 100000, overdue_amount: 50000, overdue_months: 1, months_total: 3, months_paid: 1 },
};

let paymentBody: Record<string, unknown> | null = null;

describe("NewPaymentPage", () => {
  beforeEach(() => {
    paymentBody = null;
    signInAs(["students.view", "accounting.view", "accounting.manage"], ["accountant"]);

    server.use(
      http.get(`${API_URL}/students/1/enrollments`, () => HttpResponse.json({ data: [statement.enrollment] })),
      http.get(`${API_URL}/enrollments/e1/tuition`, () => HttpResponse.json({ data: statement })),
      http.get(`${API_URL}/enrollments/e1/payment-preview`, ({ request }) => {
        const period = new URL(request.url).searchParams.get("period");
        const months = period === "monthly" ? ["2025-11"] : ["2025-11", "2025-12"];

        return HttpResponse.json({
          data: { period, requested_months: period === "monthly" ? 1 : 3, months, amount: months.length * 50000 },
        });
      }),
      http.post(`${API_URL}/payments`, async ({ request }) => {
        paymentBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { id: "p1" } }, { status: 201 });
      }),
    );
  });

  async function pickStudent() {
    const user = userEvent.setup();
    render(<NewPaymentPage />);

    await user.type(screen.getByRole("searchbox"), "Fatou");
    await user.click(await screen.findByRole("button", { name: /Fatoumata Camara/ }));

    return user;
  }

  it("shows the student's statement, then the months a quarterly payment would settle", async () => {
    const user = await pickStudent();

    expect(await screen.findByText("Relevé de scolarité")).toBeInTheDocument();
    expect(screen.getByLabelText("Année scolaire")).toHaveValue("e1");
    expect(screen.getByText("REC-2025-000001")).toBeInTheDocument();

    // Formule mensuelle par défaut : le plus ancien mois impayé.
    expect((await screen.findByText(/1 mois :/)).closest("p")).toHaveTextContent("novembre 2025");

    await user.click(screen.getByRole("radio", { name: /Trimestriel/ }));

    expect((await screen.findByText(/2 mois :/)).closest("p")).toHaveTextContent("novembre 2025, décembre 2025");
    expect(screen.getByText(/Il ne reste que 2 mois à payer/)).toBeInTheDocument();
  });

  it("records the payment with the chosen formula and opens its receipt", async () => {
    const user = await pickStudent();
    await screen.findByText(/1 mois :/);

    await user.click(screen.getByRole("radio", { name: /Trimestriel/ }));
    await screen.findByText(/2 mois :/);
    await user.selectOptions(screen.getByLabelText("Mode de paiement"), "mobile_money");
    await user.type(screen.getByLabelText(/Référence/), "OM-778899");
    await user.click(screen.getByRole("button", { name: /Encaisser/ }));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/comptabilite/paiements/p1"));
    // Le montant n'est pas envoyé : le serveur le calcule à partir des mois réglés.
    expect(paymentBody).toMatchObject({ enrollment_id: "e1", period: "quarterly", method: "mobile_money", reference: "OM-778899" });
    expect(paymentBody).not.toHaveProperty("amount");
  });

  it("shows the server's message when the payment is refused", async () => {
    server.use(
      http.post(`${API_URL}/payments`, () =>
        HttpResponse.json({ message: "Aucune echeance a payer pour cette inscription.", error_code: "nothing_to_pay" }, { status: 422 }),
      ),
    );
    const user = await pickStudent();
    await screen.findByText(/1 mois :/);

    await user.click(screen.getByRole("button", { name: /Encaisser/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Aucune echeance a payer");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("refuses to encash when nothing is left to pay", async () => {
    server.use(
      http.get(`${API_URL}/enrollments/e1/tuition`, () =>
        HttpResponse.json({
          data: {
            ...statement,
            installments: statement.installments.map((installment) => ({ ...installment, status: "paid" })),
            totals: { ...statement.totals, paid: 150000, remaining: 0, overdue_amount: 0, overdue_months: 0, months_paid: 3 },
          },
        }),
      ),
    );
    await pickStudent();

    expect(await screen.findByText(/entièrement réglée/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Encaisser/ })).not.toBeInTheDocument();
  });

  it("points the accountant to the fees page when the class has no tuition yet", async () => {
    server.use(
      http.get(`${API_URL}/enrollments/e1/tuition`, () =>
        HttpResponse.json({ data: { ...statement, installments: [], totals: { ...statement.totals, total: 0, paid: 0, remaining: 0 } } }),
      ),
    );
    await pickStudent();

    expect(await screen.findByRole("link", { name: "Frais de scolarité" })).toHaveAttribute("href", "/comptabilite/frais");
  });

  it("is closed to accounts that cannot encash", () => {
    signInAs(["students.view", "accounting.view"], ["accountant"]);
    render(<NewPaymentPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("pas le droit d'encaisser");
  });
});
