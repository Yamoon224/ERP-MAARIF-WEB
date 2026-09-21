import type { NotificationFeed, NotificationItem } from "@/components/layout/NotificationBell";
import { listMobileMoneyTransactions, listMyMobileMoneyPayments } from "@/lib/api/accounting";
import { listMySummons } from "@/lib/api/discipline";
import { getNotificationSummary, listNotificationLogs } from "@/lib/api/notifications";
import type { MobileMoneyStatus, MobileMoneyTransaction, NotificationLog, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/utils/format";

const MAX_ITEMS = 8;

const LOG_TYPE_LABEL: Record<NotificationLog["type"], string> = {
  convocation: "Convocation",
  sanction: "Sanction",
  bulletin: "Rappel de bulletin",
  admission: "Admission",
};

const LOG_STATUS: Record<NotificationLog["status"], { label: string; tone: NotificationItem["tone"] }> = {
  failed: { label: "Échec d'envoi", tone: "danger" },
  sent: { label: "Envoyé", tone: "success" },
  pending: { label: "En attente d'envoi", tone: "neutral" },
};

const MONEY_TONE: Record<MobileMoneyStatus, NotificationItem["tone"]> = {
  pending: "info",
  successful: "success",
  failed: "neutral",
  expired: "neutral",
  needs_review: "warning",
};

/** Une source qui échoue (droit manquant, panne) ne doit pas vider toute la cloche. */
async function orNull<T>(request: Promise<T> | null): Promise<T | null> {
  if (request === null) return null;

  try {
    return await request;
  } catch {
    return null;
  }
}

function newestFirst(items: Array<NotificationItem & { at: string }>): NotificationItem[] {
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_ITEMS);
}

function moneyItem(transaction: MobileMoneyTransaction, href: string, who?: string): NotificationItem & { at: string } {
  return {
    id: `money-${transaction.id}`,
    title: who ? `Mobile money · ${who}` : "Paiement par mobile money",
    detail: `${formatMoney(transaction.amount)} · ${transaction.status_label}`,
    at: transaction.created_at,
    tone: MONEY_TONE[transaction.status],
    href,
  };
}

/**
 * Cloche du personnel, selon ses droits : le journal des messages envoyés aux
 * tuteurs (`notifications.view`) et les paiements mobile money des parents
 * (`accounting.view`). Sont à traiter les envois en échec et les paiements
 * débités dont les mois étaient déjà réglés (`needs_review`).
 */
export async function loadStaffFeed(user: StaffUser | null): Promise<NotificationFeed> {
  const canSeeLogs = hasPermission(user, "notifications.view");
  const canSeeMoney = hasPermission(user, "accounting.view");

  const [logs, summary, money, toReview] = await Promise.all([
    orNull(canSeeLogs ? listNotificationLogs({ per_page: 5 }) : null),
    orNull(canSeeLogs ? getNotificationSummary({}) : null),
    orNull(canSeeMoney ? listMobileMoneyTransactions({ per_page: 5 }) : null),
    orNull(canSeeMoney ? listMobileMoneyTransactions({ status: "needs_review", per_page: 1 }) : null),
  ]);

  const items = newestFirst([
    ...(logs?.data ?? []).map((log) => ({
      id: `log-${log.id}`,
      title: `${LOG_TYPE_LABEL[log.type]} · ${log.student?.name ?? log.admission?.name ?? log.recipient}`,
      detail: LOG_STATUS[log.status].label,
      at: log.created_at,
      tone: LOG_STATUS[log.status].tone,
      href: "/notifications",
    })),
    ...(money?.data ?? []).map((transaction) => moneyItem(transaction, "/accounting/payments", transaction.student?.name)),
  ]);

  return { items, attention: (summary?.by_status.failed ?? 0) + (toReview?.meta.total ?? 0) };
}

/** Cloche du parent : les convocations de son enfant et l'état de ses paiements mobile money. */
export async function loadParentFeed(): Promise<NotificationFeed> {
  const [summons, money] = await Promise.all([
    orNull(listMySummons({ per_page: 5 })),
    orNull(listMyMobileMoneyPayments({ per_page: 5 })),
  ]);

  const pendingSummons = (summons?.data ?? []).filter((summon) => summon.status === "pending");

  const items = newestFirst([
    ...pendingSummons.map((summon) => ({
      id: `summon-${summon.id}`,
      title: "Convocation",
      detail: summon.reason,
      at: summon.scheduled_at,
      tone: "warning" as const,
      href: "/portal/summons",
    })),
    ...(money?.data ?? []).map((transaction) => moneyItem(transaction, "/portal/tuition")),
  ]);

  const toReview = (money?.data ?? []).filter((transaction) => transaction.status === "needs_review").length;

  return { items, attention: pendingSummons.length + toReview };
}
