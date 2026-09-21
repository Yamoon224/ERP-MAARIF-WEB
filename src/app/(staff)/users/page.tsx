"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ResetPasswordModal } from "@/components/staff/users/ResetPasswordModal";
import { UserFormModal } from "@/components/staff/users/UserFormModal";
import { getErrorMessage } from "@/lib/api/error";
import { listRoles } from "@/lib/api/roles";
import type { Role, StaffUser } from "@/lib/api/types";
import { deleteUser, listUsers } from "@/lib/api/users";
import { roleLabel, ROLE_LABELS } from "@/lib/auth/roles";
import { useT } from "@/lib/i18n/store";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { fetchAllPages } from "@/lib/utils/fetchAllPages";

// Repli si la liste des rôles ne charge pas : les trois rôles système existent toujours.
const SYSTEM_ROLES = Object.entries(ROLE_LABELS).map(([name, label]) => ({ name, label }));

type Dialog = { kind: "create" } | { kind: "edit"; user: StaffUser } | { kind: "password"; user: StaffUser } | null;

/**
 * Comptes du personnel. Création, modification et réinitialisation du mot de passe se font dans une fenêtre ;
 * la suppression demande confirmation. Un compte ne peut pas supprimer le sien (refusé par le serveur).
 */
export default function UsersPage() {
  const { t } = useT();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Pick<Role, "name" | "label">[]>(SYSTEM_ROLES);

  const { page, perPage, setPage, setPerPage } = usePagination();
  const { data, meta, isLoading, reload } = usePaginatedResource(() => listUsers({ page, per_page: perPage }), [page, perPage]);

  useEffect(() => {
    listRoles({ per_page: 100 })
      .then((response) => setRoles(response.data))
      .catch(() => setRoles(SYSTEM_ROLES));
  }, []);

  async function handleDelete(user: StaffUser) {
    if (!window.confirm(t("Supprimer le compte de {name} ?", { name: user.name }))) return;

    setBusyId(user.id);
    setError(null);
    setNotice(null);

    try {
      await deleteUser(user.id);
      setNotice(t("Le compte de {name} a été supprimé.", { name: user.name }));
      reload();
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible de supprimer ce compte.")));
    } finally {
      setBusyId(null);
    }
  }

  const columns: DataTableColumn<StaffUser>[] = [
    { key: "name", header: t("Nom"), render: (row) => row.name },
    { key: "email", header: t("E-mail"), render: (row) => row.email },
    {
      key: "roles",
      header: t("Rôles"),
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {row.roles.map((role) => (
            <Badge key={role} tone="info">
              {t(roleLabel(role))}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: t("Statut"),
      render: (row) => <Badge tone={row.is_active ? "success" : "neutral"}>{row.is_active ? t("Actif") : t("Inactif")}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            aria-label={t("Modifier {name}", { name: row.name })}
            title={t("Modifier")}
            disabled={busyId !== null}
            onClick={() => setDialog({ kind: "edit", user: row })}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            aria-label={t("Réinitialiser le mot de passe de {name}", { name: row.name })}
            title={t("Réinitialiser le mot de passe")}
            disabled={busyId !== null}
            onClick={() => setDialog({ kind: "password", user: row })}
          >
            <KeyRound className="size-4" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            aria-label={t("Supprimer le compte de {name}", { name: row.name })}
            title={t("Supprimer")}
            loading={busyId === row.id}
            disabled={busyId !== null}
            onClick={() => void handleDelete(row)}
          >
            {busyId !== row.id && <Trash2 className="size-4" aria-hidden="true" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("Comptes du personnel")}
        description={t("Créez les comptes, attribuez-leur des rôles et réinitialisez les mots de passe.")}
        actions={
          <Button onClick={() => setDialog({ kind: "create" })}>
            <Plus className="size-4" aria-hidden="true" /> {t("Nouvel utilisateur")}
          </Button>
        }
      />

      {error && <Alert className="mb-4">{error}</Alert>}
      {notice && (
        <p role="status" className="mb-4 flex items-center gap-2 text-sm text-success">
          <Check className="size-4" aria-hidden="true" /> {notice}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        exportName={t("Comptes du personnel")}
        exportAll={() => fetchAllPages((exportPage, exportPerPage) => listUsers({ page: exportPage, per_page: exportPerPage }))}
      />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}

      {(dialog?.kind === "create" || dialog?.kind === "edit") && (
        <UserFormModal
          user={dialog.kind === "edit" ? dialog.user : null}
          roles={roles}
          onClose={() => setDialog(null)}
          onSaved={(saved, created) => {
            setDialog(null);
            setError(null);
            setNotice(created ? t("Le compte de {name} a été créé.", { name: saved.name }) : t("Le compte de {name} a été modifié.", { name: saved.name }));
            reload();
          }}
        />
      )}

      {dialog?.kind === "password" && (
        <ResetPasswordModal
          user={dialog.user}
          onClose={() => setDialog(null)}
          onDone={(done) => {
            setDialog(null);
            setError(null);
            setNotice(t("Le mot de passe de {name} a été réinitialisé.", { name: done.name }));
          }}
        />
      )}
    </div>
  );
}
