"use client";

import { useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/staff/ExpenseForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { createExpense } from "@/lib/api/expenses";
import { useT } from "@/lib/i18n/store";

export default function NewExpensePage() {
  const { t } = useT();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("Nouvelle dépense")}
        description={t("Le montant est calculé : quantité × prix unitaire. Le numéro de dépense est attribué à l'enregistrement.")}
      />

      <ExpenseForm
        submitLabel={t("Enregistrer la dépense")}
        failureMessage={t("Impossible d'enregistrer cette dépense.")}
        onSubmit={async (payload) => {
          const expense = await createExpense(payload);
          router.push(`/expenses/${expense.id}`);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
