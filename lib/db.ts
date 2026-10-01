import dns from "node:dns";
import net from "node:net";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

// Neon resolves to IPv6 addresses that are unreachable on some networks, and
// Node's happy-eyeballs attempt timeout (250ms) then fails the request with
// ETIMEDOUT. Prefer IPv4 and connect without auto-select so queries succeed.
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

function createPrismaClient() {
  const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL!, {});
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
