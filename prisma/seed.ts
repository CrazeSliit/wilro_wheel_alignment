import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { hashPassword } from "../lib/password";

const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

const users = [
  {
    email: "admin@irukamotors.com",
    password: "Admin@1234",
    name: "System Admin",
    role: "ADMIN" as const,
    isFirstLogin: false,
  },
  {
    email: "john@irukamotors.com",
    password: "Employee@123",
    name: "John Perera",
    role: "EMPLOYEE" as const,
    isFirstLogin: true,
  },
  {
    email: "sara@irukamotors.com",
    password: "Employee@123",
    name: "Sara Fernando",
    role: "EMPLOYEE" as const,
    isFirstLogin: true,
  },
];

async function main() {
  console.log("Seeding users...");

  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        password: hashPassword(user.password),
        isFirstLogin: user.isFirstLogin,
        emailStatus: "SENT",
        emailSentAt: new Date(),
      },
      create: {
        email: user.email,
        password: hashPassword(user.password),
        name: user.name,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        emailStatus: "SENT",
        emailSentAt: new Date(),
      },
    });

    console.log(`  upserted  ${created.role.padEnd(8)}  ${created.email}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
