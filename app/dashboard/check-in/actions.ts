"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireGymId, requireRole } from "@/lib/db/scoped";
import { nextStreak } from "@/lib/attendance/streak";

export async function checkInAction(formData: FormData) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();

  const sessionId = String(formData.get("sessionId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!sessionId || !userId) throw new Error("Missing session or user.");

  await prisma.$transaction(async (tx) => {
    const session = await tx.classSession.findFirst({
      where: { id: sessionId, gymId },
      select: { id: true, durationMin: true },
    });
    if (!session) throw new Error("Class session not in this gym.");

    const member = await tx.user.findFirst({
      where: { id: userId, gymId },
      select: { id: true },
    });
    if (!member) throw new Error("Member not in this gym.");

    // Idempotent — skip if already checked in.
    const existing = await tx.attendance.findUnique({
      where: { userId_classSessionId: { userId, classSessionId: sessionId } },
      select: { id: true },
    });
    if (existing) return;

    const now = new Date();
    await tx.attendance.create({
      data: {
        userId,
        classSessionId: sessionId,
        gymId,
        durationMin: session.durationMin,
        checkedInAt: now,
      },
    });

    const stats = await tx.athleteStats.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastTrainedAt: true,
        totalMatHours: true,
        totalSessions: true,
      },
    });

    const base = stats ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastTrainedAt: null,
      totalMatHours: 0,
      totalSessions: 0,
    };

    const { currentStreak, longestStreak, lastTrainedAt } = nextStreak(base, now);
    const totalMatHours = base.totalMatHours + Math.round(session.durationMin / 60);
    const totalSessions = base.totalSessions + 1;

    await tx.athleteStats.upsert({
      where: { userId },
      update: {
        currentStreak,
        longestStreak,
        lastTrainedAt,
        totalMatHours,
        totalSessions,
      },
      create: {
        userId,
        gymId,
        currentStreak,
        longestStreak,
        lastTrainedAt,
        totalMatHours,
        totalSessions,
      },
    });
  });

  revalidatePath("/dashboard/check-in");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
}

export async function undoCheckInAction(formData: FormData) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();

  const sessionId = String(formData.get("sessionId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!sessionId || !userId) throw new Error("Missing session or user.");

  await prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.findUnique({
      where: { userId_classSessionId: { userId, classSessionId: sessionId } },
      select: { id: true, durationMin: true, gymId: true },
    });
    if (!attendance || attendance.gymId !== gymId) return;

    await tx.attendance.delete({ where: { id: attendance.id } });

    const stats = await tx.athleteStats.findUnique({
      where: { userId },
      select: { totalMatHours: true, totalSessions: true },
    });
    if (stats) {
      await tx.athleteStats.update({
        where: { userId },
        data: {
          totalMatHours: Math.max(0, stats.totalMatHours - Math.round(attendance.durationMin / 60)),
          totalSessions: Math.max(0, stats.totalSessions - 1),
        },
      });
    }
    // Note: undoing doesn't recompute streak — that would require a full
    // scan of attendance history. The leaderboard refreshes on next check-in.
  });

  revalidatePath("/dashboard/check-in");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
}
