import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Tenant Scoped Query Helper
 * Ensures queries always inject organizationId to prevent cross-tenant data leakage.
 */
export function getTenantScopedPrisma(organizationId: string) {
  if (!organizationId) {
    throw new Error("[SECURITY_ALERT] organizationId is required for tenant-scoped operations.");
  }

  return {
    contracts: {
      findMany: (args: Parameters<typeof prisma.contract.findMany>[0] = {}) =>
        prisma.contract.findMany({
          ...args,
          where: { ...args.where, organizationId },
        }),
      findFirst: (args: Parameters<typeof prisma.contract.findFirst>[0] = {}) =>
        prisma.contract.findFirst({
          ...args,
          where: { ...args.where, organizationId },
        }),
      count: (args: Parameters<typeof prisma.contract.count>[0] = {}) =>
        prisma.contract.count({
          ...args,
          where: { ...args.where, organizationId },
        }),
    },
    applications: {
      findMany: (args: Parameters<typeof prisma.financingApplication.findMany>[0] = {}) =>
        prisma.financingApplication.findMany({
          ...args,
          where: { ...args.where, organizationId },
        }),
    },
    documents: {
      findMany: (args: Parameters<typeof prisma.contractDocument.findMany>[0] = {}) =>
        prisma.contractDocument.findMany({
          ...args,
          where: { ...args.where, organizationId },
        }),
    },
    raw: prisma,
  };
}

