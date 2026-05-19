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

async function main() {
  const gym = await prisma.gym.upsert({
    where: { slug: "demo-academy" },
    update: {},
    create: {
      slug: "demo-academy",
      name: "Demo Academy",
    },
  });

  const adminEmail = "admin@darceflow.test";
  const hashedPassword = await bcrypt.hash("admin1234", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { gymId: gym.id, role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Demo Admin",
      hashedPassword,
      role: "ADMIN",
      gymId: gym.id,
    },
  });

  console.log(`Seeded gym "${gym.name}" and admin user ${adminEmail} (password: admin1234)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
