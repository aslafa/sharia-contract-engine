import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "./password";
import { SystemRole, SYSTEM_ROLE_DEFINITIONS } from "./roles";

/**
 * PostgreSQL-backed authentication & tenant membership resolution.
 *
 * Source of truth: Prisma models
 *   - User                  (credentials + activation status)
 *   - Organization          (tenant)
 *   - OrganizationMember    (tenant membership + activation status)
 *   - Role                  (systemRole mapping; role.name for display)
 *   - RolePermission/Permission (granular permission codes)
 *
 * Returns shapes compatible with the legacy DBRepository.authenticateUser /
 * switchTenant contracts so guard.ts, session.ts and RBAC remain untouched.
 */

import { AuthError } from "./json-auth";
export { AuthError };

export interface AuthenticatedMembership {
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  role: SystemRole;
  roleName: string;
  permissions: string[];
  isActive: true;
}

export interface PrismaAuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    isSuperAdmin: boolean;
    isActive: boolean;
  };
  activeMembership: AuthenticatedMembership;
  availableMemberships: AuthenticatedMembership[];
}

function loadMemberships(where: { userId: string; isActive: boolean }) {
  return prisma.organizationMember.findMany({
    where,
    include: {
      organization: true,
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}

function mapMembership(m: Awaited<ReturnType<typeof loadMemberships>>[number]): AuthenticatedMembership {
  const role = m.role;

  if (!role || !role.systemRole) {
    // Refuse to guess: an unmapped custom role must not silently gain privileges.
    throw new AuthError(
      `Peran '${role?.code ?? m.roleId}' belum terpetakan ke peran sistem SCE (Role.systemRole). Hubungi administrator platform.`,
      500
    );
  }

  // Permissions come from the database when seeded (RolePermission → Permission),
  // otherwise fall back to the code-defined defaults for that system role.
  const dbPermissions = (role.permissions ?? []).map((rp) => rp.permission.code);
  const permissions =
    dbPermissions.length > 0 ? dbPermissions : [...SYSTEM_ROLE_DEFINITIONS[role.systemRole].permissions];

  return {
    organizationId: m.organizationId,
    organizationName: m.organization.name,
    organizationCode: m.organization.code,
    role: role.systemRole,
    roleName: role.name,
    permissions,
    isActive: true,
  };
}

export async function authenticateUserWithPrisma(params: {
  email: string;
  password: string;
  roleOverride?: string;
  targetOrganizationId?: string;
}): Promise<PrismaAuthResult> {
  const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  const password = typeof params.password === "string" ? params.password : "";

  if (!email || !password) {
    throw new AuthError("Email dan password wajib disertakan.", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });

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
  const memberships = await loadMemberships({ userId: user.id, isActive: true });

  if (memberships.length === 0 && !user.isSuperAdmin) {
    throw new AuthError("Pengguna tidak memiliki keanggotaan institusi aktif.", 403);
  }

  let chosen;
  if (params.targetOrganizationId) {
    chosen = memberships.find((m) => m.organizationId === params.targetOrganizationId);
    if (!chosen) {
      throw new AuthError("Anda tidak memiliki membership aktif pada organisasi tersebut.", 403);
    }
  } else if (params.roleOverride) {
    // roleOverride may only SELECT among the user's OWN active memberships.
    // It never grants a role — the role always comes from the database.
    chosen = memberships.find((m) => m.role?.systemRole === params.roleOverride);
    if (!chosen) {
      throw new AuthError("Anda tidak memiliki membership aktif dengan peran tersebut.", 403);
    }
  } else {
    chosen = memberships[0];
  }

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

export async function switchTenantWithPrisma(
  userId: string,
  targetOrganizationId: string
): Promise<PrismaAuthResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AuthError("Pengguna tidak ditemukan.", 401);
  }

  if (!user.isActive) {
    throw new AuthError("Akun Anda telah dinonaktifkan. Hubungi administrator institusi Anda.", 403);
  }

  const memberships = await loadMemberships({ userId, isActive: true });
  const target = memberships.find((m) => m.organizationId === targetOrganizationId);

  if (!target) {
    throw new AuthError(
      "Pergantian organisasi ditolak: Anda bukan member aktif dari organisasi target.",
      403
    );
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isSuperAdmin: user.isSuperAdmin,
      isActive: user.isActive,
    },
    activeMembership: mapMembership(target),
    availableMemberships: memberships.map(mapMembership),
  };
}
