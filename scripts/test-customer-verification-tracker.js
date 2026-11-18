/**
 * SCE — CUSTOMER ONBOARDING & VERIFICATION TRACKER TEST SUITE
 * Tests:
 * 1. Creation of new customer without auto-verification (isVerified=false, amlStatus="NOT_SCREENED").
 * 2. Status field independence: registrationStatus, kycStatus, amlStatus, riskRating.
 * 3. 5-stage verification steps tracking (Submission -> KYC -> AML -> Risk -> Final Approval).
 * 4. KYC revision flow (REQUEST_REVISION_KYC -> SUBMIT_REVISED_DATA).
 * 5. AML Screening & Risk assessment.
 * 6. Defense-in-depth: Final Approval blocked if KYC not verified or AML not cleared.
 * 7. AML FLAGGED customer blocked from new financing applications.
 * 8. RBAC enforcement: only Compliance/Admin can verify KYC/AML/Approve.
 * 9. Backward compatibility: legacy customers safely normalized without database schema changes.
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
console.log("   SCE — CUSTOMER ONBOARDING & VERIFICATION TRACKER TEST SUITE                 ");
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
const initialDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
const initialCustomerCount = initialDb.customers.length;
const initialAppCount = initialDb.applications.length;

let testCustomerId = null;
const ORG_ID = "org-bprs-albarakah";

// 1. Verify database integrity
test("1. Database contains legacy applications and customers", () => {
  assert.ok(initialAppCount >= 9, "Legacy 9 applications must be preserved");
  assert.ok(initialCustomerCount >= 6, "Legacy customers must be preserved");
});

// 2. Backward compatibility of legacy customers
test("2. Legacy customers are safely normalized with distinct status fields and 5-stage tracker", () => {
  const customers = DBRepository.getCustomers({ organizationId: ORG_ID });
  assert.ok(customers.length >= initialCustomerCount, "Customer count mismatch");

  customers.forEach((c) => {
    assert.ok(c.registrationStatus, `Customer ${c.id} missing registrationStatus`);
    assert.ok(c.kycStatus, `Customer ${c.id} missing kycStatus`);
    assert.ok(c.amlStatus, `Customer ${c.id} missing amlStatus`);
    assert.ok(c.riskRating, `Customer ${c.id} missing riskRating`);
    assert.strictEqual(typeof c.isVerified, "boolean", `Customer ${c.id} isVerified not boolean`);
    assert.ok(Array.isArray(c.verificationSteps), `Customer ${c.id} missing verificationSteps`);
    assert.strictEqual(c.verificationSteps.length, 5, `Customer ${c.id} must have exactly 5 verification steps`);
  });
});

// 3. New customer registration — NOT automatically verified or cleared
test("3. New customer starts as SUBMITTED, PENDING KYC, NOT_SCREENED AML, and isVerified=false", () => {
  const newCust = DBRepository.createCustomer({
    organizationId: ORG_ID,
    type: "INDIVIDUAL",
    name: "Ahmad Dahlan Test",
    identifierNumber: `32010199000${Date.now().toString().slice(-5)}`,
    phone: "081299887766",
    email: "ahmad.dahlan.test@example.com",
    address: "Jl. Merdeka No. 45",
    city: "Bandung",
    province: "Jawa Barat",
  });

  testCustomerId = newCust.id;
  assert.strictEqual(newCust.registrationStatus, "SUBMITTED");
  assert.strictEqual(newCust.kycStatus, "PENDING");
  assert.strictEqual(newCust.amlStatus, "NOT_SCREENED");
  assert.strictEqual(newCust.isVerified, false, "CRUCIAL: New customer must NEVER be auto-verified");
  assert.strictEqual(newCust.verificationSteps.length, 5);
  assert.strictEqual(newCust.verificationSteps[0].status, "COMPLETED");
  assert.strictEqual(newCust.verificationSteps[1].status, "CURRENT");
});

// 4. KYC Revision Flow (Compliance requests revision -> FO submits revised data)
test("4. Compliance Officer requests KYC revision and FO resubmits revised data", () => {
  assert.ok(testCustomerId, "testCustomerId required");

  // Compliance requests revision
  const revised = DBRepository.processCustomerVerificationAction({
    customerId: testCustomerId,
    contextOrganizationId: ORG_ID,
    actor: { userId: "user-comp", fullName: "Dewi Compliance", role: "COMPLIANCE_OFFICER" },
    action: "REQUEST_REVISION_KYC",
    comments: "Foto KTP buram, mohon upload ulang foto e-KTP yang jelas.",
  });

  assert.strictEqual(revised.kycStatus, "REVISION_REQUIRED");
  assert.strictEqual(revised.verificationSteps[1].status, "REVISION_REQUIRED");
  assert.ok(revised.revisionNotes.includes("Foto KTP buram"));

  // FO resubmits revised data
  const resubmitted = DBRepository.processCustomerVerificationAction({
    customerId: testCustomerId,
    contextOrganizationId: ORG_ID,
    actor: { userId: "user-fo", fullName: "Fatimah FO", role: "FINANCING_OFFICER" },
    action: "SUBMIT_REVISED_DATA",
    comments: "Foto e-KTP resolusi tinggi telah diunggah kembali.",
  });

  assert.strictEqual(resubmitted.kycStatus, "PENDING");
  assert.strictEqual(resubmitted.verificationSteps[1].status, "CURRENT");
});

// 5. KYC Verification by Compliance Officer
test("5. Compliance Officer successfully verifies KYC document validity", () => {
  const verified = DBRepository.processCustomerVerificationAction({
    customerId: testCustomerId,
    contextOrganizationId: ORG_ID,
    actor: { userId: "user-comp", fullName: "Dewi Compliance", role: "COMPLIANCE_OFFICER" },
    action: "VERIFY_KYC",
    comments: "Identitas NIK dan dokumen nasabah telah divalidasi ke Dukcapil.",
    documentsInspected: ["KTP Asli", "NPWP Pribadi"],
  });

  assert.strictEqual(verified.kycStatus, "VERIFIED");
  assert.strictEqual(verified.verificationSteps[1].status, "COMPLETED");
  assert.strictEqual(verified.verificationSteps[2].status, "CURRENT");
});

// 6. Defense-in-depth: Final Approval BLOCKED when AML is not yet cleared
test("6. Defense-in-depth: Final Approval is strictly blocked when AML is not yet cleared", () => {
  assert.throws(
    () => {
      DBRepository.processCustomerVerificationAction({
        customerId: testCustomerId,
        contextOrganizationId: ORG_ID,
        actor: { userId: "user-comp", fullName: "Dewi Compliance", role: "COMPLIANCE_OFFICER" },
        action: "FINAL_APPROVE",
      });
    },
    (err) => err.message.includes("CUSTOMER_AML_NOT_CLEARED"),
    "Should throw CUSTOMER_AML_NOT_CLEARED error"
  );
});

// 7. AML Screening & Risk Assessment
test("7. Compliance Officer conducts AML/CFT screening (CLEARED) and Risk Assessment (LOW)", () => {
  const amlCleared = DBRepository.processCustomerVerificationAction({
    customerId: testCustomerId,
    contextOrganizationId: ORG_ID,
    actor: { userId: "user-comp", fullName: "Dewi Compliance", role: "COMPLIANCE_OFFICER" },
    action: "SET_AML_CLEARED",
    comments: "Pemeriksaan DTTOT dan daftar sanksi PPATK bersih.",
  });

  assert.strictEqual(amlCleared.amlStatus, "CLEARED");
  assert.strictEqual(amlCleared.verificationSteps[2].status, "COMPLETED");

  const riskSet = DBRepository.processCustomerVerificationAction({
    customerId: testCustomerId,
    contextOrganizationId: ORG_ID,
    actor: { userId: "user-comp", fullName: "Dewi Compliance", role: "COMPLIANCE_OFFICER" },
    action: "SET_RISK_RATING",
    riskRating: "LOW",
    comments: "Nasabah berpenghasilan tetap, profil risiko rendah.",
  });

  assert.strictEqual(riskSet.riskRating, "LOW");
  assert.strictEqual(riskSet.verificationSteps[3].status, "COMPLETED");
  assert.strictEqual(riskSet.verificationSteps[4].status, "CURRENT");
});

// 8. Final Approval by Compliance Officer / Admin
test("8. Compliance Officer grants Final Approval once KYC is Verified and AML is Cleared", () => {
  const approved = DBRepository.processCustomerVerificationAction({
    customerId: testCustomerId,
    contextOrganizationId: ORG_ID,
    actor: { userId: "user-comp", fullName: "Dewi Compliance", role: "COMPLIANCE_OFFICER" },
    action: "FINAL_APPROVE",
    comments: "Nasabah resmi disetujui untuk pengajuan akad pembiayaan.",
  });

  assert.strictEqual(approved.registrationStatus, "APPROVED");
  assert.strictEqual(approved.isVerified, true);
  assert.strictEqual(approved.verificationSteps[4].status, "COMPLETED");
  assert.ok(approved.verifiedBy.includes("Dewi Compliance"));
});

// 9. RBAC Enforcement: Unauthorized role blocked from verification actions
test("9. RBAC: Financing Officer or Auditor is strictly blocked from executing verification actions", () => {
  assert.throws(
    () => {
      DBRepository.processCustomerVerificationAction({
        customerId: testCustomerId,
        contextOrganizationId: ORG_ID,
        actor: { userId: "user-fo", fullName: "Fatimah FO", role: "FINANCING_OFFICER" },
        action: "FINAL_REJECT",
      });
    },
    (err) => err.message.includes("FORBIDDEN"),
    "Should throw FORBIDDEN error for FO attempting FINAL_REJECT"
  );

  assert.throws(
    () => {
      DBRepository.processCustomerVerificationAction({
        customerId: testCustomerId,
        contextOrganizationId: ORG_ID,
        actor: { userId: "user-audit", fullName: "Auditor Internal", role: "AUDITOR" },
        action: "VERIFY_KYC",
      });
    },
    (err) => err.message.includes("FORBIDDEN"),
    "Should throw FORBIDDEN error for Auditor attempting VERIFY_KYC"
  );
});

// 10. AML FLAGGED customer strictly blocked from new financing applications
test("10. Customer with AML FLAGGED is strictly blocked from new financing applications", () => {
  // Flag the test customer
  const flagged = DBRepository.processCustomerVerificationAction({
    customerId: testCustomerId,
    contextOrganizationId: ORG_ID,
    actor: { userId: "user-comp", fullName: "Dewi Compliance", role: "COMPLIANCE_OFFICER" },
    action: "SET_AML_FLAGGED",
    comments: "Terindikasi dalam daftar penelusuran transaksi mencurigakan.",
  });

  assert.strictEqual(flagged.amlStatus, "FLAGGED");
  assert.strictEqual(flagged.registrationStatus, "REJECTED");
  assert.strictEqual(flagged.isVerified, false);

  // Attempting to create an application with this customer MUST throw CUSTOMER_AML_BLOCKED
  assert.throws(
    () => {
      DBRepository.createApplication({
        organizationId: ORG_ID,
        customerId: testCustomerId,
        createdById: "user-fo",
        createdByName: "Fatimah FO",
        akad: "MURABAHAH",
        title: "Pembiayaan Sepeda Motor",
        customerName: flagged.name,
        commodityOrAsset: "Yamaha NMAX",
        costPrice: 32000000,
        marginOrNisbah: 4800000,
        tenorMonths: 24,
      });
    },
    (err) => err.message.includes("CUSTOMER_AML_BLOCKED"),
    "Should throw CUSTOMER_AML_BLOCKED error"
  );
});

// Cleanup: remove temporary test customer so database returns to pristine state
try {
  const currentDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  currentDb.customers = currentDb.customers.filter((c) => c.id !== testCustomerId);
  fs.writeFileSync(dbPath, JSON.stringify(currentDb, null, 2), "utf-8");
} catch (e) {
  // ignore
}

console.log("================================================================================");
console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✔ ALL CUSTOMER ONBOARDING & VERIFICATION TRACKER TESTS PASSED!");
}
