import { z } from "zod";

export const staffLoginSchema = z.object({
  email: z.string().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
  remember: z.boolean(),
});

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;

export const parentLoginSchema = z.object({
  matricule: z.string().min(1, "Le matricule est requis."),
  password: z.string().min(1, "Le mot de passe est requis."),
  remember: z.boolean(),
});

export type ParentLoginInput = z.infer<typeof parentLoginSchema>;

/** « Mot de passe oublié » : un seul champ, l'e-mail du compte (personnel) ou le matricule de l'élève (parent). */
export const staffForgotPasswordSchema = z.object({
  identifier: z.string().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
});

export const parentForgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Le matricule est requis."),
});

export type ForgotPasswordInput = z.infer<typeof staffForgotPasswordSchema>;

/** Nouveau mot de passe choisi depuis le lien reçu : saisi deux fois, comme au changement de mot de passe. */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "8 caractères minimum."),
    password_confirmation: z.string().min(1, "Confirmez le nouveau mot de passe."),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
