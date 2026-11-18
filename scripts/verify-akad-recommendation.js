#!/usr/bin/env node
"use strict";
const path = require("path");
const jiti = require("jiti")(__filename, {
  interopDefault: true,
  cache: false,
  alias: { "@": path.join(__dirname, "../src") },
});

const { AkadRecommendationEngine } = jiti(path.join(__dirname, "../src/lib/akad/recommendation-engine.ts"));
const { ShariaRuleEngine } = jiti(path.join(__dirname, "../src/lib/sharia/engine.ts"));

console.log("=".repeat(70));
console.log("   VERIFY: Engine variability + ShariaRuleEngine integration");
console.log("=".repeat(70));

let pass = 0; let fail = 0;

function check(label, cond) {
  if (cond) { console.log("[PASS] " + label); pass++; }
  else       { console.log("[FAIL] " + label); fail++; }
}

// 4 different inputs → expect 4 different recommendations
const inputs = [
  { financingPurpose: "ASSET_PURCHASE",       financingAmount: 500e6, tenorMonths: 36, customerType: "SME",          riskProfile: "CONSERVATIVE", wantsOwnershipTransfer: true,  hasCollateral: true, businessHasTrackRecord: true },
  { financingPurpose: "ASSET_LEASE",           financingAmount: 800e6, tenorMonths: 24, customerType: "CORPORATE",    riskProfile: "MODERATE",     wantsOwnershipTransfer: false },
  { financingPurpose: "BUSINESS_PARTNERSHIP",  financingAmount: 300e6, tenorMonths: 24, customerType: "SME",          riskProfile: "GROWTH",       capitalContributionPercent: 30, businessHasTrackRecord: true },
  { financingPurpose: "BUSINESS_CAPITAL",      financingAmount: 100e6, tenorMonths: 12, customerType: "MICRO_BUSINESS", riskProfile: "GROWTH",     capitalContributionPercent: 0,  businessHasTrackRecord: true },
];

const recs = [];
for (const inp of inputs) {
  const rec = AkadRecommendationEngine.recommend(inp);
  recs.push(rec.recommendedAkad);

  // Validate sharia payload hint
  const val = ShariaRuleEngine.evaluate(
    rec.recommendedAkad,
    rec.shariaPayloadHint,
    { contractNumber: "TEST-VERIFY-001" }
  );

  check(
    `[${inp.financingPurpose}] → ${rec.recommendedAkad} (skor=${rec.scores[0].score}, confidence=${rec.confidence}) | Sharia: ${val.status} (${val.overallScore}/100)`,
    val && typeof val.overallScore === "number" && ["COMPLIANT","WARNING","NON_COMPLIANT","NEEDS_MANUAL_REVIEW"].includes(val.status)
  );
}

// All 4 recommendations must differ (proves non-static output)
const unique = new Set(recs);
check(`Engine menghasilkan ${unique.size}/4 rekomendasi berbeda (non-statis)`, unique.size === 4);

// shariaPayloadHint for Murabahah must have required fields
const mRec = AkadRecommendationEngine.recommend(inputs[0]);
check("shariaPayloadHint Murabahah: costPrice ada", "costPrice" in mRec.shariaPayloadHint);
check("shariaPayloadHint Murabahah: profitMargin ada", "profitMargin" in mRec.shariaPayloadHint);
check("shariaPayloadHint Murabahah: isGoodsReceived ada", "isGoodsReceived" in mRec.shariaPayloadHint);

// shariaPayloadHint for Ijarah
const iRec = AkadRecommendationEngine.recommend(inputs[1]);
check("shariaPayloadHint Ijarah: assetValue ada", "assetValue" in iRec.shariaPayloadHint);
check("shariaPayloadHint Ijarah: isImbt ada", "isImbt" in iRec.shariaPayloadHint);

// shariaPayloadHint for Musyarakah
const msRec = AkadRecommendationEngine.recommend(inputs[2]);
check("shariaPayloadHint Musyarakah: institutionNisbah ada", "institutionNisbah" in msRec.shariaPayloadHint);
check("shariaPayloadHint Musyarakah: partnerNisbah ada", "partnerNisbah" in msRec.shariaPayloadHint);

// shariaPayloadHint for Mudharabah
const mdRec = AkadRecommendationEngine.recommend(inputs[3]);
check("shariaPayloadHint Mudharabah: shahibulMalNisbah ada", "shahibulMalNisbah" in mdRec.shariaPayloadHint);
check("shariaPayloadHint Mudharabah: mudharibNisbah ada", "mudharibNisbah" in mdRec.shariaPayloadHint);

// Router path: recommendedAkad → lowercase → valid contract path
const akadPaths = ["murabahah", "ijarah", "musyarakah", "mudharabah"];
const allPaths = recs.map(r => r.toLowerCase());
check(
  `Tombol lanjut: semua akad.toLowerCase() menghasilkan path valid (${allPaths.join(", ")})`,
  allPaths.every(p => akadPaths.includes(p))
);

console.log("\n" + "=".repeat(70));
console.log(`   RESULTS: ${pass} PASS, ${fail} FAIL`);
console.log("=".repeat(70));
if (fail > 0) process.exit(1);
