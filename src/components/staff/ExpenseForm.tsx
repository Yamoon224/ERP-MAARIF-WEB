"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { listExpenseCategories, listSuppliers, type ExpensePayload } from "@/lib/api/expenses";
import { getErrorMessage } from "@/lib/api/error";
import type { ExpenseCategory, PaymentMethod } from "@/lib/api/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/labels";
import { formatMoney, today } from "@/lib/utils/format";
import { expenseSchema, parseAmount, type ExpenseFormInput } from "@/lib/validation/expenses";

/** Unités courantes des achats scolaires, proposées en saisie semi-automatique (le champ reste libre). */
const UNITS = ["unité", "boîte", "paquet", "carton", "ramette", "registre", "cahier", "lot", "facture"];

interface ExpenseFormProps {
  /** Valeurs de départ (modification) ; vide pour une nouvelle dépense. */
  defaultValues?: Partial<ExpenseFormInput>;
  /** Catégorie déjà portée par la dépense modifiée : reste proposée même désactivée. */
  currentCategory?: { id: string; name: string };
  submitLabel: string;
  failureMessage: string;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
  onCancel: () => void;
}

/** Formulaire d'une dépense ou d'un approvisionnement, partagé par la saisie et la correction. */
export function ExpenseForm({ defaultValues, currentCategory, submitLabel, failureMessage, onSubmit, onCancel }: ExpenseFormProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { expense_category_id: "", method: "cash", quantity: "1", spent_at: today(), ...defaultValues },
  });

  useEffect(() => {
    listExpenseCategories(true)
      .then(setCategories)
      .catch(() => setCategories([]));
    listSuppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
  }, []);

  const [quantity, unitPrice] = useWatch({ control, name: ["quantity", "unit_price"] });
  const total = parseAmount(quantity ?? "") * parseAmount(unitPrice ?? "");
  const hasTotal = Number.isFinite(total) && total > 0;

  const options = currentCategory && !categories.some((category) => category.id === currentCategory.id) ? [...categories, currentCategory] : categories;

  async function submit(values: ExpenseFormInput) {
    setServerError(null);

    try {
      await onSubmit({
        expense_category_id: values.expense_category_id,
        label: values.label.trim(),
        supplier_name: values.supplier_name?.trim() || null,
        quantity: parseAmount(values.quantity),
        unit: values.unit?.trim() || null,
        unit_price: parseAmount(values.unit_price),
        method: values.method,
        invoice_reference: values.invoice_reference?.trim() || null,
        spent_at: values.spent_at,
        note: values.note?.trim() || null,
      });
    } catch (error) {
      setServerError(getErrorMessage(error, failureMessage));
    }
  }

  return (
    <Card accent="attendance">
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
          {serverError && <Alert>{serverError}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="spent_at">Date de l&apos;achat</Label>
              <Input id="spent_at" type="date" max={today()} {...register("spent_at")} />
              <FieldError>{errors.spent_at?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="expense_category_id">Catégorie</Label>
              <Select id="expense_category_id" {...register("expense_category_id")}>
                <option value="" disabled>
                  Choisir une catégorie
                </option>
                {options.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.expense_category_id?.message}</FieldError>
            </div>
          </div>

          <div>
            <Label htmlFor="label">Désignation</Label>
            <Input id="label" placeholder="Craies blanches, registres d'appel..." maxLength={150} {...register("label")} />
            <FieldError>{errors.label?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="supplier_name">Fournisseur (facultatif)</Label>
            <Input id="supplier_name" list="expense-suppliers" placeholder="Papeterie Centrale" maxLength={150} {...register("supplier_name")} />
            <datalist id="expense-suppliers">
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier} />
              ))}
            </datalist>
            <FieldError>{errors.supplier_name?.message}</FieldError>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="quantity">Quantité</Label>
              <Input id="quantity" inputMode="decimal" {...register("quantity")} />
              <FieldError>{errors.quantity?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="unit">Unité (facultatif)</Label>
              <Input id="unit" list="expense-units" placeholder="boîte" maxLength={30} {...register("unit")} />
              <datalist id="expense-units">
                {UNITS.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
              <FieldError>{errors.unit?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="unit_price">Prix unitaire</Label>
              <Input id="unit_price" inputMode="decimal" placeholder="12000" {...register("unit_price")} />
              <FieldError>{errors.unit_price?.message}</FieldError>
            </div>
          </div>

          <p className="flex items-baseline justify-between rounded-md border border-border bg-background px-4 py-3" aria-live="polite">
            <span className="text-sm text-muted">Montant total</span>
            <span className="text-lg font-semibold text-foreground">{hasTotal ? formatMoney(total) : "—"}</span>
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="method">Mode de paiement</Label>
              <Select id="method" {...register("method")}>
                {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABEL[method]}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.method?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="invoice_reference">N° de facture ou de bon (facultatif)</Label>
              <Input id="invoice_reference" maxLength={100} {...register("invoice_reference")} />
              <FieldError>{errors.invoice_reference?.message}</FieldError>
            </div>
          </div>

          <div>
            <Label htmlFor="note">Note (facultatif)</Label>
            <Textarea id="note" maxLength={255} {...register("note")} />
            <FieldError>{errors.note?.message}</FieldError>
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={isSubmitting}>
              {submitLabel}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
