import { z } from "zod";

export const INTERVALS = ["MONTH", "YEAR"] as const;

export const createPlanSchema = z.object({
  name: z.string().min(2, "Use at least 2 characters.").max(60),
  description: z.string().max(200).optional().or(z.literal("")),
  amountCents: z.coerce.number().int().min(0).max(1_000_000),
  interval: z.enum(INTERVALS),
  features: z.string().max(500).optional().or(z.literal("")),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const INTERVAL_LABEL: Record<(typeof INTERVALS)[number], string> = {
  MONTH: "Monthly",
  YEAR: "Yearly",
};
