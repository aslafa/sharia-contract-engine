/**
 * SCE — JSON Repository Durability Test Suite (temporary data strategy)
 *
 * Verifies that the JSON store (data/sce_database.json via DBRepository):
 *   1. never produces a corrupt/truncated file when a write fails mid-way,
 *   2. recovers from a corrupt main file via the rolling backup,
 *   3. NEVER destructively reseeds over a corrupt file (original bytes kept),
 *   4. preserves existing data across mutations and keeps tenant isolation,
 *   5. JSON-backed auth enforces Argon2id passwords and active checks.
 *
 * All tests run in an ISOLATED SANDBOX directory (SCE_DB_FILE env override);
 * the real demo data is untouched.
 *
 * Usage: node scripts/test-json-atomicity.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

// Sandbox paths MUST be set before repository.ts is imported (module-level consts).
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "sce-db-test-"));
process.env.SCE_DATA_DIR = sandbox;
process.env.SCE_DB_FILE = path.join(sandbox, "sce_database.json");
process.env.SCE_DB_BACKUP_FILE = path.join(sandbox, "sce_database.backup.json");
process.env.SCE_DB_CORRUPT_FILE = path.join(sandbox, "sce_database.corrupt.json");

const jiti = require("jiti")(process.cwd(), {
  alias: { "@": path.resolve("src") },
});
const { DBRepository } = jiti(path.resolve("src/lib/db/repository.ts"));
const { authenticateUserWithJson } = jiti(path.resolve("src/lib/auth/json-auth.ts"));

const DB_FILE = process.env.SCE_DB_FILE;
const BACKUP_FILE = process.env.SCE_DB_BACKUP_FILE;
const CORRUPT_FILE = process.env.SCE_DB_CORRUPT_FILE;

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

function readFileSafe(file) {
  try {
    return fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
}

function isParseableJson(file) {
  try {
    JSON.parse(readFileSafe(file));
    return true;
  } catch {
    return false;
  }
}

async function run() {
  console.log("=".repeat(80));
  console.log("   SCE — JSON REPOSITORY DURABILITY & TENANT ISOLATION SUITE");
  console.log(`   Sandbox: ${sandbox}`);
  console.log("=".repeat(80));
  console.log("");

  // ---------------------------------------------------------------- 1. boot
  {
    const apps = DBRepository.getApplications({});
    report(
      "D1  Boot fresh: store ter-seed dan file JSON valid",
      Array.isArray(apps) && apps.length > 0 && isParseableJson(DB_FILE),
      `apps=${apps.length}`
    );
    const users = DBRepository.getUsers();
    report(
      "D2  User demo memiliki passwordHash Argon2id (tidak ada plaintext)",
      users.length === 8 &&
        users.every((u) => typeof u.passwordHash === "string" && u.passwordHash.startsWith("$argon2")),
      `users=${users.length}`
    );
  }

  // --------------------------------------------- 2. mutation + tenant isolation
  {
    const created = DBRepository.createApplication({
      organizationId: "org-bprs-albarakah",
      createdById: "usr-fo-001",
      createdByName: "Test FO",
      akad: "MURABAHAH",
      title: "Uji Ketahanan JSON",
      customerName: "PT Sandbox Test",
      commodityOrAsset: "1 Unit Mesin Uji",
      costPrice: 100000000,
      marginOrNisbah: 10000000,
      tenorMonths: 12,
    });
    const afterCreate = DBRepository.getApplications({});
    report(
      "D3  Mutasi createApplication tersimpan dan data lama tetap ada",
      afterCreate.length > 4 &&
        afterCreate.some((a) => a.id === created.id) &&
        isParseableJson(DB_FILE),
      `total=${afterCreate.length}`
    );
    report(
      "D4  organizationId aplikasi baru benar (tenant isolation)",
      created.organizationId === "org-bprs-albarakah"
    );

    const otherTenant = DBRepository.getApplications({ organizationId: "org-kspps-bintang" });
    report(
      "D5  Query tenant lain tidak melihat aplikasi tenant ini",
      !otherTenant.some((a) => a.id === created.id),
      `leak=${otherTenant.some((a) => a.id === created.id)}`
    );

    let rejected = false;
    try {
      DBRepository.createApplication({
        createdById: "usr-fo-001",
        akad: "MURABAHAH",
        title: "Tanpa organizationId",
        customerName: "X",
        commodityOrAsset: "Y",
        costPrice: 1,
        marginOrNisbah: 0,
        tenorMonths: 1,
      });
    } catch (e) {
      rejected = String(e.message).includes("TENANT_ISOLATION");
    }
    report(
      "D6  createApplication TANPA organizationId ditolak (tanpa fallback tenant lain)",
      rejected
    );
  }

  // ---------------------------------------------------- 3. failed write atomicity
  {
    const before = readFileSafe(DB_FILE);
    const origRename = fs.renameSync;
    fs.renameSync = () => {
      throw new Error("SIMULATED_CRASH_MID_WRITE");
    };
    let threw = false;
    try {
      // capture current state via public API then attempt a save that fails at rename
      const state = JSON.parse(before);
      DBRepository.save(state);
    } catch (e) {
      threw = true;
    } finally {
      fs.renameSync = origRename;
    }
    const after = readFileSafe(DB_FILE);
    report(
      "D7  Kegagalan write (crash sebelum rename) -> save melempar error",
      threw,
      "save tidak melempar error saat rename gagal"
    );
    report(
      "D8  File utama tetap utuh & JSON valid setelah kegagalan write (tidak ada partial write)",
      after !== null && after === before && isParseableJson(DB_FILE),
      "file berubah atau rusak"
    );
  }

  // ------------------------------------------- 4. corrupt main -> backup recovery
  {
    // Take a known-good snapshot (creates rolling backup)
    const goodState = JSON.parse(readFileSafe(DB_FILE));
    DBRepository.save(goodState);
    if (!fs.existsSync(BACKUP_FILE)) {
      report("D9  Backup rolling dibuat saat save", false, "sce_database.backup.json tidak ada");
    } else {
      report("D9  Backup rolling dibuat saat save", true);
    }

    // Corrupt the main file
    fs.writeFileSync(DB_FILE, "{{{CORRUPT_PARTIAL_JSON", "utf-8");
    const recovered = DBRepository.getUsers();
    report(
      "D10 File utama korup -> dipulihkan dari backup (data tidak hilang)",
      recovered.length === 8 && isParseableJson(DB_FILE),
      `users=${recovered.length}`
    );
    report(
      "D11 File korup dikarantina (sce_database.corrupt.json ada)",
      fs.existsSync(CORRUPT_FILE)
    );
  }

  // ---------------------------------- 5. no destructive reseed over corrupt file
  {
    const corruptBytes = "{{{UNRECOVERABLE_USER_DATA";
    fs.writeFileSync(DB_FILE, corruptBytes, "utf-8");
    fs.rmSync(BACKUP_FILE, { force: true }); // worst case: no backup available

    const users = DBRepository.getUsers(); // falls back to in-memory seed
    const onDisk = readFileSafe(DB_FILE);
    report(
      "D12 Tanpa backup: load memakai seed in-memory (API tetap hidup)",
      users.length === 8
    );
    report(
      "D13 File korut TIDAK ditimpa seed (bytes asli dipertahankan untuk recovery manual)",
      onDisk === corruptBytes,
      "file terdedikasi ditimpa — data asli hilang!"
    );
  }

  // ------------------------------------------------- 6. JSON auth (sandbox data)
  {
    // Restore a valid store for auth tests
    const seedState = DBRepository.getApplications({}); // triggers load; seed in memory
    // Persist the in-memory seed explicitly to continue with valid data
    const state = {
      organizations: DBRepository.getOrganizations(),
      users: DBRepository.getUsers(),
      memberships: [],
      applications: seedState,
      approvalSteps: [],
      contracts: [],
      documents: [],
      notifications: [],
      auditLogs: [],
    };
    // memberships need a proper load; fetch via a fresh valid file: copy recovery path
    // Simplest: rebuild memberships from the seed by triggering load with valid file
    DBRepository.save(state);

    const ok = await authenticateUserWithJson({
      email: "fatimah.zahra@bprs-albarakah.co.id",
      password: process.env.SCE_DEMO_PASSWORD || "P@ssword123!",
    });
    report(
      "D14 Login JSON dengan password benar -> membership & role dari store",
      ok.activeMembership.role === "FINANCING_OFFICER" &&
        ok.activeMembership.organizationId === "org-bprs-albarakah"
    );

    let wrongRejected = false;
    try {
      await authenticateUserWithJson({
        email: "fatimah.zahra@bprs-albarakah.co.id",
        password: "definitely-wrong",
      });
    } catch (e) {
      wrongRejected = e.status === 401 && e.message === "Kredensial tidak valid.";
    }
    report("D15 Login JSON dengan password salah ditolak (401, pesan generik)", wrongRejected);

    let inactiveRejected = false;
    // deactivate FO membership directly in the sandbox file
    const raw = JSON.parse(readFileSafe(DB_FILE));
    raw.memberships = raw.memberships.map((m) =>
      m.userId === "usr-fo-001" ? { ...m, isActive: false } : m
    );
    DBRepository.save(raw);
    try {
      await authenticateUserWithJson({
        email: "fatimah.zahra@bprs-albarakah.co.id",
        password: process.env.SCE_DEMO_PASSWORD || "P@ssword123!",
      });
    } catch (e) {
      inactiveRejected = e.status === 403;
    }
    report("D16 Membership nonaktif ditolak (403)", inactiveRejected);

    // restore membership
    const restored = JSON.parse(readFileSafe(DB_FILE));
    restored.memberships = restored.memberships.map((m) =>
      m.userId === "usr-fo-001" ? { ...m, isActive: true } : m
    );
    DBRepository.save(restored);
  }

  console.log("");
  console.log("=".repeat(80));
  console.log(`   RESULTS: ${passedCount} PASS, ${failedCount} FAIL`);
  if (failures.length > 0) {
    console.log("   Failed tests:");
    failures.forEach((f) => console.log(`     - ${f}`));
  }
  console.log("=".repeat(80));

  // cleanup sandbox
  fs.rmSync(sandbox, { recursive: true, force: true });

  process.exit(failedCount > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
