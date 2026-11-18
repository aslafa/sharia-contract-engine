import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const startedAt = Date.now();
  let dbStatus = "unknown";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "disconnected";
  }

  return NextResponse.json({
    status: "ok",
    service: "Sharia Contract Engine (SCE) API",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    database: dbStatus,
    supportedAkadModules: ["MURABAHAH", "IJARAH", "MUSYARAKAH", "MUDHARABAH"],
  });
}

