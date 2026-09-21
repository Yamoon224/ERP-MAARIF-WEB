import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit compter au moins 2 caractères.").max(60, "60 caractères au plus."),
});

export type RoleFormInput = z.infer<typeof roleSchema>;
