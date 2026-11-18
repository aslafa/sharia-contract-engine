import { NextRequest, NextResponse } from "next/server";
import { createSession, withSessionExpiry, getSessionSecret, UserSession } from "@/lib/auth/session";
import { DBRepository } from "@/lib/db/repository";
import { authenticateUserWithJson, AuthError } from "@/lib/auth/json-auth";
import { logAuthEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, roleOverride, organizationId, mfaCode } = body || {};

    const secret = getSessionSecret();

    // STRICT mode is mandatory in production: refuse to run without a signing secret.
    if (!secret && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVER_CONFIGURATION_ERROR",
            message:
              "Otentikasi ketat tidak tersedia: SESSION_SECRET belum dikonfigurasi pada server.",
          },
        },
        { status: 500 }
      );
    }

    if (secret) {
      // ============================================================
      // STRICT MODE — JSON-backed authentication (temporary data
      // strategy) with identical security semantics: Argon2id password
      // verification, active checks, membership-scoped role selection.
      // (prisma-auth.ts remains the migration target when PostgreSQL
      // runtime returns.)
      // ============================================================

      // roleOverride must never be a client-controllable privilege in production.
      if (process.env.NODE_ENV === "production" && roleOverride) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_LOGIN_PAYLOAD",
              message: "roleOverride tidak diizinkan pada otentikasi production.",
            },
          },
          { status: 400 }
        );
      }

      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: { message: "Email dan password wajib disertakan." } },
          { status: 400 }
        );
      }

      const authResult = await authenticateUserWithJson({
        email,
        password,
        roleOverride, // dev-only convenience: may only select among the user's OWN memberships
        targetOrganizationId: organizationId,
      });

      const sessionUser: Omit<UserSession, "expiresAt"> = {
        userId: authResult.user.id,
        email: authResult.user.email,
        fullName: authResult.user.fullName,
        isSuperAdmin: authResult.user.isSuperAdmin,
        organizationId: authResult.activeMembership.organizationId,
        organizationName: authResult.activeMembership.organizationName,
        organizationCode: authResult.activeMembership.organizationCode,
        role: authResult.activeMembership.role,
        roleName: authResult.activeMembership.roleName,
        permissions: authResult.activeMembership.permissions,
        mfaVerified: Boolean(mfaCode),
        availableTenants: authResult.availableMemberships.map((m) => ({
          organizationId: m.organizationId,
          organizationName: m.organizationName,
          organizationCode: m.organizationCode,
          role: m.role,
        })),
      };

      // Signed HMAC-SHA256 session cookie (see lib/auth/session.ts)
      await createSession(withSessionExpiry(sessionUser));

      await logAuthEvent("LOGIN", authResult.user.id, authResult.activeMembership.organizationId, {
        email: authResult.user.email,
        role: authResult.activeMembership.role,
      });

      return NextResponse.json({
        success: true,
        message: "Otentikasi berhasil. Selamat datang di portal SHARIA CONTRACT ENGINE.",
        data: { user: { ...sessionUser, expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() } },
      });
    }

    // ============================================================
    // LEGACY DEMO MODE (no SESSION_SECRET, development only)
    // Preserves the original JSON-repository demo flow.
    // ============================================================
    if (!email && !roleOverride) {
      return NextResponse.json(
        { success: false, error: { message: "Email atau peran kredensial wajib disertakan." } },
        { status: 400 }
      );
    }

    const authResult = DBRepository.authenticateUser({
      email,
      password,
      roleOverride,
      targetOrganizationId: organizationId,
    });

    const sessionUser: Omit<UserSession, "expiresAt"> = {
      userId: authResult.user.id,
      email: authResult.user.email,
      fullName: authResult.user.fullName,
      isSuperAdmin: authResult.user.isSuperAdmin,
      organizationId: authResult.activeMembership.organizationId,
      organizationName: authResult.activeMembership.organizationName,
      organizationCode: authResult.activeMembership.organizationCode,
      role: authResult.activeMembership.role,
      roleName: authResult.activeMembership.roleName,
      permissions: authResult.activeMembership.permissions,
      mfaVerified: Boolean(mfaCode),
      availableTenants: authResult.availableMemberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organizationName,
        organizationCode: m.organizationCode,
        role: m.role,
      })),
    };

    await createSession(withSessionExpiry(sessionUser));

    return NextResponse.json({
      success: true,
      message: "Otentikasi berhasil. Selamat datang di portal SHARIA CONTRACT ENGINE.",
      data: { user: { ...sessionUser, expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() } },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_FAILED", message: error.message } },
        { status: error.status }
      );
    }
    // Never log request payloads (may contain passwords).
    console.error("[LOGIN_ERROR]", error instanceof Error ? error.message : "Gagal memproses otentikasi.");
    return NextResponse.json(
      { success: false, error: { message: "Gagal memproses otentikasi." } },
      { status: 401 }
    );
  }
}
