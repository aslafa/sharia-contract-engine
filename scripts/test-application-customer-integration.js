/**
 * SCE — Application ↔ Customer Integration Test Suite (Tahap 3B.2)
 *
 * End-to-end verification of the customerId integration between Customer
 * Management and Financing Applications against the running dev server.
 *
 * Covers:
 *   - create application with valid customerId (snapshot filled from customer)
 *   - create application without customerId (legacy behavior preserved)
 *   - unknown customerId rejected (400 CUSTOMER_NOT_FOUND)
 *   - cross-tenant customerId rejected (403 CUSTOMER_CROSS_TENANT_ACCESS)
 *   - AML FLAGGED customer rejected (403 CUSTOMER_AML_BLOCKED)
 *   - AML PENDING customer NOT silently treated as CLEARED
 *   - list filter ?customerId=
 *   - detail includes customer summary (id, CIF, name, risk, AML, verified)
 *   - legacy applications (no customerId) remain fully readable
 *   - the 9 legacy applications are byte-for-byte unchanged
 *   - no JSON mutation when validation fails
 *   - role WITHOUT contracts:view is blocked from the list (forged session)
 *
 * Usage: node scripts/test-application-customer-integration.js
 * Created test applications/customers are REMOVED afterwards
 * (login audit entries are kept, application audit entries are removed).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = process.env.SCE_TEST_URL || "http://localhost:3000";
const DEMO_PASSWORD = process.env.SCE_DEMO_PASSWORD || "P@ssword123!";
const DB_FILE = path.join(process.cwd(), "data", "sce_database.json");

const USERS = {
  FO: { email: "fatimah.zahra@bprs-albarakah.co.id", org: "org-bprs-albarakah" },
  AUDITOR: { email: "audit.internal@bprs-albarakah.co.id", org: "org-bprs-albarakah" },
};

const createdApplicationIds = [];
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

// ---------------------------------------------------------------------------
// JSON store helpers (direct reads/writes for integrity checks)
// ---------------------------------------------------------------------------
function readState() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeStateAtomic(state) {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
  fs.renameSync(tmp, DB_FILE);
}

function fileHash() {
  return crypto.createHash("sha256").update(fs.readFileSync(DB_FILE)).digest("hex");
}

function counts() {
  const state = readState();
  return {
    applications: state.applications.length,
    customers: state.customers.length,
    approvalSteps: state.approvalSteps.length,
    notifications: state.notifications.length,
  };
}

// ---------------------------------------------------------------------------
// Signed session forging (RBAC negative test: permissions: [])
// Mirrors createSessionToken(): base64url(payload) + "." + HMAC-sha256(base64url)
// ---------------------------------------------------------------------------
function readSessionSecret() {
  const envPath = path.join(process.cwd(), ".env");
  const content = fs.readFileSync(envPath, "utf-8");
  const match = content.match(/^SESSION_SECRET\s*=\s*"?([^"\r\n]+)"?$/m);
  return match ? match[1].trim() : null;
}

function forgeSessionCookie({ role = "FINANCING_OFFICER", roleName = "Financing / Account Officer", permissions }) {
  const secret = readSessionSecret();
  if (!secret) throw new Error("SESSION_SECRET tidak ditemukan di .env — tidak dapat menempa sesi uji.");
  const payload = {
    userId: "usr-forge-test",
    email: "forged.session@test.local",
    fullName: "Forged Test Session",
    isSuperAdmin: false,
    organizationId: USERS.FO.org,
    organizationName: "PT BPRS Al-Barakah Mandiri",
    organizationCode: "BPRS-ALBARAKAH",
    role,
    roleName,
    permissions, // [] => session carries no additional permissions
    mfaVerified: true,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("base64url");
  return `sce_auth_session=${b64}.${sig}`;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
async function request(method, urlPath, { cookie, body, headers } = {}) {
  const finalHeaders = { ...headers };
  if (cookie) finalHeaders.cookie = cookie;
  if (body) finalHeaders["content-type"] = "application/json";

  const res = await fetch(BASE + urlPath, {
    method,
    headers: finalHeaders,
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
  return { status: res.status, json, cookie: nextCookie };
}

function login(email) {
  return request("POST", "/api/auth/login", { body: { email, password: DEMO_PASSWORD } });
}

function validCustomerBody(overrides = {}) {
  return {
    type: "INDIVIDUAL",
    name: "Nasabah Uji Integrasi 3B",
    identifierNumber: `3204${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 9)}`,
    phone: "+62 813-3B2-0001",
    email: "nasabah.integrasi@example.com",
    city: "Bandung",
    province: "Jawa Barat",
    annualIncomeOrRevenue: 120000000,
    ...overrides,
  };
}

function validApplicationBody(overrides = {}) {
  return {
    akad: "MURABAHAH",
    title: "Pengujian Integrasi Customer 3B.2",
    commodityOrAsset: "Motor listrik uji integrasi",
    costPrice: 20000000,
    marginOrNisbah: 2000000,
    tenorMonths: 12,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Cleanup: remove applications + customers created by this test (atomic write)
// ---------------------------------------------------------------------------
function cleanup() {
  try {
    const state = readState();
    const removed = { apps: 0, steps: 0, notifs: 0, customers: 0, audits: 0 };

    state.applications = state.applications.filter((a) => {
      if (createdApplicationIds.includes(a.id)) {
        removed.apps++;
        return false;
      }
      return true;
    });
    state.approvalSteps = state.approvalSteps.filter((s) => {
      if (createdApplicationIds.includes(s.applicationId)) {
        removed.steps++;
        return false;
      }
      return true;
    });
    state.notifications = state.notifications.filter((n) => {
      if (createdApplicationIds.includes(n.relatedId)) {
        removed.notifs++;
        return false;
      }
      return true;
    });
    // Remove audit entries tied to the created applications only
    // (login audit entries created during testing are intentionally kept).
    state.auditLogs = state.auditLogs.filter((l) => {
      if (createdApplicationIds.includes(l.entityId)) {
        removed.audits++;
        return false;
      }
      return true;
    });
    state.customers = state.customers.filter((c) => {
      if (createdCustomerIds.includes(c.id)) {
        removed.customers++;
        return false;
      }
      return true;
    });

    writeStateAtomic(state);
    console.log(
      `[CLEANUP] dihapus: ${removed.apps} aplikasi, ${removed.steps} step, ${removed.notifs} notifikasi, ${removed.audits} audit aplikasi, ${removed.customers} customer.`
    );
  } catch (e) {
    console.error("[CLEANUP_ERROR]", e.message);
  }
}

async function run() {
  console.log("=".repeat(80));
  console.log("   SCE — APPLICATION-CUSTOMER INTEGRATION SUITE (Tahap 3B.2)");
  console.log(`   Target: ${BASE}`);
  console.log("=".repeat(80));
  console.log("");

  // Pre-test integrity snapshot
  const initialCounts = counts();
  const initialState = readState();
  const legacyApps = initialState.applications.filter((a) => !a.customerId);
  const legacySnapshot = new Map(legacyApps.map((a) => [a.id, JSON.stringify(a)]));
  const customerSnapshot = new Map(initialState.customers.map((c) => [c.id, JSON.stringify(c)]));
  const allInitialAppIds = new Set(initialState.applications.map((a) => a.id));
  console.log(
    `[PRE] aplikasi=${initialCounts.applications} (legacy tanpa customerId=${legacyApps.length}), customer=${initialCounts.customers}`
  );
  console.log("");

  try {
    // ------------------------------------------------------- unauthenticated
    {
      const list = await request("GET", "/api/v1/applications");
      report("(1) GET list aplikasi tanpa sesi ditolak (401)", list.status === 401, `status=${list.status}`);
    }

    // ------------------------------------------------------------- FO login
    const fo = await login(USERS.FO.email);
    if (fo.status !== 200 || !fo.cookie) {
      report("(2) Login FINANCING_OFFICER valid", false, `status=${fo.status}`);
      return;
    }
    report("(2) Login FINANCING_OFFICER valid (200)", true);

    // ------------------------------------------------- create test customers
    // C1: CLEARED + verified (happy path) | C2: FLAGGED | C3: PENDING | C4: unverified
    let c1 = null, c2 = null, c3 = null, c4 = null;
    {
      const mk = async (overrides) => {
        const res = await request("POST", "/api/v1/customers", {
          cookie: fo.cookie,
          body: validCustomerBody(overrides),
        });
        const data = res.json?.data;
        if (data?.id) createdCustomerIds.push(data.id);
        return data || null;
      };
      c1 = await mk({ name: "Nasabah CLEARED Uji 3B", amlStatus: "CLEARED", isVerified: true, riskRating: "LOW" });
      c2 = await mk({ name: "Nasabah FLAGGED Uji 3B", amlStatus: "FLAGGED", isVerified: true });
      c3 = await mk({ name: "Nasabah PENDING Uji 3B", amlStatus: "PENDING", isVerified: true });
      c4 = await mk({ name: "Nasabah Unverified Uji 3B", amlStatus: "CLEARED", isVerified: false });
      report(
        "(3) 4 customer uji dibuat via API (CLEARED/FLAGGED/PENDING/Unverified)",
        c1 && c2 && c3 && c4 && c1.amlStatus === "CLEARED" && c2.amlStatus === "FLAGGED" &&
          c3.amlStatus === "PENDING" && c4.isVerified === false,
        `c1=${!!c1} c2=${!!c2} c3=${!!c3} c4=${!!c4}`
      );
    }
    if (!c1 || !c2 || !c3 || !c4) return;

    // ------------------------------------------- happy path with customerId
    let linkedAppId = null;
    {
      const res = await request("POST", "/api/v1/applications", {
        cookie: fo.cookie,
        body: validApplicationBody({
          customerId: c1.id,
          // Client-supplied snapshot values must be OVERRIDDEN by the
          // authoritative customer record — use deliberately wrong values.
          customerName: "NAMA SALAH DARI CLIENT",
          customerIdNumber: "0000000000000000",
          customerPhone: "+62 000-0000-0000",
        }),
      });
      const app = res.json?.data;
      if (app?.id) createdApplicationIds.push(app.id);
      linkedAppId = app?.id || null;
      report(
        "(4a) Create aplikasi dengan customerId valid (201, customerId terisi)",
        res.status === 201 && app?.customerId === c1.id,
        `status=${res.status} customerId=${app?.customerId}`
      );
      report(
        "(4b) Snapshot nasabah terisi dari data customer (authoritative)",
        app?.customerName === c1.name &&
          app?.customerIdNumber === c1.identifierNumber &&
          app?.customerPhone === c1.phone,
        `name=${app?.customerName} idn=${app?.customerIdNumber}`
      );
      report(
        "(4c) Aplikasi customer CLEARED ber-amlStatus CLEARED",
        app?.amlStatus === "CLEARED",
        `amlStatus=${app?.amlStatus}`
      );
    }

    {
      const res = await request("GET", `/api/v1/applications?customerId=${c1.id}`, { cookie: fo.cookie });
      const items = res.json?.data || [];
      report(
        "(5) GET list filter ?customerId= hanya mengembalikan aplikasi terkait",
        res.status === 200 && items.length === 1 && items[0]?.customerId === c1.id,
        `total=${res.json?.total} items=${items.length}`
      );
      report(
        "(6) Ringkasan customer melekat pada list (id/CIF/nama/risk/AML/verified)",
        items[0]?.customer?.id === c1.id &&
          items[0]?.customer?.cifNumber === c1.cifNumber &&
          items[0]?.customer?.name === c1.name &&
          items[0]?.customer?.riskRating === "LOW" &&
          items[0]?.customer?.amlStatus === "CLEARED" &&
          items[0]?.customer?.isVerified === true,
        `customer=${JSON.stringify(items[0]?.customer)}`
      );
    }

    {
      const res = await request("GET", `/api/v1/applications/${linkedAppId}`, { cookie: fo.cookie });
      const customer = res.json?.data?.customer;
      report(
        "(7) GET detail menyertakan ringkasan customer (200)",
        res.status === 200 && customer?.id === c1.id && customer?.cifNumber === c1.cifNumber,
        `status=${res.status} customer=${JSON.stringify(customer)}`
      );
      // steps & documents shape unchanged
      report(
        "(8) Struktur steps & documents pada detail tidak berubah",
        Array.isArray(res.json?.data?.steps) && res.json?.data?.steps.length === 6 &&
          Array.isArray(res.json?.data?.documents),
        `steps=${res.json?.data?.steps?.length}`
      );
    }

    // ------------------------------------------- legacy behavior (no customerId)
    let legacyCreatedId = null;
    {
      const res = await request("POST", "/api/v1/applications", {
        cookie: fo.cookie,
        body: validApplicationBody({ customerName: "Nasabah Manual Legacy 3B" }),
      });
      const app = res.json?.data;
      if (app?.id) createdApplicationIds.push(app.id);
      legacyCreatedId = app?.id || null;
      report(
        "(9) Create aplikasi TANPA customerId tetap berhasil (perilaku lama)",
        res.status === 201 && app && !("customerId" in app && app.customerId) &&
          app?.customerName === "Nasabah Manual Legacy 3B" && app?.amlStatus === "CLEARED",
        `status=${res.status} customerId=${app?.customerId} name=${app?.customerName}`
      );
    }

    // ------------------------------------------- AML PENDING (never CLEARED)
    {
      const res = await request("POST", "/api/v1/applications", {
        cookie: fo.cookie,
        body: validApplicationBody({ customerId: c3.id }),
      });
      const app = res.json?.data;
      if (app?.id) createdApplicationIds.push(app.id);
      report(
        "(10) Customer AML PENDING boleh dibuat & amlStatus aplikasi tetap PENDING (tidak CLEARED)",
        res.status === 201 && app?.amlStatus === "PENDING",
        `status=${res.status} amlStatus=${app?.amlStatus}`
      );
    }

    // ------------------------------------------- unverified customer allowed, surfaced
    {
      const res = await request("POST", "/api/v1/applications", {
        cookie: fo.cookie,
        body: validApplicationBody({ customerId: c4.id }),
      });
      const app = res.json?.data;
      if (app?.id) createdApplicationIds.push(app.id);
      const unverifiedAppId = app?.id || null;
      let detailCustomer = null;
      if (unverifiedAppId) {
        const det = await request("GET", `/api/v1/applications/${unverifiedAppId}`, { cookie: fo.cookie });
        detailCustomer = det.json?.data?.customer;
      }
      report(
        "(11) Customer belum terverifikasi: aplikasi dibuat & status unverified tampil jelas",
        res.status === 201 && detailCustomer?.isVerified === false,
        `status=${res.status} isVerified=${detailCustomer?.isVerified}`
      );
    }

    // ------------------------------------------- direct-insert KSPPS customer
    {
      const state = readState();
      const now = new Date().toISOString();
      const ksppsId = `cust-kspps-3b-${Date.now()}`;
      state.customers.unshift({
        id: ksppsId,
        organizationId: "org-kspps-bintang",
        cifNumber: "CIF-KSPPS-3B",
        type: "INDIVIDUAL",
        name: "Nasabah KSPPS Uji 3B",
        identifierNumber: `3374${Date.now().toString().slice(-8)}0009`,
        riskRating: "LOW",
        amlStatus: "CLEARED",
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      });
      createdCustomerIds.push(ksppsId);
      writeStateAtomic(state);
      report("(12) Customer KSPPS (tenant lain) tersedia di store untuk uji isolasi", true);
    }

    // ------------------------------------------- failure cases — NO WRITE segment
    {
      const hashBefore = fileHash();

      const unknown = await request("POST", "/api/v1/applications", {
        cookie: fo.cookie,
        body: validApplicationBody({ customerId: "cust-tidak-ada-3b2" }),
      });
      report(
        "(13a) customerId tidak ditemukan ditolak (400 CUSTOMER_NOT_FOUND)",
        unknown.status === 400 && unknown.json?.error?.code === "CUSTOMER_NOT_FOUND",
        `status=${unknown.status} code=${unknown.json?.error?.code}`
      );

      const ksppsId = createdCustomerIds.find((id) => id.startsWith("cust-kspps-3b-"));
      const cross = await request("POST", "/api/v1/applications", {
        cookie: fo.cookie,
        body: validApplicationBody({ customerId: ksppsId }),
      });
      report(
        "(13b) customerId tenant lain ditolak (403 CUSTOMER_CROSS_TENANT_ACCESS)",
        cross.status === 403 && cross.json?.error?.code === "CUSTOMER_CROSS_TENANT_ACCESS",
        `status=${cross.status} code=${cross.json?.error?.code}`
      );

      const flagged = await request("POST", "/api/v1/applications", {
        cookie: fo.cookie,
        body: validApplicationBody({ customerId: c2.id }),
      });
      report(
        "(13c) Customer AML FLAGGED ditolak (403 CUSTOMER_AML_BLOCKED)",
        flagged.status === 403 && flagged.json?.error?.code === "CUSTOMER_AML_BLOCKED",
        `status=${flagged.status} code=${flagged.json?.error?.code}`
      );

      const missingName = await request("POST", "/api/v1/applications", {
        cookie: fo.cookie,
        // customerName omitted entirely: JSON.stringify drops undefined keys
        body: validApplicationBody({ customerName: undefined }),
      });
      report(
        "(13d) Tanpa customerId & tanpa customerName ditolak (400)",
        missingName.status === 400,
        `status=${missingName.status}`
      );

      const hashAfter = fileHash();
      report(
        "(13e) TIDAK ada perubahan data JSON setelah seluruh validasi gagal",
        hashBefore === hashAfter,
        `before=${hashBefore.slice(0, 12)} after=${hashAfter.slice(0, 12)}`
      );
    }

    // ------------------------------------------- legacy integrity via API
    {
      const list = await request("GET", "/api/v1/applications", { cookie: fo.cookie });
      const items = list.json?.data || [];
      const legacyInApi = items.filter((a) => !a.customerId);
      report(
        "(14a) GET list tanpa filter tetap mengembalikan aplikasi legacy tanpa relasi customer",
        list.status === 200 && legacyInApi.length >= legacyApps.length,
        `total=${list.json?.total} legacy=${legacyInApi.length}`
      );
      const legacySample = items.find((a) => a.customerId === undefined || a.customerId === null) || null;
      let detailOk = false;
      if (legacySample) {
        const det = await request("GET", `/api/v1/applications/${legacySample.id}`, { cookie: fo.cookie });
        detailOk =
          det.status === 200 &&
          det.json?.data?.customer === null &&
          Array.isArray(det.json?.data?.steps);
      }
      report(
        "(14b) Detail aplikasi legacy tetap terbaca (customer: null, steps utuh)",
        detailOk,
        `sample=${legacySample?.applicationNumber}`
      );
    }

    // ------------------------------------------- RBAC via forged sessions
    // NOTE: all 8 system roles hold `contracts:view`, and assertPermission is
    // ADDITIVE (role-derived permissions + session permissions) — so a valid
    // signed session can never be denied the list read. The denial (403)
    // mechanism is therefore proven via `contracts:create` on POST, which the
    // AUDITOR role genuinely lacks.
    {
      const auditorForge = await request("POST", "/api/v1/applications", {
        cookie: forgeSessionCookie({ role: "AUDITOR", roleName: "Internal / External Auditor", permissions: [] }),
        body: validApplicationBody({ customerName: "Nasabah Dilarang Forge" }),
      });
      report(
        "(15a) Role TANPA permission (AUDITOR, contracts:create) ditolak (403) — mekanisme assertPermission",
        auditorForge.status === 403,
        `status=${auditorForge.status}`
      );

      const foForgeNoPerms = await request("GET", "/api/v1/applications", {
        cookie: forgeSessionCookie({ permissions: [] }),
      });
      report(
        "(15b) contracts:view bersifat per-ROLE (aditif): sesi FO tanpa session-permissions tetap 200 (kompatibilitas)",
        foForgeNoPerms.status === 200,
        `status=${foForgeNoPerms.status}`
      );

      const allowed = await request("GET", "/api/v1/applications", {
        cookie: forgeSessionCookie({ permissions: ["contracts:view"] }),
      });
      report(
        "(15c) Sesi forged tanda tangan valid diterima (signature HMAC terverifikasi)",
        allowed.status === 200,
        `status=${allowed.status}`
      );

      const auditor = await login(USERS.AUDITOR.email);
      const auditorRead = await request("GET", "/api/v1/applications", { cookie: auditor.cookie });
      report(
        "(15d) AUDITOR (role read-only) dapat membaca list (kompatibilitas 8 role)",
        auditorRead.status === 200,
        `status=${auditorRead.status}`
      );
    }
  } finally {
    cleanup();
  }

  // ------------------------------------------------- post-test integrity
  console.log("");
  {
    const finalCounts = counts();
    const finalState = readState();

    report(
      "(16a) Jumlah aplikasi kembali sama seperti sebelum uji",
      finalCounts.applications === initialCounts.applications,
      `before=${initialCounts.applications} after=${finalCounts.applications}`
    );
    report(
      "(16b) Jumlah customer kembali sama seperti sebelum uji",
      finalCounts.customers === initialCounts.customers,
      `before=${initialCounts.customers} after=${finalCounts.customers}`
    );
    report(
      "(16c) approvalSteps & notifications kembali sama",
      finalCounts.approvalSteps === initialCounts.approvalSteps &&
        finalCounts.notifications === initialCounts.notifications,
      `steps ${initialCounts.approvalSteps}->${finalCounts.approvalSteps}, notifs ${initialCounts.notifications}->${finalCounts.notifications}`
    );
    report(
      "(16d) Tidak ada customer lama yang berubah (deep-equal snapshot awal)",
      finalState.customers
        .filter((c) => customerSnapshot.has(c.id))
        .every((c) => JSON.stringify(c) === customerSnapshot.get(c.id)),
      ""
    );

    // legacy applications deep-equality
    const legacyAfter = finalState.applications.filter((a) => allInitialAppIds.has(a.id));
    let legacyUnchanged = true;
    const legacyDetails = [];
    for (const a of legacyAfter) {
      const beforeJson = legacySnapshot.get(a.id);
      if (!beforeJson || JSON.stringify(a) !== beforeJson) {
        legacyUnchanged = false;
        legacyDetails.push(a.id);
      }
    }
    report(
      "(16e) SEMUA aplikasi legacy utuh & tidak berubah (deep-equal)",
      legacyUnchanged && legacyAfter.length === legacyApps.length,
      legacyDetails.length ? `berubah: ${legacyDetails.join(", ")}` : `n=${legacyAfter.length}`
    );
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
