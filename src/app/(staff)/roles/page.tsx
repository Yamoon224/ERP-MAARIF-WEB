"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { RolePermissionsEditor } from "@/components/staff/RolePermissionsEditor";
import { getErrorMessage } from "@/lib/api/error";
import { createRole, deleteRole, listPermissions, listRoles, updateRole } from "@/lib/api/roles";
import type { Permission, Role } from "@/lib/api/types";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { fetchAllPages } from "@/lib/utils/fetchAllPages";
import { roleSchema, type RoleFormInput } from "@/lib/validation/roles";

/**
 * Administration des rôles : création, renommage, suppression, et attribution des permissions de chacun.
 * Les rôles système (administrateur, enseignant, comptable) restent en place et ne se renomment pas : le code
 * s'appuie sur leur nom ; on peut en revanche régler leurs permissions (sauf celles de l'administrateur).
 */
export default function RolesPage() {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [permissionsOf, setPermissionsOf] = useState<Role | null>(null);
  const [catalog, setCatalog] = useState<Permission[]>([]);

  const { page, perPage, setPage, setPerPage } = usePagination();
  const { data, meta, isLoading, reload } = usePaginatedResource(
    () => listRoles({ page, per_page: perPage }),
    [page, perPage],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormInput>({ resolver: zodResolver(roleSchema), defaultValues: { name: "" } });

  useEffect(() => {
    listPermissions()
      .then(setCatalog)
      .catch(() => setError("Impossible de charger la liste des permissions."));
  }, []);

  async function add(values: RoleFormInput) {
    setError(null);

    try {
      const created = await createRole({ name: values.name });
      reset();
      reload();
      // Un rôle vide ne sert à rien : on ouvre aussitôt ses permissions.
      setPermissionsOf(created);
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible de créer ce rôle."));
    }
  }

  /** Enchaîne une action sur une ligne : verrouille ses boutons, montre l'erreur, recharge la liste. */
  async function run(role: Role, action: () => Promise<unknown>, failure: string) {
    setBusyId(role.id);
    setError(null);

    try {
      await action();
      setEditing(null);
      reload();
    } catch (caught) {
      setError(getErrorMessage(caught, failure));
    } finally {
      setBusyId(null);
    }
  }

  const columns: DataTableColumn<Role>[] = [
    {
      key: "name",
      header: "Rôle",
      className: "min-w-56",
      value: (row) => row.label,
      render: (row) =>
        editing?.id === row.id ? (
          <Input
            aria-label={`Nom de ${row.label}`}
            value={editing.name}
            maxLength={60}
            onChange={(event) => setEditing({ ...editing, name: event.target.value })}
          />
        ) : (
          <span className="font-medium">{row.label}</span>
        ),
    },
    {
      key: "type",
      header: "Type",
      value: (row) => (row.is_system ? "Système" : "Personnalisé"),
      render: (row) => (row.is_system ? <Badge tone="info">Système</Badge> : <Badge tone="neutral">Personnalisé</Badge>),
    },
    {
      key: "permissions",
      header: "Permissions",
      value: (row) => row.permissions_count ?? 0,
      render: (row) => row.permissions_count ?? 0,
    },
    {
      key: "users",
      header: "Utilisateurs",
      value: (row) => row.users_count ?? 0,
      render: (row) => row.users_count ?? 0,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) =>
        editing?.id === row.id ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              loading={busyId === row.id}
              disabled={editing.name.trim().length < 2}
              aria-label={`Enregistrer ${row.label}`}
              onClick={() => run(row, () => updateRole(row.id, { name: editing.name.trim() }), "Impossible de renommer ce rôle.")}
            >
              <Check className="size-4" />
            </Button>
            <Button size="sm" variant="secondary" aria-label="Annuler la modification" onClick={() => setEditing(null)}>
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="gradient"
              aria-label={`Permissions de ${row.label}`}
              disabled={busyId !== null}
              onClick={() => setPermissionsOf(row)}
            >
              <ShieldCheck className="size-4" aria-hidden="true" /> Permissions
            </Button>
            {!row.is_system && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`Renommer ${row.label}`}
                  disabled={busyId !== null}
                  onClick={() => setEditing({ id: row.id, name: row.name })}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  aria-label={`Supprimer ${row.label}`}
                  disabled={busyId !== null}
                  onClick={() => {
                    if (window.confirm(`Supprimer le rôle « ${row.label} » ?`)) {
                      void run(
                        row,
                        async () => {
                          await deleteRole(row.id);
                          if (permissionsOf?.id === row.id) setPermissionsOf(null);
                        },
                        "Impossible de supprimer ce rôle.",
                      );
                    }
                  }}
                >
                  <Trash2 className="size-4" />
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
        title="Rôles et permissions"
        description="Créez des rôles, puis choisissez ce que chacun peut faire dans l'application."
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      <Card accent="users" className="mb-6 max-w-3xl">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(add)} className="grid items-start gap-4 sm:grid-cols-[1fr_auto]" noValidate>
            <div>
              <Label htmlFor="role-name">Nouveau rôle</Label>
              <Input id="role-name" placeholder="Secrétaire, Surveillant général..." maxLength={60} {...register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </div>
            <Button type="submit" className="sm:mt-6" loading={isSubmitting}>
              <Plus className="size-4" /> Créer le rôle
            </Button>
          </form>
        </CardContent>
      </Card>

      {permissionsOf && (
        <RolePermissionsEditor
          key={permissionsOf.id}
          role={permissionsOf}
          catalog={catalog}
          onChanged={reload}
          onClose={() => setPermissionsOf(null)}
        />
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
    </div>
  );
}
