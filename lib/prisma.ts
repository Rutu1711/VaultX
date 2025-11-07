import { PrismaClient } from "../app/generated/prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.prismaGlobal ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}


