import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../lib/generated/prisma/client";
import type { BeltRank, Role } from "../lib/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function upsertUser(opts: {
  email: string;
  name: string;
  password: string;
  role: Role;
  gymId: string;
  belt?: BeltRank | null;
  stripes?: number;
}) {
  const hashedPassword = await bcrypt.hash(opts.password, 10);
  return prisma.user.upsert({
    where: { email: opts.email },
    update: {
      name: opts.name,
      role: opts.role,
      gymId: opts.gymId,
      hashedPassword,
      belt: opts.belt ?? null,
      stripes: opts.stripes ?? 0,
    },
    create: {
      email: opts.email,
      name: opts.name,
      hashedPassword,
      role: opts.role,
      gymId: opts.gymId,
      belt: opts.belt ?? null,
      stripes: opts.stripes ?? 0,
    },
  });
}

async function main() {
  const gym = await prisma.gym.upsert({
    where: { slug: "demo-academy" },
    update: {},
    create: { slug: "demo-academy", name: "Demo Academy" },
  });

  const admin = await upsertUser({
    email: "admin@darceflow.test",
    name: "Demo Admin",
    password: "admin1234",
    role: "ADMIN",
    gymId: gym.id,
    belt: "BROWN",
    stripes: 2,
  });

  const coach = await upsertUser({
    email: "coach@darceflow.test",
    name: "Coach Helio",
    password: "coach1234",
    role: "COACH",
    gymId: gym.id,
    belt: "BLACK",
    stripes: 0,
  });

  const student = await upsertUser({
    email: "student@darceflow.test",
    name: "Student Roger",
    password: "student1234",
    role: "STUDENT",
    gymId: gym.id,
    belt: "PURPLE",
    stripes: 2,
  });

  // A handful of additional students with varied belts so the table looks alive.
  const extras: { name: string; belt: BeltRank; stripes: number }[] = [
    { name: "Carlos Souza", belt: "WHITE", stripes: 3 },
    { name: "Maya Patel", belt: "BLUE", stripes: 1 },
    { name: "Jordan Lee", belt: "BLUE", stripes: 4 },
    { name: "Ana Ribeiro", belt: "PURPLE", stripes: 0 },
    { name: "Liam Connor", belt: "WHITE", stripes: 0 },
    { name: "Sofia Esposito", belt: "BROWN", stripes: 1 },
  ];
  for (const e of extras) {
    const handle = e.name.toLowerCase().replace(/\s+/g, "");
    await upsertUser({
      email: `${handle}@darceflow.test`,
      name: e.name,
      password: "student1234",
      role: "STUDENT",
      gymId: gym.id,
      belt: e.belt,
      stripes: e.stripes,
    });
  }

  // A starter weekly schedule. Upsert via composite-ish lookup (delete + create
  // is safer here since there's no natural unique constraint on the schedule).
  await prisma.classDefinition.deleteMany({ where: { gymId: gym.id } });

  const classes = [
    { name: "Fundamentals Gi", dayOfWeek: 1, startTime: "18:30", durationMin: 60, capacity: 30, coachId: coach.id, description: "Beginner-friendly. Focus on positions and escapes." },
    { name: "Advanced Gi", dayOfWeek: 2, startTime: "19:00", durationMin: 75, capacity: 24, coachId: coach.id, description: "Blue belt and up. Open sparring last 20 minutes." },
    { name: "No-Gi", dayOfWeek: 3, startTime: "19:30", durationMin: 60, capacity: 24, coachId: admin.id, description: "All levels welcome." },
    { name: "Open Mat", dayOfWeek: 5, startTime: "12:00", durationMin: 90, capacity: 40, coachId: null, description: "Drill, roll, repeat." },
    { name: "Competition Training", dayOfWeek: 6, startTime: "10:00", durationMin: 120, capacity: 20, coachId: coach.id, description: "Invite-only competition prep." },
  ];

  for (const c of classes) {
    await prisma.classDefinition.create({
      data: {
        gymId: gym.id,
        name: c.name,
        description: c.description,
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        durationMin: c.durationMin,
        capacity: c.capacity,
        coachId: c.coachId,
      },
    });
  }

  // Phase 4: belt history, competition results, and injuries for the demo student.
  await prisma.beltPromotion.deleteMany({ where: { gymId: gym.id } });
  await prisma.competitionResult.deleteMany({ where: { gymId: gym.id } });
  await prisma.injury.deleteMany({ where: { gymId: gym.id } });

  const months = (n: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d;
  };

  const promotions: Array<{
    fromBelt: BeltRank | null;
    fromStripes: number;
    toBelt: BeltRank;
    toStripes: number;
    awardedAt: Date;
    note: string | null;
  }> = [
    { fromBelt: null, fromStripes: 0, toBelt: "WHITE", toStripes: 0, awardedAt: months(48), note: "Day one." },
    { fromBelt: "WHITE", fromStripes: 3, toBelt: "BLUE", toStripes: 0, awardedAt: months(36), note: "Promoted at the winter graduation." },
    { fromBelt: "BLUE", fromStripes: 4, toBelt: "PURPLE", toStripes: 0, awardedAt: months(12), note: "Earned after the open." },
    { fromBelt: "PURPLE", fromStripes: 1, toBelt: "PURPLE", toStripes: 2, awardedAt: months(2), note: "Stripe for consistency." },
  ];

  for (const p of promotions) {
    await prisma.beltPromotion.create({
      data: {
        userId: student.id,
        gymId: gym.id,
        awardedById: coach.id,
        ...p,
      },
    });
  }

  await prisma.competitionResult.createMany({
    data: [
      {
        userId: student.id,
        gymId: gym.id,
        eventName: "IBJJF European Open",
        division: "Purple · Adult",
        weightClassKg: 76,
        placement: "GOLD",
        wins: 4,
        losses: 0,
        competedAt: months(8),
        note: "Submitted the final by triangle.",
      },
      {
        userId: student.id,
        gymId: gym.id,
        eventName: "ADCC West Coast Trials",
        division: "Adult",
        weightClassKg: 77,
        placement: "BRONZE",
        wins: 3,
        losses: 1,
        competedAt: months(4),
        note: "Lost the semi on advantages.",
      },
      {
        userId: student.id,
        gymId: gym.id,
        eventName: "Dublin Open",
        division: "Purple · Adult",
        weightClassKg: 76,
        placement: "SILVER",
        wins: 2,
        losses: 1,
        competedAt: months(1),
        note: null,
      },
    ],
  });

  await prisma.injury.createMany({
    data: [
      {
        userId: student.id,
        gymId: gym.id,
        bodyPart: "KNEE",
        severity: "MODERATE",
        status: "RECOVERING",
        startedAt: months(1),
        note: "Tweaked during a Berimbolo attempt. Avoid heavy leg drags.",
      },
      {
        userId: student.id,
        gymId: gym.id,
        bodyPart: "ELBOW",
        severity: "MINOR",
        status: "RESOLVED",
        startedAt: months(6),
        resolvedAt: months(5),
        note: "Hyperextension from defending a kimura.",
      },
    ],
  });

  // ---------------------------------------------------------------------
  // Phase 5: 26 weeks of attendance + AthleteStats
  // ---------------------------------------------------------------------
  await prisma.attendance.deleteMany({ where: { gymId: gym.id } });
  await prisma.classSession.deleteMany({ where: { gymId: gym.id } });
  await prisma.athleteStats.deleteMany({ where: { gymId: gym.id } });

  const allUsers = await prisma.user.findMany({
    where: { gymId: gym.id },
    select: { id: true, email: true },
  });

  // Per-user weekly attendance probability (0–1) — gives variety on the
  // leaderboard. Higher = more consistent training.
  const attendanceWeight = new Map<string, number>();
  for (const u of allUsers) {
    if (u.email === "admin@darceflow.test") attendanceWeight.set(u.id, 0.35);
    else if (u.email === "coach@darceflow.test") attendanceWeight.set(u.id, 0.6);
    else if (u.email === "student@darceflow.test") attendanceWeight.set(u.id, 0.85);
    else if (u.email?.startsWith("mayapatel")) attendanceWeight.set(u.id, 0.9);
    else if (u.email?.startsWith("jordanlee")) attendanceWeight.set(u.id, 0.75);
    else if (u.email?.startsWith("anaribeiro")) attendanceWeight.set(u.id, 0.6);
    else if (u.email?.startsWith("sofiaesposito")) attendanceWeight.set(u.id, 0.5);
    else if (u.email?.startsWith("carlossouza")) attendanceWeight.set(u.id, 0.4);
    else attendanceWeight.set(u.id, 0.3);
  }

  const allDefs = await prisma.classDefinition.findMany({
    where: { gymId: gym.id },
    select: { id: true, dayOfWeek: true, startTime: true, durationMin: true },
  });

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 26 * 7);
  start.setHours(0, 0, 0, 0);

  const cursor = new Date(start);
  const attendanceRows: {
    userId: string;
    classSessionId: string;
    gymId: string;
    durationMin: number;
    checkedInAt: Date;
  }[] = [];

  while (cursor <= now) {
    const dow = cursor.getDay();
    const todays = allDefs.filter((d) => d.dayOfWeek === dow);
    for (const def of todays) {
      const [hh, mm] = def.startTime.split(":").map((s) => Number.parseInt(s, 10));
      const scheduledAt = new Date(cursor);
      scheduledAt.setHours(hh, mm, 0, 0);
      if (scheduledAt > now) continue;

      const session = await prisma.classSession.create({
        data: {
          classDefinitionId: def.id,
          gymId: gym.id,
          scheduledAt,
          durationMin: def.durationMin,
        },
      });

      // Pick attendees based on per-user probability.
      for (const u of allUsers) {
        const p = attendanceWeight.get(u.id) ?? 0;
        if (Math.random() < p) {
          attendanceRows.push({
            userId: u.id,
            classSessionId: session.id,
            gymId: gym.id,
            durationMin: def.durationMin,
            checkedInAt: scheduledAt,
          });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Bulk insert in chunks; createMany doesn't enforce the unique constraint
  // for us with skipDuplicates so we trust the picker didn't double-add.
  for (let i = 0; i < attendanceRows.length; i += 500) {
    await prisma.attendance.createMany({
      data: attendanceRows.slice(i, i + 500),
      skipDuplicates: true,
    });
  }

  // Compute AthleteStats from the freshly-inserted attendance.
  const byUser = new Map<string, Date[]>();
  const minutesByUser = new Map<string, number>();
  for (const a of attendanceRows) {
    if (!byUser.has(a.userId)) byUser.set(a.userId, []);
    byUser.get(a.userId)!.push(a.checkedInAt);
    minutesByUser.set(a.userId, (minutesByUser.get(a.userId) ?? 0) + a.durationMin);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const [userId, dates] of byUser.entries()) {
    const dayKeys = Array.from(
      new Set(dates.map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString())),
    )
      .map((iso) => new Date(iso))
      .sort((a, b) => a.getTime() - b.getTime());

    let longest = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const day of dayKeys) {
      if (prev) {
        const diff = Math.round((day.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
        if (diff === 1) run += 1;
        else run = 1;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = day;
    }

    // Current streak: walk back from today/yesterday.
    const dayKeySet = new Set(dayKeys.map((d) => d.toISOString()));
    let current = 0;
    const walker = new Date(today);
    if (!dayKeySet.has(walker.toISOString())) {
      walker.setDate(walker.getDate() - 1);
    }
    while (dayKeySet.has(walker.toISOString())) {
      current += 1;
      walker.setDate(walker.getDate() - 1);
    }

    const lastTrainedAt = dates.reduce((m, d) => (d > m ? d : m), dates[0]);

    await prisma.athleteStats.create({
      data: {
        userId,
        gymId: gym.id,
        currentStreak: current,
        longestStreak: longest,
        lastTrainedAt,
        totalMatHours: Math.round((minutesByUser.get(userId) ?? 0) / 60),
        totalSessions: dates.length,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Phase 6: materialize upcoming sessions and add a few reservations + a
  // waitlist so the schedule page isn't empty out of the box.
  // ---------------------------------------------------------------------
  await prisma.waitlistEntry.deleteMany({ where: { gymId: gym.id } });
  await prisma.reservation.deleteMany({ where: { gymId: gym.id } });

  const futureCursor = new Date();
  futureCursor.setHours(0, 0, 0, 0);
  // Only generate sessions strictly in the future (the loop above already
  // wrote past sessions for attendance).
  futureCursor.setDate(futureCursor.getDate() + 1);
  const futureEnd = new Date(futureCursor);
  futureEnd.setDate(futureEnd.getDate() + 8 * 7);

  const fc = new Date(futureCursor);
  while (fc <= futureEnd) {
    const dow = fc.getDay();
    const todays = allDefs.filter((d) => d.dayOfWeek === dow);
    for (const def of todays) {
      const [hh, mm] = def.startTime.split(":").map((s) => Number.parseInt(s, 10));
      const scheduledAt = new Date(fc);
      scheduledAt.setHours(hh, mm, 0, 0);
      await prisma.classSession.upsert({
        where: {
          classDefinitionId_scheduledAt: {
            classDefinitionId: def.id,
            scheduledAt,
          },
        },
        update: {},
        create: {
          classDefinitionId: def.id,
          gymId: gym.id,
          scheduledAt,
          durationMin: def.durationMin,
        },
      });
    }
    fc.setDate(fc.getDate() + 1);
  }

  const futureSessions = await prisma.classSession.findMany({
    where: { gymId: gym.id, scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 6,
    include: { classDefinition: { select: { capacity: true } } },
  });

  // Reserve the demo student into every one of the next few sessions; layer
  // some of the extras on top so coaches see a realistic roster.
  for (const s of futureSessions) {
    await prisma.reservation.upsert({
      where: { userId_classSessionId: { userId: student.id, classSessionId: s.id } },
      update: {},
      create: { userId: student.id, classSessionId: s.id, gymId: gym.id },
    });

    const others = allUsers.filter((u) => u.id !== student.id);
    // 40% per other user, capped at capacity.
    let filled = 1;
    for (const u of others) {
      if (filled >= s.classDefinition.capacity) break;
      if (Math.random() < 0.4) {
        await prisma.reservation.upsert({
          where: { userId_classSessionId: { userId: u.id, classSessionId: s.id } },
          update: {},
          create: { userId: u.id, classSessionId: s.id, gymId: gym.id },
        });
        filled += 1;
      }
    }
  }

  // Force one session to be full and put a few students on the waitlist so
  // the demo state showcases the FIFO promotion flow.
  const competitionTrainingDef = allDefs.find(
    (d) => d.dayOfWeek === 6 && d.startTime === "10:00",
  );
  if (competitionTrainingDef) {
    const nextCompTraining = await prisma.classSession.findFirst({
      where: {
        classDefinitionId: competitionTrainingDef.id,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      include: { classDefinition: { select: { capacity: true } } },
    });
    if (nextCompTraining) {
      // Reserve up to capacity.
      const capacity = nextCompTraining.classDefinition.capacity;
      const reservedSoFar = await prisma.reservation.count({
        where: { classSessionId: nextCompTraining.id },
      });
      const need = Math.max(0, capacity - reservedSoFar);

      const candidates = allUsers
        .filter((u) => u.email !== "admin@darceflow.test")
        .slice(0, need);
      for (const u of candidates) {
        await prisma.reservation.upsert({
          where: {
            userId_classSessionId: {
              userId: u.id,
              classSessionId: nextCompTraining.id,
            },
          },
          update: {},
          create: {
            userId: u.id,
            classSessionId: nextCompTraining.id,
            gymId: gym.id,
          },
        });
      }

      // Anyone left becomes a waitlist entry.
      const waitlisted = allUsers
        .filter(
          (u) =>
            !candidates.find((c) => c.id === u.id) &&
            u.email !== "admin@darceflow.test",
        )
        .slice(0, 3);
      let pos = 1;
      for (const u of waitlisted) {
        await prisma.waitlistEntry.upsert({
          where: {
            userId_classSessionId: {
              userId: u.id,
              classSessionId: nextCompTraining.id,
            },
          },
          update: { position: pos },
          create: {
            userId: u.id,
            classSessionId: nextCompTraining.id,
            gymId: gym.id,
            position: pos,
          },
        });
        pos += 1;
      }
    }
  }

  const reservationCount = await prisma.reservation.count({ where: { gymId: gym.id } });
  const waitlistCount = await prisma.waitlistEntry.count({ where: { gymId: gym.id } });

  // ---------------------------------------------------------------------
  // Phase 7: technique library seed
  // ---------------------------------------------------------------------
  await prisma.techniqueFavorite.deleteMany({});
  await prisma.technique.deleteMany({ where: { gymId: gym.id } });

  const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const samples: Array<{
    slug: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    position:
      | "CLOSED_GUARD"
      | "OPEN_GUARD"
      | "HALF_GUARD"
      | "SIDE_CONTROL"
      | "MOUNT"
      | "BACK"
      | "STANDING";
    category:
      | "SUBMISSION"
      | "SWEEP"
      | "ESCAPE"
      | "PASS"
      | "TAKEDOWN"
      | "CONCEPT";
    tags: string[];
    durationSec: number;
    uploadedById: string;
  }> = [
    {
      slug: "triangle-from-closed-guard",
      title: "Triangle from closed guard",
      description:
        "The classic closed-guard triangle. Break their posture, hunt the arm in–arm out grip, and angle off before throwing the leg over.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnailUrl: ytThumb("dQw4w9WgXcQ"),
      position: "CLOSED_GUARD",
      category: "SUBMISSION",
      tags: ["triangle", "fundamentals", "gi"],
      durationSec: 240,
      uploadedById: coach.id,
    },
    {
      slug: "hip-bump-sweep",
      title: "Hip bump sweep",
      description:
        "When they sit up to stack you, post on your free hand, swing your hips off-center, and reverse them with the hip bump.",
      videoUrl: "https://www.youtube.com/watch?v=oHg5SJYRHA0",
      thumbnailUrl: ytThumb("oHg5SJYRHA0"),
      position: "CLOSED_GUARD",
      category: "SWEEP",
      tags: ["sweep", "fundamentals"],
      durationSec: 180,
      uploadedById: coach.id,
    },
    {
      slug: "knee-cut-pass",
      title: "Knee cut pass",
      description:
        "Bread-and-butter pass from combat base. Pin the far leg, clear the bottom knee, settle into side control.",
      videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      thumbnailUrl: ytThumb("jNQXAC9IVRw"),
      position: "OPEN_GUARD",
      category: "PASS",
      tags: ["pass", "knee-cut", "fundamentals"],
      durationSec: 360,
      uploadedById: coach.id,
    },
    {
      slug: "double-leg-takedown",
      title: "Double leg takedown",
      description:
        "Drop step, change levels, head to the inside ear, finish with a turn-the-corner mechanic.",
      videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      thumbnailUrl: ytThumb("ScMzIvxBSi4"),
      position: "STANDING",
      category: "TAKEDOWN",
      tags: ["wrestling", "no-gi", "fundamentals"],
      durationSec: 300,
      uploadedById: coach.id,
    },
    {
      slug: "back-escape-to-half-guard",
      title: "Back escape to half guard",
      description:
        "Defend the choke side, scoot your hips, ride one hook over to the mat, and shuck their leg into half guard.",
      videoUrl: "https://www.youtube.com/watch?v=L_jWHffIx5E",
      thumbnailUrl: ytThumb("L_jWHffIx5E"),
      position: "BACK",
      category: "ESCAPE",
      tags: ["escape", "back"],
      durationSec: 270,
      uploadedById: admin.id,
    },
    {
      slug: "americana-from-side-control",
      title: "Americana from side control",
      description:
        "Trap the far arm at a 90° angle, paint the floor, lift the elbow. Don't get lazy with the framing.",
      videoUrl: "https://www.youtube.com/watch?v=2vjPBrBU-TM",
      thumbnailUrl: ytThumb("2vjPBrBU-TM"),
      position: "SIDE_CONTROL",
      category: "SUBMISSION",
      tags: ["kimura", "americana", "fundamentals"],
      durationSec: 210,
      uploadedById: coach.id,
    },
    {
      slug: "mount-arm-bar",
      title: "Arm bar from mount",
      description:
        "When they push the chest, isolate the arm, swing the leg around the head, and sit back tight on the elbow.",
      videoUrl: "https://www.youtube.com/watch?v=YbJOTdZBX1g",
      thumbnailUrl: ytThumb("YbJOTdZBX1g"),
      position: "MOUNT",
      category: "SUBMISSION",
      tags: ["arm-bar", "mount", "fundamentals"],
      durationSec: 200,
      uploadedById: coach.id,
    },
    {
      slug: "deep-half-sweep",
      title: "Deep half guard sweep",
      description:
        "Slip under their hips, clamp the far leg, walk your shoulder to their ankle, and roll them over the top.",
      videoUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
      thumbnailUrl: ytThumb("fJ9rUzIMcZQ"),
      position: "HALF_GUARD",
      category: "SWEEP",
      tags: ["deep-half", "advanced", "no-gi"],
      durationSec: 420,
      uploadedById: coach.id,
    },
    {
      slug: "guard-retention-concept",
      title: "Guard retention — frame, shoulder, hip",
      description:
        "The order of priorities when defending the pass. Frame first, post the shoulder, recover the hip last.",
      videoUrl: "https://www.youtube.com/watch?v=tVj0ZTS4WF4",
      thumbnailUrl: ytThumb("tVj0ZTS4WF4"),
      position: "OPEN_GUARD",
      category: "CONCEPT",
      tags: ["retention", "concept", "framing"],
      durationSec: 540,
      uploadedById: admin.id,
    },
  ];

  for (const t of samples) {
    await prisma.technique.create({
      data: {
        gymId: gym.id,
        ...t,
      },
    });
  }

  // Demo student favorites a few techniques so the "Saved" filter has data.
  const favoriteSlugs = [
    "triangle-from-closed-guard",
    "guard-retention-concept",
    "double-leg-takedown",
  ];
  for (const slug of favoriteSlugs) {
    const t = await prisma.technique.findUnique({
      where: { gymId_slug: { gymId: gym.id, slug } },
    });
    if (t) {
      await prisma.techniqueFavorite.upsert({
        where: {
          userId_techniqueId: { userId: student.id, techniqueId: t.id },
        },
        update: {},
        create: { userId: student.id, techniqueId: t.id },
      });
    }
  }

  const techniqueCount = await prisma.technique.count({ where: { gymId: gym.id } });

  // ---------------------------------------------------------------------
  // Phase 8: plans, subscriptions, invoices. mock Stripe IDs so the UI is
  // fully populated without needing real Stripe credentials.
  // ---------------------------------------------------------------------
  await prisma.invoice.deleteMany({ where: { gymId: gym.id } });
  await prisma.subscription.deleteMany({ where: { gymId: gym.id } });
  await prisma.plan.deleteMany({ where: { gymId: gym.id } });

  const plans = await Promise.all([
    prisma.plan.create({
      data: {
        gymId: gym.id,
        name: "Drop-in",
        description: "Pay-as-you-go — perfect for visitors.",
        amountCents: 2500,
        interval: "MONTH",
        features: ["1 class per week", "Open mat access"],
        stripeProductId: "prod_demo_dropin",
        stripePriceId: "price_demo_dropin",
      },
    }),
    prisma.plan.create({
      data: {
        gymId: gym.id,
        name: "Unlimited",
        description: "All classes, every day of the week.",
        amountCents: 9900,
        interval: "MONTH",
        features: [
          "Unlimited classes",
          "Open mat access",
          "Gi and no-gi",
          "Technique library",
        ],
        stripeProductId: "prod_demo_unlimited",
        stripePriceId: "price_demo_unlimited",
      },
    }),
    prisma.plan.create({
      data: {
        gymId: gym.id,
        name: "Competition",
        description: "For athletes prepping for the next tournament.",
        amountCents: 16900,
        interval: "MONTH",
        features: [
          "Everything in Unlimited",
          "Private competition training",
          "Recorded sparring review",
          "Comp travel discounts",
        ],
        stripeProductId: "prod_demo_competition",
        stripePriceId: "price_demo_competition",
      },
    }),
  ]);

  const unlimited = plans[1];
  const competition = plans[2];

  function monthsAgo(n: number) {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d;
  }

  // Demo student: ACTIVE Unlimited subscription, ~5 months of invoices.
  const studentSub = await prisma.subscription.create({
    data: {
      userId: student.id,
      gymId: gym.id,
      planId: unlimited.id,
      stripeSubscriptionId: "sub_demo_student",
      stripeCustomerId: "cus_demo_student",
      status: "ACTIVE",
      currentPeriodEnd: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d;
      })(),
      startedAt: monthsAgo(5),
    },
  });

  await prisma.user.update({
    where: { id: student.id },
    data: { stripeCustomerId: "cus_demo_student" },
  });

  for (let i = 4; i >= 0; i--) {
    await prisma.invoice.create({
      data: {
        subscriptionId: studentSub.id,
        userId: student.id,
        gymId: gym.id,
        stripeInvoiceId: `in_demo_student_${i}`,
        amountDueCents: unlimited.amountCents,
        amountPaidCents: unlimited.amountCents,
        currency: "usd",
        status: "PAID",
        paidAt: monthsAgo(i),
        hostedInvoiceUrl: "https://invoice.stripe.com/i/demo",
      },
    });
  }

  // One PAST_DUE subscription on a side student so the admin past-due card
  // has something to show.
  const pastDueStudent = await prisma.user.findFirst({
    where: { gymId: gym.id, email: "carlossouza@darceflow.test" },
  });
  if (pastDueStudent) {
    const sub = await prisma.subscription.create({
      data: {
        userId: pastDueStudent.id,
        gymId: gym.id,
        planId: unlimited.id,
        stripeSubscriptionId: "sub_demo_carlos",
        stripeCustomerId: "cus_demo_carlos",
        status: "PAST_DUE",
        currentPeriodEnd: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 2);
          return d;
        })(),
        startedAt: monthsAgo(3),
      },
    });
    await prisma.user.update({
      where: { id: pastDueStudent.id },
      data: { stripeCustomerId: "cus_demo_carlos" },
    });
    await prisma.invoice.create({
      data: {
        subscriptionId: sub.id,
        userId: pastDueStudent.id,
        gymId: gym.id,
        stripeInvoiceId: "in_demo_carlos_failed",
        amountDueCents: unlimited.amountCents,
        amountPaidCents: 0,
        status: "OPEN",
        hostedInvoiceUrl: "https://invoice.stripe.com/i/demo",
      },
    });
  }

  // A coach on the Competition plan, paid invoices.
  const coachSub = await prisma.subscription.create({
    data: {
      userId: coach.id,
      gymId: gym.id,
      planId: competition.id,
      stripeSubscriptionId: "sub_demo_coach",
      stripeCustomerId: "cus_demo_coach",
      status: "ACTIVE",
      currentPeriodEnd: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 22);
        return d;
      })(),
      startedAt: monthsAgo(8),
    },
  });
  await prisma.user.update({
    where: { id: coach.id },
    data: { stripeCustomerId: "cus_demo_coach" },
  });
  for (let i = 7; i >= 0; i--) {
    await prisma.invoice.create({
      data: {
        subscriptionId: coachSub.id,
        userId: coach.id,
        gymId: gym.id,
        stripeInvoiceId: `in_demo_coach_${i}`,
        amountDueCents: competition.amountCents,
        amountPaidCents: competition.amountCents,
        currency: "usd",
        status: "PAID",
        paidAt: monthsAgo(i),
        hostedInvoiceUrl: "https://invoice.stripe.com/i/demo",
      },
    });
  }

  const planCount = plans.length;
  const subCount = await prisma.subscription.count({ where: { gymId: gym.id } });
  const invoiceCount = await prisma.invoice.count({ where: { gymId: gym.id } });

  console.log(`Seeded gym "${gym.name}" with members, schedule, athlete history,`);
  console.log(`and ${attendanceRows.length} attendance rows across 26 weeks.`);
  console.log(`Upcoming bookings: ${reservationCount} reservations, ${waitlistCount} waitlist.`);
  console.log(`Library: ${techniqueCount} techniques with ${favoriteSlugs.length} student favorites.`);
  console.log(`Billing: ${planCount} plans, ${subCount} subscriptions, ${invoiceCount} invoices.`);
  console.log("  admin@darceflow.test    / admin1234");
  console.log("  coach@darceflow.test    / coach1234");
  console.log("  student@darceflow.test  / student1234");
  console.log(`  + ${extras.length} extra students (password: student1234)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
