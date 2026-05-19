import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../lib/generated/prisma/client";

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
  role: "ADMIN" | "COACH" | "STUDENT";
  gymId: string;
}) {
  const hashedPassword = await bcrypt.hash(opts.password, 10);
  return prisma.user.upsert({
    where: { email: opts.email },
    update: { name: opts.name, role: opts.role, gymId: opts.gymId, hashedPassword },
    create: {
      email: opts.email,
      name: opts.name,
      hashedPassword,
      role: opts.role,
      gymId: opts.gymId,
    },
  });
}

async function main() {
  const gym = await prisma.gym.upsert({
    where: { slug: "demo-academy" },
    update: {},
    create: { slug: "demo-academy", name: "Demo Academy" },
  });

  await upsertUser({
    email: "admin@darceflow.test",
    name: "Demo Admin",
    password: "admin1234",
    role: "ADMIN",
    gymId: gym.id,
  });

  await upsertUser({
    email: "coach@darceflow.test",
    name: "Coach Helio",
    password: "coach1234",
    role: "COACH",
    gymId: gym.id,
  });

  await upsertUser({
    email: "student@darceflow.test",
    name: "Student Roger",
    password: "student1234",
    role: "STUDENT",
    gymId: gym.id,
  });

  console.log(`Seeded gym "${gym.name}" with admin / coach / student demo users.`);
  console.log("  admin@darceflow.test    / admin1234");
  console.log("  coach@darceflow.test    / coach1234");
  console.log("  student@darceflow.test  / student1234");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
