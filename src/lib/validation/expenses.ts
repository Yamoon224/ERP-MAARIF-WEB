import { z } from "zod";
import { today } from "@/lib/utils/format";

/** Nombre saisi à la main : la virgule décimale française est acceptée. */
export function parseAmount(value: string): number {
  return Number(value.trim().replace(/\s/g, "").replace(",", "."));
}

const positiveNumber = (required: string, invalid: string) =>
  z
    .string()
    .min(1, required)
    .refine((value) => Number.isFinite(parseAmount(value)) && parseAmount(value) > 0, invalid);

export const expenseSchema = z.object({
  expense_category_id: z.string().min(1, "Sélectionnez une catégorie."),
  label: z.string().min(1, "La désignation est requise.").max(150, "150 caractères au plus."),
  supplier_name: z.string().max(150, "150 caractères au plus.").optional().or(z.literal("")),
  quantity: positiveNumber("La quantité est requise.", "La quantité doit être supérieure à 0."),
  unit: z.string().max(30, "30 caractères au plus.").optional().or(z.literal("")),
  unit_price: positiveNumber("Le prix unitaire est requis.", "Le prix unitaire doit être supérieur à 0."),
  method: z.enum(["cash", "mobile_money", "bank_transfer", "cheque"], { message: "Sélectionnez un mode de paiement." }),
  invoice_reference: z.string().max(100, "100 caractères au plus.").optional().or(z.literal("")),
  spent_at: z
    .string()
    .min(1, "La date est requise.")
    .refine((value) => value <= today(), "La date ne peut pas être dans le futur."),
  note: z.string().max(255, "255 caractères au plus.").optional().or(z.literal("")),
});

export type ExpenseFormInput = z.infer<typeof expenseSchema>;

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(100, "100 caractères au plus."),
  description: z.string().max(255, "255 caractères au plus.").optional().or(z.literal("")),
});

export type ExpenseCategoryFormInput = z.infer<typeof expenseCategorySchema>;
