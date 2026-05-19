"use server";

import bcrypt from "bcryptjs";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomSuffix, slugify } from "@/lib/slug";
import { registerSchema } from "@/lib/validators/auth";

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function registerAction(
  _prev: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    gymName: String(formData.get("gymName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const { name, gymName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const baseSlug = slugify(gymName) || "gym";
  let slug = baseSlug;
  let attempts = 0;
  while (await prisma.gym.findUnique({ where: { slug } })) {
    attempts += 1;
    slug = `${baseSlug}-${randomSuffix()}`;
    if (attempts > 8) {
      return { error: "Could not assign a unique gym slug. Try a different name." };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const gym = await tx.gym.create({ data: { name: gymName, slug } });
    await tx.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: "ADMIN",
        gymId: gym.id,
      },
    });
  });

  // signIn throws a framework-handled redirect on success. Any other error
  // (e.g. config) bubbles up to Next.js — credentials we just minted are
  // guaranteed valid.
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });

  return {};
}
