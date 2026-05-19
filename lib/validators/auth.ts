import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Use at least 2 characters.")
    .max(60, "Name is too long."),
  gymName: z
    .string()
    .min(2, "Gym name is too short.")
    .max(80, "Gym name is too long."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "At least 8 characters.")
    .max(72, "Maximum 72 characters."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
