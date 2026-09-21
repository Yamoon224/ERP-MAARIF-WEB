import { apiClient } from "@/lib/api/client";
import type {
  AccountingSummary,
  ArrearsRow,
  PaginatedResponse,
  MobileMoneyOperator,
  MobileMoneyStatus,
  MobileMoneyTransaction,
  Payment,
  PaymentMethod,
  PaymentPeriod,
  PaymentPreview,
  PeriodParams,
  SchoolClass,
  TuitionStatement,
} from "@/lib/api/types";

export interface PaymentListParams extends PeriodParams {
  student_id?: string;
  school_class_id?: string;
  period_type?: PaymentPeriod;
  method?: PaymentMethod;
  status?: "valid" | "cancelled";
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PaymentPayload {
  enrollment_id: string;
  period: PaymentPeriod;
  method: PaymentMethod;
  reference?: string | null;
  paid_at?: string | null;
  note?: string | null;
}

export async function listPayments(params: PaymentListParams) {
  const { data } = await apiClient.get<PaginatedResponse<Payment>>("/payments", { params });
  return data;
}

export async function getPayment(id: string) {
  const { data } = await apiClient.get<{ data: Payment }>(`/payments/${id}`);
  return data.data;
}

/** Le montant est calculé par le serveur à partir des mois réglés. */
export async function createPayment(payload: PaymentPayload) {
  const { data } = await apiClient.post<{ data: Payment }>("/payments", payload);
  return data.data;
}

export async function cancelPayment(id: string, reason: string) {
  const { data } = await apiClient.post<{ data: Payment }>(`/payments/${id}/cancel`, { reason });
  return data.data;
}

export async function getTuitionStatement(enrollmentId: string) {
  const { data } = await apiClient.get<{ data: TuitionStatement }>(`/enrollments/${enrollmentId}/tuition`);
  return data.data;
}

export async function previewPayment(enrollmentId: string, period: PaymentPeriod) {
  const { data } = await apiClient.get<{ data: PaymentPreview }>(`/enrollments/${enrollmentId}/payment-preview`, {
    params: { period },
  });
  return data.data;
}

export async function getAccountingSummary(params: PeriodParams & { school_class_id?: string }) {
  const { data } = await apiClient.get<{ data: AccountingSummary }>("/accounting/summary", { params });
  return data.data;
}

export async function listArrears(params: PeriodParams & { school_class_id?: string; search?: string; page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<ArrearsRow>>("/accounting/arrears", { params });
  return data;
}

/** Fixe la scolarité mensuelle d'une classe ; les mois non réglés de ses élèves passent au nouveau tarif. */
export async function updateClassFee(schoolClassId: string, monthlyFee: number) {
  const { data } = await apiClient.put<{ data: SchoolClass }>(`/classes/${schoolClassId}/fee`, { monthly_fee: monthlyFee });
  return data.data;
}

// --- Portail parent -------------------------------------------------------------

/** Relevés de scolarité de son enfant, un par année scolaire. */
export async function getMyTuition() {
  const { data } = await apiClient.get<{ data: TuitionStatement[] }>("/parent/tuition");
  return data.data;
}

export async function listMyPayments(params: PeriodParams & { page?: number; per_page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Payment>>("/parent/payments", { params });
  return data;
}

// --- Paiement par mobile money -----------------------------------------------------

export interface MobileMoneyPayload {
  enrollment_id: string;
  period: PaymentPeriod;
  operator: MobileMoneyOperator;
  phone: string;
}

/** Quels mois et quel montant pour une formule, côté parent (inscription de son enfant uniquement). */
export async function previewMyPayment(enrollmentId: string, period: PaymentPeriod) {
  const { data } = await apiClient.get<{ data: PaymentPreview }>("/parent/tuition/preview", {
    params: { enrollment_id: enrollmentId, period },
  });
  return data.data;
}

/** Lance la demande : le parent reçoit une invite à valider sur son téléphone. Le montant est calculé par le serveur. */
export async function startMobileMoneyPayment(payload: MobileMoneyPayload) {
  const { data } = await apiClient.post<{ data: MobileMoneyTransaction }>("/parent/mobile-money", payload);
  return data.data;
}

/** Sert aussi de sondage : chaque appel demande à l'opérateur où en est une demande en attente. */
export async function getMobileMoneyPayment(id: string) {
  const { data } = await apiClient.get<{ data: MobileMoneyTransaction }>(`/parent/mobile-money/${id}`);
  return data.data;
}

export async function listMyMobileMoneyPayments(params: { page?: number; per_page?: number } = {}) {
  const { data } = await apiClient.get<PaginatedResponse<MobileMoneyTransaction>>("/parent/mobile-money", { params });
  return data;
}

/** Côté comptabilité : toutes les demandes des parents, les plus récentes d'abord. */
export async function listMobileMoneyTransactions(params: { status?: MobileMoneyStatus; page?: number; per_page?: number } = {}) {
  const { data } = await apiClient.get<PaginatedResponse<MobileMoneyTransaction>>("/mobile-money-transactions", { params });
  return data;
}
