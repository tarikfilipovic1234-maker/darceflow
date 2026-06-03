"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";

export type BookingResult =
  | { kind: "reserved" }
  | { kind: "waitlisted"; position: number }
  | { kind: "already_reserved" }
  | { kind: "already_waitlisted"; position: number }
  | { kind: "session_passed" }
  | { kind: "not_found" };

/**
 * Book a spot in a class session. Returns whether the user got a reservation
 * or was added to the waitlist.
 *
 * Tenant-checked: session must belong to the current user's gym.
 */
export async function reserveSpotAction(formData: FormData): Promise<BookingResult> {
  const { session, gymId } = await requireGymId();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return { kind: "not_found" };

  const result = await prisma.$transaction(async (tx) => {
    const cs = await tx.classSession.findFirst({
      where: { id: sessionId, gymId },
      select: {
        id: true,
        scheduledAt: true,
        classDefinition: { select: { capacity: true } },
      },
    });
    if (!cs) return { kind: "not_found" as const };
    if (cs.scheduledAt < new Date()) return { kind: "session_passed" as const };

    const existing = await tx.reservation.findUnique({
      where: { userId_classSessionId: { userId: session.user.id, classSessionId: sessionId } },
      select: { id: true },
    });
    if (existing) return { kind: "already_reserved" as const };

    const existingWaitlist = await tx.waitlistEntry.findUnique({
      where: { userId_classSessionId: { userId: session.user.id, classSessionId: sessionId } },
      select: { position: true },
    });
    if (existingWaitlist) {
      return { kind: "already_waitlisted" as const, position: existingWaitlist.position };
    }

    const reservedCount = await tx.reservation.count({
      where: { classSessionId: sessionId },
    });

    if (reservedCount < cs.classDefinition.capacity) {
      await tx.reservation.create({
        data: { userId: session.user.id, classSessionId: sessionId, gymId },
      });
      return { kind: "reserved" as const };
    }

    const last = await tx.waitlistEntry.findFirst({
      where: { classSessionId: sessionId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const nextPosition = (last?.position ?? 0) + 1;
    await tx.waitlistEntry.create({
      data: {
        userId: session.user.id,
        classSessionId: sessionId,
        gymId,
        position: nextPosition,
      },
    });
    return { kind: "waitlisted" as const, position: nextPosition };
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/schedule/${sessionId}`);
  revalidatePath("/dashboard");
  return result;
}

/**
 * Cancel a reservation. If a waitlist exists, the first entry is auto-promoted
 * inside the same transaction.
 */
export async function cancelReservationAction(formData: FormData) {
  const { session, gymId } = await requireGymId();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;

  await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { userId_classSessionId: { userId: session.user.id, classSessionId: sessionId } },
      select: { id: true, classSession: { select: { gymId: true } } },
    });
    if (!reservation || reservation.classSession.gymId !== gymId) return;

    await tx.reservation.delete({ where: { id: reservation.id } });

    const head = await tx.waitlistEntry.findFirst({
      where: { classSessionId: sessionId },
      orderBy: { position: "asc" },
    });
    if (!head) return;

    await tx.reservation.create({
      data: {
        userId: head.userId,
        classSessionId: sessionId,
        gymId: head.gymId,
      },
    });
    await tx.waitlistEntry.delete({ where: { id: head.id } });
    await tx.waitlistEntry.updateMany({
      where: { classSessionId: sessionId },
      data: { position: { decrement: 1 } },
    });
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/schedule/${sessionId}`);
  revalidatePath("/dashboard");
}

export async function leaveWaitlistAction(formData: FormData) {
  const { session, gymId } = await requireGymId();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;

  await prisma.$transaction(async (tx) => {
    const entry = await tx.waitlistEntry.findUnique({
      where: { userId_classSessionId: { userId: session.user.id, classSessionId: sessionId } },
      select: { id: true, position: true, gymId: true },
    });
    if (!entry || entry.gymId !== gymId) return;

    await tx.waitlistEntry.delete({ where: { id: entry.id } });
    await tx.waitlistEntry.updateMany({
      where: { classSessionId: sessionId, position: { gt: entry.position } },
      data: { position: { decrement: 1 } },
    });
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/schedule/${sessionId}`);
}

/**
 * Coach/admin: manually promote a waitlist entry to a reservation. Used when
 * a coach wants to override the FIFO promotion order.
 */
export async function promoteWaitlistAction(formData: FormData) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const sessionId = String(formData.get("sessionId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!sessionId || !userId) return;

  await prisma.$transaction(async (tx) => {
    const entry = await tx.waitlistEntry.findUnique({
      where: { userId_classSessionId: { userId, classSessionId: sessionId } },
      select: { id: true, position: true, gymId: true },
    });
    if (!entry || entry.gymId !== gymId) return;

    await tx.reservation.upsert({
      where: { userId_classSessionId: { userId, classSessionId: sessionId } },
      update: {},
      create: { userId, classSessionId: sessionId, gymId },
    });
    await tx.waitlistEntry.delete({ where: { id: entry.id } });
    await tx.waitlistEntry.updateMany({
      where: { classSessionId: sessionId, position: { gt: entry.position } },
      data: { position: { decrement: 1 } },
    });
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/schedule/${sessionId}`);
}

/**
 * Coach/admin: remove a member's reservation (without auto-promoting). Useful
 * for kicking a no-show off the roster.
 */
export async function removeReservationAction(formData: FormData) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const sessionId = String(formData.get("sessionId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!sessionId || !userId) return;

  await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { userId_classSessionId: { userId, classSessionId: sessionId } },
      select: { id: true, gymId: true },
    });
    if (!reservation || reservation.gymId !== gymId) return;

    await tx.reservation.delete({ where: { id: reservation.id } });

    // Auto-promote so the spot doesn't sit empty.
    const head = await tx.waitlistEntry.findFirst({
      where: { classSessionId: sessionId },
      orderBy: { position: "asc" },
    });
    if (!head) return;
    await tx.reservation.create({
      data: {
        userId: head.userId,
        classSessionId: sessionId,
        gymId: head.gymId,
      },
    });
    await tx.waitlistEntry.delete({ where: { id: head.id } });
    await tx.waitlistEntry.updateMany({
      where: { classSessionId: sessionId },
      data: { position: { decrement: 1 } },
    });
  });

  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/schedule/${sessionId}`);
}

