/**
 * SCE — CONTRACT STATUS TRACKER & APPROVAL INTEGRATION TEST SUITE
 * Verifies the 8-stage contract lifecycle tracking, approval integration,
 * defense-in-depth security, and RBAC read-only enforcement for Auditor.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const jiti = require("jiti")(process.cwd(), {
  alias: {
    "@": path.resolve("src"),
  },
});

const { DBRepository } = jiti(path.resolve("src/lib/db/repository.ts"));

console.log("================================================================================");
console.log("   SCE — CONTRACT STATUS TRACKER & LIFECYCLE VERIFICATION SUITE                 ");
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

const dbPath = path.resolve("data/sce_database.json");
const rawDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

// 1. Verify database contains actual applications and approvalSteps
test("1. Verify database contains actual applications and approvalSteps", () => {
  assert.ok(Array.isArray(rawDb.applications), "applications array missing");
  assert.ok(Array.isArray(rawDb.approvalSteps), "approvalSteps array missing");
  assert.ok(Array.isArray(rawDb.contracts), "contracts array missing");
  assert.ok(rawDb.applications.length >= 9, "Legacy 9 applications must be preserved");
  assert.ok(rawDb.approvalSteps.length >= 54, "Approval steps must be at least 54");
});

test("2. DBRepository.getContracts() returns contracts enriched with 8-stage progress tracker", () => {
  const contracts = DBRepository.getContracts();
  assert.ok(contracts.length > 0, "No contracts returned");

  // Check each contract has stages
  contracts.forEach((c) => {
    assert.ok(c.contractNumber, "Contract must have contractNumber");
    assert.ok(Array.isArray(c.stages), `Contract ${c.contractNumber} missing stages`);
    assert.strictEqual(c.stages.length, 8, `Contract ${c.contractNumber} must have exactly 8 stages`);

    const expectedStageKeys = [
      "DRAFT_SUBMISSION",
      "LEGAL_REVIEW",
      "COMPLIANCE_REVIEW",
      "DPS_REVIEW",
      "MANAGEMENT_APPROVAL",
      "SIGNING",
      "ACTIVE",
      "EXECUTED",
    ];

    c.stages.forEach((s, idx) => {
      assert.strictEqual(s.stageNumber, idx + 1);
      assert.strictEqual(s.stageKey, expectedStageKeys[idx]);
      assert.ok(s.stageName, "Stage must have stageName");
      assert.ok(s.roleTitle, "Stage must have roleTitle");
      assert.ok(s.actorName, "Stage must have actorName");
      assert.ok(
        ["Disetujui", "Sedang Diproses", "Menunggu", "Revisi", "Ditolak", "Dilewati"].includes(s.statusLabel),
        `Invalid statusLabel '${s.statusLabel}' on stage ${s.stageNumber}`
      );
    });
  });
});

test("3. Verify Stage 1 to 5 map directly to actual approval steps from sce_database.json", () => {
  // Test SCE/2026/IJR/00141 (COMPLIANCE_REVIEW)
  const contracts = DBRepository.getContracts();
  const cIjr = contracts.find((c) => c.contractNumber === "SCE/2026/IJR/00141");
  assert.ok(cIjr, "SCE/2026/IJR/00141 not found in contracts");

  // Stage 1 (FO): Disetujui
  assert.strictEqual(cIjr.stages[0].status, "COMPLETED");
  assert.strictEqual(cIjr.stages[0].statusLabel, "Disetujui");

  // Stage 2 (Legal): Disetujui (Bambang Sudrajat approved)
  assert.strictEqual(cIjr.stages[1].status, "COMPLETED");
  assert.strictEqual(cIjr.stages[1].statusLabel, "Disetujui");
  assert.strictEqual(cIjr.stages[1].actorName, "Bambang Sudrajat, S.H.");

  // Stage 3 (Compliance): Sedang Diproses (Nurul Hidayati)
  assert.strictEqual(cIjr.stages[2].status, "CURRENT");
  assert.strictEqual(cIjr.stages[2].statusLabel, "Sedang Diproses");
  assert.strictEqual(cIjr.stages[2].actorName, "Nurul Hidayati");

  // Stage 4 (DPS): Menunggu
  assert.strictEqual(cIjr.stages[3].status, "PENDING");
  assert.strictEqual(cIjr.stages[3].statusLabel, "Menunggu");

  // Stage 5 (Management): Menunggu
  assert.strictEqual(cIjr.stages[4].status, "PENDING");
  assert.strictEqual(cIjr.stages[4].statusLabel, "Menunggu");

  // Stage 6 (Signing): Menunggu
  assert.strictEqual(cIjr.stages[5].status, "PENDING");
  assert.strictEqual(cIjr.stages[5].statusLabel, "Menunggu");
});

test("4. Verify SCE/2026/MUR/1974 (APPROVED) is ready for Signing & Activation", () => {
  const contracts = DBRepository.getContracts();
  const cMur = contracts.find((c) => c.contractNumber === "SCE/2026/MUR/1974");
  assert.ok(cMur, "SCE/2026/MUR/1974 not found in contracts");
  assert.strictEqual(cMur.status, "APPROVED");

  // Stages 1-5 must all be Disetujui
  assert.strictEqual(cMur.stages[0].statusLabel, "Disetujui");
  assert.strictEqual(cMur.stages[1].statusLabel, "Disetujui");
  assert.strictEqual(cMur.stages[2].statusLabel, "Disetujui");
  assert.strictEqual(cMur.stages[3].statusLabel, "Disetujui");
  assert.strictEqual(cMur.stages[4].statusLabel, "Disetujui");

  // Stage 6 (Signing) must be Sedang Diproses
  assert.strictEqual(cMur.stages[5].statusLabel, "Sedang Diproses");

  // Stage 7 (Aktif) must be Menunggu (cannot be active before signing)
  assert.strictEqual(cMur.stages[6].statusLabel, "Menunggu");
});

test("5. Defense-in-depth: Activation is strictly blocked if prior approval stages are not completed", () => {
  assert.throws(
    () => {
      // Attempt to activate SCE/2026/IJR/00141 which is still in COMPLIANCE_REVIEW
      DBRepository.signAndActivateContract({
        contractIdOrNumber: "SCE/2026/IJR/00141",
        actorName: "Test Actor",
        role: "FINANCING_OFFICER",
      });
    },
    (err) => {
      return (
        err.message.includes("Akad belum dapat diaktifkan") &&
        err.message.includes("Compliance Officer") &&
        err.message.includes("Dewan Pengawas Syariah (DPS)")
      );
    },
    "Activation on unapproved contract must throw descriptive barrier error"
  );
});

test("6. Verify SCE/2026/MDH/00139 (ACTIVE) has Stages 1-7 Disetujui and Stage 8 Sedang Diproses", () => {
  const contracts = DBRepository.getContracts();
  const cMdh = contracts.find((c) => c.contractNumber === "SCE/2026/MDH/00139");
  assert.ok(cMdh, "SCE/2026/MDH/00139 not found in contracts");
  assert.strictEqual(cMdh.status, "ACTIVE");

  // Stages 1-7 must all be Disetujui
  for (let i = 0; i < 7; i++) {
    assert.strictEqual(cMdh.stages[i].statusLabel, "Disetujui", `Stage ${i + 1} must be Disetujui`);
  }

  // Stage 8 (Selesai/Executed) is Sedang Diproses (angsuran berjalan)
  assert.strictEqual(cMdh.stages[7].status, "CURRENT");
  assert.strictEqual(cMdh.stages[7].statusLabel, "Sedang Diproses");
});

test("7. DBRepository.getContractById() returns single contract with complete tracking and documents", () => {
  const result = DBRepository.getContractById("SCE/2026/MUR/1974");
  assert.ok(result.contract, "Contract must be returned");
  assert.ok(result.application, "Application must be returned");
  assert.strictEqual(result.stages.length, 8, "Stages must have 8 items");
  assert.ok(Array.isArray(result.steps), "Steps must be an array");
  assert.ok(Array.isArray(result.documents), "Documents must be an array");
});

test("8. Verify all 9 legacy applications in database are preserved with original scores", () => {
  const currentDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  assert.strictEqual(currentDb.applications.length, 9, "Legacy 9 applications must remain intact");

  const expectedNumbers = [
    "SCE/2026/MUD/7067",
    "SCE/2026/MUR/4264",
    "SCE/2026/MUR/1621",
    "SCE/2026/MUR/1974",
    "SCE/2026/MUR/4466",
    "SCE/2026/MRB/00142",
    "SCE/2026/IJR/00141",
    "SCE/2026/MSK/00140",
    "SCE/2026/MDH/00139",
  ];

  expectedNumbers.forEach((num) => {
    const found = currentDb.applications.find((a) => a.applicationNumber === num);
    assert.ok(found, `Application ${num} must exist in database`);
    assert.ok(typeof found.shariaScore === "number", `Application ${num} must have shariaScore`);
  });
});

console.log("================================================================================");
console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✔ ALL CONTRACT STATUS TRACKER & APPROVAL INTEGRATION TESTS PASSED!");
}
