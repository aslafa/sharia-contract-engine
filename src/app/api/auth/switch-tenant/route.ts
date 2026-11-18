import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, createSession, withSessionExpiry, getSessionSecret, UserSession } from "@/lib/auth/session";
import { DBRepository } from "@/lib/db/repository";
import { switchTenantWithJson, AuthError } from "@/lib/auth/json-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: { message: "Sesi Anda tidak valid. Silakan login kembali." } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { targetOrganizationId } = body;

    if (!targetOrganizationId) {
      return NextResponse.json(
        { success: false, error: { message: "targetOrganizationId wajib disertakan." } },
        { status: 400 }
      );
    }

    // Attempt tenant switch: strict mode validates membership from the JSON
    // store (temporary data strategy); legacy demo mode uses the legacy path.
    const secret = getSessionSecret();
    const switchResult = secret
      ? await switchTenantWithJson(session.userId, targetOrganizationId)
      : DBRepository.switchTenant(session.userId, targetOrganizationId);

    const updatedSession: Omit<UserSession, "expiresAt"> = {
      userId: switchResult.user.id,
      email: switchResult.user.email,
      fullName: switchResult.user.fullName,
      isSuperAdmin: switchResult.user.isSuperAdmin,
      organizationId: switchResult.activeMembership.organizationId,
      organizationName: switchResult.activeMembership.organizationName,
      organizationCode: switchResult.activeMembership.organizationCode,
      role: switchResult.activeMembership.role,
      roleName: switchResult.activeMembership.roleName,
      permissions: switchResult.activeMembership.permissions,
      mfaVerified: session.mfaVerified,
      availableTenants: switchResult.availableMemberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organizationName,
        organizationCode: m.organizationCode,
        role: m.role,
      })),
    };

    await createSession(withSessionExpiry(updatedSession));

    return NextResponse.json({
      success: true,
      message: `Berhasil beralih ke organisasi ${switchResult.activeMembership.organizationName}.`,
      data: {
        user: { ...updatedSession, expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() },
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: "TENANT_SWITCH_REJECTED", message: error.message } },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: error.message || "Gagal beralih organisasi." } },
      { status: 403 }
    );
  }
}

