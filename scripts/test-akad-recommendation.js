#!/usr/bin/env node
/**
 * SCE — AI Akad Recommendation Engine Unit Test
 * Tests the pure logic of AkadRecommendationEngine without server.
 */

"use strict";

const path = require("path");

// Minimal polyfill — engine has no external deps (only @/types/akad and @/config/akad)
// We require the compiled engine via ts-node/jiti

let AkadRecommendationEngine;
let AKAD_REGISTRY;

try {
  // Use jiti with path alias resolution
  const jiti = require("jiti")(__filename, {
    interopDefault: true,
    cache: false,
    alias: {
      "@": path.join(__dirname, "../src"),
    },
  });
  const engineMod = jiti(path.join(__dirname, "../src/lib/akad/recommendation-engine.ts"));
  AkadRecommendationEngine = engineMod.AkadRecommendationEngine;
  const configMod = jiti(path.join(__dirname, "../src/config/akad.ts"));
  AKAD_REGISTRY = configMod.AKAD_REGISTRY;
} catch (e) {
  console.error("FATAL: Cannot load engine modules via jiti:", e.message);
  process.exit(1);
}

// ─── Test helpers ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (e) {
    console.error(`[FAIL] ${name}`);
    console.error("       →", e.message);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function assertEquals(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log("=".repeat(80));
console.log("   SCE — AI AKAD RECOMMENDATION ENGINE — UNIT TEST SUITE");
console.log("=".repeat(80));

// 1. Asset purchase → Murabahah
test("1. Pembelian aset mesin → Murabahah direkomendasikan", () => {
  const result = AkadRecommendationEngine.recommend({
    financingPurpose: "ASSET_PURCHASE",
    transactionObject: "Mesin konveksi 2 unit",
    financingAmount: 500_000_000,
    tenorMonths: 36,
    customerType: "SME",
    riskProfile: "CONSERVATIVE",
    wantsOwnershipTransfer: true,
    hasCollateral: true,
    businessHasTrackRecord: true,
  });
  assertEquals(result.recommendedAkad, "MURABAHAH", "Harus merekomendasikan MURABAHAH");
  assert(result.scores[0].score >= 60, `Skor Murabahah harus ≥ 60, got ${result.scores[0].score}`);
  assert(result.reasoning.includes("MURABAHAH") || result.reasoning.includes("Murabahah"), "Reasoning harus menyebut Murabahah");
});

// 2. Asset lease → Ijarah
test("2. Sewa alat berat tanpa kepemilikan → Ijarah direkomendasikan", () => {
  const result = AkadRecommendationEngine.recommend({
    financingPurpose: "ASSET_LEASE",
    transactionObject: "Excavator Komatsu PC200",
    financingAmount: 800_000_000,
    tenorMonths: 24,
    customerType: "CORPORATE",
    riskProfile: "MODERATE",
    wantsOwnershipTransfer: false,
    hasCollateral: true,
    businessHasTrackRecord: true,
  });
  assertEquals(result.recommendedAkad, "IJARAH", "Harus merekomendasikan IJARAH");
  assert(result.scores[0].score >= 50, `Skor Ijarah harus ≥ 50, got ${result.scores[0].score}`);
});

// 3. Business partnership → Musyarakah
test("3. Kemitraan usaha dengan modal nasabah → Musyarakah direkomendasikan", () => {
  const result = AkadRecommendationEngine.recommend({
    financingPurpose: "BUSINESS_PARTNERSHIP",
    transactionObject: "Ekspansi pabrik tahu bersama",
    financingAmount: 300_000_000,
    tenorMonths: 24,
    customerType: "SME",
    riskProfile: "GROWTH",
    hasCollateral: false,
    businessHasTrackRecord: true,
    capitalContributionPercent: 30,
  });
  assertEquals(result.recommendedAkad, "MUSYARAKAH", "Harus merekomendasikan MUSYARAKAH");
  assert(result.scores[0].score >= 50, `Skor Musyarakah harus ≥ 50`);
});

// 4. Business capital, no partner capital → Mudharabah
test("4. Modal usaha UMKM 100% dari lembaga → Mudharabah direkomendasikan", () => {
  const result = AkadRecommendationEngine.recommend({
    financingPurpose: "BUSINESS_CAPITAL",
    transactionObject: "Usaha dagang sembako",
    financingAmount: 100_000_000,
    tenorMonths: 12,
    customerType: "MICRO_BUSINESS",
    riskProfile: "GROWTH",
    hasCollateral: false,
    businessHasTrackRecord: true,
    capitalContributionPercent: 0,
  });
  assertEquals(result.recommendedAkad, "MUDHARABAH", "Harus merekomendasikan MUDHARABAH");
});

// 5. Result structure
test("5. Output memiliki struktur lengkap (scores, reasoning, alternatives, shariaPayloadHint)", () => {
  const result = AkadRecommendationEngine.recommend({
    financingPurpose: "PROPERTY",
    financingAmount: 400_000_000,
    tenorMonths: 120,
    customerType: "INDIVIDUAL",
    riskProfile: "CONSERVATIVE",
    wantsOwnershipTransfer: true,
    hasCollateral: true,
  });
  assert(Array.isArray(result.scores), "scores harus array");
  assertEquals(result.scores.length, 4, "Harus ada 4 skor akad");
  assert(typeof result.reasoning === "string" && result.reasoning.length > 20, "reasoning harus string bermakna");
  assert(Array.isArray(result.alternatives), "alternatives harus array");
  assert(typeof result.shariaPayloadHint === "object", "shariaPayloadHint harus object");
  assert(typeof result.evaluatedAt === "string", "evaluatedAt harus string ISO");
});

// 6. Confidence level
test("6. Confidence HIGH ketika selisih skor ≥ 25 poin", () => {
  const result = AkadRecommendationEngine.recommend({
    financingPurpose: "ASSET_PURCHASE",
    financingAmount: 200_000_000,
    tenorMonths: 24,
    customerType: "INDIVIDUAL",
    riskProfile: "CONSERVATIVE",
    wantsOwnershipTransfer: true,
    hasCollateral: true,
  });
  // Murabahah seharusnya menang jauh
  const murabahahScore = result.scores.find((s) => s.akad === "MURABAHAH")?.score ?? 0;
  const secondScore = result.scores.find((s) => s.akad !== "MURABAHAH")
    ? Math.max(...result.scores.filter((s) => s.akad !== "MURABAHAH").map((s) => s.score))
    : 0;
  if (murabahahScore - secondScore >= 25) {
    assertEquals(result.confidence, "HIGH", "Confidence harus HIGH ketika selisih ≥ 25");
  } else {
    assert(["HIGH", "MEDIUM", "LOW"].includes(result.confidence), "Confidence harus valid");
  }
});

// 7. ShariaPayloadHint key untuk masing-masing akad
test("7. shariaPayloadHint Murabahah mengandung costPrice dan profitMargin", () => {
  const result = AkadRecommendationEngine.recommend({
    financingPurpose: "ASSET_PURCHASE",
    financingAmount: 150_000_000,
    tenorMonths: 18,
    customerType: "SME",
    riskProfile: "CONSERVATIVE",
    wantsOwnershipTransfer: true,
    hasCollateral: true,
  });
  assertEquals(result.recommendedAkad, "MURABAHAH", "Harus merekomendasikan MURABAHAH");
  assert("costPrice" in result.shariaPayloadHint, "shariaPayloadHint harus ada costPrice");
  assert("profitMargin" in result.shariaPayloadHint, "shariaPayloadHint harus ada profitMargin");
});

// 8. Skor selalu 0-100
test("8. Semua skor akad dalam rentang 0–100", () => {
  const inputs = [
    { financingPurpose: "OTHER", financingAmount: 50_000_000, tenorMonths: 6, customerType: "INDIVIDUAL", riskProfile: "CONSERVATIVE" },
    { financingPurpose: "WORKING_CAPITAL", financingAmount: 2_000_000_000, tenorMonths: 400, customerType: "CORPORATE", riskProfile: "GROWTH" },
  ];
  for (const inp of inputs) {
    const result = AkadRecommendationEngine.recommend(inp);
    for (const s of result.scores) {
      assert(s.score >= 0 && s.score <= 100, `Skor ${s.akad} harus 0-100, got ${s.score}`);
    }
  }
});

// 9. AKAD_REGISTRY memiliki 4 akad yang valid
test("9. AKAD_REGISTRY memiliki 4 akad lengkap dengan fatwaDsnMui", () => {
  const expected = ["MURABAHAH", "IJARAH", "MUSYARAKAH", "MUDHARABAH"];
  for (const akad of expected) {
    assert(akad in AKAD_REGISTRY, `${akad} harus ada di AKAD_REGISTRY`);
    assert(Array.isArray(AKAD_REGISTRY[akad].fatwaDsnMui) && AKAD_REGISTRY[akad].fatwaDsnMui.length > 0,
      `${akad} harus memiliki referensi fatwaDsnMui`);
  }
});

// 10. Education purpose → Ijarah
test("10. Pembiayaan pendidikan/jasa → Ijarah direkomendasikan", () => {
  const result = AkadRecommendationEngine.recommend({
    financingPurpose: "EDUCATION",
    transactionObject: "Paket umroh 15 orang",
    financingAmount: 75_000_000,
    tenorMonths: 12,
    customerType: "INDIVIDUAL",
    riskProfile: "CONSERVATIVE",
    wantsOwnershipTransfer: false,
  });
  assertEquals(result.recommendedAkad, "IJARAH", "Pembiayaan jasa/pendidikan harus Ijarah");
});

// ─── Report ──────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(80));
console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=".repeat(80));

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✔ SEMUA TEST AI AKAD RECOMMENDATION ENGINE LULUS!\n");
}
