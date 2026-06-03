import { z } from "zod";

export const inviteMemberSchema = z.object({
  name: z.string().min(2, "Use at least 2 characters.").max(60),
  email: z.string().email("Enter a valid email."),
  role: z.enum(["ADMIN", "COACH", "STUDENT"]),
  belt: z.enum(["WHITE", "BLUE", "PURPLE", "BROWN", "BLACK"]).optional(),
  password: z.string().min(8, "At least 8 characters.").max(72),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "COACH", "STUDENT"]),
});

export const updateBeltSchema = z.object({
  userId: z.string().min(1),
  belt: z.enum(["WHITE", "BLUE", "PURPLE", "BROWN", "BLACK"]),
  stripes: z.coerce.number().int().min(0).max(4),
});
