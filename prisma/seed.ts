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

  console.log(`Seeded gym "${gym.name}" with members, schedule, and athlete history.`);
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
