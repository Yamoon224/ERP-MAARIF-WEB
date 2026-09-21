"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { createExpenseCategory, deleteExpenseCategory, listExpenseCategories, updateExpenseCategory } from "@/lib/api/expenses";
import { getErrorMessage } from "@/lib/api/error";
import type { ExpenseCategory } from "@/lib/api/types";
import { expenseCategorySchema, type ExpenseCategoryFormInput } from "@/lib/validation/expenses";

/**
 * Postes de dépense de l'établissement. Une catégorie qui porte déjà des
 * dépenses ne se supprime pas (l'historique resterait sans poste) : on la
 * désactive, et elle n'est plus proposée à la saisie.
 */
export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseCategoryFormInput>({ resolver: zodResolver(expenseCategorySchema), defaultValues: { name: "", description: "" } });

  const load = useCallback(() => {
    listExpenseCategories()
      .then(setCategories)
      .catch(() => setError("Impossible de charger les catégories."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(load, [load]);

  async function add(values: ExpenseCategoryFormInput) {
    setError(null);

    try {
      await createExpenseCategory({ name: values.name.trim(), description: values.description?.trim() || null });
      reset();
      load();
    } catch (failure) {
      setError(getErrorMessage(failure, "Impossible d'ajouter cette catégorie."));
    }
  }

  /** Enchaîne une action sur une ligne : verrouille ses boutons, montre l'erreur, recharge la liste. */
  async function run(category: ExpenseCategory, action: () => Promise<unknown>, failure: string) {
    setBusyId(category.id);
    setError(null);

    try {
      await action();
      setEditing(null);
      load();
    } catch (caught) {
      setError(getErrorMessage(caught, failure));
    } finally {
      setBusyId(null);
    }
  }

  const columns: DataTableColumn<ExpenseCategory>[] = [
    {
      key: "name",
      header: "Catégorie",
      className: "min-w-56",
      render: (row) =>
        editing?.id === row.id ? (
          <div className="space-y-2">
            <Input
              aria-label={`Nom de ${row.name}`}
              value={editing.name}
              maxLength={100}
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            />
            <Input
              aria-label={`Description de ${row.name}`}
              value={editing.description}
              maxLength={255}
              placeholder="Description (facultatif)"
              onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            />
          </div>
        ) : (
          <div>
            <p className="font-medium">{row.name}</p>
            {row.description && <p className="text-xs text-muted">{row.description}</p>}
          </div>
        ),
    },
    { key: "count", header: "Dépenses", render: (row) => row.expenses_count },
    {
      key: "status",
      header: "Statut",
      render: (row) => (row.is_active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Désactivée</Badge>),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        editing?.id === row.id ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={busyId === row.id}
              disabled={!editing.name.trim()}
              aria-label={`Enregistrer ${row.name}`}
              onClick={() =>
                run(row, () => updateExpenseCategory(row.id, { name: editing.name.trim(), description: editing.description.trim() || null }), "Impossible de modifier cette catégorie.")
              }
            >
              <Check className="size-4" />
            </Button>
            <Button size="sm" variant="secondary" aria-label="Annuler la modification" onClick={() => setEditing(null)}>
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              aria-label={`Renommer ${row.name}`}
              disabled={busyId !== null}
              onClick={() => setEditing({ id: row.id, name: row.name, description: row.description ?? "" })}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${row.is_active ? "Désactiver" : "Réactiver"} ${row.name}`}
              disabled={busyId !== null}
              onClick={() => run(row, () => updateExpenseCategory(row.id, { name: row.name, description: row.description, is_active: !row.is_active }), "Impossible de modifier cette catégorie.")}
            >
              <Power className="size-4" />
            </Button>
            {row.expenses_count === 0 && (
              <Button
                size="sm"
                variant="danger"
                aria-label={`Supprimer ${row.name}`}
                disabled={busyId !== null}
                onClick={() => {
                  if (window.confirm(`Supprimer la catégorie « ${row.name} » ?`)) {
                    void run(row, () => deleteExpenseCategory(row.id), "Impossible de supprimer cette catégorie.");
                  }
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ),
    },
  ];

  return (
    <div>
      <Link href="/expenses" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Dépenses
      </Link>

      <PageHeader title="Catégories de dépenses" description="Les postes proposés à la saisie d'une dépense : fournitures, registres, entretien..." />

      {error && <Alert className="mb-4">{error}</Alert>}

      <Card accent="attendance" className="mb-6 max-w-3xl">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(add)} className="grid items-start gap-4 sm:grid-cols-[1fr_1.5fr_auto]" noValidate>
            <div>
              <Label htmlFor="category-name">Nouvelle catégorie</Label>
              <Input id="category-name" placeholder="Sorties pédagogiques" maxLength={100} {...register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="category-description">Description (facultatif)</Label>
              <Input id="category-description" maxLength={255} {...register("description")} />
              <FieldError>{errors.description?.message}</FieldError>
            </div>
            <Button type="submit" className="sm:mt-6" loading={isSubmitting}>
              <Plus className="size-4" /> Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable columns={columns} rows={categories} rowKey={(row) => row.id} isLoading={isLoading} emptyMessage="Aucune catégorie." />
    </div>
  );
}
