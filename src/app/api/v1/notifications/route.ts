import { NextRequest, NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";
import { getAuthenticatedUser, handleAuthError } from "@/lib/auth/guard";

export async function GET(req: NextRequest) {
  try {
    // 1. Strict Authentication Guard (401 if unauthenticated)
    const session = await getAuthenticatedUser(req);

    const { searchParams } = new URL(req.url);
    // Role filter: only Admin can inspect other roles; normal users are locked to their own role
    const requestedRole =
      session.isSuperAdmin || session.role === "INSTITUTION_ADMIN"
        ? searchParams.get("role") || session.role
        : session.role;

    // Strict Tenant Isolation: bound to session organization
    const organizationId = session.isSuperAdmin ? undefined : session.organizationId;

    const notifications = DBRepository.getNotifications({
      role: requestedRole,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Authentication Guard (401 if unauthenticated)
    const session = await getAuthenticatedUser(req);

    const body = await req.json();
    if (body.action === "MARK_ALL_READ") {
      DBRepository.markAllNotificationsRead(session.role);
    } else if (body.id) {
      // Validate notification belongs to the active tenant
      const tenantNotifs = DBRepository.getNotifications({ organizationId: session.organizationId });
      const targetNotif = tenantNotifs.find((n) => n.id === body.id);
      if (targetNotif || session.isSuperAdmin) {
        DBRepository.markNotificationRead(body.id);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

