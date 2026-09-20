import type { AttendanceStatus, InstallmentStatus, PaymentMethod, PaymentPeriod, SummonStatus } from "@/lib/api/types";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: "Présent",
  absent: "Absent",
  retard: "Retard",
};

export const ATTENDANCE_TONE: Record<AttendanceStatus, Tone> = {
  present: "success",
  absent: "danger",
  retard: "warning",
};

export const SUMMON_LABEL: Record<SummonStatus, string> = {
  pending: "En attente",
  done: "Réalisée",
  cancelled: "Annulée",
};

export const SUMMON_TONE: Record<SummonStatus, Tone> = {
  pending: "warning",
  done: "success",
  cancelled: "neutral",
};

export const PAYMENT_PERIOD_LABEL: Record<PaymentPeriod, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  semiannual: "Semestriel",
  annual: "Annuel",
};

/** Nombre de mois réglés par formule ; `null` = tous les mois restants de l'année. */
export const PAYMENT_PERIOD_MONTHS: Record<PaymentPeriod, number | null> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: null,
};

export const PAYMENT_PERIOD_HINT: Record<PaymentPeriod, string> = {
  monthly: "Règle le prochain mois impayé.",
  quarterly: "Règle les 3 prochains mois.",
  semiannual: "Règle les 6 prochains mois.",
  annual: "Règle tous les mois restants de l'année scolaire.",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Espèces",
  mobile_money: "Mobile money",
  bank_transfer: "Virement",
  cheque: "Chèque",
};

export const INSTALLMENT_LABEL: Record<InstallmentStatus, string> = {
  paid: "Réglé",
  overdue: "En retard",
  due: "À payer",
  upcoming: "À venir",
};

export const INSTALLMENT_TONE: Record<InstallmentStatus, Tone> = {
  paid: "success",
  overdue: "danger",
  due: "warning",
  upcoming: "neutral",
};
