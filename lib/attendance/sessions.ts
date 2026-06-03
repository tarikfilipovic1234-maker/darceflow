import { prisma } from "@/lib/db";

/**
 * Ensure ClassSession rows exist for every ClassDefinition that runs on `date`'s
 * weekday. We materialize on demand so the cron from Phase 6 isn't required for
 * Phase 5 to work end-to-end.
 *
 * Idempotent — upserts on the (classDefinitionId, scheduledAt) unique tuple.
 */
export async function materializeSessionsForDate(date: Date, gymId: string) {
  const dayOfWeek = date.getDay();
  const definitions = await prisma.classDefinition.findMany({
    where: { gymId, dayOfWeek },
    select: {
      id: true,
      gymId: true,
      startTime: true,
      durationMin: true,
    },
  });

  if (definitions.length === 0) return [];

  const sessions = await Promise.all(
    definitions.map((def) => {
      const [hh, mm] = def.startTime.split(":").map((s) => Number.parseInt(s, 10));
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hh, mm, 0, 0);

      return prisma.classSession.upsert({
        where: {
          classDefinitionId_scheduledAt: {
            classDefinitionId: def.id,
            scheduledAt,
          },
        },
        update: {},
        create: {
          classDefinitionId: def.id,
          gymId: def.gymId,
          scheduledAt,
          durationMin: def.durationMin,
        },
      });
    }),
  );

  return sessions;
}

export function startOfLocalDay(d: Date = new Date()) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function endOfLocalDay(d: Date = new Date()) {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}
