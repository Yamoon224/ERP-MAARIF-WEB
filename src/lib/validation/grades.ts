import { z } from "zod";

export const gradeSchema = z.object({
  subject_id: z.string().min(1, "Selectionnez une matiere."),
  term_id: z.string().min(1, "Selectionnez un trimestre."),
  type: z.enum(["devoir", "composition"], { message: "Selectionnez un type." }),
  value: z
    .string()
    .min(1, "La note est requise.")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, "La note doit etre positive."),
  max_value: z
    .string()
    .min(1, "Le bareme est requis.")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, "Le bareme doit etre superieur a 0."),
  recorded_at: z.string().min(1, "La date est requise."),
  comment: z.string().optional().or(z.literal("")),
});

export type GradeFormInput = z.infer<typeof gradeSchema>;
