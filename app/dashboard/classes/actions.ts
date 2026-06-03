"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { createClassSchema } from "@/lib/validators/classes";

export type CreateClassState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createClassAction(
  _prev: CreateClassState | undefined,
  formData: FormData,
): Promise<CreateClassState> {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    dayOfWeek: String(formData.get("dayOfWeek") ?? "1"),
    startTime: String(formData.get("startTime") ?? ""),
    durationMin: String(formData.get("durationMin") ?? "60"),
    capacity: String(formData.get("capacity") ?? "20"),
    coachId: String(formData.get("coachId") ?? ""),
  };

  const parsed = createClassSchema.safeParse(raw);
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

  // Verify the chosen coach is actually a coach/admin in this gym.
  let coachId: string | null = null;
  if (parsed.data.coachId) {
    const coach = await prisma.user.findFirst({
      where: {
        id: parsed.data.coachId,
        gymId,
        role: { in: ["ADMIN", "COACH"] },
      },
      select: { id: true },
    });
    if (!coach) return { error: "Selected coach is not part of this gym." };
    coachId = coach.id;
  }

  await prisma.classDefinition.create({
    data: {
      gymId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      durationMin: parsed.data.durationMin,
      capacity: parsed.data.capacity,
      coachId,
    },
  });

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard");
  redirect("/dashboard/classes");
}

export async function deleteClassAction(formData: FormData) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.classDefinition.deleteMany({ where: { id, gymId } });
  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard");
}
