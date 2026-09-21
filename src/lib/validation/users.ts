import { z } from "zod";

const identity = {
  name: z.string().trim().min(1, "Le nom est requis."),
  email: z.string().trim().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
  phone: z.string().trim().max(30, "30 caractères au plus.").optional().or(z.literal("")),
  roles: z.array(z.string()).min(1, "Sélectionnez au moins un rôle."),
  is_active: z.boolean(),
};

/** Création d'un compte : le mot de passe initial est exigé. */
export const userSchema = z.object({
  ...identity,
  password: z.string().min(8, "8 caractères minimum."),
});

/** Modification d'un compte : le mot de passe ne s'y change pas (voir `resetPasswordSchema`). */
export const userEditSchema = z.object(identity);

/** Réinitialisation du mot de passe d'un compte par un administrateur : pas d'ancien mot de passe. */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "8 caractères minimum."),
    password_confirmation: z.string().min(1, "Confirmez le nouveau mot de passe."),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

export type UserFormInput = z.infer<typeof userSchema>;
export type UserEditFormInput = z.infer<typeof userEditSchema>;
export type ResetPasswordFormInput = z.infer<typeof resetPasswordSchema>;
