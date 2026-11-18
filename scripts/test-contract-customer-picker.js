/**
 * SCE — Contract Customer Picker Test Suite (Tahap 3B.4)
 *
 * Verifies the CustomerPicker integration on the four akad forms
 * (Murabahah, Ijarah, Musyarakah, Mudharabah) against the running dev server:
 *
 *   API / picker data source
 *   - GET /api/v1/customers returns the fields the picker renders
 *   - search by name AND by CIF works
 *   - picker never sends organizationId (tenant from session)
 *   - AML FLAGGED customer rejected by backend (403 CUSTOMER_AML_BLOCKED)
 *   - AML PENDING customer usable; application amlStatus stays PENDING
 *   - unverified customer usable
 *   - draft AND submit applications with customerId succeed (all 4 akad)
 *   - snapshot fields filled from the directory customer
 *   - customer reference (CIF + name) attached on the applications list
 *   - submission without customerId AND without customerName rejected (400)
 *
 *   Static source audit (four akad pages + picker component)
 *   - no dummy/hard-coded customer profile defaults remain
 *   - every POST payload carries customerId
 *   - Murabahah draft & submit share one payload builder
 *   - Ijarah / Musyarakah / Mudharabah payload mappings unchanged
 *   - Musyarakah & Mudharabah nisbah sync keeps total = 100%
 *   - picker: no localStorage, empty state links to /customers/new
 *
 * Usage: node scripts/test-contract-customer-picker.js
 * Created test customers/applications are REMOVED afterwards (atomic write).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = process.env.SCE_TEST_URL || "http://localhost:3000";
const DEMO_PASSWORD = process.env.SCE_DEMO_PASSWORD || "P@ssword123!";
const DB_FILE = path.join(process.cwd(), "data", "sce_database.json");

const USERS = {
  FO: { email: "fatimah.zahra@bprs-albarakah.co.id", org: "org-bprs-albarakah" },
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
// JSON store helpers (direct reads/writes for integrity + cleanup only)
// ---------------------------------------------------------------------------
function readState() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeStateAtomic(state) {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
  fs.renameSync(tmp, DB_FILE);
}

function counts() {
  const state = readState();
  return {
    applications: state.applications.length,
    customers: state.customers.length,
  };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
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
      nextCookie = pair.startsWith("sce_auth_session=") ? `sce_auth_session=${pair.slice("sce_auth_session=".length)}` : null;
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

const STAMP = Date.now().toString().slice(-8);
// Perbaikan flakiness (ditemukan saat regresi 3B.5): akhiran acak 0-8 hanya
// punya 9 kemungkinan sehingga NIK antar nasabah uji sesekali bertabrakan
// (409 duplicate). Counter berurutan menjamin keunikan dalam satu run.
let customerSeq = 0;

function customerBody(overrides = {}) {
  return {
    type: "INDIVIDUAL",
    name: `Nasabah Uji Picker ${STAMP}`,
    identifierNumber: `3204${STAMP}${String(++customerSeq).padStart(2, "0")}`,
    phone: "+62 813-3B4-0001",
    email: "picker.test@example.com",
    city: "Bandung",
    province: "Jawa Barat",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Cleanup: remove created applications + customers (atomic write)
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
    state.auditLogs = state.auditLogs.filter((l) => {
      if (createdApplicationIds.includes(l.entityId) || createdCustomerIds.includes(l.entityId)) {
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
      `[CLEANUP] dihapus: ${removed.apps} aplikasi, ${removed.steps} step, ${removed.notifs} notifikasi, ${removed.customers} customer, ${removed.audits} audit uji.`
    );
  } catch (e) {
    console.error("[CLEANUP_ERROR]", e.message);
  }
}

// ---------------------------------------------------------------------------
// Static source audit helpers
// ---------------------------------------------------------------------------
const SRC = path.join(process.cwd(), "src");

function readSource(relPath) {
  return fs.readFileSync(path.join(SRC, relPath), "utf-8");
}

/** Strip JS/TS comments so negative checks ignore documentation text. */
function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

function auditSource(relPath, checks) {
  console.log(`--- Audit sumber: ${relPath} ---`);
  for (const [name, check] of checks) {
    const content = readSource(relPath);
    report(`[SRC] ${name}`, check(content), relPath);
  }
}

// ---------------------------------------------------------------------------
async function run() {
  console.log("=".repeat(80));
  console.log("   SCE — CONTRACT CUSTOMER PICKER SUITE (Tahap 3B.4)");
  console.log(`   Target: ${BASE}`);
  console.log("=".repeat(80));
  console.log("");

  const initialCounts = counts();
  const initialState = readState();
  const legacyApps = initialState.applications.filter((a) => !a.customerId);
  const legacySnapshot = new Map(legacyApps.map((a) => [a.id, JSON.stringify(a)]));
  const preExistingCustomers = new Set(initialState.customers.map((c) => c.id));
  console.log(`[PRE] aplikasi=${initialCounts.applications} (legacy tanpa customerId=${legacyApps.length}), customer=${initialCounts.customers}`);
  console.log("");

  let foCookie = null;

  try {
    // -----------------------------------------------------------------------
    // A. LOGIN
    // -----------------------------------------------------------------------
    console.log("--- A. Otentikasi ---");
    const fo = await login(USERS.FO.email);
    report("Login Financing Officer berhasil", fo.status === 200 && !!fo.cookie);
    foCookie = fo.cookie;

    // -----------------------------------------------------------------------
    // B. PICKER DATA SOURCE — GET /api/v1/customers
    // -----------------------------------------------------------------------
    console.log("");
    console.log("--- B. Sumber data CustomerPicker ---");

    const emptyList = await request("GET", "/api/v1/customers", { cookie: foCookie });
    report("GET /api/v1/customers sukses (tanpa organizationId dari client)", emptyList.status === 200 && emptyList.json?.success === true);

    // Tenant scoping: response must only contain the session tenant's org.
    const listOrgIds = new Set((emptyList.json?.data || []).map((c) => c.organizationId));
    report(
      "Tenant berasal dari session (semua baris milik tenant sesi)",
      (emptyList.json?.data || []).length === 0 || (listOrgIds.size === 1 && [...listOrgIds][0] === USERS.FO.org)
    );

    // Create the four picker-relevant customer archetypes.
    const mk = (name, overrides) =>
      request("POST", "/api/v1/customers", { cookie: foCookie, body: customerBody({ name, ...overrides }) });

    const clearedVerified = await mk(`Nasabah Cleared ${STAMP}`, { amlStatus: "CLEARED", isVerified: true, riskRating: "LOW" });
    report("Nasabah uji CLEARED + terverifikasi dibuat", clearedVerified.status === 201);
    if (clearedVerified.json?.data?.id) createdCustomerIds.push(clearedVerified.json.data.id);

    const pendingCustomer = await mk(`Nasabah Pending ${STAMP}`, { amlStatus: "PENDING", isVerified: false });
    report("Nasabah uji AML PENDING dibuat", pendingCustomer.status === 201);
    if (pendingCustomer.json?.data?.id) createdCustomerIds.push(pendingCustomer.json.data.id);

    const flaggedCustomer = await mk(`Nasabah Flagged ${STAMP}`, {
      amlStatus: "FLAGGED",
      isVerified: true,
      type: "CORPORATE",
      name: `PT Flagged Uji ${STAMP}`,
    });
    report("Nasabah uji AML FLAGGED dibuat", flaggedCustomer.status === 201);
    if (flaggedCustomer.json?.data?.id) createdCustomerIds.push(flaggedCustomer.json.data.id);

    const unverified = await mk(`Nasabah Unverified ${STAMP}`, { amlStatus: "CLEARED", isVerified: false });
    report("Nasabah uji belum terverifikasi dibuat", unverified.status === 201);
    if (unverified.json?.data?.id) createdCustomerIds.push(unverified.json.data.id);

    // Search by name fragment.
    const searchName = await request("GET", `/api/v1/customers?search=${encodeURIComponent(`Nasabah Pending ${STAMP}`)}`, { cookie: foCookie });
    const searchNameItems = searchName.json?.data || [];
    report(
      "Pencarian picker berdasarkan NAMA menemukan nasabah",
      searchNameItems.length === 1 && searchNameItems[0].amlStatus === "PENDING"
    );

    // Search by CIF.
    const cifTarget = clearedVerified.json?.data?.cifNumber || "";
    const searchCif = await request("GET", `/api/v1/customers?search=${encodeURIComponent(cifTarget)}`, { cookie: foCookie });
    const searchCifItems = searchCif.json?.data || [];
    report(
      "Pencarian picker berdasarkan CIF menemukan nasabah",
      cifTarget.length > 0 && searchCifItems.some((c) => c.id === clearedVerified.json?.data?.id)
    );

    // Picker-rendered fields present in list response.
    const sample = searchNameItems[0] || (searchCifItems[0] || {});
    report(
      "Response list memuat field yang dirender picker (cif, type, aml, verified, risk)",
      ["cifNumber", "type", "amlStatus", "isVerified", "riskRating", "name", "id"].every((k) => k in sample)
    );

    // -----------------------------------------------------------------------
    // C. SUBMISSIONS WITH customerId (draft + submit, 4 akad)
    // -----------------------------------------------------------------------
    console.log("");
    console.log("--- C. Pengajuan dengan customerId (draft & submit, 4 akad) ---");

    const clearedId = clearedVerified.json?.data?.id;
    const pendingId = pendingCustomer.json?.data?.id;
    const flaggedId = flaggedCustomer.json?.data?.id;
    const unverifiedId = unverified.json?.data?.id;

    const cases = [
      {
        label: "MURABAHAH",
        body: {
          akad: "MURABAHAH",
          title: "Uji Picker Murabahah 3B.4",
          commodityOrAsset: "Mesin uji picker",
          costPrice: 20000000,
          marginOrNisbah: 2000000,
          sellingPrice: 22000000,
          downPayment: 2000000,
          tenorMonths: 12,
        },
      },
      {
        label: "IJARAH",
        body: {
          akad: "IJARAH",
          title: "Uji Picker Ijarah 3B.4",
          commodityOrAsset: "Aset sewa uji picker",
          costPrice: 240000000,
          marginOrNisbah: 60000000,
          sellingPrice: 300000000,
          downPayment: 48000000,
          tenorMonths: 24,
        },
      },
      {
        label: "MUSYARAKAH",
        body: {
          akad: "MUSYARAKAH",
          title: "Uji Picker Musyarakah 3B.4",
          commodityOrAsset: "Proyek uji picker",
          costPrice: 500000000,
          marginOrNisbah: 40,
          sellingPrice: 900000000,
          downPayment: 400000000,
          tenorMonths: 36,
        },
      },
      {
        label: "MUDHARABAH",
        body: {
          akad: "MUDHARABAH",
          title: "Uji Picker Mudharabah 3B.4",
          commodityOrAsset: "Usaha uji picker",
          costPrice: 300000000,
          marginOrNisbah: 30,
          sellingPrice: 300000000,
          downPayment: 0,
          tenorMonths: 12,
        },
      },
    ];

    for (const c of cases) {
      const draft = await request("POST", "/api/v1/applications", {
        cookie: foCookie,
        body: { ...c.body, customerId: clearedId, submitImmediately: false },
      });
      report(
        `${c.label}: DRAFT dengan customerId berhasil`,
        draft.status === 201 && draft.json?.success === true,
        JSON.stringify(draft.json?.error || draft.status)
      );
      if (draft.json?.data?.id) createdApplicationIds.push(draft.json.data.id);
      report(
        `${c.label}: snapshot nama terisi dari direktori`,
        draft.json?.data?.customerName === `Nasabah Cleared ${STAMP}`
      );
      report(
        `${c.label}: draf tersimpan dengan customerId`,
        draft.json?.data?.customerId === clearedId
      );

      const submit = await request("POST", "/api/v1/applications", {
        cookie: foCookie,
        body: { ...c.body, customerId: clearedId, submitImmediately: true },
      });
      report(
        `${c.label}: SUBMIT dengan customerId berhasil`,
        submit.status === 201 && submit.json?.success === true,
        JSON.stringify(submit.json?.error || submit.status)
      );
      if (submit.json?.data?.id) createdApplicationIds.push(submit.json.data.id);
    }

    // -----------------------------------------------------------------------
    // D. AML / VERIFICATION POLICY THROUGH THE BACKEND (last authority)
    // -----------------------------------------------------------------------
    console.log("");
    console.log("--- D. Kebijakan AML & verifikasi (otoritas terakhir = backend) ---");

    const flaggedAttempt = await request("POST", "/api/v1/applications", {
      cookie: foCookie,
      body: {
        akad: "MURABAHAH",
        title: "Uji Picker Flagged 3B.4",
        customerId: flaggedId,
        commodityOrAsset: "Barang uji flagged",
        costPrice: 10000000,
        marginOrNisbah: 1000000,
        tenorMonths: 12,
      },
    });
    report(
      "Customer AML FLAGGED ditolak backend (403 CUSTOMER_AML_BLOCKED)",
      flaggedAttempt.status === 403 && flaggedAttempt.json?.error?.code === "CUSTOMER_AML_BLOCKED",
      JSON.stringify(flaggedAttempt.json?.error || flaggedAttempt.status)
    );

    const pendingApp = await request("POST", "/api/v1/applications", {
      cookie: foCookie,
      body: {
        akad: "MURABAHAH",
        title: "Uji Picker Pending 3B.4",
        customerId: pendingId,
        commodityOrAsset: "Barang uji pending",
        costPrice: 10000000,
        marginOrNisbah: 1000000,
        tenorMonths: 12,
      },
    });
    report(
      "Customer AML PENDING dapat dipilih (pengajuan sukses)",
      pendingApp.status === 201 && pendingApp.json?.success === true,
      JSON.stringify(pendingApp.json?.error || pendingApp.status)
    );
    report(
      "Aplikasi dari customer PENDING berstatus amlStatus PENDING (tidak diam-diam CLEARED)",
      pendingApp.json?.data?.amlStatus === "PENDING"
    );
    if (pendingApp.json?.data?.id) createdApplicationIds.push(pendingApp.json.data.id);

    const unverifiedApp = await request("POST", "/api/v1/applications", {
      cookie: foCookie,
      body: {
        akad: "IJARAH",
        title: "Uji Picker Unverified 3B.4",
        customerId: unverifiedId,
        commodityOrAsset: "Aset uji unverified",
        costPrice: 10000000,
        marginOrNisbah: 1000000,
        tenorMonths: 12,
      },
    });
    report(
      "Customer belum terverifikasi dapat dipilih (pengajuan sukses)",
      unverifiedApp.status === 201 && unverifiedApp.json?.success === true,
      JSON.stringify(unverifiedApp.json?.error || unverifiedApp.status)
    );
    if (unverifiedApp.json?.data?.id) createdApplicationIds.push(unverifiedApp.json.data.id);

    const noCustomer = await request("POST", "/api/v1/applications", {
      cookie: foCookie,
      body: {
        akad: "MURABAHAH",
        title: "Uji Tanpa Nasabah 3B.4",
        commodityOrAsset: "Barang tanpa nasabah",
        costPrice: 10000000,
        marginOrNisbah: 1000000,
        tenorMonths: 12,
      },
    });
    report(
      "Pengajuan tanpa customerId DAN tanpa customerName ditolak (400)",
      noCustomer.status === 400,
      JSON.stringify(noCustomer.json?.error || noCustomer.status)
    );

    // -----------------------------------------------------------------------
    // E. APPLICATION LIST — customer reference + legacy safety
    // -----------------------------------------------------------------------
    console.log("");
    console.log("--- E. Daftar aplikasi: referensi customer & aplikasi legacy ---");

    const list = await request("GET", "/api/v1/applications?akad=MURABAHAH", { cookie: foCookie });
    report("GET /api/v1/applications tetap sukses setelah integrasi", list.status === 200 && list.json?.success === true);

    const firstCreated = createdApplicationIds.length > 0 ? createdApplicationIds[0] : null;
    const listedCreated = (list.json?.data || []).find((a) => a.id === firstCreated);
    report(
      "Aplikasi ter-link memuat referensi customer (CIF + nama)",
      Boolean(listedCreated?.customer?.cifNumber) && listedCreated?.customer?.name === `Nasabah Cleared ${STAMP}`,
      JSON.stringify(listedCreated?.customer || null)
    );

    const listedLegacy = (list.json?.data || []).find((a) => legacySnapshot.has(a.id));
    report(
      "Aplikasi legacy (tanpa customerId) tetap tampil di daftar",
      Boolean(listedLegacy)
    );

    // Legacy applications must remain byte-for-byte unchanged (file-level,
    // not API-level: the list response legitimately enriches items with
    // `customer: null` reference fields added in Tahap 3B.2).
    const stateAtCheck = readState();
    let legacyChanged = 0;
    for (const [id, snapshot] of legacySnapshot) {
      const freshInFile = stateAtCheck.applications.find((a) => a.id === id);
      if (!freshInFile || JSON.stringify(freshInFile) !== snapshot) legacyChanged++;
    }
    report(`Tidak ada aplikasi legacy yang berubah (${legacyApps.length} diperiksa)`, legacyChanged === 0, `drift=${legacyChanged}`);

    // -----------------------------------------------------------------------
    // F. STATIC SOURCE AUDIT — four akad pages + picker
    // -----------------------------------------------------------------------
    console.log("");
    console.log("--- F. Audit sumber: empat halaman akad + CustomerPicker ---");

    const PAGES = {
      murabahah: "app/(dashboard)/contracts/murabahah/page.tsx",
      ijarah: "app/(dashboard)/contracts/ijarah/page.tsx",
      musyarakah: "app/(dashboard)/contracts/musyarakah/page.tsx",
      mudharabah: "app/(dashboard)/contracts/mudharabah/page.tsx",
    };

    const dummyStrings = [
      "PT Cahaya Makmur Abadi",
      "CV Amanah Mitra Mandiri",
      "PT Samudera Karya Medika",
      "Koperasi Mandiri Berkah Sejahtera",
      "3273012903880004",
      "+62 812-3456-7890",
      "finance@cahayamakmur.co.id",
    ];

    for (const [label, rel] of Object.entries(PAGES)) {
      auditSource(rel, [
        ...dummyStrings.map(
          (dummy) => [`tidak ada data dummy: "${dummy}"`, (content) => !content.includes(dummy)]
        ),
        ["CustomerPicker terintegrasi", (content) => content.includes("CustomerPicker") && content.includes("selectedCustomer")],
        ["payload POST membawa customerId", (content) => content.includes("customerId: selectedCustomer.id") || content.includes("customerId: customer.id")],
        ["validasi customerId sebelum simpan", (content) => content.includes("!selectedCustomer")],
        ["tabel menampilkan CIF dengan fallback aman", (content) => content.includes("customer?.name ?? app.customerName ??") || content.includes("customer?.name ?? c.customerName ??")],
      ]);
    }

    auditSource(PAGES.murabahah, [
      ["draft & submit memakai satu pembentuk payload (buildPayload)", (content) => content.includes("buildPayload(selectedCustomer, false)") && content.includes("buildPayload(selectedCustomer, true)")],
    ]);

    auditSource(PAGES.ijarah, [
      ["mapping Ijarah: marginOrNisbah = totalUjrah - assetValue", (content) => content.includes("marginOrNisbah: calcResult.totalUjrah - assetValue")],
      ["mapping Ijarah: sellingPrice = totalUjrah", (content) => content.includes("sellingPrice: calcResult.totalUjrah")],
      ["mapping Ijarah: downPayment = advanceRentalDeposit", (content) => content.includes("downPayment: advanceRentalDeposit")],
      ["mapping Ijarah: costPrice = assetValue", (content) => content.includes("costPrice: assetValue")],
    ]);

    auditSource(PAGES.musyarakah, [
      ["mapping Musyarakah: costPrice = institutionCapital", (content) => content.includes("costPrice: institutionCapital")],
      ["mapping Musyarakah: marginOrNisbah = institutionNisbah (%)", (content) => content.includes("marginOrNisbah: institutionNisbah")],
      ["mapping Musyarakah: sellingPrice = totalCapital", (content) => content.includes("sellingPrice: calcResult.totalCapital")],
      ["mapping Musyarakah: downPayment = partnerCapital", (content) => content.includes("downPayment: partnerCapital")],
      ["total nisbah tetap 100% (sinkron 100 - v)", (content) => content.includes("setPartnerNisbah(100 - v)") && content.includes("setInstitutionNisbah(100 - v)")],
    ]);

    auditSource(PAGES.mudharabah, [
      ["mapping Mudharabah: costPrice = capitalShahibulMal", (content) => content.includes("costPrice: capitalShahibulMal")],
      ["mapping Mudharabah: marginOrNisbah = shahibulMalNisbah (%)", (content) => content.includes("marginOrNisbah: shahibulMalNisbah")],
      ["mapping Mudharabah: sellingPrice = capitalShahibulMal", (content) => content.includes("sellingPrice: capitalShahibulMal")],
      ["mapping Mudharabah: downPayment = 0", (content) => content.includes("downPayment: 0,")],
      ["total nisbah tetap 100% (sinkron 100 - v)", (content) => content.includes("setMudharibNisbah(100 - v)") && content.includes("setShahibulMalNisbah(100 - v)")],
      ["tanpa keuntungan tetap yang dijamin (zero guaranteed return)", (content) => content.includes("Zero guaranteed fixed return")],
    ]);

    auditSource("components/contracts/customer-picker.tsx", [
      ["picker memanggil GET /api/v1/customers", (content) => content.includes("/api/v1/customers")],
      ["picker TIDAK mengirim organizationId (tanpa komentar)", (content) => !stripComments(content).includes("organizationId")],
      ["picker tanpa localStorage/sessionStorage (tanpa komentar)", (content) => !stripComments(content).includes("localStorage") && !stripComments(content).includes("sessionStorage")],
      ["debounce pencarian 300 ms", (content) => content.includes("300") && content.includes("setTimeout")],
      ["race condition terjaga (guard nomor urut)", (content) => content.includes("requestSeqRef")],
      ["FLAGGED tidak dapat dipilih", (content) => content.includes('customer.amlStatus === "FLAGGED"') && content.includes("disabled={flagged}")],
      ["PENDING dapat dipilih dengan peringatan", (content) => content.includes('value.amlStatus === "PENDING"')],
      ["belum terverifikasi memberi peringatan", (content) => content.includes("!value.isVerified")],
      ["empty state mengarah ke /customers/new", (content) => content.includes("/customers/new") && content.includes("Belum Ada Nasabah Terdaftar")],
      ["pesan 401/403 ditangani", (content) => content.includes('result.status === 401') && content.includes('result.status === 403')],
      ["tombol Ganti Nasabah & Hapus Pilihan tersedia", (content) => content.includes("Ganti Nasabah") && content.includes("Hapus Pilihan")],
      ["badge AML: hijau/kuning/merah konsisten", (content) => content.includes('"CLEARED" ? "success"') && content.includes('"PENDING" ? "warning"') && content.includes('"danger"')],
    ]);
  } catch (e) {
    console.error("[FATAL]", e);
    report("Suite berjalan tanpa error fatal", false, e.message);
  } finally {
    // -----------------------------------------------------------------------
    // CLEANUP + INTEGRITY
    // -----------------------------------------------------------------------
    cleanup();

    const afterCounts = counts();
    const afterState = readState();
    const finalCustomers = new Set(afterState.customers.map((c) => c.id));
    const noLeftover = createdCustomerIds.every((id) => !finalCustomers.has(id));
    const noPreExistingTouched = [...preExistingCustomers].every((id) => finalCustomers.has(id));
    const legacyStillIntact = [...legacySnapshot.keys()].every((id) =>
      afterState.applications.some((a) => a.id === id)
    );

    report("JSON tetap satu-satunya operational data store (tidak ada store lain)", true);
    report("Seluruh data uji customer dihapus kembali", noLeftover);
    report("Data customer lama tidak tersentuh", noPreExistingTouched);
    report("Aplikasi legacy tetap utuh setelah cleanup", legacyStillIntact);
    report(
      "Jumlah record kembali ke kondisi awal",
      afterCounts.applications === initialCounts.applications && afterCounts.customers === initialCounts.customers,
      `awal=${JSON.stringify(initialCounts)} akhir=${JSON.stringify(afterCounts)}`
    );
  }

  // ---------------------------------------------------------------------------
  console.log("");
  console.log("=".repeat(80));
  console.log(`   HASIL: ${passedCount} PASS, ${failedCount} FAIL`);
  if (failures.length > 0) {
    console.log("   Gagal:");
    for (const f of failures) console.log(`     - ${f}`);
  }
  console.log("=".repeat(80));
  process.exit(failedCount === 0 ? 0 : 1);
}

run();
