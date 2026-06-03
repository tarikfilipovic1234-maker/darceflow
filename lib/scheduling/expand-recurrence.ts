import { prisma } from "@/lib/db";

/**
 * Materialize ClassSession rows for every recurring ClassDefinition in `gymId`
 * across the next `days` (default 56 — eight weeks). Idempotent: relies on the
 * (classDefinitionId, scheduledAt) unique constraint via upsert.
 *
 * Returns the count of sessions written or refreshed.
 */
export async function expandRecurringSessions({
  gymId,
  days = 56,
  from = new Date(),
}: {
  gymId?: string;
  days?: number;
  from?: Date;
} = {}): Promise<number> {
  const definitions = await prisma.classDefinition.findMany({
    where: gymId ? { gymId } : undefined,
    select: {
      id: true,
      gymId: true,
      dayOfWeek: true,
      startTime: true,
      durationMin: true,
    },
  });

  if (definitions.length === 0) return 0;

  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  let written = 0;

  for (let offset = 0; offset < days; offset++) {
    const cursor = new Date(start);
    cursor.setDate(start.getDate() + offset);
    const dow = cursor.getDay();
    const matching = definitions.filter((d) => d.dayOfWeek === dow);
    if (matching.length === 0) continue;

    await Promise.all(
      matching.map((def) => {
        const [hh, mm] = def.startTime.split(":").map((s) => Number.parseInt(s, 10));
        const scheduledAt = new Date(cursor);
        scheduledAt.setHours(hh, mm, 0, 0);

        return prisma.classSession
          .upsert({
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
          })
          .then(() => {
            written += 1;
          });
      }),
    );
  }

  return written;
}
