import { z } from "zod";

export const admissionSchema = z.object({
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, "Format attendu : 2025-2026."),
  level: z.string().min(1, "Le niveau demandé est requis."),
  first_name: z.string().min(1, "Le prénom est requis."),
  last_name: z.string().min(1, "Le nom est requis."),
  gender: z.enum(["M", "F"], { message: "Sélectionnez le sexe." }),
  birth_date: z.string().optional().or(z.literal("")),
  previous_school: z.string().optional().or(z.literal("")),
  guardian_name: z.string().min(1, "Le nom du tuteur est requis."),
  guardian_phone: z.string().min(1, "Le téléphone du tuteur est requis."),
  guardian_email: z.string().email("Adresse e-mail invalide.").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type AdmissionFormInput = z.infer<typeof admissionSchema>;
