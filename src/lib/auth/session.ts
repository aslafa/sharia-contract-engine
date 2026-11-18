import { cookies } from "next/headers";
import crypto from "crypto";
import { SystemRole, SYSTEM_ROLE_DEFINITIONS } from "./roles";

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  role: SystemRole;
  roleName: string;
  permissions: string[];
  mfaVerified: boolean;
  expiresAt: string;
  availableTenants?: {
    organizationId: string;
    organizationName: string;
    organizationCode: string;
    role: SystemRole;
  }[];
}

export const DEMO_USERS: Record<SystemRole, UserSession> = {
  SUPER_ADMIN: {
    userId: "usr-super-admin-001",
    email: "superadmin@sce-engine.id",
    fullName: "Ahmad Fauzan, S.Kom., M.TI (Super Admin)",
    isSuperAdmin: true,
    organizationId: "org-global-platform",
    organizationName: "SCE Global Central Platform",
    organizationCode: "SCE-HQ",
    role: "SUPER_ADMIN",
    roleName: "Super Administrator",
    permissions: SYSTEM_ROLE_DEFINITIONS.SUPER_ADMIN.permissions,
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  },

  INSTITUTION_ADMIN: {
    userId: "usr-inst-admin-001",
    email: "admin@bprs-albarakah.co.id",
    fullName: "Drs. H. Mulyadi Kartasasmita",
    isSuperAdmin: false,
    organizationId: "org-bprs-albarakah",
    organizationName: "PT BPRS Al-Barakah Mandiri",
    organizationCode: "BPRS-ALBARAKAH",
    role: "INSTITUTION_ADMIN",
    roleName: "Institution Administrator",
    permissions: SYSTEM_ROLE_DEFINITIONS.INSTITUTION_ADMIN.permissions,
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  },

  FINANCING_OFFICER: {
    userId: "usr-fo-001",
    email: "fatimah.zahra@bprs-albarakah.co.id",
    fullName: "Fatimah Az-Zahra, S.E.Sy.",
    isSuperAdmin: false,
    organizationId: "org-bprs-albarakah",
    organizationName: "PT BPRS Al-Barakah Mandiri",
    organizationCode: "BPRS-ALBARAKAH",
    role: "FINANCING_OFFICER",
    roleName: "Financing / Account Officer",
    permissions: SYSTEM_ROLE_DEFINITIONS.FINANCING_OFFICER.permissions,
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  },

  LEGAL_OFFICER: {
    userId: "usr-legal-001",
    email: "bambang.sudrajat@bprs-albarakah.co.id",
    fullName: "Bambang Sudrajat, S.H., M.Kn.",
    isSuperAdmin: false,
    organizationId: "org-bprs-albarakah",
    organizationName: "PT BPRS Al-Barakah Mandiri",
    organizationCode: "BPRS-ALBARAKAH",
    role: "LEGAL_OFFICER",
    roleName: "Legal Officer",
    permissions: SYSTEM_ROLE_DEFINITIONS.LEGAL_OFFICER.permissions,
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  },

  COMPLIANCE_OFFICER: {
    userId: "usr-compliance-001",
    email: "nurul.hidayati@bprs-albarakah.co.id",
    fullName: "Nurul Hidayati, S.Sy., C.P.A.",
    isSuperAdmin: false,
    organizationId: "org-bprs-albarakah",
    organizationName: "PT BPRS Al-Barakah Mandiri",
    organizationCode: "BPRS-ALBARAKAH",
    role: "COMPLIANCE_OFFICER",
    roleName: "Compliance Officer",
    permissions: SYSTEM_ROLE_DEFINITIONS.COMPLIANCE_OFFICER.permissions,
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  },

  SHARIA_REVIEWER: {
    userId: "usr-dps-001",
    email: "kh.ridwan.mansur@dps-mui.id",
    fullName: "K.H. Dr. Ridwan Mansur, M.Ag. (DPS)",
    isSuperAdmin: false,
    organizationId: "org-bprs-albarakah",
    organizationName: "PT BPRS Al-Barakah Mandiri",
    organizationCode: "BPRS-ALBARAKAH",
    role: "SHARIA_REVIEWER",
    roleName: "Dewan Pengawas Syariah (DPS)",
    permissions: SYSTEM_ROLE_DEFINITIONS.SHARIA_REVIEWER.permissions,
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  },

  MANAGEMENT: {
    userId: "usr-mgmt-001",
    email: "ir.hendra.gunawan@bprs-albarakah.co.id",
    fullName: "Ir. Hendra Gunawan, M.B.A. (Direktur Bisnis)",
    isSuperAdmin: false,
    organizationId: "org-bprs-albarakah",
    organizationName: "PT BPRS Al-Barakah Mandiri",
    organizationCode: "BPRS-ALBARAKAH",
    role: "MANAGEMENT",
    roleName: "Executive Management",
    permissions: SYSTEM_ROLE_DEFINITIONS.MANAGEMENT.permissions,
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  },

  AUDITOR: {
    userId: "usr-auditor-001",
    email: "audit.internal@bprs-albarakah.co.id",
    fullName: "Arief Wibowo, S.E., Ak., CA (Lead Auditor)",
    isSuperAdmin: false,
    organizationId: "org-bprs-albarakah",
    organizationName: "PT BPRS Al-Barakah Mandiri",
    organizationCode: "BPRS-ALBARAKAH",
    role: "AUDITOR",
    roleName: "Internal / External Auditor",
    permissions: SYSTEM_ROLE_DEFINITIONS.AUDITOR.permissions,
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  },
};

const SESSION_COOKIE_NAME = "sce_auth_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SESSION_TTL_MS = SESSION_MAX_AGE_SECONDS * 1000;

/**
 * Retrieve the session signing secret from environment.
 * NEVER hardcoded. When absent, the platform runs in legacy demo mode
 * (unsigned sessions, dev-only) and a warning is emitted once.
 */
export function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length === 0) return null;
  return secret.trim();
}

function hmacSign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Create a signed session token: base64url(payload).hmac-sha256(base64url)
 * The signature covers the ENTIRE payload (including role and permissions),
 * so any client-side modification invalidates the token.
 */
export function createSessionToken(session: UserSession, secret?: string): string {
  const signingSecret = secret ?? getSessionSecret();
  if (!signingSecret) {
    throw new Error(
      "[SESSION_SECURITY] SESSION_SECRET belum dikonfigurasi. Sesu tidak dapat ditandatangani dengan aman."
    );
  }
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${hmacSign(payload, signingSecret)}`;
}

/**
 * Parse and verify a signed session token.
 * Returns null when: signature mismatch, malformed token, unknown role,
 * missing critical claims, or expired session. The expiry is enforced
 * server-side on every request, independent of the cookie's maxAge.
 */
export function parseSessionToken(token: string, secret?: string): UserSession | null {
  const signingSecret = secret ?? getSessionSecret();
  if (!signingSecret) return null;

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = hmacSign(payload, signingSecret);

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const session = JSON.parse(decoded) as UserSession;

    // Structural validation: critical claims must be present
    if (!session || typeof session !== "object") return null;
    if (!session.userId || !session.email || !session.organizationId) return null;

    // Role must map to a known system role — never trust arbitrary values
    if (!session.role || !(session.role in SYSTEM_ROLE_DEFINITIONS)) return null;
    if (!Array.isArray(session.permissions)) return null;

    // Server-side expiry enforcement
    if (!session.expiresAt) return null;
    const expiresAtMs = new Date(session.expiresAt).getTime();
    if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Retrieve current user session from the signed session cookie.
 *
 * Strict mode (SESSION_SECRET configured): unsigned/invalid/expired cookies
 * are REJECTED and there is NO fallback — unauthenticated requests receive null.
 *
 * Legacy demo mode (no SESSION_SECRET, development only): preserves the
 * previous behavior so existing demo data and flows keep working.
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  const secret = getSessionSecret();

  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie && sessionCookie.value) {
      if (secret) {
        const session = parseSessionToken(sessionCookie.value, secret);
        if (!session) {
          console.error(
            "[SESSION_SECURITY] Sesi ditolak: signature tidak valid, payload dimanipulasi, atau sesi telah berakhir."
          );
          return null;
        }
        return session;
      }

      // No signing secret: unsigned cookies are forgeable and are NEVER trusted in production.
      if (process.env.NODE_ENV === "production") {
        console.error(
          "[SESSION_SECURITY] SESSION_SECRET tidak dikonfigurasi pada production; cookie sesi unsigned ditolak."
        );
        return null;
      }

      // Legacy unsigned mode (development/demo only)
      const decoded = JSON.parse(decodeURIComponent(sessionCookie.value)) as UserSession;
      if (decoded?.expiresAt && new Date(decoded.expiresAt).getTime() <= Date.now()) {
        return null;
      }
      return decoded;
    }
  } catch (err) {
    console.error("[SESSION_PARSE_ERROR]", err);
  }

  // In strict mode there is no demo fallback: no cookie means unauthenticated.
  if (secret) return null;

  // The demo fallback is a development convenience and is NEVER enabled in production.
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[SESSION_SECURITY] SESSION_SECRET tidak dikonfigurasi pada production; fallback demo dinonaktifkan."
    );
    return null;
  }

  // Fallback to default demo session (Institution Admin) in development if none set
  return DEMO_USERS.INSTITUTION_ADMIN;
}

/**
 * Create or update the signed session cookie
 */
export async function createSession(session: UserSession): Promise<void> {
  const cookieStore = cookies();
  const secret = getSessionSecret();

  const value = secret
    ? createSessionToken(session, secret)
    : encodeURIComponent(JSON.stringify(session));

  cookieStore.set(SESSION_COOKIE_NAME, value, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clear session cookie on logout
 */
export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Build a fresh UserSession with a server-derived expiry timestamp.
 * Used by login and switch-tenant so expiry is always set from the server.
 */
export function withSessionExpiry(session: Omit<UserSession, "expiresAt">): UserSession {
  return {
    ...session,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
}
