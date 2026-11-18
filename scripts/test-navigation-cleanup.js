/**
 * Navigation & Role-Based Menu Verification Test Suite
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("================================================================================");
console.log("   SCE — ROLE-BASED NAVIGATION & FEATURE CLEANUP VERIFICATION                   ");
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

const ALL_ROLES = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "FINANCING_OFFICER",
  "LEGAL_OFFICER",
  "COMPLIANCE_OFFICER",
  "SHARIA_REVIEWER",
  "MANAGEMENT",
  "AUDITOR",
];

const sidebarContent = fs.readFileSync(
  path.resolve("src/components/enterprise/enterprise-sidebar.tsx"),
  "utf-8"
);

// Helper to extract nav items from code for a role
function extractHrefsForRole(role) {
  const roleCase = `case "${role}":`;
  const afterCase = sidebarContent.split(roleCase)[1];
  if (!afterCase) return [];
  const block = afterCase.split("return [")[1]?.split("];")[0] || "";
  const matches = [...block.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
  return matches;
}

// 1. Verify no removed decorative features exist in navigation
test("1. Verify /brand-assets and decorative tools are completely absent from all roles' nav", () => {
  assert.strictEqual(sidebarContent.includes("/brand-assets"), false, "Sidebar still contains /brand-assets");
  assert.strictEqual(sidebarContent.includes("/design-system"), false, "Sidebar still contains /design-system");
  assert.strictEqual(sidebarContent.includes("Logo & Brand Kit"), false, "Sidebar still contains Logo & Brand Kit");
});

// 2. Verify files are completely deleted from disk
test("2. Verify brand-assets and design-system directories do not exist", () => {
  const brandAssetsExists = fs.existsSync(path.resolve("src/app/(dashboard)/brand-assets"));
  const designSystemExists = fs.existsSync(path.resolve("src/app/(dashboard)/design-system"));
  const brandDownloadCenterExists = fs.existsSync(path.resolve("src/components/brand/brand-download-center.tsx"));

  assert.strictEqual(brandAssetsExists, false, "src/app/(dashboard)/brand-assets must not exist");
  assert.strictEqual(designSystemExists, false, "src/app/(dashboard)/design-system must not exist");
  assert.strictEqual(brandDownloadCenterExists, false, "brand-download-center.tsx must not exist");
});

// 3. Verify core SCE identity assets still intact
test("3. Verify core SCE logo component and assets remain intact for sidebar & header", () => {
  const logoComponentExists = fs.existsSync(path.resolve("src/components/brand/sce-logo.tsx"));
  assert.strictEqual(logoComponentExists, true, "sce-logo.tsx must exist");
});

// 4. Role-based menu verification per specification
test("4. FINANCING_OFFICER navigation matches permissions", () => {
  const hrefs = extractHrefsForRole("FINANCING_OFFICER");
  assert.ok(hrefs.includes("/dashboard"));
  assert.ok(hrefs.includes("/customers"));
  assert.ok(hrefs.includes("/contracts"));
  assert.ok(hrefs.includes("/documents/generator"));
  assert.ok(hrefs.includes("/documents"));
  assert.ok(hrefs.includes("/sharia-rules"));
  // Must NOT include administrative / executive / approval review menus
  assert.ok(!hrefs.includes("/approvals"), "FO must not have approvals review menu");
  assert.ok(!hrefs.includes("/billing"), "FO must not have billing");
  assert.ok(!hrefs.includes("/settings"), "FO must not have settings");
  assert.ok(!hrefs.includes("/admin"), "FO must not have admin");
});

test("5. LEGAL_OFFICER navigation matches permissions", () => {
  const hrefs = extractHrefsForRole("LEGAL_OFFICER");
  assert.ok(hrefs.includes("/dashboard"));
  assert.ok(hrefs.includes("/approvals"));
  assert.ok(hrefs.includes("/contracts"));
  assert.ok(hrefs.includes("/documents/generator"));
  assert.ok(hrefs.includes("/documents"));
  assert.ok(hrefs.includes("/sharia-rules"));
  assert.ok(hrefs.includes("/customers"));
  assert.ok(!hrefs.includes("/billing"));
  assert.ok(!hrefs.includes("/settings"));
  assert.ok(!hrefs.includes("/admin"));
});

test("6. COMPLIANCE_OFFICER navigation matches permissions", () => {
  const hrefs = extractHrefsForRole("COMPLIANCE_OFFICER");
  assert.ok(hrefs.includes("/dashboard"));
  assert.ok(hrefs.includes("/approvals"));
  assert.ok(hrefs.includes("/sharia-rules"));
  assert.ok(hrefs.includes("/contracts"));
  assert.ok(hrefs.includes("/analytics"));
  assert.ok(hrefs.includes("/customers"));
  assert.ok(hrefs.includes("/documents"));
  assert.ok(!hrefs.includes("/billing"));
  assert.ok(!hrefs.includes("/settings"));
});

test("7. SHARIA_REVIEWER (DPS) navigation matches permissions", () => {
  const hrefs = extractHrefsForRole("SHARIA_REVIEWER");
  assert.ok(hrefs.includes("/dashboard"));
  assert.ok(hrefs.includes("/approvals"));
  assert.ok(hrefs.includes("/sharia-rules"));
  assert.ok(hrefs.includes("/contracts"));
  assert.ok(hrefs.includes("/contracts/mapping"));
  assert.ok(hrefs.includes("/documents"));
  assert.ok(hrefs.includes("/customers"));
  assert.ok(!hrefs.includes("/billing"));
  assert.ok(!hrefs.includes("/settings"));
});

test("8. MANAGEMENT navigation matches permissions", () => {
  const hrefs = extractHrefsForRole("MANAGEMENT");
  assert.ok(hrefs.includes("/dashboard"));
  assert.ok(hrefs.includes("/approvals"));
  assert.ok(hrefs.includes("/contracts"));
  assert.ok(hrefs.includes("/analytics"));
  assert.ok(hrefs.includes("/customers"));
  assert.ok(hrefs.includes("/documents"));
  assert.ok(hrefs.includes("/billing"));
  assert.ok(!hrefs.includes("/sharia-rules"));
});

test("9. AUDITOR navigation matches permissions", () => {
  const hrefs = extractHrefsForRole("AUDITOR");
  assert.ok(hrefs.includes("/dashboard"));
  assert.ok(hrefs.includes("/analytics"));
  assert.ok(hrefs.includes("/contracts"));
  assert.ok(hrefs.includes("/approvals"));
  assert.ok(hrefs.includes("/sharia-rules"));
  assert.ok(hrefs.includes("/documents"));
  assert.ok(hrefs.includes("/customers"));
  assert.ok(!hrefs.includes("/documents/generator"));
  assert.ok(!hrefs.includes("/settings"));
});

test("10. INSTITUTION_ADMIN navigation matches permissions", () => {
  const hrefs = extractHrefsForRole("INSTITUTION_ADMIN");
  assert.ok(hrefs.includes("/dashboard"));
  assert.ok(hrefs.includes("/customers"));
  assert.ok(hrefs.includes("/contracts"));
  assert.ok(hrefs.includes("/approvals"));
  assert.ok(hrefs.includes("/documents/generator"));
  assert.ok(hrefs.includes("/sharia-rules"));
  assert.ok(hrefs.includes("/analytics"));
  assert.ok(hrefs.includes("/documents"));
  assert.ok(hrefs.includes("/billing"));
  assert.ok(hrefs.includes("/settings"));
  assert.ok(!hrefs.includes("/admin"), "Institution Admin must not have super admin SaaS HQ");
});

test("11. SUPER_ADMIN navigation matches permissions", () => {
  const hrefs = extractHrefsForRole("SUPER_ADMIN");
  assert.ok(hrefs.includes("/admin"));
  assert.ok(hrefs.includes("/dashboard"));
  assert.ok(hrefs.includes("/settings"));
  assert.ok(hrefs.includes("/contracts"));
  assert.ok(hrefs.includes("/sharia-rules"));
  assert.ok(hrefs.includes("/analytics"));
  assert.ok(hrefs.includes("/customers"));
});

// 12. Check that all referenced routes actually have an existing page component
test("12. Verify every navigation route maps to an existing page (no 404 dead links)", () => {
  const allHrefs = new Set();
  for (const role of ALL_ROLES) {
    const hrefs = extractHrefsForRole(role);
    hrefs.forEach((h) => allHrefs.add(h));
  }

  for (const href of allHrefs) {
    let pagePath;
    if (href === "/admin") {
      pagePath = path.resolve("src/app/(admin)/admin/page.tsx");
    } else {
      const cleanHref = href.startsWith("/") ? href.slice(1) : href;
      pagePath = path.resolve(`src/app/(dashboard)/${cleanHref}/page.tsx`);
    }
    assert.strictEqual(
      fs.existsSync(pagePath),
      true,
      `Route ${href} does not have an existing page.tsx at ${pagePath}`
    );
  }
});

console.log("\n================================================================================");
console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
}
