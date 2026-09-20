import { z } from "zod";

export const attendanceSchema = z.object({
  date: z.string().min(1, "La date est requise."),
  status: z.enum(["present", "absent", "retard"], { message: "Selectionnez un statut." }),
  reason: z.string().optional().or(z.literal("")),
});

export type AttendanceFormInput = z.infer<typeof attendanceSchema>;
