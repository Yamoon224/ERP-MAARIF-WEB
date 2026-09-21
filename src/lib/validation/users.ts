import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(8, "8 caracteres minimum."),
  roles: z.array(z.string()).min(1, "Sélectionnez au moins un rôle."),
});

export type UserFormInput = z.infer<typeof userSchema>;
