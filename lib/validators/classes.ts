import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(2, "Use at least 2 characters.").max(80),
  description: z.string().max(280).optional().or(z.literal("")),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM, 24-hour."),
  durationMin: z.coerce.number().int().min(15).max(240),
  capacity: z.coerce.number().int().min(1).max(200),
  coachId: z.string().optional().or(z.literal("")),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
