/**
 * SCE — Customer Management API Test Suite (Tahap 3A)
 *
 * End-to-end verification of /api/v1/customers against the running dev server.
 * Covers: valid create, list, detail, update, RBAC, cross-tenant isolation,
 * invalid input, duplicate identifier, and unauthenticated access.
 *
 * Usage: node scripts/test-customer-management.js
 * Created test customers are REMOVED afterwards (audit logs are kept).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = process.env.SCE_TEST_URL || "http://localhost:3000";
const DEMO_PASSWORD = process.env.SCE_DEMO_PASSWORD || "P@ssword123!";

const USERS = {
  FO: { email: "fatimah.zahra@bprs-albarakah.co.id", org: "org-bprs-albarakah" },
  AUDITOR: { email: "audit.internal@bprs-albarakah.co.id", org: "org-bprs-albarakah" },
  DPS: { email: "kh.ridwan.mansur@dps-mui.id", org: "org-bprs-albarakah" },
};

const createdCustomerIds = [];

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

  const res = await fetch(BASE + urlPath, { method, headers, body: body ? JSON.stringify(body) : undefined });
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
  return { status: res.status, json, cookie: nextCookie };
}

function login(email) {
  return request("POST", "/api/auth/login", { body: { email, password: DEMO_PASSWORD } });
}

function validCustomerBody(overrides = {}) {
  return {
    type: "INDIVIDUAL",
    name: "Nasabah Uji Tahap 3A",
    identifierNumber: `3204${Date.now().toString().slice(-8)}0001`, // NIK-like, unique per run
    phone: "+62 812-0000-1234",
    email: "nasabah.uji@example.com",
    city: "Bandung",
    province: "Jawa Barat",
    annualIncomeOrRevenue: 96000000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Cleanup: remove customers created by this test (atomic write pattern)
// ---------------------------------------------------------------------------
function cleanup() {
  if (createdCustomerIds.length === 0) return;
  const DB_FILE = path.join(process.cwd(), "data", "sce_database.json");
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const state = JSON.parse(raw);
    const before = state.customers.length;
    state.customers = state.customers.filter((c) => !createdCustomerIds.includes(c.id));
    if (state.customers.length !== before) {
      const tmp = DB_FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
      fs.renameSync(tmp, DB_FILE);
      console.log(`[CLEANUP] ${before - state.customers.length} customer uji dihapus (audit log dipertahankan).`);
    }
  } catch (e) {
    console.error("[CLEANUP_ERROR]", e.message);
  }
}

async function run() {
  console.log("=".repeat(80));
  console.log("   SCE — CUSTOMER MANAGEMENT API SUITE (Tahap 3A)");
  console.log(`   Target: ${BASE}`);
  console.log("=".repeat(80));
  console.log("");

  try {
    // ------------------------------------------------------- unauthenticated
    {
      const list = await request("GET", "/api/v1/customers");
      report("(1a) GET list tanpa sesi ditolak (401)", list.status === 401, `status=${list.status}`);

      const create = await request("POST", "/api/v1/customers", { body: validCustomerBody() });
      report("(1b) POST tanpa sesi ditolak (401)", create.status === 401, `status=${create.status}`);

      const detail = await request("GET", "/api/v1/customers/cust-xyz");
      report("(1c) GET detail tanpa sesi ditolak (401)", detail.status === 401, `status=${detail.status}`);
    }

    // ------------------------------------------------------------- FO happy path
    const fo = await login(USERS.FO.email);
    if (fo.status !== 200 || !fo.cookie) {
      report("(2) Login FINANCING_OFFICER valid", false, `status=${fo.status}`);
      return;
    }
    report("(2) Login FINANCING_OFFICER valid (200)", true);

    let createdId = null;
    let ksppsCustomerId = null;
    {
      const res = await request("POST", "/api/v1/customers", {
        cookie: fo.cookie,
        body: validCustomerBody(),
      });
      const data = res.json?.data;
      createdId = data?.id || null;
      if (createdId) createdCustomerIds.push(createdId);
      report(
        "(3a) Create customer valid (201, orgId dari sesi)",
        res.status === 201 &&
          data?.organizationId === USERS.FO.org &&
          typeof data?.cifNumber === "string",
        `status=${res.status} org=${data?.organizationId}`
      );
    }

    {
      // duplicate identifier in same organization
      const dupBody = validCustomerBody();
      const first = await request("POST", "/api/v1/customers", { cookie: fo.cookie, body: dupBody });
      if (first.json?.data?.id) createdCustomerIds.push(first.json.data.id);
      const dup = await request("POST", "/api/v1/customers", { cookie: fo.cookie, body: dupBody });
      if (dup.json?.data?.id) createdCustomerIds.push(dup.json.data.id);
      report(
        "(3b) Duplikasi identifierNumber dalam organisasi sama ditolak (409)",
        first.status === 201 && dup.status === 409,
        `first=${first.status} dup=${dup.status}`
      );
    }

    {
      const res = await request("GET", "/api/v1/customers?search=Nasabah Uji Tahap", { cookie: fo.cookie });
      const items = res.json?.data || [];
      const found = items.find((c) => c.id === createdId);
      report(
        "(4a) List customer berisi customer baru (search nama)",
        res.status === 200 && found,
        `total=${res.json?.total}`
      );
      report(
        "(4b) identifierNumber TERMASK di list view (tidak tampil penuh)",
        found &&
          typeof found.identifierNumber === "string" &&
          found.identifierNumber.includes("*") &&
          !found.identifierNumber.startsWith("3204"),
        `masked=${found?.identifierNumber}`
      );
      report("(4c) Customer tenant lain tidak muncul di list FO", !items.some((c) => c.organizationId !== USERS.FO.org));
    }

    {
      const res = await request("GET", `/api/v1/customers/${createdId}`, { cookie: fo.cookie });
      report(
        "(5) Detail customer ditemukan (200, identifier penuh di detail)",
        res.status === 200 && res.json?.data?.id === createdId && res.json?.data?.identifierNumber.startsWith("3204"),
        `status=${res.status}`
      );
    }

    {
      const res = await request("PATCH", `/api/v1/customers/${createdId}`, {
        cookie: fo.cookie,
        body: { phone: "+62 812-9999-8888", amlStatus: "PENDING", isVerified: true },
      });
      const data = res.json?.data;
      report(
        "(6a) Update customer valid (200, field berubah)",
        res.status === 200 &&
          data?.phone === "+62 812-9999-8888" &&
          data?.amlStatus === "PENDING" &&
          data?.isVerified === true,
        `status=${res.status}`
      );

      // status change helper path via PATCH again (risk rating)
      const res2 = await request("PATCH", `/api/v1/customers/${createdId}`, {
        cookie: fo.cookie,
        body: { riskRating: "MEDIUM" },
      });
      report(
        "(6b) Perubahan status/risk rating didukung model (200)",
        res2.status === 200 && res2.json?.data?.riskRating === "MEDIUM"
      );
    }

    {
      const invalidPayloads = [
        { name: "A" }, // name too short
        { email: "bukan-email" }, // invalid email
        { identifierNumber: "AB" }, // too short identifier
        { amlStatus: "SUSPECT" }, // invalid enum
      ];
      let allRejected = true;
      const details = [];
      for (const patch of invalidPayloads) {
        const res = await request("PATCH", `/api/v1/customers/${createdId}`, {
          cookie: fo.cookie,
          body: patch,
        });
        if (res.status !== 400) {
          allRejected = false;
          details.push(`${JSON.stringify(patch)} -> ${res.status}`);
        }
      }
      const badCreate = await request("POST", "/api/v1/customers", {
        cookie: fo.cookie,
        body: validCustomerBody({ name: "X", email: "salah@format" }),
      });
      report(
        "(7) Input tidak valid ditolak 400 (PATCH & POST)",
        allRejected && badCreate.status === 400,
        `details=[${details.join("; ")}] badCreate=${badCreate.status}`
      );
    }

    // ------------------------------------------------------------- RBAC
    {
      const auditor = await login(USERS.AUDITOR.email);
      const readRes = await request("GET", "/api/v1/customers", { cookie: auditor.cookie });
      const createRes = await request("POST", "/api/v1/customers", {
        cookie: auditor.cookie,
        body: validCustomerBody(),
      });
      if (createRes.json?.data?.id) createdCustomerIds.push(createRes.json.data.id);
      report(
        "(8) RBAC: Auditor boleh LIHAT (200) tapi tidak boleh CREATE (403)",
        readRes.status === 200 && createRes.status === 403,
        `read=${readRes.status} create=${createRes.status}`
      );
    }

    // ------------------------------------------------------- cross-tenant
    {
      // The only demo members of KSPPS are DPS and Auditor (both intentionally
      // read-only for customers). To test cross-tenant protection, insert a
      // KSPPS customer directly into the store, then verify FO (BPRS tenant)
      // cannot read or modify it.
      const DB_FILE = path.join(process.cwd(), "data", "sce_database.json");
      const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      raw.customers = raw.customers || [];
      const now = new Date().toISOString();
      ksppsCustomerId = `cust-kspps-test-${Date.now()}`;
      raw.customers.unshift({
        id: ksppsCustomerId,
        organizationId: "org-kspps-bintang",
        cifNumber: "CIF-KSPPS-TEST",
        type: "INDIVIDUAL",
        name: "Nasabah KSPPS Uji",
        identifierNumber: `3374${Date.now().toString().slice(-8)}0009`,
        riskRating: "LOW",
        amlStatus: "CLEARED",
        isVerified: false,
        createdAt: now,
        updatedAt: now,
      });
      createdCustomerIds.push(ksppsCustomerId);
      const tmp = DB_FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(raw, null, 2), "utf-8");
      fs.renameSync(tmp, DB_FILE);
      report("(9a) Customer KSPPS tersedia di store (dibuat langsung untuk uji isolasi)", true);

      // FO (org BPRS) attempts to read & modify KSPPS customer
      const crossGet = await request("GET", `/api/v1/customers/${ksppsCustomerId}`, { cookie: fo.cookie });
      const crossPatch = await request("PATCH", `/api/v1/customers/${ksppsCustomerId}`, {
        cookie: fo.cookie,
        body: { name: "Percobaan Ambil Alih" },
      });
      report(
        "(9b) FO tenant BPRS dibaca customer KSPPS ditolak (403)",
        crossGet.status === 403,
        `status=${crossGet.status}`
      );
      report(
        "(9c) FO tenant BPRS memodifikasi customer KSPPS ditolak (403)",
        crossPatch.status === 403,
        `status=${crossPatch.status}`
      );

      // FO list must not contain the KSPPS customer
      const foList = await request("GET", "/api/v1/customers", { cookie: fo.cookie });
      report(
        "(9d) List FO tidak memuat customer tenant lain",
        !(foList.json?.data || []).some((c) => c.id === ksppsCustomerId)
      );

      // spoof attempt: FO passes x-organization-id header of KSPPS
      const spoofHeaders = { cookie: fo.cookie, "x-organization-id": "org-kspps-bintang" };
      const spoofRes = await fetch(BASE + "/api/v1/customers?search=Nasabah", {
        headers: spoofHeaders,
      });
      let spoofBlocked = spoofRes.status === 403;
      let spoofJson = null;
      try {
        spoofJson = await spoofRes.json();
      } catch {}
      if (spoofJson?.data) {
        spoofBlocked = spoofBlocked && !spoofJson.data.some((c) => c.id === ksppsCustomerId);
      }
      report("(9e) Spoofing header x-organization-id ditolak (403/terisolasi)", spoofBlocked, `status=${spoofRes.status}`);
    }

    // ------------------------------------------------------- 404 handling
    {
      const res = await request("GET", "/api/v1/customers/cust-tidak-ada-123", { cookie: fo.cookie });
      report("(10) Detail customer tidak ada -> 404", res.status === 404, `status=${res.status}`);
    }
  } finally {
    cleanup();
  }

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
  cleanup();
  process.exit(1);
});
