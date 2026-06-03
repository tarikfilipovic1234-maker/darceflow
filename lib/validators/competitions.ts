import { z } from "zod";

export const PLACEMENTS = ["GOLD", "SILVER", "BRONZE", "FOURTH", "DNP"] as const;

export const createCompetitionSchema = z.object({
  userId: z.string().min(1),
  eventName: z.string().min(2, "Use at least 2 characters.").max(120),
  division: z.string().max(60).optional().or(z.literal("")),
  weightClassKg: z.coerce.number().int().min(20).max(250).optional().or(z.literal("")),
  placement: z.enum(PLACEMENTS),
  wins: z.coerce.number().int().min(0).max(40),
  losses: z.coerce.number().int().min(0).max(40),
  competedAt: z.string().min(1, "Pick a date."),
  note: z.string().max(280).optional().or(z.literal("")),
});

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;

export const PLACEMENT_LABEL: Record<(typeof PLACEMENTS)[number], string> = {
  GOLD: "Gold",
  SILVER: "Silver",
  BRONZE: "Bronze",
  FOURTH: "4th",
  DNP: "Did not place",
};
