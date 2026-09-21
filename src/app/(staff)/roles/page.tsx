"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { RoleFormModal } from "@/components/staff/RoleFormModal";
import { RolePermissionsEditor } from "@/components/staff/RolePermissionsEditor";
import { getErrorMessage } from "@/lib/api/error";
import { deleteRole, listPermissions, listRoles } from "@/lib/api/roles";
import type { Permission, Role } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { fetchAllPages } from "@/lib/utils/fetchAllPages";

type Dialog = { kind: "create" } | { kind: "rename"; role: Role } | { kind: "permissions"; role: Role } | null;

/**
 * Administration des rôles : création, renommage, suppression, et attribution des permissions de chacun.
 * Les rôles système (administrateur, enseignant, comptable) restent en place et ne se renomment pas : le code
 * s'appuie sur leur nom ; on peut en revanche régler leurs permissions (sauf celles de l'administrateur).
 */
export default function RolesPage() {
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [catalog, setCatalog] = useState<Permission[]>([]);

  const { page, perPage, setPage, setPerPage } = usePagination();
  const { data, meta, isLoading, reload } = usePaginatedResource(() => listRoles({ page, per_page: perPage }), [page, perPage]);

  useEffect(() => {
    listPermissions()
      .then(setCatalog)
      .catch(() => setError(t("Impossible de charger la liste des permissions.")));
    // Le catalogue ne change pas pendant la session ; la langue ne le concerne pas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(role: Role) {
    if (!window.confirm(t("Supprimer le rôle « {role} » ?", { role: role.label }))) return;

    setBusyId(role.id);
    setError(null);
    setNotice(null);

    try {
      await deleteRole(role.id);
      setNotice(t("Le rôle « {role} » a été supprimé.", { role: role.label }));
      reload();
    } catch (failure) {
      setError(getErrorMessage(failure, t("Impossible de supprimer ce rôle.")));
    } finally {
      setBusyId(null);
    }
  }

  const columns: DataTableColumn<Role>[] = [
    { key: "name", header: t("Rôle"), className: "min-w-56", value: (row) => t(row.label), render: (row) => <span className="font-medium">{t(row.label)}</span> },
    {
      key: "type",
      header: t("Type"),
      value: (row) => (row.is_system ? t("Système") : t("Personnalisé")),
      render: (row) => (row.is_system ? <Badge tone="info">{t("Système")}</Badge> : <Badge tone="neutral">{t("Personnalisé")}</Badge>),
    },
    { key: "permissions", header: t("Permissions"), value: (row) => row.permissions_count ?? 0, render: (row) => row.permissions_count ?? 0 },
    { key: "users", header: t("Utilisateurs"), value: (row) => row.users_count ?? 0, render: (row) => row.users_count ?? 0 },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="gradient"
            aria-label={t("Permissions de {role}", { role: t(row.label) })}
            disabled={busyId !== null}
            onClick={() => setDialog({ kind: "permissions", role: row })}
          >
            <ShieldCheck className="size-4" aria-hidden="true" /> {t("Permissions")}
          </Button>
          {!row.is_system && (
            <>
              <Button
                size="sm"
                variant="secondary"
                aria-label={t("Renommer {role}", { role: row.label })}
                title={t("Renommer")}
                disabled={busyId !== null}
                onClick={() => setDialog({ kind: "rename", role: row })}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="danger"
                aria-label={t("Supprimer {role}", { role: row.label })}
                title={t("Supprimer")}
                loading={busyId === row.id}
                disabled={busyId !== null}
                onClick={() => void handleDelete(row)}
              >
                {busyId !== row.id && <Trash2 className="size-4" aria-hidden="true" />}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("Rôles et permissions")}
        description={t("Créez des rôles, puis choisissez ce que chacun peut faire dans l'application.")}
        actions={
          <Button onClick={() => setDialog({ kind: "create" })}>
            <Plus className="size-4" aria-hidden="true" /> {t("Nouveau rôle")}
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
        emptyMessage="Aucun rôle."
        exportName="Rôles"
        exportAll={() => fetchAllPages((exportPage, exportPerPage) => listRoles({ page: exportPage, per_page: exportPerPage }))}
      />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}

      {(dialog?.kind === "create" || dialog?.kind === "rename") && (
        <RoleFormModal
          role={dialog.kind === "rename" ? dialog.role : null}
          onClose={() => setDialog(null)}
          onSaved={(saved, created) => {
            setError(null);
            setNotice(null);
            reload();
            // Un rôle vide ne sert à rien : on ouvre aussitôt ses permissions.
            setDialog(created ? { kind: "permissions", role: saved } : null);
          }}
        />
      )}

      {dialog?.kind === "permissions" && (
        <RolePermissionsEditor key={dialog.role.id} role={dialog.role} catalog={catalog} onChanged={reload} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
