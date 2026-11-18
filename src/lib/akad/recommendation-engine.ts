/**
 * AI Akad Recommendation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule-based scoring engine yang mensimulasikan pendekatan AI untuk merekomen-
 * dasikan jenis akad syariah yang paling sesuai berdasarkan karakteristik
 * transaksi, kebutuhan pembiayaan, dan profil nasabah.
 *
 * Prinsip:
 * - AI hanya MEREKOMENDASIKAN — keputusan syariah tetap di tangan DPS/Manajemen.
 * - Setiap skor didukung reasoning yang dapat diaudit.
 * - Output langsung dapat diteruskan ke ShariaRuleEngine.evaluate() untuk validasi.
 */

import { AkadCategory } from "@/types/akad";
import { AKAD_REGISTRY } from "@/config/akad";

// ─── Input Schema ────────────────────────────────────────────────────────────

export type FinancingPurpose =
  | "ASSET_PURCHASE"       // Pembelian aset/barang (cocok Murabahah)
  | "ASSET_LEASE"          // Sewa aset/peralatan (cocok Ijarah)
  | "BUSINESS_PARTNERSHIP" // Kemitraan usaha (cocok Musyarakah)
  | "BUSINESS_CAPITAL"     // Modal usaha/investasi (cocok Mudharabah)
  | "PROPERTY"             // Properti/KPR (Murabahah atau IMBT)
  | "VEHICLE"              // Kendaraan (Murabahah atau Ijarah)
  | "EDUCATION"            // Pendidikan/jasa (Ijarah)
  | "WORKING_CAPITAL"      // Modal kerja dagang (Mudharabah atau Musyarakah)
  | "OTHER";

export type CustomerType =
  | "INDIVIDUAL"           // Perorangan
  | "MICRO_BUSINESS"       // UMKM
  | "SME"                  // UKM
  | "CORPORATE";           // Korporasi

export type RiskProfile =
  | "CONSERVATIVE"         // Risiko rendah, preferensi aset tetap
  | "MODERATE"             // Risiko sedang, campuran
  | "GROWTH";              // Risiko tinggi, berbasis bagi hasil

export interface AkadRecommendationInput {
  // Tujuan pembiayaan
  financingPurpose: FinancingPurpose;
  // Objek transaksi
  transactionObject?: string;        // Deskripsi aset/barang/jasa
  // Nilai pembiayaan (Rp)
  financingAmount: number;
  // Tenor yang diinginkan (bulan)
  tenorMonths: number;
  // Profil nasabah
  customerType: CustomerType;
  riskProfile: RiskProfile;
  // Preferensi tambahan
  wantsOwnershipTransfer?: boolean;  // Apakah ingin kepemilikan aset di akhir
  hasCollateral?: boolean;           // Apakah ada agunan
  businessHasTrackRecord?: boolean;  // Apakah usaha sudah berjalan
  capitalContributionPercent?: number; // Kontribusi modal nasabah (0–100)
  // Input bebas dari FO
  additionalNotes?: string;
}

// ─── Output Schema ───────────────────────────────────────────────────────────

export interface AkadScore {
  akad: AkadCategory;
  score: number;           // 0–100
  reasons: string[];       // Alasan positif mengapa akad ini sesuai
  cautions: string[];      // Hal-hal yang perlu diperhatikan
  requiredFields: string[]; // Field yang perlu diisi untuk pengajuan
}

export interface AkadRecommendationResult {
  recommendedAkad: AkadCategory;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  scores: AkadScore[];          // Semua akad, diurutkan score tertinggi
  reasoning: string;            // Narasi ringkasan rekomendasi
  alternatives: AkadCategory[]; // Alternatif akad layak (score ≥ 60)
  shariaPayloadHint: Record<string, unknown>; // Payload siap kirim ke ShariaRuleEngine
  evaluatedAt: string;
}

// ─── Scoring Rules ───────────────────────────────────────────────────────────

function scoreMurabahah(input: AkadRecommendationInput): AkadScore {
  let score = 0;
  const reasons: string[] = [];
  const cautions: string[] = [];

  // Tujuan pembiayaan
  if (["ASSET_PURCHASE", "PROPERTY", "VEHICLE"].includes(input.financingPurpose)) {
    score += 40;
    reasons.push("Tujuan pembelian aset/barang sangat sesuai dengan struktur Murabahah (cost-plus sale).");
  } else if (input.financingPurpose === "OTHER") {
    score += 15;
  }

  // Kepemilikan aset
  if (input.wantsOwnershipTransfer !== false) {
    score += 20;
    reasons.push("Nasabah menginginkan kepemilikan aset — Murabahah mengalihkan kepemilikan langsung saat akad.");
  }

  // Agunan tersedia
  if (input.hasCollateral) {
    score += 10;
    reasons.push("Tersedia agunan — mendukung klausul jaminan dalam Murabahah.");
  }

  // Profil risiko konservatif
  if (input.riskProfile === "CONSERVATIVE") {
    score += 15;
    reasons.push("Profil risiko konservatif sesuai dengan kepastian margin tetap Murabahah.");
  } else if (input.riskProfile === "GROWTH") {
    cautions.push("Nasabah growth-oriented mungkin lebih cocok akad bagi hasil (Musyarakah/Mudharabah).");
  }

  // Tenor
  const [minT, maxT] = AKAD_REGISTRY.MURABAHAH.defaultTenorRangeMonths;
  if (input.tenorMonths >= minT && input.tenorMonths <= maxT) {
    score += 10;
    reasons.push(`Tenor ${input.tenorMonths} bulan masuk rentang standar Murabahah (${minT}–${maxT} bulan).`);
  } else if (input.tenorMonths > maxT) {
    cautions.push(`Tenor ${input.tenorMonths} bulan melebihi batas maksimum Murabahah (${maxT} bulan).`);
    score -= 10;
  }

  // Nilai pembiayaan
  if (input.financingAmount >= 10_000_000) {
    score += 5;
    reasons.push("Nilai pembiayaan memadai untuk transaksi Murabahah.");
  }

  return {
    akad: "MURABAHAH",
    score: Math.min(100, Math.max(0, score)),
    reasons,
    cautions,
    requiredFields: ["costPrice", "profitMargin", "tenorMonths", "commodityDescription", "isGoodsReceived"],
  };
}

function scoreIjarah(input: AkadRecommendationInput): AkadScore {
  let score = 0;
  const reasons: string[] = [];
  const cautions: string[] = [];

  // Tujuan sewa
  if (["ASSET_LEASE", "EDUCATION"].includes(input.financingPurpose)) {
    score += 45;
    reasons.push("Tujuan sewa jasa/manfaat aset sangat tepat untuk struktur Ijarah (transfer hak manfaat).");
  } else if (input.financingPurpose === "VEHICLE" && input.wantsOwnershipTransfer) {
    score += 25;
    reasons.push("Pembiayaan kendaraan dengan transfer kepemilikan cocok dengan Ijarah IMBT.");
  } else if (input.financingPurpose === "PROPERTY" && input.wantsOwnershipTransfer) {
    score += 20;
    reasons.push("Properti dengan kepemilikan akhir dapat menggunakan IMBT (Ijarah Muntahiya Bittamlik).");
  }

  // Kepemilikan akhir via Wa'd
  if (input.wantsOwnershipTransfer) {
    score += 10;
    reasons.push("Kepemilikan akhir dapat diakomodasi via janji Wa'd dalam akad IMBT.");
  } else if (input.wantsOwnershipTransfer === false) {
    score += 15;
    reasons.push("Tidak butuh kepemilikan aset — Ijarah murni ideal karena nasabah hanya butuh manfaat.");
  }

  // Profil moderate/konservatif
  if (["CONSERVATIVE", "MODERATE"].includes(input.riskProfile)) {
    score += 15;
    reasons.push("Ujrah Ijarah bersifat tetap per periode — memberikan kepastian biaya.");
  }

  // Tenor
  const [minT, maxT] = AKAD_REGISTRY.IJARAH.defaultTenorRangeMonths;
  if (input.tenorMonths >= minT && input.tenorMonths <= maxT) {
    score += 10;
    reasons.push(`Tenor ${input.tenorMonths} bulan sesuai rentang Ijarah (${minT}–${maxT} bulan).`);
  } else if (input.tenorMonths < minT) {
    cautions.push(`Tenor ${input.tenorMonths} bulan di bawah minimum Ijarah (${minT} bulan).`);
    score -= 5;
  }

  cautions.push("Pemeliharaan pokok objek sewa tetap menjadi tanggung jawab lembaga (pemberi sewa).");

  return {
    akad: "IJARAH",
    score: Math.min(100, Math.max(0, score)),
    reasons,
    cautions,
    requiredFields: ["assetDescription", "assetValue", "rentalFeePerMonth", "rentalPeriodMonths", "isImbt"],
  };
}

function scoreMusyarakah(input: AkadRecommendationInput): AkadScore {
  let score = 0;
  const reasons: string[] = [];
  const cautions: string[] = [];

  // Tujuan kemitraan
  if (["BUSINESS_PARTNERSHIP", "WORKING_CAPITAL"].includes(input.financingPurpose)) {
    score += 40;
    reasons.push("Pembiayaan kemitraan/modal kerja berbasis risiko bersama sangat sesuai dengan Musyarakah.");
  } else if (input.financingPurpose === "PROPERTY") {
    score += 25;
    reasons.push("Pemilikan properti via Musyarakah Mutanaqisah (MMQ) adalah alternatif kuat untuk KPR Syariah.");
  }

  // Kontribusi modal nasabah
  const cp = input.capitalContributionPercent ?? 0;
  if (cp >= 20 && cp <= 80) {
    score += 20;
    reasons.push(`Kontribusi modal nasabah ${cp}% mendukung struktur syirkah yang seimbang.`);
  } else if (cp > 0) {
    score += 10;
    reasons.push("Nasabah berkontribusi modal — sesuai syarat syirkah dalam Musyarakah.");
  } else {
    cautions.push("Musyarakah membutuhkan kontribusi modal dari nasabah. Modal 100% dari lembaga beralih ke Mudharabah.");
  }

  // Track record usaha
  if (input.businessHasTrackRecord) {
    score += 15;
    reasons.push("Usaha memiliki rekam jejak — mendukung due diligence kemitraan Musyarakah.");
  }

  // Profil risiko
  if (input.riskProfile === "GROWTH") {
    score += 10;
    reasons.push("Profil growth-oriented sesuai dengan bagi hasil berbasis kinerja Musyarakah.");
  }

  // Tipe nasabah
  if (["SME", "CORPORATE"].includes(input.customerType)) {
    score += 10;
    reasons.push("Tipe nasabah UKM/Korporasi memiliki kapasitas manajemen yang diperlukan dalam syirkah.");
  }

  // Tenor
  const [minT, maxT] = AKAD_REGISTRY.MUSYARAKAH.defaultTenorRangeMonths;
  if (input.tenorMonths >= minT && input.tenorMonths <= maxT) {
    score += 5;
  } else if (input.tenorMonths > maxT) {
    cautions.push(`Tenor ${input.tenorMonths} bulan di atas lazimnya Musyarakah (${maxT} bulan).`);
    score -= 5;
  }

  cautions.push("Nisbah bagi hasil harus dalam persentase — tidak boleh nominal tetap untuk menghindari riba.");

  return {
    akad: "MUSYARAKAH",
    score: Math.min(100, Math.max(0, score)),
    reasons,
    cautions,
    requiredFields: ["businessScope", "institutionCapital", "partnerCapital", "institutionNisbah", "partnerNisbah", "calculationBasis"],
  };
}

function scoreMudharabah(input: AkadRecommendationInput): AkadScore {
  let score = 0;
  const reasons: string[] = [];
  const cautions: string[] = [];

  // Tujuan investasi/modal kerja
  if (["BUSINESS_CAPITAL", "WORKING_CAPITAL"].includes(input.financingPurpose)) {
    score += 40;
    reasons.push("Modal kerja/investasi usaha dengan pengelolaan penuh nasabah — struktur ideal Mudharabah.");
  }

  // Tidak ada kontribusi modal dari nasabah
  const cp = input.capitalContributionPercent ?? 0;
  if (cp === 0) {
    score += 20;
    reasons.push("Lembaga menyediakan 100% modal (Shahibul Mal) — sesuai prinsip dasar Mudharabah.");
  } else if (cp > 0 && cp < 20) {
    score += 5;
    cautions.push(`Kontribusi modal nasabah ${cp}% — pertimbangkan Musyarakah jika kontribusi lebih besar.`);
  } else {
    cautions.push("Kontribusi modal nasabah signifikan — lebih tepat menggunakan Musyarakah.");
    score -= 10;
  }

  // Track record usaha
  if (input.businessHasTrackRecord) {
    score += 20;
    reasons.push("Rekam jejak usaha yang terbukti menguatkan kepercayaan mandat Mudharabah.");
  } else {
    cautions.push("Usaha tanpa rekam jejak meningkatkan risiko pembiayaan Mudharabah secara signifikan.");
    score -= 10;
  }

  // Profil risiko growth
  if (input.riskProfile === "GROWTH") {
    score += 15;
    reasons.push("Nasabah siap berbagi risiko — sesuai semangat investasi berbasis kepercayaan Mudharabah.");
  } else if (input.riskProfile === "CONSERVATIVE") {
    cautions.push("Profil konservatif kurang sesuai — Mudharabah berisiko tinggi karena tidak ada agunan usaha.");
    score -= 15;
  }

  // Tipe nasabah
  if (["MICRO_BUSINESS", "SME"].includes(input.customerType)) {
    score += 10;
    reasons.push("UMKM/UKM adalah segmen utama pembiayaan produktif berbasis Mudharabah.");
  }

  // Tenor pendek-menengah
  const [minT, maxT] = AKAD_REGISTRY.MUDHARABAH.defaultTenorRangeMonths;
  if (input.tenorMonths >= minT && input.tenorMonths <= maxT) {
    score += 5;
  } else if (input.tenorMonths > maxT) {
    cautions.push(`Tenor ${input.tenorMonths} bulan di atas lazimnya Mudharabah (${maxT} bulan) — risiko meningkat.`);
    score -= 10;
  }

  cautions.push("Shahibul Mal menanggung 100% kerugian finansial kecuali terbukti kelalaian mudharib.");

  return {
    akad: "MUDHARABAH",
    score: Math.min(100, Math.max(0, score)),
    reasons,
    cautions,
    requiredFields: ["businessField", "capitalShahibulMal", "mudharibName", "shahibulMalNisbah", "mudharibNisbah", "calculationMethod", "capitalReturnTerms"],
  };
}

// ─── Sharia Payload Builder ──────────────────────────────────────────────────

function buildShariaPayloadHint(
  akad: AkadCategory,
  input: AkadRecommendationInput
): Record<string, unknown> {
  const base = {
    financingAmount: input.financingAmount,
    tenorMonths: input.tenorMonths,
    transactionObject: input.transactionObject ?? "",
  };

  switch (akad) {
    case "MURABAHAH":
      return {
        ...base,
        costPrice: input.financingAmount,
        profitMargin: Math.round(input.financingAmount * 0.08), // 8% margin hint
        tenorMonths: input.tenorMonths,
        commodityDescription: input.transactionObject ?? "Objek pembiayaan",
        isGoodsReceived: false,
        downPaymentUrbun: 0,
      };
    case "IJARAH":
      return {
        ...base,
        assetDescription: input.transactionObject ?? "Objek sewa",
        assetValue: input.financingAmount,
        rentalFeePerMonth: Math.round(input.financingAmount / input.tenorMonths),
        rentalPeriodMonths: input.tenorMonths,
        isImbt: input.wantsOwnershipTransfer ?? false,
      };
    case "MUSYARAKAH":
      return {
        ...base,
        businessScope: input.transactionObject ?? "Usaha kemitraan",
        institutionCapital: input.financingAmount,
        partnerCapital: Math.round(
          input.financingAmount * ((input.capitalContributionPercent ?? 20) / 100)
        ),
        institutionNisbah: 40,
        partnerNisbah: 60,
        calculationBasis: "PROFIT_SHARING",
      };
    case "MUDHARABAH":
      return {
        ...base,
        businessField: input.transactionObject ?? "Usaha produktif",
        capitalShahibulMal: input.financingAmount,
        mudharibName: "Nasabah",
        shahibulMalNisbah: 70,
        mudharibNisbah: 30,
        calculationMethod: "PROFIT_SHARING",
        capitalReturnTerms: `Dikembalikan bertahap selama ${input.tenorMonths} bulan`,
      };
  }
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

export class AkadRecommendationEngine {
  public static recommend(input: AkadRecommendationInput): AkadRecommendationResult {
    const rawScores: AkadScore[] = [
      scoreMurabahah(input),
      scoreIjarah(input),
      scoreMusyarakah(input),
      scoreMudharabah(input),
    ];

    // Sort by score descending
    rawScores.sort((a, b) => b.score - a.score);

    const best = rawScores[0];
    const recommendedAkad = best.akad;

    // Confidence berdasarkan selisih skor
    const gap = best.score - rawScores[1].score;
    const confidence: AkadRecommendationResult["confidence"] =
      gap >= 25 ? "HIGH" : gap >= 10 ? "MEDIUM" : "LOW";

    // Alternatif: akad lain dengan score ≥ 60
    const alternatives = rawScores
      .slice(1)
      .filter((s) => s.score >= 60)
      .map((s) => s.akad);

    // Narasi ringkasan
    const akadConfig = AKAD_REGISTRY[recommendedAkad];
    const reasoning =
      `Berdasarkan analisis ${rawScores.length} jenis akad syariah, sistem merekomendasikan ` +
      `${akadConfig.name} (skor: ${best.score}/100, confidence: ${confidence}) ` +
      `untuk ${input.transactionObject ?? "kebutuhan pembiayaan ini"}. ` +
      (best.reasons[0] ?? "") +
      (alternatives.length > 0
        ? ` Alternatif layak: ${alternatives.map((a) => AKAD_REGISTRY[a].name).join(", ")}.`
        : " Tidak ada alternatif akad yang memenuhi ambang kelayakan minimum (≥60).") +
      " Rekomendasi ini bersifat advisory — validasi syariah final tetap menjadi otoritas DPS.";

    return {
      recommendedAkad,
      confidence,
      scores: rawScores,
      reasoning,
      alternatives,
      shariaPayloadHint: buildShariaPayloadHint(recommendedAkad, input),
      evaluatedAt: new Date().toISOString(),
    };
  }
}
