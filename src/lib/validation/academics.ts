import { z } from "zod";

export const schoolClassSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  level: z.string().min(1, "Le niveau est requis."),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, "Format attendu : 2025-2026."),
});

export type SchoolClassFormInput = z.infer<typeof schoolClassSchema>;

export const subjectSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  code: z.string().min(1, "Le code est requis."),
  coefficient: z
    .string()
    .min(1, "Le coefficient est requis.")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0.5, "Le coefficient doit etre d'au moins 0.5."),
});

export type SubjectFormInput = z.infer<typeof subjectSchema>;

export const termSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, "Format attendu : 2025-2026."),
  starts_at: z.string().min(1, "La date de debut est requise."),
  ends_at: z.string().min(1, "La date de fin est requise."),
  is_current: z.boolean().optional(),
});

export type TermFormInput = z.infer<typeof termSchema>;
