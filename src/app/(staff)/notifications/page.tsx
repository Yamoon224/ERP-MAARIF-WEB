"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, RotateCw, Undo2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { getErrorMessage } from "@/lib/api/error";
import {
  getNotificationSummary,
  listNotificationLogs,
  markNotificationRead,
  markNotificationUnread,
  resendNotification,
} from "@/lib/api/notifications";
import type { NotificationLog, NotificationSummary, StaffUser } from "@/lib/api/types";
import { hasPermission } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { fetchAllPages } from "@/lib/utils/fetchAllPages";
import { useT } from "@/lib/i18n/store";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import {
  NOTIFICATION_CHANNEL_LABEL,
  NOTIFICATION_STATUS_LABEL,
  NOTIFICATION_STATUS_TONE,
  NOTIFICATION_TYPE_LABEL,
} from "@/lib/labels";
import { formatDateTime } from "@/lib/utils/format";

type ReadFilter = "" | "read" | "unread";

const TYPES = Object.keys(NOTIFICATION_TYPE_LABEL) as NotificationLog["type"][];
const CHANNELS = Object.keys(NOTIFICATION_CHANNEL_LABEL) as NotificationLog["channel"][];
const STATUSES = Object.keys(NOTIFICATION_STATUS_LABEL) as NotificationLog["status"][];

/** Qui est concerné : l'élève, ou le candidat (dossier d'admission) tant qu'il n'est pas inscrit. */
function Concerned({ log }: { log: NotificationLog }) {
  if (log.student) {
    return (
      <Link href={`/students/${log.student.id}`} className="font-medium text-primary hover:underline">
        {log.student.name}
      </Link>
    );
  }

  if (log.admission) {
    return (
      <div>
        <Link href={`/admissions/${log.admission.id}`} className="font-medium text-primary hover:underline">
          {log.admission.name}
        </Link>
        <p className="font-mono text-xs text-muted">{log.admission.reference}</p>
      </div>
    );
  }

  return <span className="text-muted">-</span>;
}

/**
 * Journal des messages envoyés aux tuteurs (convocations, sanctions,
 * admissions). Répond à « je n'ai pas reçu le message » : chaque tentative est
 * tracée, échecs compris, avec le texte envoyé et la raison d'un échec.
 */
export default function NotificationsPage() {
  const { t } = useT();
  const canResend = hasPermission(useAuthStore((state) => state.user as StaffUser | null), "notifications.manage");

  const [search, setSearch] = useState("");
  const [type, setType] = useState<NotificationLog["type"] | "">("");
  const [channel, setChannel] = useState<NotificationLog["channel"] | "">("");
  const [status, setStatus] = useState<NotificationLog["status"] | "">("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("");
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [readTogglingId, setReadTogglingId] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [summaryToken, setSummaryToken] = useState(0);
  const debouncedSearch = useDebouncedValue(search);
  const { page, perPage, setPage, setPerPage } = usePagination(`${debouncedSearch}|${type}|${channel}|${status}|${readFilter}`);

  // Les cartes suivent le type, le canal et la recherche, mais pas le statut : filtrer sur « échec » ne les vide pas.
  useEffect(() => {
    getNotificationSummary({ search: debouncedSearch || undefined, type: type || undefined, channel: channel || undefined })
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [debouncedSearch, type, channel, summaryToken]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: type || undefined,
      channel: channel || undefined,
      status: status || undefined,
      read: readFilter === "" ? undefined : readFilter === "read",
    }),
    [debouncedSearch, type, channel, status, readFilter],
  );
  const fetcher = useMemo(() => () => listNotificationLogs({ ...filters, page, per_page: perPage }), [filters, page, perPage]);
  const { data, meta, isLoading, reload } = usePaginatedResource(fetcher, [filters, page, perPage]);

  async function handleResend(log: NotificationLog) {
    setResendingId(log.id);
    setResendNotice(null);

    try {
      const result = await resendNotification(log.id);
      setResendNotice(
        result.status === "sent"
          ? { tone: "success", text: t("Message renvoyé à {recipient}.", { recipient: result.recipient }) }
          : { tone: "error", text: t("Le renvoi a échoué : {reason}.", { reason: result.error ?? t("raison inconnue") }) },
      );
      reload();
      setSummaryToken((token) => token + 1);
    } catch (failure) {
      setResendNotice({ tone: "error", text: getErrorMessage(failure, t("Impossible de renvoyer ce message.")) });
    } finally {
      setResendingId(null);
    }
  }

  async function handleToggleRead(log: NotificationLog) {
    setReadTogglingId(log.id);

    try {
      await (log.is_read ? markNotificationUnread(log.id) : markNotificationRead(log.id));
      reload();
    } catch {
      // Un aide-mémoire de consultation : un échec silencieux (réseau, permission) n'empêche pas de relire le journal.
    } finally {
      setReadTogglingId(null);
    }
  }

  const columns: DataTableColumn<NotificationLog>[] = [
    { key: "date", header: "Date", render: (row) => formatDateTime(row.created_at) },
    { key: "concerned", header: "Concerné", render: (row) => <Concerned log={row} /> },
    { key: "type", header: "Type", render: (row) => <Badge tone="info">{t(NOTIFICATION_TYPE_LABEL[row.type])}</Badge> },
    {
      key: "recipient",
      header: "Envoyé à",
      render: (row) => (
        <div>
          <p>{row.recipient}</p>
          <p className="text-xs text-muted">{t(NOTIFICATION_CHANNEL_LABEL[row.channel])}</p>
        </div>
      ),
    },
    {
      key: "message",
      header: "Message",
      className: "min-w-64",
      render: (row) => (
        <div className="space-y-1">
          <p className="font-medium">{row.subject ?? "-"}</p>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer text-primary">{t("Voir le message")}</summary>
            <p className="mt-1 whitespace-pre-line">{row.body}</p>
          </details>
          {row.error && <p className="text-xs text-danger">{t("Échec : {error}", { error: row.error })}</p>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (row) => (
        <div>
          <Badge tone={NOTIFICATION_STATUS_TONE[row.status]}>{t(NOTIFICATION_STATUS_LABEL[row.status])}</Badge>
          {row.sent_at && <p className="mt-1 text-xs text-muted">{formatDateTime(row.sent_at)}</p>}
          {row.attempts > 1 && <p className="mt-1 text-xs text-muted">{t("{count} tentatives", { count: row.attempts })}</p>}
          {canResend && row.status === "failed" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              loading={resendingId === row.id}
              disabled={resendingId !== null}
              aria-label={t("Renvoyer le message à {recipient}", { recipient: row.recipient })}
              onClick={() => handleResend(row)}
            >
              <RotateCw className="size-4" /> {t("Renvoyer")}
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "read",
      header: "Lu",
      render: (row) => (
        <div>
          <Badge tone={row.is_read ? "success" : "neutral"}>{row.is_read ? t("Lu") : t("Non lu")}</Badge>
          {row.is_read && row.read_at && <p className="mt-1 text-xs text-muted">{formatDateTime(row.read_at)}</p>}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            loading={readTogglingId === row.id}
            disabled={readTogglingId !== null}
            aria-label={
              row.is_read
                ? t("Marquer comme non lu le message à {recipient}", { recipient: row.recipient })
                : t("Marquer comme lu le message à {recipient}", { recipient: row.recipient })
            }
            onClick={() => handleToggleRead(row)}
          >
            {row.is_read ? <Undo2 className="size-4" /> : <Check className="size-4" />}
            {row.is_read ? t("Marquer non lu") : t("Marquer comme lu")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("Notifications")}
        description={t("Journal des messages envoyés aux tuteurs : convocations, sanctions et décisions d'admission.")}
      />

      {resendNotice &&
        (resendNotice.tone === "error" ? (
          <Alert className="mb-4">{resendNotice.text}</Alert>
        ) : (
          <p role="status" className="mb-4 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground">
            {resendNotice.text}
          </p>
        ))}

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            accent="grades"
            label={t("Envoyés")}
            value={summary.by_status.sent}
            hint={t("{count} message(s) au total", { count: summary.total })}
          />
          <StatCard accent="discipline" label={t("En échec")} value={summary.by_status.failed} hint={t("À vérifier avec le tuteur")} />
          <StatCard accent="academics" label={t("En attente")} value={summary.by_status.pending} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t("Rechercher un élève, un candidat, un destinataire...")} />
        <Select aria-label={t("Type")} className="h-10 w-44" value={type} onChange={(event) => setType(event.target.value as NotificationLog["type"] | "")}>
          <option value="">{t("Tous les types")}</option>
          {TYPES.map((value) => (
            <option key={value} value={value}>
              {t(NOTIFICATION_TYPE_LABEL[value])}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t("Canal")}
          className="h-10 w-40"
          value={channel}
          onChange={(event) => setChannel(event.target.value as NotificationLog["channel"] | "")}
        >
          <option value="">{t("Tous les canaux")}</option>
          {CHANNELS.map((value) => (
            <option key={value} value={value}>
              {t(NOTIFICATION_CHANNEL_LABEL[value])}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t("Statut")}
          className="h-10 w-44"
          value={status}
          onChange={(event) => setStatus(event.target.value as NotificationLog["status"] | "")}
        >
          <option value="">{t("Tous les statuts")}</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(NOTIFICATION_STATUS_LABEL[value])}
            </option>
          ))}
        </Select>
        <Select aria-label={t("Lu")} className="h-10 w-36" value={readFilter} onChange={(event) => setReadFilter(event.target.value as ReadFilter)}>
          <option value="">{t("Tous")}</option>
          <option value="unread">{t("Non lus")}</option>
          <option value="read">{t("Lus")}</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="Aucun message dans le journal."
        exportName="Journal des notifications"
        exportAll={() => fetchAllPages((exportPage, exportPerPage) => listNotificationLogs({ ...filters, page: exportPage, per_page: exportPerPage }))}
      />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
