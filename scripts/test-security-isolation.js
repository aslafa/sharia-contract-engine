const path = require("path");
const jiti = require("jiti")(process.cwd(), {
  alias: {
    "@": path.resolve("src"),
  },
});

const { DBRepository } = jiti(path.resolve("src/lib/db/repository.ts"));
const { assertTenantIsolation, assertPermission, assertRole, TenantIsolationError, AuthorizationError } = jiti(
  path.resolve("src/lib/auth/guard.ts")
);
const { DEMO_USERS } = jiti(path.resolve("src/lib/auth/session.ts"));
const { PERMISSIONS } = jiti(path.resolve("src/lib/auth/roles.ts"));

console.log("================================================================================");
console.log("   SHARIA CONTRACT ENGINE (SCE) — SECURITY & MULTI-TENANT ISOLATION SUITE      ");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[\x1b[32mPASS\x1b[0m] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[\x1b[31mFAIL\x1b[0m] ${name}`);
    console.error(`       Error: ${err.message}`);
    failedCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`[\x1b[32mPASS\x1b[0m] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[\x1b[31mFAIL\x1b[0m] ${name}`);
    console.error(`       Error: ${err.message}`);
    failedCount++;
  }
}

async function main() {
  // -------------------------------------------------------------------------
  // 1. DATABASE FOUNDATION & IDENTITY VERIFICATION
  // -------------------------------------------------------------------------
  runTest("1.1 Database repository loads organizations and users correctly", () => {
    const orgs = DBRepository.getOrganizations();
    if (!orgs || orgs.length < 2) throw new Error("Organizations not found or insufficient.");
    const bprs = orgs.find((o) => o.id === "org-bprs-albarakah");
    if (!bprs) throw new Error("BPRS Al-Barakah organization not found.");

    const users = DBRepository.getUsers();
    if (!users || users.length < 5) throw new Error("Users not found or insufficient.");
    const fo = users.find((u) => u.id === "usr-fo-001");
    if (!fo) throw new Error("Financing Officer user not found.");
  });

  runTest("1.2 User authentication against database loads memberships & available tenants", () => {
    const authFO = DBRepository.authenticateUser({
      email: "fatimah.zahra@bprs-albarakah.co.id",
    });
    if (authFO.activeMembership.organizationId !== "org-bprs-albarakah") {
      throw new Error(`Expected org-bprs-albarakah, got ${authFO.activeMembership.organizationId}`);
    }
    if (authFO.availableMemberships.length !== 1) {
      throw new Error(`FO should only have 1 tenant, got ${authFO.availableMemberships.length}`);
    }

    // DPS has multi-tenant memberships
    const authDPS = DBRepository.authenticateUser({
      email: "kh.ridwan.mansur@dps-mui.id",
    });
    if (authDPS.availableMemberships.length < 2) {
      throw new Error(`DPS should have multiple memberships, got ${authDPS.availableMemberships.length}`);
    }
  });

  // -------------------------------------------------------------------------
  // 2. CROSS-TENANT ISOLATION BARRIER
  // -------------------------------------------------------------------------
  await runAsyncTest("2.1 Cross-tenant access attempt is blocked with 403 TenantIsolationError", async () => {
    const foUser = DEMO_USERS.FINANCING_OFFICER;
    const foreignTenantId = "org-kspps-bintang";

    let blocked = false;
    try {
      await assertTenantIsolation(foUser, foreignTenantId, "FinancingApplication", "app-test-999");
    } catch (err) {
      if (err instanceof TenantIsolationError) {
        blocked = true;
      } else {
        throw err;
      }
    }
    if (!blocked) throw new Error("TenantIsolationError was not thrown for cross-tenant access!");
  });

  await runAsyncTest("2.2 Cross-tenant violation automatically writes security audit log", async () => {
    const logs = DBRepository.getAuditLogs({ limit: 5 });
    const violationLog = logs.find((l) => l.action === "CROSS_TENANT_VIOLATION_BLOCKED");
    if (!violationLog) throw new Error("Security audit log for cross-tenant violation was not created.");
    if (!violationLog.sha256) throw new Error("Audit log missing SHA-256 seal.");
  });

  await runAsyncTest("2.3 Intra-tenant access for legitimate user is granted smoothly", async () => {
    const foUser = DEMO_USERS.FINANCING_OFFICER;
    await assertTenantIsolation(foUser, "org-bprs-albarakah", "FinancingApplication", "app-1");
  });

  runTest("2.4 Unauthorized tenant switch attempt is rejected", () => {
    let switchBlocked = false;
    try {
      DBRepository.switchTenant("usr-fo-001", "org-kspps-bintang");
    } catch (err) {
      if (err.message.includes("PELANGGARAN ISOLASI TENANT")) {
        switchBlocked = true;
      }
    }
    if (!switchBlocked) throw new Error("FO should not be permitted to switch to org-kspps-bintang!");
  });

  runTest("2.5 Multi-tenant user (DPS) can legitimately switch tenants", () => {
    const switchResult = DBRepository.switchTenant("usr-dps-001", "org-kspps-bintang");
    if (switchResult.activeMembership.organizationId !== "org-kspps-bintang") {
      throw new Error("DPS tenant switch to org-kspps-bintang failed.");
    }
  });

  // -------------------------------------------------------------------------
  // 3. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS
  // -------------------------------------------------------------------------
  await runAsyncTest("3.1 Read-Only Auditor is blocked from creating financing contracts", async () => {
    const auditor = DEMO_USERS.AUDITOR;
    let blocked = false;
    try {
      await assertPermission(auditor, PERMISSIONS.CONTRACTS_CREATE);
    } catch (err) {
      if (err instanceof AuthorizationError) blocked = true;
    }
    if (!blocked) throw new Error("Auditor should be blocked from CONTRACTS_CREATE!");
  });

  await runAsyncTest("3.2 Financing Officer is blocked from Sharia Fatwa Override", async () => {
    const fo = DEMO_USERS.FINANCING_OFFICER;
    let blocked = false;
    try {
      await assertPermission(fo, PERMISSIONS.SHARIA_OVERRIDE);
    } catch (err) {
      if (err instanceof AuthorizationError) blocked = true;
    }
    if (!blocked) throw new Error("FO should be blocked from SHARIA_OVERRIDE!");
  });

  await runAsyncTest("3.3 Dewan Pengawas Syariah (DPS) is granted Sharia Fatwa Override", async () => {
    const dps = DEMO_USERS.SHARIA_REVIEWER;
    await assertPermission(dps, PERMISSIONS.SHARIA_OVERRIDE);
  });

  await runAsyncTest("3.4 Role membership validation (assertRole) strictly blocks unauthorized roles", async () => {
    const fo = DEMO_USERS.FINANCING_OFFICER;
    let blocked = false;
    try {
      await assertRole(fo, ["LEGAL_OFFICER", "MANAGEMENT"]);
    } catch (err) {
      if (err instanceof AuthorizationError) blocked = true;
    }
    if (!blocked) throw new Error("assertRole should have blocked FO from LEGAL_OFFICER!");
  });

  // -------------------------------------------------------------------------
  // 4. DATA QUERY ISOLATION & LEAKAGE PREVENTION
  // -------------------------------------------------------------------------
  runTest("4.1 Applications query strictly respects organizationId boundary", () => {
    const apps = DBRepository.getApplications({ organizationId: "org-bprs-albarakah" });
    const hasLeakage = apps.some((a) => a.organizationId !== "org-bprs-albarakah");
    if (hasLeakage) throw new Error("Data leakage detected: application belonging to another tenant found!");
  });

  runTest("4.2 Contracts query strictly respects organizationId boundary", () => {
    const contracts = DBRepository.getContracts({ organizationId: "org-bprs-albarakah" });
    const hasLeakage = contracts.some((c) => c.organizationId !== "org-bprs-albarakah");
    if (hasLeakage) throw new Error("Data leakage detected: contract belonging to another tenant found!");
  });

  runTest("4.3 Audit logs query strictly filters by tenant organizationId", () => {
    const logs = DBRepository.getAuditLogs({ organizationId: "org-bprs-albarakah" });
    const hasLeakage = logs.some((l) => l.organizationId && l.organizationId !== "org-bprs-albarakah");
    if (hasLeakage) throw new Error("Audit log leakage: foreign tenant logs returned!");
  });

  runTest("4.4 Notifications query strictly filters by organizationId", () => {
    const notifs = DBRepository.getNotifications({ organizationId: "org-bprs-albarakah" });
    const hasLeakage = notifs.some((n) => n.organizationId && n.organizationId !== "org-bprs-albarakah");
    if (hasLeakage) throw new Error("Notification leakage: foreign tenant notifications returned!");
  });

  // -------------------------------------------------------------------------
  // 5. HTTP STATUS CODE CONTRACTS & UNCHECKED NULL-SESSION PREVENTION
  // -------------------------------------------------------------------------
  const { AuthenticationError, handleAuthError } = jiti(path.resolve("src/lib/auth/guard.ts"));

  await runAsyncTest("5.1 Null session passed to assertTenantIsolation is rejected with 401 AuthenticationError", async () => {
    let rejected = false;
    try {
      await assertTenantIsolation(null, "org-bprs-albarakah");
    } catch (err) {
      if (err instanceof AuthenticationError && err.status === 401) rejected = true;
    }
    if (!rejected) throw new Error("Null session must throw AuthenticationError with status 401!");
  });

  await runAsyncTest("5.2 Null session passed to assertPermission is rejected with 401 AuthenticationError", async () => {
    let rejected = false;
    try {
      await assertPermission(null, PERMISSIONS.CONTRACTS_CREATE);
    } catch (err) {
      if (err instanceof AuthenticationError && err.status === 401) rejected = true;
    }
    if (!rejected) throw new Error("Null session must throw AuthenticationError with status 401!");
  });

  await runAsyncTest("5.3 Null session passed to assertRole is rejected with 401 AuthenticationError", async () => {
    let rejected = false;
    try {
      await assertRole(null, ["FINANCING_OFFICER"]);
    } catch (err) {
      if (err instanceof AuthenticationError && err.status === 401) rejected = true;
    }
    if (!rejected) throw new Error("Null session must throw AuthenticationError with status 401!");
  });

  runTest("5.4 handleAuthError maps AuthenticationError to HTTP 401 response", () => {
    const res = handleAuthError(new AuthenticationError("Unauthorized test"));
    if (res.status !== 401) throw new Error(`Expected HTTP status 401, got ${res.status}`);
  });

  runTest("5.5 handleAuthError maps TenantIsolationError to HTTP 403 response", () => {
    const res = handleAuthError(new TenantIsolationError("Forbidden cross-tenant", "org-1", "org-2"));
    if (res.status !== 403) throw new Error(`Expected HTTP status 403, got ${res.status}`);
  });

  runTest("5.6 handleAuthError maps AuthorizationError to HTTP 403 response", () => {
    const res = handleAuthError(new AuthorizationError("Forbidden action"));
    if (res.status !== 403) throw new Error(`Expected HTTP status 403, got ${res.status}`);
  });

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`   TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED                    `);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("\x1b[32m✔ ALL SECURITY, RBAC, AND TENANT ISOLATION TESTS PASSED PERFECTLY!\x1b[0m\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error running test suite:", err);
  process.exit(1);
});

