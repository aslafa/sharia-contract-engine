import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, UserSession } from "./session";
import { SystemRole } from "./roles";
import { roleHasPermission, PermissionCode } from "./rbac";
import { createAuditLog } from "@/lib/audit";
import { DBRepository } from "@/lib/db/repository";

export class AuthenticationError extends Error {
  public status: number = 401;
  constructor(message: string = "Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class TenantIsolationError extends Error {
  public status: number = 403;
  public userOrgId: string;
  public targetOrgId: string;

  constructor(message: string, userOrgId: string, targetOrgId: string) {
    super(message);
    this.name = "TenantIsolationError";
    this.userOrgId = userOrgId;
    this.targetOrgId = targetOrgId;
  }
}

export class AuthorizationError extends Error {
  public status: number = 403;
  constructor(message: string = "Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Server-side guard to guarantee user is authenticated
 */
export async function getAuthenticatedUser(req?: NextRequest): Promise<UserSession> {
  const session = await getCurrentSession();
  if (!session || !session.userId) {
    throw new AuthenticationError("Sesi Anda telah berakhir atau belum terotentikasi. Silakan login kembali.");
  }
  return session;
}

/**
 * Backend authorization guard verifying role membership
 */
export async function assertRole(
  user: UserSession | null | undefined,
  allowedRoles: SystemRole[]
): Promise<void> {
  if (!user || !user.userId) {
    throw new AuthenticationError("Sesi otentikasi tidak valid atau tidak ditemukan.");
  }

  if (user.isSuperAdmin) return; // Super admin bypasses role barrier for platform governance

  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      `Peran '${user.role}' tidak memiliki otorisasi untuk mengakses operasi ini. Peran yang diizinkan: ${allowedRoles.join(", ")}`
    );
  }
}

/**
 * Backend authorization guard verifying granular permission
 */
export async function assertPermission(
  user: UserSession | null | undefined,
  permission: PermissionCode | string
): Promise<void> {
  if (!user || !user.userId) {
    throw new AuthenticationError("Sesi otentikasi tidak valid atau tidak ditemukan.");
  }

  if (user.isSuperAdmin) return;

  // Tahap 3B.5 (RBAC audit hardening): otoritas permission HANYA dari
  // definisi role (SYSTEM_ROLE_DEFINITIONS). Fallback ke klaim
  // `permissions` pada token dihapus karena memungkinkan eskalasi
  // privilege bila klaim sesi berbeda dari definisi role. Session yang
  // sah selalu diturunkan dari definisi role yang sama, sehingga tidak
  // ada alur legitimate yang berubah.
  const hasPerm = roleHasPermission(user.role, permission);

  if (!hasPerm) {
    throw new AuthorizationError(
      `Otorisasi ditolak: Pengguna tidak memiliki hak izin '${permission}'.`
    );
  }
}

/**
 * CRITICAL MULTI-TENANT ISOLATION CHECK
 * Guarantees that users can NEVER access or mutate records belonging to another organization.
 * Emits security audit alert on violation.
 */
export async function assertTenantIsolation(
  user: UserSession | null | undefined,
  targetOrganizationId: string,
  entityName: string = "Resource",
  entityId: string = "unknown",
  ipAddress?: string
): Promise<void> {
  if (!user || !user.userId || !user.organizationId) {
    throw new AuthenticationError(
      "Sesi otentikasi tidak valid atau pengguna belum terasosiasi dengan institusi tenant manapun."
    );
  }

  // Super admin can inspect tenants in platform mode, but tenant users are strictly isolated
  if (user.isSuperAdmin) return;

  const hasAccess =
    Boolean(targetOrganizationId) &&
    (user.organizationId === targetOrganizationId ||
      DBRepository.userHasTenantAccess(user.userId, targetOrganizationId));

  if (!hasAccess) {
    // Record security audit violation
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.userId,
      action: "CROSS_TENANT_VIOLATION_BLOCKED",
      entityName,
      entityId,
      details: {
        violation: "CROSS_TENANT_ACCESS_ATTEMPT",
        userOrganizationId: user.organizationId,
        targetOrganizationId: targetOrganizationId || "undefined",
        userRole: user.role,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
    });

    throw new TenantIsolationError(
      `PELANGGARAN ISOLASI TENANT: Pengguna dari organisasi '${user.organizationId}' tidak diizinkan mengakses data milik organisasi '${targetOrganizationId}'. Insiden ini telah dicatat dalam log audit keamanan.`,
      user.organizationId,
      targetOrganizationId || "unknown"
    );
  }
}

/**
 * Standard HTTP Error handler for Route Handlers
 */
export function handleAuthError(error: unknown) {
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: error.message,
        },
      },
      { status: 401 }
    );
  }

  if (error instanceof TenantIsolationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN_CROSS_TENANT_ACCESS",
          message: error.message,
          userOrg: error.userOrgId,
          targetOrg: error.targetOrgId,
        },
      },
      { status: 403 }
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED_OR_FORBIDDEN",
          message: error.message,
        },
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_AUTH_ERROR",
        message: error instanceof Error ? error.message : "Terjadi kesalahan otentikasi internal.",
      },
    },
    { status: 500 }
  );
}

