"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import {
  inviteMemberSchema,
  updateBeltSchema,
  updateRoleSchema,
} from "@/lib/validators/members";

export type InviteMemberState = {
  ok?: true;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function inviteMemberAction(
  _prev: InviteMemberState | undefined,
  formData: FormData,
): Promise<InviteMemberState> {
  const { session, gymId } = await requireGymId();
  if (session.user.role === "STUDENT") {
    return { error: "Students cannot invite members." };
  }

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    role: String(formData.get("role") ?? "STUDENT"),
    belt: (String(formData.get("belt") ?? "") || undefined) as string | undefined,
    password: String(formData.get("password") ?? ""),
  };

  const parsed = inviteMemberSchema.safeParse(raw);
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

  // Coaches can only invite students.
  if (session.user.role === "COACH" && parsed.data.role !== "STUDENT") {
    return { error: "Coaches can only invite students." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Someone with that email already has an account." };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      hashedPassword,
      role: parsed.data.role,
      belt: parsed.data.belt ?? (parsed.data.role === "STUDENT" ? "WHITE" : null),
      gymId,
    },
  });

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
  redirect("/dashboard/members");
}

export async function updateRoleAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const { gymId } = await requireGymId();

  const parsed = updateRoleSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    role: String(formData.get("role") ?? ""),
  });
  if (!parsed.success) {
    throw new Error("Invalid role update.");
  }

  // Tenant guard: only update users in the same gym.
  await prisma.user.update({
    where: { id: parsed.data.userId, gymId },
    data: { role: parsed.data.role },
  });

  revalidatePath(`/dashboard/members/${parsed.data.userId}`);
  revalidatePath("/dashboard/members");
}

export async function updateBeltAction(formData: FormData) {
  const { session, gymId } = await requireGymId();
  if (session.user.role === "STUDENT") {
    throw new Error("Students cannot promote.");
  }

  const parsed = updateBeltSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    belt: String(formData.get("belt") ?? ""),
    stripes: String(formData.get("stripes") ?? "0"),
  });
  if (!parsed.success) {
    throw new Error("Invalid promotion.");
  }

  const note = String(formData.get("note") ?? "").trim() || null;

  await prisma.$transaction(async (tx) => {
    const current = await tx.user.findFirst({
      where: { id: parsed.data.userId, gymId },
      select: { belt: true, stripes: true },
    });
    if (!current) throw new Error("Member not found.");

    const changed =
      current.belt !== parsed.data.belt || current.stripes !== parsed.data.stripes;

    await tx.user.update({
      where: { id: parsed.data.userId },
      data: { belt: parsed.data.belt, stripes: parsed.data.stripes },
    });

    if (changed) {
      await tx.beltPromotion.create({
        data: {
          userId: parsed.data.userId,
          gymId,
          fromBelt: current.belt,
          fromStripes: current.stripes,
          toBelt: parsed.data.belt,
          toStripes: parsed.data.stripes,
          awardedById: session.user.id,
          note,
        },
      });
    }
  });

  revalidatePath(`/dashboard/members/${parsed.data.userId}`);
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
}
