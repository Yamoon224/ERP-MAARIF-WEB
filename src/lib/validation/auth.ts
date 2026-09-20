import { z } from "zod";

export const staffLoginSchema = z.object({
  email: z.string().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;

export const parentLoginSchema = z.object({
  matricule: z.string().min(1, "Le matricule est requis."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type ParentLoginInput = z.infer<typeof parentLoginSchema>;
