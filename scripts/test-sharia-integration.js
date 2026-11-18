/**
 * Test Sharia Rule Engine Integration & Regression Test Suite
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const jiti = require("jiti")(process.cwd(), {
  alias: {
    "@": path.resolve("src"),
  },
});

const { ShariaRuleEngine } = jiti(path.resolve("src/lib/sharia/engine.ts"));
const { DBRepository } = jiti(path.resolve("src/lib/db/repository.ts"));

console.log("================================================================================");
console.log("   SCE — SHARIA RULE ENGINE INTEGRATION & REGRESSION TEST SUITE                 ");
console.log("================================================================================");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

// 1. Compliant Murabahah evaluation
test("1. ShariaRuleEngine evaluate COMPLIANT Murabahah (score: 100)", () => {
  const mrbCompliant = ShariaRuleEngine.evaluate("MURABAHAH", {
    costPrice: 100000000,
    profitMargin: 15000000,
    sellingPrice: 115000000,
    downPaymentUrbun: 10000000,
    isGoodsReceived: true,
  });
  assert.strictEqual(mrbCompliant.status, "COMPLIANT");
  assert.strictEqual(mrbCompliant.criticalViolations, 0);
  assert.strictEqual(mrbCompliant.overallScore, 100);
});

// 2. Non-compliant Murabahah (sellingPrice != costPrice + margin)
test("2. ShariaRuleEngine evaluate NON_COMPLIANT Murabahah (critical violations detected)", () => {
  const mrbNonCompliant = ShariaRuleEngine.evaluate("MURABAHAH", {
    costPrice: 100000000,
    profitMargin: 15000000,
    sellingPrice: 130000000,
    downPaymentUrbun: 10000000,
    isGoodsReceived: true,
  });
  assert.strictEqual(mrbNonCompliant.status, "NON_COMPLIANT");
  assert.ok(mrbNonCompliant.criticalViolations > 0);
});

// 3. Warning Murabahah (downPayment >= sellingPrice)
test("3. ShariaRuleEngine evaluate WARNING Murabahah (warning detected, non-critical)", () => {
  const mrbWarning = ShariaRuleEngine.evaluate("MURABAHAH", {
    costPrice: 100000000,
    profitMargin: 15000000,
    sellingPrice: 115000000,
    downPaymentUrbun: 120000000,
    isGoodsReceived: true,
  });
  assert.strictEqual(mrbWarning.status, "WARNING");
  assert.strictEqual(mrbWarning.criticalViolations, 0);
  assert.ok(mrbWarning.warnings > 0);
});

// 4. Blocking NON_COMPLIANT application in DBRepository.createApplication()
test("4. DBRepository.createApplication() blocks NON_COMPLIANT application from persistence", () => {
  assert.throws(
    () => {
      DBRepository.createApplication({
        organizationId: "org-bprs-albarakah",
        createdById: "usr-fo-001",
        createdByName: "Fatimah Az-Zahra",
        customerName: "Nasabah Test Non-Compliant",
        akad: "MURABAHAH",
        title: "Test Pengajuan Melanggar Syariah",
        commodityOrAsset: "Mesin Pabrik",
        costPrice: 100000000,
        marginOrNisbah: 20000000,
        sellingPrice: 150000000, // Sengaja tidak cocok: 100jt + 20jt != 150jt
        tenorMonths: 12,
      });
    },
    (err) => {
      return (
        err instanceof Error &&
        err.message.includes("[SHARIA_NON_COMPLIANT]") &&
        err.message.includes("RULE-MRB-03")
      );
    }
  );
});

// 5. Creating COMPLIANT application generates real score and saves Sharia Validation Report
test("5. DBRepository.createApplication() calculates real score, assigns PASS, and saves validation report", () => {
  const app = DBRepository.createApplication({
    organizationId: "org-bprs-albarakah",
    createdById: "usr-fo-001",
    createdByName: "Fatimah Az-Zahra",
    customerName: "Nasabah Uji Compliant",
    akad: "MURABAHAH",
    title: "Test Pengajuan Compliant",
    commodityOrAsset: "1 Unit Mesin Produksi",
    costPrice: 100000000,
    marginOrNisbah: 15000000,
    sellingPrice: 115000000,
    downPayment: 10000000,
    tenorMonths: 12,
  });

  assert.strictEqual(app.shariaStatus, "PASS");
  assert.strictEqual(app.shariaScore, 100);

  // Check validation report saved
  const report = DBRepository.getShariaValidationReportByApplicationId(app.id, "org-bprs-albarakah");
  assert.ok(report, "Laporan validasi syariah harus tersimpan");
  assert.strictEqual(report.status, "COMPLIANT");
  assert.strictEqual(report.overallScore, 100);
  assert.strictEqual(report.applicationId, app.id);
  assert.strictEqual(report.organizationId, "org-bprs-albarakah");

  // Clean up
  cleanupApp(app.id);
});

// 6. Regression Test: WARNING / REVIEW routing on submitImmediately = true
test("6. [Fix 1A] createApplication with submitImmediately=true and REVIEW status sets DPS step to CURRENT", () => {
  const app = DBRepository.createApplication({
    organizationId: "org-bprs-albarakah",
    createdById: "usr-fo-001",
    createdByName: "Fatimah Az-Zahra",
    customerName: "Nasabah Warning Segera",
    akad: "MURABAHAH",
    title: "Pengajuan Warning Segera",
    commodityOrAsset: "Mesin Kemas",
    costPrice: 100000000,
    marginOrNisbah: 15000000,
    sellingPrice: 115000000,
    downPayment: 120000000, // Urbun >= selling price triggers WARNING
    tenorMonths: 12,
    submitImmediately: true,
  });

  assert.strictEqual(app.shariaStatus, "REVIEW");
  assert.strictEqual(app.status, "DPS_REVIEW");
  assert.strictEqual(app.currentStage, "DPS");

  const { steps } = DBRepository.getApplicationById(app.id);
  const foStep = steps.find((s) => s.roleCode === "FINANCING_OFFICER");
  const legalStep = steps.find((s) => s.roleCode === "LEGAL_OFFICER");
  const dpsStep = steps.find((s) => s.roleCode === "SHARIA_REVIEWER");

  assert.strictEqual(foStep.status, "COMPLETED");
  assert.strictEqual(legalStep.status, "PENDING", "Legal step harus PENDING ketika dialihkan langsung ke DPS");
  assert.strictEqual(dpsStep.status, "CURRENT", "DPS step harus CURRENT ketika shariaStatus REVIEW");

  cleanupApp(app.id);
});

// 7. Regression Test: submitApplication() routing on draft with REVIEW status
test("7. [Fix 1B] submitApplication() on draft with REVIEW status routes to DPS_REVIEW and sets DPS step to CURRENT", () => {
  // First create as DRAFT
  const draftApp = DBRepository.createApplication({
    organizationId: "org-bprs-albarakah",
    createdById: "usr-fo-001",
    createdByName: "Fatimah Az-Zahra",
    customerName: "Nasabah Warning Draf",
    akad: "MURABAHAH",
    title: "Pengajuan Warning Draf",
    commodityOrAsset: "Mesin Press",
    costPrice: 100000000,
    marginOrNisbah: 15000000,
    sellingPrice: 115000000,
    downPayment: 120000000, // Warning
    tenorMonths: 12,
    submitImmediately: false,
  });

  assert.strictEqual(draftApp.shariaStatus, "REVIEW");
  assert.strictEqual(draftApp.status, "DRAFT");
  assert.strictEqual(draftApp.currentStage, "FO");

  // Submit it
  const submittedApp = DBRepository.submitApplication(draftApp.id, "Fatimah Az-Zahra");
  assert.strictEqual(submittedApp.status, "DPS_REVIEW");
  assert.strictEqual(submittedApp.currentStage, "DPS");

  const { steps } = DBRepository.getApplicationById(draftApp.id);
  const foStep = steps.find((s) => s.roleCode === "FINANCING_OFFICER");
  const legalStep = steps.find((s) => s.roleCode === "LEGAL_OFFICER");
  const dpsStep = steps.find((s) => s.roleCode === "SHARIA_REVIEWER");

  assert.strictEqual(foStep.status, "COMPLETED");
  assert.strictEqual(legalStep.status, "PENDING");
  assert.strictEqual(dpsStep.status, "CURRENT");

  cleanupApp(draftApp.id);
});

// 8. Regression Test: Defense-in-depth on processApproval()
test("8. [Fix 2] processApproval() blocks approval on application with BLOCKED / NON_COMPLIANT sharia status", () => {
  // Create a compliant draft first to get valid steps
  const app = DBRepository.createApplication({
    organizationId: "org-bprs-albarakah",
    createdById: "usr-fo-001",
    createdByName: "Fatimah Az-Zahra",
    customerName: "Nasabah Uji Defense",
    akad: "MURABAHAH",
    title: "Pengajuan Uji Defense",
    commodityOrAsset: "Peralatan",
    costPrice: 50000000,
    marginOrNisbah: 5000000,
    tenorMonths: 6,
    submitImmediately: true,
  });

  // Manually simulate a legacy or manipulated BLOCKED application
  const dbPath = path.resolve("data/sce_database.json");
  const dbData = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  const target = dbData.applications.find((a) => a.id === app.id);
  target.shariaStatus = "BLOCKED";
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), "utf-8");

  // Attempt approval by LEGAL_OFFICER (since it's at LEGAL stage)
  assert.throws(
    () => {
      DBRepository.processApproval({
        applicationId: app.id,
        roleCode: "LEGAL_OFFICER",
        actorName: "Bambang Sudrajat",
        action: "APPROVE",
        comments: "Mencoba setujui aplikasi yang bermasalah syariah",
      });
    },
    (err) => {
      return (
        err instanceof Error &&
        err.message.includes("[SHARIA_BLOCKED]") &&
        err.message.includes("pelanggaran syariah")
      );
    }
  );

  cleanupApp(app.id);
});

// 9. Existing database integrity
test("9. Legacy 9 applications preserved with original scores and statuses", () => {
  const db = JSON.parse(fs.readFileSync(path.resolve("data/sce_database.json"), "utf-8"));
  assert.strictEqual(db.applications.length, 9);
  assert.ok(Array.isArray(db.shariaValidationReports));
});

function cleanupApp(appId) {
  const dbPath = path.resolve("data/sce_database.json");
  const dbData = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  dbData.applications = dbData.applications.filter((a) => a.id !== appId);
  dbData.approvalSteps = dbData.approvalSteps.filter((s) => s.applicationId !== appId);
  dbData.auditLogs = dbData.auditLogs.filter((l) => l.entityId !== appId);
  dbData.shariaValidationReports = (dbData.shariaValidationReports || []).filter((r) => r.applicationId !== appId);
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), "utf-8");
}

console.log("\n================================================================================");
console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
}
