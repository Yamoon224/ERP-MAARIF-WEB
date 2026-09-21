"use client";

import { useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/staff/ExpenseForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { createExpense } from "@/lib/api/expenses";

export default function NewExpensePage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nouvelle dépense" description="Le montant est calculé : quantité × prix unitaire. Le numéro de dépense est attribué à l'enregistrement." />

      <ExpenseForm
        submitLabel="Enregistrer la dépense"
        failureMessage="Impossible d'enregistrer cette dépense."
        onSubmit={async (payload) => {
          const expense = await createExpense(payload);
          router.push(`/expenses/${expense.id}`);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
