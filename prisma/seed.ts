import "dotenv/config";
import { Department, PrismaClient, Role } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { hashPassword } from "../lib/password";

const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

const users = [
  {
    email: "admin@irukamotors.com",
    password: "Admin@1234",
    name: "System Admin",
    role: Role.ADMIN,
    phone: "+94 11 234 5678",
    jobTitle: "System Administrator",
    department: Department.ADMINISTRATION,
    isFirstLogin: false,
  },
  {
    email: "john@irukamotors.com",
    password: "Employee@123",
    name: "John Perera",
    role: Role.EMPLOYEE,
    phone: "+94 77 123 4567",
    jobTitle: "Senior Service Advisor",
    department: Department.SERVICE,
    isFirstLogin: true,
  },
  {
    email: "sara@irukamotors.com",
    password: "Employee@123",
    name: "Sara Fernando",
    phone: "+94 77 234 5678",
    jobTitle: "Parts Coordinator",
    department: Department.PARTS,
    role: Role.EMPLOYEE,
    isFirstLogin: true,
  },
];

async function main() {
  console.log("Seeding users...");

  for (const user of users) {
    const password = hashPassword(user.password);

    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        phone: user.phone,
        jobTitle: user.jobTitle,
        department: user.department,
        password,
        isFirstLogin: user.isFirstLogin,
        emailStatus: "SENT",
        emailSentAt: new Date(),
      },
      create: {
        email: user.email,
        password,
        name: user.name,
        role: user.role,
        phone: user.phone,
        jobTitle: user.jobTitle,
        department: user.department,
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
