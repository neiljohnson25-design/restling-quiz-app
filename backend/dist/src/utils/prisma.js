"use strict";
// This file handles Prisma client instantiation
// The PrismaClient will be available after running `npx prisma generate`
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
let PrismaClient;
try {
    PrismaClient = require('@prisma/client').PrismaClient;
}
catch (e) {
    console.warn('Prisma client not generated yet. Run `npm run db:generate` first.');
    PrismaClient = class MockPrismaClient {
    };
}
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map