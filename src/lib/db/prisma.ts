import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Lazy Prisma client accessor.
 * Prisma is retained as a future migration target; the operational runtime strictly
 * uses the JSON repository (data/sce_database.json). This lazy accessor ensures
 * PrismaClient is NEVER instantiated at module evaluation time during Next.js
 * builds or API route page-data collection.
 */
function getPrismaInstance(): PrismaClient {
  if (!globalForPrisma.prisma) {
    if (!process.env.DATABASE_URL) {
      return new Proxy({} as PrismaClient, {
        get(_target, prop) {
          throw new Error(
            `[PRISMA_OFFLINE] Prisma is a future migration target, not the active runtime (attempted to access ${String(
              prop
            )}). Operational database is data/sce_database.json.`
          );
        },
      });
    }

    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrismaInstance();
    const value = (instance as any)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

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

