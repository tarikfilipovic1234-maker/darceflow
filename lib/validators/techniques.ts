import { z } from "zod";

export const POSITIONS = [
  "CLOSED_GUARD",
  "OPEN_GUARD",
  "HALF_GUARD",
  "BUTTERFLY_GUARD",
  "SIDE_CONTROL",
  "KNEE_ON_BELLY",
  "MOUNT",
  "BACK",
  "TURTLE",
  "STANDING",
  "NORTH_SOUTH",
  "OTHER",
] as const;

export const CATEGORIES = [
  "SUBMISSION",
  "SWEEP",
  "ESCAPE",
  "PASS",
  "TAKEDOWN",
  "TRANSITION",
  "DRILL",
  "CONCEPT",
] as const;

export const POSITION_LABEL: Record<(typeof POSITIONS)[number], string> = {
  CLOSED_GUARD: "Closed guard",
  OPEN_GUARD: "Open guard",
  HALF_GUARD: "Half guard",
  BUTTERFLY_GUARD: "Butterfly guard",
  SIDE_CONTROL: "Side control",
  KNEE_ON_BELLY: "Knee on belly",
  MOUNT: "Mount",
  BACK: "Back",
  TURTLE: "Turtle",
  STANDING: "Standing",
  NORTH_SOUTH: "North–south",
  OTHER: "Other",
};

export const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  SUBMISSION: "Submission",
  SWEEP: "Sweep",
  ESCAPE: "Escape",
  PASS: "Pass",
  TAKEDOWN: "Takedown",
  TRANSITION: "Transition",
  DRILL: "Drill",
  CONCEPT: "Concept",
};

export const createTechniqueSchema = z.object({
  title: z.string().min(2, "Use at least 2 characters.").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  videoUrl: z.string().url("Paste a valid URL."),
  thumbnailUrl: z.string().url("Paste a valid URL.").optional().or(z.literal("")),
  position: z.enum(POSITIONS),
  category: z.enum(CATEGORIES),
  tags: z.string().max(200).optional().or(z.literal("")),
  durationSec: z.coerce.number().int().min(1).max(60 * 60 * 4).optional().or(z.literal("")),
});

export type CreateTechniqueInput = z.infer<typeof createTechniqueSchema>;
