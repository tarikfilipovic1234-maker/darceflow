import { z } from "zod";

export const BODY_PARTS = [
  "HEAD",
  "NECK",
  "SHOULDER",
  "ELBOW",
  "WRIST",
  "HAND_FINGER",
  "RIBS",
  "BACK",
  "HIP",
  "GROIN",
  "KNEE",
  "ANKLE",
  "FOOT_TOE",
  "OTHER",
] as const;

export const SEVERITIES = ["MINOR", "MODERATE", "SEVERE"] as const;
export const STATUSES = ["ACTIVE", "RECOVERING", "RESOLVED"] as const;

export const createInjurySchema = z.object({
  userId: z.string().min(1),
  bodyPart: z.enum(BODY_PARTS),
  severity: z.enum(SEVERITIES),
  startedAt: z.string().min(1, "Pick a date."),
  note: z.string().max(280).optional().or(z.literal("")),
});

export const updateInjuryStatusSchema = z.object({
  injuryId: z.string().min(1),
  status: z.enum(STATUSES),
});

export const BODY_PART_LABEL: Record<(typeof BODY_PARTS)[number], string> = {
  HEAD: "Head",
  NECK: "Neck",
  SHOULDER: "Shoulder",
  ELBOW: "Elbow",
  WRIST: "Wrist",
  HAND_FINGER: "Hand / finger",
  RIBS: "Ribs",
  BACK: "Back",
  HIP: "Hip",
  GROIN: "Groin",
  KNEE: "Knee",
  ANKLE: "Ankle",
  FOOT_TOE: "Foot / toe",
  OTHER: "Other",
};

export const SEVERITY_LABEL: Record<(typeof SEVERITIES)[number], string> = {
  MINOR: "Minor",
  MODERATE: "Moderate",
  SEVERE: "Severe",
};

export const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  ACTIVE: "Active",
  RECOVERING: "Recovering",
  RESOLVED: "Resolved",
};
