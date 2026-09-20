"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedResource } from "@/lib/hooks/usePaginatedResource";
import { usePagination } from "@/lib/hooks/usePagination";
import { userSchema, type UserFormInput } from "@/lib/validation/users";
import { createUser, deleteUser, listUsers } from "@/lib/api/users";
import { getErrorMessage } from "@/lib/api/error";
import type { StaffUser } from "@/lib/api/types";

const ROLE_LABEL: Record<string, string> = { admin: "Administrateur", teacher: "Enseignant" };

export default function UsersPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const { page, perPage, setPage, setPerPage } = usePagination();
  const { data, meta, isLoading, reload } = usePaginatedResource(
    () => listUsers({ page, per_page: perPage }),
    [page, perPage],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormInput>({ resolver: zodResolver(userSchema), defaultValues: { roles: ["teacher"] } });

  async function onSubmit(values: UserFormInput) {
    setServerError(null);

    try {
      await createUser(values);
      reset({ roles: ["teacher"], name: "", email: "", password: "" });
      reload();
    } catch (error) {
      setServerError(getErrorMessage(error, "Impossible de creer ce compte."));
    }
  }

  async function handleDelete(user: StaffUser) {
    await deleteUser(user.id);
    reload();
  }

  const columns: DataTableColumn<StaffUser>[] = [
    { key: "name", header: "Nom", render: (row) => row.name },
    { key: "email", header: "E-mail", render: (row) => row.email },
    {
      key: "roles",
      header: "Roles",
      render: (row) => (
        <div className="flex gap-1.5">
          {row.roles.map((role) => (
            <Badge key={role} tone="info">
              {ROLE_LABEL[role] ?? role}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: "status", header: "Statut", render: (row) => <Badge tone={row.is_active ? "success" : "neutral"}>{row.is_active ? "Actif" : "Inactif"}</Badge> },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button onClick={() => handleDelete(row)} aria-label="Supprimer le compte" className="text-muted hover:text-danger">
          <Trash2 className="size-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Comptes du personnel</h1>

      <Card accent="users" className="mb-6">
        <CardHeader>
          <CardTitle>Nouveau compte</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-4" noValidate>
            {serverError && (
              <div className="sm:col-span-4">
                <Alert>{serverError}</Alert>
              </div>
            )}

            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" placeholder="Nom complet" {...register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="nom@exemple.com" {...register("email")} />
              <FieldError>{errors.email?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <PasswordInput id="password" placeholder="Mot de passe initial" {...register("password")} />
              <FieldError>{errors.password?.message}</FieldError>
            </div>

            <div>
              <Label>Role</Label>
              <Controller
                control={control}
                name="roles"
                render={({ field }) => (
                  <div className="flex h-10 items-center gap-4 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={field.value?.[0] === "admin"}
                        onChange={() => field.onChange(["admin"])}
                      />
                      Admin
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={field.value?.[0] === "teacher"}
                        onChange={() => field.onChange(["teacher"])}
                      />
                      Enseignant
                    </label>
                  </div>
                )}
              />
              <FieldError>{errors.roles?.message}</FieldError>
            </div>

            <div className="sm:col-span-4">
              <Button type="submit" loading={isSubmitting}>
                <Plus className="size-4" /> Creer le compte
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <DataTable columns={columns} rows={data} rowKey={(row) => row.id} isLoading={isLoading} />

      {meta && <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} />}
    </div>
  );
}
