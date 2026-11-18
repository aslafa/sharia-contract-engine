import { NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";

export async function GET() {
  const startedAt = Date.now();
  let dbStatus = "operational";

  try {
    const apps = DBRepository.getApplications();
    if (!Array.isArray(apps)) {
      dbStatus = "degraded";
    }
  } catch (error) {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: "ok",
    service: "Sharia Contract Engine (SCE) API",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    database: dbStatus,
    storage: "JSON Repository (data/sce_database.json)",
    supportedAkadModules: ["MURABAHAH", "IJARAH", "MUSYARAKAH", "MUDHARABAH"],
  });
}

