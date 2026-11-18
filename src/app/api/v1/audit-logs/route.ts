import { NextRequest, NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";
import {
  getAuthenticatedUser,
  assertPermission,
  assertTenantIsolation,
  handleAuthError,
} from "@/lib/auth/guard";

export async function GET(req: NextRequest) {
  try {
    // 1. Strict Authentication Guard (401 if unauthenticated)
    const session = await getAuthenticatedUser(req);

    // 2. RBAC: Verify permission to view audit logs (403 if unauthorized)
    await assertPermission(session, "audit:view");

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || 100);
    const requestedOrgId = searchParams.get("organizationId");

    // 3. Multi-Tenant Isolation
    if (requestedOrgId && requestedOrgId !== session.organizationId) {
      await assertTenantIsolation(session, requestedOrgId, "AuditLog");
    }

    const organizationId = session.isSuperAdmin
      ? requestedOrgId || undefined
      : session.organizationId;

    const logs = DBRepository.getAuditLogs({
      organizationId,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

