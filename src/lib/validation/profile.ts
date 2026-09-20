import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  email: z.string().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
  phone: z.string().optional().or(z.literal("")),
});

export type ProfileFormInput = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Le mot de passe actuel est requis."),
    password: z.string().min(8, "8 caractères minimum."),
    password_confirmation: z.string().min(1, "Confirmez le nouveau mot de passe."),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Les deux mots de passe ne correspondent pas.",
  })
  .refine((values) => values.password !== values.current_password, {
    path: ["password"],
    message: "Le nouveau mot de passe doit être différent de l'ancien.",
  });

export type PasswordFormInput = z.infer<typeof passwordSchema>;
