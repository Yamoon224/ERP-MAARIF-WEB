import { z } from "zod";

export const studentSchema = z.object({
  first_name: z.string().min(1, "Le prenom est requis."),
  last_name: z.string().min(1, "Le nom est requis."),
  gender: z.enum(["M", "F"], { message: "Selectionnez le sexe." }),
  birth_date: z.string().optional().or(z.literal("")),
  school_class_id: z.string().optional().or(z.literal("")),
  guardian_name: z.string().min(1, "Le nom du tuteur est requis."),
  guardian_phone: z.string().min(1, "Le telephone du tuteur est requis."),
  guardian_email: z.string().email("Adresse e-mail invalide.").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export type StudentFormInput = z.infer<typeof studentSchema>;
