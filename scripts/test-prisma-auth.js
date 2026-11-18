/**
 * SCE — Prisma-Based Authentication Test Suite (2.2A)
 *
 * Verifies PostgreSQL-backed login & tenant membership against the RUNNING
 * dev server. Requires: sce-postgres up, seed applied, SESSION_SECRET set.
 *
 * Usage: node scripts/test-prisma-auth.js
 * Note: this suite toggles isActive flags via Prisma and always RESTORES them.
 */

const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = process.env.SCE_TEST_URL || "http://localhost:3000";

const DEMO_PASSWORD = process.env.SCE_DEMO_PASSWORD || "P@ssword123!";

const USERS = {
  FO: "fatimah.zahra@bprs-albarakah.co.id",
  DPS: "kh.ridwan.mansur@dps-mui.id",
  AUDITOR: "audit.internal@bprs-albarakah.co.id",
};

let passedCount = 0;
let failedCount = 0;
const failures = [];

function report(name, ok, detail) {
  if (ok) {
    console.log(`[\x1b[32mPASS\x1b[0m] ${name}`);
    passedCount++;
  } else {
    console.error(`[\x1b[31mFAIL\x1b[0m] ${name}`);
    if (detail) console.error(`       ${detail}`);
    failedCount++;
    failures.push(name);
  }
}

async function request(method, urlPath, { cookie, body } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (body) headers["content-type"] = "application/json";

  const res = await fetch(BASE + urlPath, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const setCookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : res.headers.get("set-cookie")
      ? [res.headers.get("set-cookie")]
      : [];

  let nextCookie = cookie || null;
  for (const sc of setCookies) {
    const pair = sc.split(";")[0];
    if (pair.startsWith("sce_auth_session=")) {
      const value = pair.slice("sce_auth_session=".length);
      nextCookie = value ? `sce_auth_session=${value}` : null;
    }
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }

  return { status: res.status, json, setCookies, cookie: nextCookie };
}

function login(email, password, extra = {}) {
  return request("POST", "/api/auth/login", { body: { email, password, ...extra } });
}

async function run() {
  console.log("=".repeat(80));
  console.log("   SCE — PRISMA-BASED AUTHENTICATION SUITE (PostgreSQL)");
  console.log(`   Target: ${BASE}`);
  console.log("=".repeat(80));
  console.log("");

  // Precondition: PostgreSQL actually reachable
  try {
    await prisma.$queryRaw`SELECT 1`;
    report("PG0 PostgreSQL benar-benar terhubung", true);
  } catch (e) {
    report("PG0 PostgreSQL benar-benar terhubung", false, String(e.message).split("\n")[0]);
    return finish();
  }

  // ------------------------------------------------------------------ valid
  {
    const res = await login(USERS.FO, DEMO_PASSWORD);
    const user = res.json?.data?.user;
    report(
      "P1 Login kredensial valid (200, role dari membership DB)",
      res.status === 200 &&
        user?.role === "FINANCING_OFFICER" &&
        user?.organizationId === "org-bprs-albarakah",
      `status=${res.status} role=${user?.role}`
    );

    // Permissions MUST come from DB membership (RolePermission), not client input
    report(
      "P2 Permission sesi berasal dari membership DB (contracts:create ada, sharia:override tidak)",
      Array.isArray(user?.permissions) &&
        user.permissions.includes("contracts:create") &&
        !user.permissions.includes("sharia:override"),
      JSON.stringify(user?.permissions)
    );
  }

  // ------------------------------------------------------- invalid credentials
  {
    const res = await login(USERS.FO, "wrong-password-xyz");
    report(
      "P3 Login password salah ditolak (401, pesan generik)",
      res.status === 401 && res.json?.success === false,
      `status=${res.status}`
    );
    report(
      "P4 Login password salah TIDAK mengeluarkan Set-Cookie sesi",
      !res.setCookies.some((sc) => sc.includes("sce_auth_session=") && !/sce_auth_session=;/.test(sc)),
      JSON.stringify(res.setCookies)
    );
  }
  {
    const res = await login("unknown@sce-engine.id", DEMO_PASSWORD);
    report(
      "P5 Email tidak dikenal ditolak (401)",
      res.status === 401,
      `status=${res.status}`
    );
  }
  {
    const res = await request("POST", "/api/auth/login", { body: { email: USERS.FO } });
    report(
      "P6 Login tanpa password ditolak (400)",
      res.status === 400,
      `status=${res.status}`
    );
  }

  // ------------------------------------------------- roleOverride not a privilege
  {
    // roleOverride may only select among the user's OWN memberships.
    // FO has no SHARIA_REVIEWER membership -> must be rejected, not granted.
    const res = await login(USERS.FO, DEMO_PASSWORD, { roleOverride: "SHARIA_REVIEWER" });
    report(
      "P7 roleOverride ke peran yang BUKAN membership pengguna ditolak (403)",
      res.status === 403 && res.json?.success === false,
      `status=${res.status}`
    );
  }
  {
    // Valid self-membership selection still works in non-production
    const res = await login(USERS.FO, DEMO_PASSWORD, { roleOverride: "FINANCING_OFFICER" });
    report(
      "P8 roleOverride ke peran membership sendiri diterima di non-production (200)",
      res.status === 200 && res.json?.data?.user?.role === "FINANCING_OFFICER",
      `status=${res.status}`
    );
  }

  // ------------------------------------------------------- inactive user
  {
    await prisma.user.update({ where: { email: USERS.FO }, data: { isActive: false } });
    try {
      const res = await login(USERS.FO, DEMO_PASSWORD);
      report(
        "P9 User NONAKTIF ditolak (403)",
        res.status === 403 && res.json?.success === false,
        `status=${res.status}`
      );
      report(
        "P10 User nonaktif TIDAK mendapat Set-Cookie sesi",
        !res.setCookies.some((sc) => sc.includes("sce_auth_session=") && !/sce_auth_session=;/.test(sc)),
        JSON.stringify(res.setCookies)
      );
    } finally {
      await prisma.user.update({ where: { email: USERS.FO }, data: { isActive: true } });
    }
    // restored: valid login works again
    const restored = await login(USERS.FO, DEMO_PASSWORD);
    report("P11 Setelah isActive dipulihkan, login valid kembali (200)", restored.status === 200);
  }

  // --------------------------------------------------- inactive membership
  {
    // Deactivate FO's only membership
    await prisma.organizationMember.updateMany({
      where: { userId: (await prisma.user.findUnique({ where: { email: USERS.FO } })).id },
      data: { isActive: false },
    });
    try {
      const res = await login(USERS.FO, DEMO_PASSWORD);
      report(
        "P12 Membership NONAKTIF ditolak (403)",
        res.status === 403,
        `status=${res.status}`
      );
    } finally {
      await prisma.organizationMember.updateMany({
        where: { userId: (await prisma.user.findUnique({ where: { email: USERS.FO } })).id },
        data: { isActive: true },
      });
    }
  }

  // ------------------------------------ multi-tenant membership (DPS, Auditor)
  {
    const dps = await login(USERS.DPS, DEMO_PASSWORD);
    const user = dps.json?.data?.user;
    const tenantIds = (user?.availableTenants || []).map((t) => t.organizationId);
    report(
      "P13 DPS memiliki dua membership aktif (multi-tenant dipertahankan)",
      dps.status === 200 &&
        tenantIds.includes("org-bprs-albarakah") &&
        tenantIds.includes("org-kspps-bintang"),
      JSON.stringify(tenantIds)
    );

    // switch to second tenant via DB-validated membership
    const sw = await request("POST", "/api/auth/switch-tenant", {
      cookie: dps.cookie,
      body: { targetOrganizationId: "org-kspps-bintang" },
    });
    report(
      "P14 DPS switch ke tenant kedua diterima (200, role dari DB)",
      sw.status === 200 &&
        sw.json?.data?.user?.organizationId === "org-kspps-bintang" &&
        sw.json?.data?.user?.role === "SHARIA_REVIEWER",
      `status=${sw.status}`
    );

    // auditor multi-tenant
    const aud = await login(USERS.AUDITOR, DEMO_PASSWORD);
    const audTenants = (aud.json?.data?.user?.availableTenants || []).map((t) => t.organizationId);
    report(
      "P15 Auditor memiliki dua membership aktif (multi-tenant dipertahankan)",
      aud.status === 200 &&
        audTenants.includes("org-bprs-albarakah") &&
        audTenants.includes("org-kspps-bintang"),
      JSON.stringify(audTenants)
    );
  }

  // --------------------------------------- inactive membership blocks switching
  {
    // Deactivate DPS membership in KSPPS-BINTANG, then try switching there
    const dpsUser = await prisma.user.findUnique({ where: { email: USERS.DPS } });
    await prisma.organizationMember.updateMany({
      where: { userId: dpsUser.id, organizationId: "org-kspps-bintang" },
      data: { isActive: false },
    });
    try {
      const dps = await login(USERS.DPS, DEMO_PASSWORD);
      const tenants = (dps.json?.data?.user?.availableTenants || []).map((t) => t.organizationId);
      report(
        "P16 Membership KSPPS dinonaktifkan -> hilang dari availableTenants",
        dps.status === 200 && !tenants.includes("org-kspps-bintang"),
        JSON.stringify(tenants)
      );

      const sw = await request("POST", "/api/auth/switch-tenant", {
        cookie: dps.cookie,
        body: { targetOrganizationId: "org-kspps-bintang" },
      });
      report(
        "P17 Switch ke tenant dengan membership nonaktif ditolak (403)",
        sw.status === 403 && sw.json?.success === false,
        `status=${sw.status}`
      );
    } finally {
      await prisma.organizationMember.updateMany({
        where: { userId: dpsUser.id, organizationId: "org-kspps-bintang" },
        data: { isActive: true },
      });
    }
  }

  // ------------------------------------- password hash never leaves the server
  {
    const res = await login(USERS.DPS, DEMO_PASSWORD);
    const raw = JSON.stringify(res.json || {});
    report(
      "P18 Respons login tidak memuat password hash (argon2/",
      res.status === 200 && !raw.includes("argon2$") && !raw.includes("passwordHash"),
      ""
    );
  }

  return finish();
}

function finish() {
  console.log("");
  console.log("=".repeat(80));
  console.log(`   RESULTS: ${passedCount} PASS, ${failedCount} FAIL`);
  if (failures.length > 0) {
    console.log("   Failed tests:");
    failures.forEach((f) => console.log(`     - ${f}`));
  }
  console.log("=".repeat(80));
  process.exit(failedCount > 0 ? 1 : 0);
}

run()
  .catch((e) => {
    console.error("[FATAL]", e.message);
    finish();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
