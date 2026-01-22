// This file handles Prisma client instantiation
// The PrismaClient will be available after running `npx prisma generate`

let PrismaClient: any;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (e) {
  console.warn('Prisma client not generated yet. Run `npm run db:generate` first.');
  PrismaClient = class MockPrismaClient {};
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
