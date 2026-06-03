"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { createCompetitionSchema } from "@/lib/validators/competitions";
import {
  createInjurySchema,
  updateInjuryStatusSchema,
} from "@/lib/validators/injuries";

export type AddCompetitionState = {
  ok?: true;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function addCompetitionAction(
  _prev: AddCompetitionState | undefined,
  formData: FormData,
): Promise<AddCompetitionState> {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();

  const parsed = createCompetitionSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    eventName: String(formData.get("eventName") ?? "").trim(),
    division: String(formData.get("division") ?? "").trim(),
    weightClassKg: String(formData.get("weightClassKg") ?? ""),
    placement: String(formData.get("placement") ?? "GOLD"),
    wins: String(formData.get("wins") ?? "0"),
    losses: String(formData.get("losses") ?? "0"),
    competedAt: String(formData.get("competedAt") ?? ""),
    note: String(formData.get("note") ?? "").trim(),
  });

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

  // Tenant guard.
  const member = await prisma.user.findFirst({
    where: { id: parsed.data.userId, gymId },
    select: { id: true },
  });
  if (!member) return { error: "Member not found in this gym." };

  await prisma.competitionResult.create({
    data: {
      userId: parsed.data.userId,
      gymId,
      eventName: parsed.data.eventName,
      division: parsed.data.division || null,
      weightClassKg:
        typeof parsed.data.weightClassKg === "number" ? parsed.data.weightClassKg : null,
      placement: parsed.data.placement,
      wins: parsed.data.wins,
      losses: parsed.data.losses,
      competedAt: new Date(parsed.data.competedAt),
      note: parsed.data.note || null,
    },
  });

  revalidatePath(`/dashboard/members/${parsed.data.userId}`);
  return { ok: true };
}

export async function deleteCompetitionAction(formData: FormData) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const id = String(formData.get("id") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!id) return;

  await prisma.competitionResult.deleteMany({ where: { id, gymId } });
  if (userId) revalidatePath(`/dashboard/members/${userId}`);
}

export type AddInjuryState = {
  ok?: true;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function addInjuryAction(
  _prev: AddInjuryState | undefined,
  formData: FormData,
): Promise<AddInjuryState> {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();

  const parsed = createInjurySchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    bodyPart: String(formData.get("bodyPart") ?? "KNEE"),
    severity: String(formData.get("severity") ?? "MINOR"),
    startedAt: String(formData.get("startedAt") ?? ""),
    note: String(formData.get("note") ?? "").trim(),
  });

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

  const member = await prisma.user.findFirst({
    where: { id: parsed.data.userId, gymId },
    select: { id: true },
  });
  if (!member) return { error: "Member not found in this gym." };

  await prisma.injury.create({
    data: {
      userId: parsed.data.userId,
      gymId,
      bodyPart: parsed.data.bodyPart,
      severity: parsed.data.severity,
      startedAt: new Date(parsed.data.startedAt),
      note: parsed.data.note || null,
    },
  });

  revalidatePath(`/dashboard/members/${parsed.data.userId}`);
  return { ok: true };
}

export async function updateInjuryStatusAction(formData: FormData) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const userId = String(formData.get("userId") ?? "");

  const parsed = updateInjuryStatusSchema.safeParse({
    injuryId: String(formData.get("injuryId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) throw new Error("Invalid injury update.");

  const resolvedAt = parsed.data.status === "RESOLVED" ? new Date() : null;

  await prisma.injury.updateMany({
    where: { id: parsed.data.injuryId, gymId },
    data: { status: parsed.data.status, resolvedAt },
  });

  if (userId) revalidatePath(`/dashboard/members/${userId}`);
}

export async function deleteInjuryAction(formData: FormData) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const id = String(formData.get("id") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!id) return;

  await prisma.injury.deleteMany({ where: { id, gymId } });
  if (userId) revalidatePath(`/dashboard/members/${userId}`);
}
