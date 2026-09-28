"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/staff/ExpenseForm";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { getExpense, updateExpense } from "@/lib/api/expenses";
import type { Expense } from "@/lib/api/types";
import { useT } from "@/lib/i18n/store";
import type { ExpenseFormInput } from "@/lib/validation/expenses";

/** Valeurs du formulaire d'après une dépense : les champs vides de l'API deviennent des chaînes vides. */
function toFormValues(expense: Expense): ExpenseFormInput {
  return {
    expense_category_id: expense.category?.id ?? "",
    label: expense.label,
    supplier_name: expense.supplier_name ?? "",
    quantity: String(expense.quantity),
    unit: expense.unit ?? "",
    unit_price: String(expense.unit_price),
    method: expense.method,
    invoice_reference: expense.invoice_reference ?? "",
    spent_at: expense.spent_at,
    note: expense.note ?? "",
  };
}

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useT();
  const { id } = use(params);
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getExpense(id)
      .then(setExpense)
      .catch(() => setFailed(true));
  }, [id]);

  if (failed) return <Alert>{t("Dépense introuvable.")}</Alert>;
  if (!expense) return <p className="text-sm text-muted">{t("Chargement...")}</p>;

  const back = `/expenses/${id}`;

  // Une dépense annulée est figée : on en saisit une nouvelle plutôt que de réécrire l'historique.
  if (expense.status === "cancelled") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert>{t("Cette dépense est annulée : elle ne peut plus être modifiée. Saisissez-en une nouvelle.")}</Alert>
        <Link href={back} className="text-sm font-medium text-primary hover:underline">
          {t("← Retour à la dépense")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Modifier {number}", { number: expense.number })}
        description={t("Le numéro et l'auteur de la saisie ne changent pas ; le montant est recalculé.")}
      />

      <ExpenseForm
        defaultValues={toFormValues(expense)}
        currentCategory={expense.category}
        submitLabel={t("Enregistrer les modifications")}
        failureMessage={t("Impossible de modifier cette dépense.")}
        onSubmit={async (payload) => {
          await updateExpense(id, payload);
          router.push(back);
        }}
        onCancel={() => router.push(back)}
      />
    </div>
  );
}
