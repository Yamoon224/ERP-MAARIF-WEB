import { z } from "zod";

export const summonSchema = z.object({
  reason: z.string().min(1, "Le motif est requis."),
  scheduled_at: z.string().min(1, "La date est requise."),
  location: z.string().optional().or(z.literal("")),
});

export type SummonFormInput = z.infer<typeof summonSchema>;

export const sanctionSchema = z.object({
  type: z.enum(["avertissement", "exclusion_temporaire", "renvoi_definitif"], { message: "Selectionnez un type." }),
  reason: z.string().min(1, "Le motif est requis."),
  start_date: z.string().min(1, "La date de debut est requise."),
  end_date: z.string().optional().or(z.literal("")),
});

export type SanctionFormInput = z.infer<typeof sanctionSchema>;
