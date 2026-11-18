/**
 * SHARIA CONTRACT ENGINE (SCE) — Signed Session Cookie Test Suite
 *
 * End-to-end verification of the HMAC-SHA256 signed session mechanism.
 * Requires the Next.js dev server running (default http://localhost:3000).
 *
 * Covered cases:
 *   a. Request WITHOUT cookie                    -> rejected (401)
 *   b. Cookie with INVALID signature             -> rejected (401)
 *   c. Expired session (server-side expiry)      -> rejected (401)
 *   d. Role/permission escalation manipulation   -> rejected (401)
 *   e. Valid login                               -> signed cookie issued + session readable
 *   f. Logout                                    -> session cookie cleared
 *   g. Tenant switching (allowed + forbidden)    -> session re-signed for target tenant
 *
 * Usage: node scripts/test-signed-session.js
 * The signing secret is read from .env (SESSION_SECRET) — never hardcoded here.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = process.env.SCE_TEST_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Secret loading (from environment file, never hardcoded)
// ---------------------------------------------------------------------------
function loadSecret() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env tidak ditemukan. SESSION_SECRET wajib tersedia.");
  }
  const match = fs.readFileSync(envPath, "utf8").match(/^SESSION_SECRET="([^"]+)"/m);
  if (!match) {
    throw new Error("SESSION_SECRET tidak ditemukan di .env. Mode strict tidak dapat diuji.");
  }
  return match[1];
}

const SERVER_SECRET = loadSecret();
const ATTACKER_SECRET = "attacker-controlled-secret-0000000000000000";

// Demo dataset credentials (demo personas seeded into PostgreSQL; not production accounts)
const DEMO_PASSWORD = process.env.SCE_DEMO_PASSWORD || "P@ssword123!";
const DEMO_USERS = {
  FINANCING_OFFICER: { email: "fatimah.zahra@bprs-albarakah.co.id", password: DEMO_PASSWORD },
  SHARIA_REVIEWER: { email: "kh.ridwan.mansur@dps-mui.id", password: DEMO_PASSWORD },
};

// ---------------------------------------------------------------------------
// Token crafting helpers (mirror of src/lib/auth/session.ts algorithm)
// ---------------------------------------------------------------------------
function encodePayload(session) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}
function hmacSign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}
function craftToken(session, secret) {
  const payload = encodePayload(session);
  return `${payload}.${hmacSign(payload, secret)}`;
}
function decodeTokenPayload(token) {
  const payload = token.split(".")[0];
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

// ---------------------------------------------------------------------------
// Minimal test runner
// ---------------------------------------------------------------------------
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
    redirect: "manual",
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
    /* non-JSON response */
  }

  return { status: res.status, json, setCookies, cookie: nextCookie };
}

function buildSession(overrides = {}) {
  return {
    userId: "usr-fo-001",
    email: "fatimah.zahra@bprs-albarakah.co.id",
    fullName: "Fatimah Az-Zahra, S.E.Sy.",
    isSuperAdmin: false,
    organizationId: "org-bprs-albarakah",
    organizationName: "PT BPRS Al-Barakah Mandiri",
    organizationCode: "BPRS-ALBARAKAH",
    role: "FINANCING_OFFICER",
    roleName: "Financing / Account Officer",
    permissions: ["contracts:create", "contracts:view", "contracts:edit", "documents:upload"],
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
async function run() {
  console.log("=".repeat(80));
  console.log("   SCE — SIGNED SESSION COOKIE SECURITY SUITE");
  console.log(`   Target: ${BASE}`);
  console.log("=".repeat(80));
  console.log("");

  // -------------------------------------------------------------------------
  // a. Request WITHOUT cookie
  // -------------------------------------------------------------------------
  {
    const res = await request("GET", "/api/auth/session");
    report(
      "(a1) GET /api/auth/session tanpa cookie ditolak (401)",
      res.status === 401 && res.json && res.json.authenticated === false,
      `status=${res.status}`
    );
  }
  {
    const res = await request("GET", "/api/v1/applications");
    report(
      "(a2) GET /api/v1/applications tanpa cookie ditolak (401)",
      res.status === 401,
      `status=${res.status}`
    );
  }

  // -------------------------------------------------------------------------
  // b. Cookie with INVALID signature (attacker-signed)
  // -------------------------------------------------------------------------
  {
    const forged = craftToken(buildSession(), ATTACKER_SECRET);
    const res = await request("GET", "/api/auth/session", { cookie: `sce_auth_session=${forged}` });
    report(
      "(b1) Cookie ditandatangani secret asing ditolak (401)",
      res.status === 401,
      `status=${res.status}`
    );
  }
  {
    const validToken = craftToken(buildSession(), SERVER_SECRET);
    const tampered = validToken.slice(0, -2) + "XX"; // corrupt last signature chars
    const res = await request("GET", "/api/v1/applications", { cookie: `sce_auth_session=${tampered}` });
    report(
      "(b2) Signature yang dikorup 1-2 karakter tetap ditolak (401)",
      res.status === 401,
      `status=${res.status}`
    );
  }

  // -------------------------------------------------------------------------
  // c. Expired session (correct signature, but expired server-side)
  // -------------------------------------------------------------------------
  {
    const expired = craftToken(
      buildSession({ expiresAt: new Date(Date.now() - 1000).toISOString() }),
      SERVER_SECRET
    );
    const res = await request("GET", "/api/auth/session", { cookie: `sce_auth_session=${expired}` });
    report(
      "(c) Sesi expired (signature valid) ditolak (401)",
      res.status === 401,
      `status=${res.status}`
    );
  }

  // -------------------------------------------------------------------------
  // d. Role escalation via payload manipulation
  // -------------------------------------------------------------------------
  {
    // e-prep: obtain a genuinely signed FINANCING_OFFICER cookie via login
    const login = await request("POST", "/api/auth/login", {
      body: { email: DEMO_USERS.FINANCING_OFFICER.email, password: DEMO_USERS.FINANCING_OFFICER.password },
    });
    if (login.status !== 200 || !login.cookie) {
      report("(e) Login valid FINANCING_OFFICER", false, `status=${login.status}`);
      return finish();
    }
    report("(e1) Login valid FINANCING_OFFICER (200 + Set-Cookie)", true);

    const legitToken = login.cookie.split("=")[1];
    const legitPayload = decodeTokenPayload(legitToken);
    const legitSignature = legitToken.split(".")[1];

    report(
      "(e2) Cookie login ter-signature HMAC dan terverifikasi",
      legitSignature === hmacSign(encodePayload(legitPayload), SERVER_SECRET),
      "Signature pada cookie login tidak cocok dengan HMAC-SHA256 server secret"
    );

    // d1: escalate role, keep original signature -> signature mismatch
    const escalated = { ...legitPayload, role: "SUPER_ADMIN", isSuperAdmin: true, permissions: ["*"] };
    const forgedKeepSig = `${encodePayload(escalated)}.${legitSignature}`;
    const resEscalated = await request("GET", "/api/auth/session", {
      cookie: `sce_auth_session=${forgedKeepSig}`,
    });
    report(
      "(d1) Payload dinaikkan ke SUPER_ADMIN dengan signature lama ditolak (401)",
      resEscalated.status === 401,
      `status=${resEscalated.status}`
    );

    // d2: escalate role, attacker re-signs with own secret -> rejected
    const attackerSigned = craftToken(escalated, ATTACKER_SECRET);
    const resAttacker = await request("GET", "/api/v1/applications", {
      cookie: `sce_auth_session=${attackerSigned}`,
    });
    report(
      "(d2) Payload SUPER_ADMIN ditandatangani secret penyerang ditolak (401)",
      resAttacker.status === 401,
      `status=${resAttacker.status}`
    );

    // d3: verify a SUPER_ADMIN-granted response is never returned from forged cookies
    const bodyText = JSON.stringify(resEscalated.json || {});
    report(
      "(d3) Tidak ada grant SUPER_ADMIN dalam respons untuk cookie palsu",
      resEscalated.status === 401 && !bodyText.includes('"role":"SUPER_ADMIN"')
    );

    // -------------------------------------------------------------------------
    // e3: legitimate session is readable with the login cookie
    // -------------------------------------------------------------------------
    const sess = await request("GET", "/api/auth/session", { cookie: login.cookie });
    report(
      "(e3) Sesi valid terbaca dengan cookie login (200, role sesuai)",
      sess.status === 200 &&
        sess.json &&
        sess.json.authenticated === true &&
        sess.json.data.user.role === "FINANCING_OFFICER",
      `status=${sess.status}`
    );

    // e4: operational API works with legitimate signed session (guard.ts + RBAC compat)
    const apps = await request("GET", "/api/v1/applications", { cookie: login.cookie });
    report(
      "(e4) GET /api/v1/applications dengan sesi valid diterima (200)",
      apps.status === 200 && apps.json && apps.json.success === true,
      `status=${apps.status}`
    );

    // -------------------------------------------------------------------------
    // g. Tenant switching
    // -------------------------------------------------------------------------
    // g-prep: login as SHARIA_REVIEWER (DPS is member of two tenants)
    const dpsLogin = await request("POST", "/api/auth/login", {
      body: { email: DEMO_USERS.SHARIA_REVIEWER.email, password: DEMO_USERS.SHARIA_REVIEWER.password },
    });
    if (dpsLogin.status !== 200 || !dpsLogin.cookie) {
      report("(g) Login SHARIA_REVIEWER untuk uji switch", false, `status=${dpsLogin.status}`);
    } else {
      const switchRes = await request("POST", "/api/auth/switch-tenant", {
        cookie: dpsLogin.cookie,
        body: { targetOrganizationId: "org-kspps-bintang" },
      });
      report(
        "(g1) Switch tenant ke KSPPS-BINTANG diterima (200) untuk multi-member DPS",
        switchRes.status === 200 && switchRes.json && switchRes.json.success === true,
        `status=${switchRes.status}`
      );

      const switchedSess = await request("GET", "/api/auth/session", {
        cookie: switchRes.cookie || dpsLogin.cookie,
      });
      report(
        "(g2) Sesi setelah switch menunjuk tenant baru (KSPPS-BINTANG)",
        switchedSess.status === 200 &&
          switchedSess.json &&
          switchedSess.json.data.user.organizationId === "org-kspps-bintang",
        `status=${switchedSess.status}, org=${switchedSess.json?.data?.user?.organizationId}`
      );

      const switchBack = await request("POST", "/api/auth/switch-tenant", {
        cookie: switchRes.cookie || dpsLogin.cookie,
        body: { targetOrganizationId: "org-bprs-albarakah" },
      });
      report(
        "(g3) Switch kembali ke BPRS-ALBARAKAH diterima (200)",
        switchBack.status === 200,
        `status=${switchBack.status}`
      );

      // g4: single-tenant user cannot switch to a tenant they do not belong to
      const foLogin = await request("POST", "/api/auth/login", {
        body: { email: DEMO_USERS.FINANCING_OFFICER.email, password: DEMO_USERS.FINANCING_OFFICER.password },
      });
      const foSwitch = await request("POST", "/api/auth/switch-tenant", {
        cookie: foLogin.cookie,
        body: { targetOrganizationId: "org-kspps-bintang" },
      });
      report(
        "(g4) FINANCING_OFFICER (bukan member KSPPS) ditolak switch tenant (403)",
        foSwitch.status === 403 && !(foSwitch.json && foSwitch.json.success === true),
        `status=${foSwitch.status}`
      );
    }

    // -------------------------------------------------------------------------
    // f. Logout
    // -------------------------------------------------------------------------
    const logout = await request("POST", "/api/auth/logout", { cookie: login.cookie });
    report(
      "(f1) Logout diterima (200)",
      logout.status === 200 && logout.json && logout.json.success === true,
      `status=${logout.status}`
    );

    const cookieCleared =
      logout.setCookies.some((sc) => /sce_auth_session=;/.test(sc)) ||
      logout.setCookies.some((sc) => /sce_auth_session=.*Max-Age=0/i.test(sc)) ||
      logout.setCookies.some((sc) => /sce_auth_session=.*Expires=Thu, 01 Jan 1970/i.test(sc));
    report("(f2) Set-Cookie logout menghapus session cookie", cookieCleared, JSON.stringify(logout.setCookies));

    // f3: after clearing, session request without cookie is rejected again
    const afterLogout = await request("GET", "/api/auth/session");
    report(
      "(f3) Setelah logout (cookie hilang), request ditolak kembali (401)",
      afterLogout.status === 401,
      `status=${afterLogout.status}`
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

run().catch((err) => {
  console.error("[FATAL]", err);
  finish();
});
