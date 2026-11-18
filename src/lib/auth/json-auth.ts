import { DBRepository, DBUser, DBMembership } from "@/lib/db/repository";
import { verifyPassword } from "./password";
import { SYSTEM_ROLE_DEFINITIONS } from "./roles";
import type { SystemRole } from "./roles";

export class AuthError extends Error {
  public status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * JSON-backed authentication & tenant membership resolution (temporary data
 * strategy: data/sce_database.json is the sole operational data source until
 * the Prisma migration resumes).
 *
 * Security semantics are IDENTICAL to prisma-auth.ts:
 *   - Argon2id password verification (plaintext never stored/logged)
 *   - inactive user / inactive membership rejected
 *   - roleOverride may only SELECT among the user's OWN active memberships
 *   - role & permissions always come from the stored membership, never client input
 *
 * Contract is compatible with prisma-auth.ts so the data source can be swapped
 * back to Prisma later without touching routes, guard.ts, or RBAC.
 */

export interface JsonAuthenticatedMembership {
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  role: SystemRole;
  roleName: string;
  permissions: string[];
  isActive: true;
}

export interface JsonAuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    isSuperAdmin: boolean;
    isActive: boolean;
  };
  activeMembership: JsonAuthenticatedMembership;
  availableMemberships: JsonAuthenticatedMembership[];
}

function mapMembership(m: DBMembership): JsonAuthenticatedMembership {
  // Tahap 3B.5 (RBAC audit fix): klaim permission sesi HARUS diturunkan dari
  // SYSTEM_ROLE_DEFINITIONS (matriks RBAC otoritatif), bukan dari array
  // `permissions` pada record membership yang berisi kode legacy stale
  // (mis. "org:manage", "approvals:legal"). Klaim yang stale membuat gating
  // UI (useSession.can) dan klaim token menyimpang dari otoritas backend
  // (roleHasPermission). Backend TETAP memverifikasi ulang setiap izin.
  const authoritative =
    SYSTEM_ROLE_DEFINITIONS[m.role as SystemRole]?.permissions;
  return {
    organizationId: m.organizationId,
    organizationName: m.organizationName,
    organizationCode: m.organizationCode,
    role: m.role,
    roleName: m.roleName,
    permissions: authoritative
      ? [...authoritative]
      : [...(m.permissions || [])],
    isActive: true,
  };
}

function toAuthResult(user: DBUser, memberships: DBMembership[], chosen: DBMembership): JsonAuthResult {
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isSuperAdmin: user.isSuperAdmin,
      isActive: user.isActive,
    },
    activeMembership: mapMembership(chosen),
    availableMemberships: memberships.map(mapMembership),
  };
}

export async function authenticateUserWithJson(params: {
  email: string;
  password: string;
  roleOverride?: string;
  targetOrganizationId?: string;
}): Promise<JsonAuthResult> {
  const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  const password = typeof params.password === "string" ? params.password : "";

  if (!email || !password) {
    throw new AuthError("Email dan password wajib disertakan.", 400);
  }

  const user = DBRepository.getUserByEmail(email);

  // Generic message for unknown email AND missing/wrong password (prevents enumeration).
  if (!user || !user.passwordHash) {
    throw new AuthError("Kredensial tidak valid.", 401);
  }

  if (!user.isActive) {
    throw new AuthError("Akun Anda telah dinonaktifkan. Hubungi administrator institusi Anda.", 403);
  }

  const passwordOk = await verifyPassword(user.passwordHash, password);
  if (!passwordOk) {
    throw new AuthError("Kredensial tidak valid.", 401);
  }

  // Only ACTIVE memberships of the authenticated user are ever considered.
  const memberships = DBRepository.getUserMemberships(user.id);

  if (memberships.length === 0 && !user.isSuperAdmin) {
    throw new AuthError("Pengguna tidak memiliki keanggotaan institusi aktif.", 403);
  }

  let chosen: DBMembership | undefined;
  if (params.targetOrganizationId) {
    chosen = memberships.find((m) => m.organizationId === params.targetOrganizationId);
    if (!chosen) {
      throw new AuthError("Anda tidak memiliki membership aktif pada organisasi tersebut.", 403);
    }
  } else if (params.roleOverride) {
    // roleOverride may only SELECT among the user's OWN active memberships.
    // It never grants a role — the role always comes from the stored membership.
    chosen = memberships.find((m) => m.role === params.roleOverride);
    if (!chosen) {
      throw new AuthError("Anda tidak memiliki membership aktif dengan peran tersebut.", 403);
    }
  } else {
    chosen = memberships[0];
  }

  return toAuthResult(user, memberships, chosen);
}

export async function switchTenantWithJson(
  userId: string,
  targetOrganizationId: string
): Promise<JsonAuthResult> {
  const user = DBRepository.getUserById(userId);

  if (!user) {
    throw new AuthError("Pengguna tidak ditemukan.", 401);
  }

  if (!user.isActive) {
    throw new AuthError("Akun Anda telah dinonaktifkan. Hubungi administrator institusi Anda.", 403);
  }

  const memberships = DBRepository.getUserMemberships(userId);
  const target = memberships.find((m) => m.organizationId === targetOrganizationId);

  if (!target) {
    throw new AuthError(
      "Pergantian organisasi ditolak: Anda bukan member aktif dari organisasi target.",
      403
    );
  }

  return toAuthResult(user, memberships, target);
}
