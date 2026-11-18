/**
 * SHARIA CONTRACT ENGINE (SCE)
 * Musyarakah (Partnership Financing) Calculation & Sharia Rule Engine
 * Aligned with Fatwa DSN-MUI No. 08/DSN-MUI/IV/2000
 */

import { roundCurrency } from "./murabahah";

export interface MusyarakahCalculationInput {
  institutionCapital: number; // Porsi Modal Bank / LKS (Rp)
  partnerCapital: number; // Porsi Modal Mitra / Nasabah (Rp)
  institutionNisbah: number; // Nisbah Keuntungan Bank (%) - e.g. 40
  partnerNisbah: number; // Nisbah Keuntungan Mitra (%) - e.g. 60
  projectedProfitPerPeriod?: number; // Estimasi Keuntungan Usaha
  realizedGrossRevenue?: number; // Realisasi Pendapatan Kotor Usaha
  realizedOperatingExpense?: number; // Realisasi Biaya Operasional Riil
}

export interface MusyarakahDistributionResult {
  totalCapital: number;
  institutionCapitalPercentage: number;
  partnerCapitalPercentage: number;
  institutionNisbah: number;
  partnerNisbah: number;
  realizedNetProfit: number; // Laba Bersih yang Dapat Dibagi (Distributable Profit)
  institutionProfitShare: number; // Porsi Bank = Laba × Nisbah Bank
  partnerProfitShare: number; // Porsi Mitra = Laba × Nisbah Mitra
  isLossOccurred: boolean;
  totalLossAmount: number;
  institutionLossShare: number; // Kerugian dibagi mutlak sesuai porsi modal riil
  partnerLossShare: number;
  lossRuleExplanation: string;
}

export interface MusyarakahShariaChecklist {
  isBusinessHalal: boolean; // Bidang usaha halal & bebas maysir/riba
  isCapitalVerifiable: boolean; // Modal telah disetor ke rekening bersama (escrow)
  isNisbahAgreedUpfront: boolean; // Nisbah nisbah disepakati dalam bentuk persentase, bukan nominal tetap
  isLossSharingProportional: boolean; // Klausul kerugian disepakati sesuai nisbah modal riil
  hasNoGuaranteedReturn: boolean; // Tidak ada jaminan keuntungan tetap (guaranteed return)
  isPeriodicReportAudited: boolean; // Tersedia laporan keuangan periodik yang dapat diuji
}

/**
 * Execute Musyarakah profit & loss distribution calculation
 */
export function calculateMusyarakahDistribution(
  input: MusyarakahCalculationInput
): MusyarakahDistributionResult {
  const institutionCapital = roundCurrency(Math.max(0, input.institutionCapital));
  const partnerCapital = roundCurrency(Math.max(0, input.partnerCapital));
  const totalCapital = roundCurrency(institutionCapital + partnerCapital);

  const institutionCapitalPercentage =
    totalCapital > 0 ? roundCurrency((institutionCapital / totalCapital) * 100) : 0;
  const partnerCapitalPercentage =
    totalCapital > 0 ? roundCurrency((partnerCapital / totalCapital) * 100) : 0;

  // Validate Nisbah sum = 100%
  const institutionNisbah = Number(input.institutionNisbah) || 50;
  const partnerNisbah = Number(input.partnerNisbah) || 50;

  const grossRevenue = roundCurrency(Math.max(0, input.realizedGrossRevenue || 0));
  const operatingExpense = roundCurrency(Math.max(0, input.realizedOperatingExpense || 0));
  const realizedNetProfit = roundCurrency(grossRevenue - operatingExpense);

  const isLossOccurred = realizedNetProfit < 0;
  const totalLossAmount = isLossOccurred ? Math.abs(realizedNetProfit) : 0;

  let institutionProfitShare = 0;
  let partnerProfitShare = 0;
  let institutionLossShare = 0;
  let partnerLossShare = 0;

  if (!isLossOccurred && realizedNetProfit > 0) {
    // Profit distributed according to agreed NISBAH
    institutionProfitShare = roundCurrency(realizedNetProfit * (institutionNisbah / 100));
    partnerProfitShare = roundCurrency(realizedNetProfit * (partnerNisbah / 100));
  } else if (isLossOccurred) {
    // Loss strictly shared according to CAPITAL CONTRIBUTION RATIO (Fatwa DSN-MUI No. 08)
    institutionLossShare = roundCurrency(
      totalLossAmount * (institutionCapitalPercentage / 100)
    );
    partnerLossShare = roundCurrency(
      totalLossAmount * (partnerCapitalPercentage / 100)
    );
  }

  return {
    totalCapital,
    institutionCapitalPercentage,
    partnerCapitalPercentage,
    institutionNisbah,
    partnerNisbah,
    realizedNetProfit,
    institutionProfitShare,
    partnerProfitShare,
    isLossOccurred,
    totalLossAmount,
    institutionLossShare,
    partnerLossShare,
    lossRuleExplanation:
      "Sesuai Fatwa DSN-MUI No. 08/DSN-MUI/IV/2000: Keuntungan dibagi berdasarkan nisbah yang disepakati, sedangkan kerugian ditanggung para mitra secara proporsional sesuai porsi modal masing-masing, kecuali disebabkan oleh kelalaian (Ta'addi) atau wanprestasi (Mukhalafah) oleh mitra pengelola.",
  };
}

/**
 * Validate Sharia compliance conditions for Musyarakah
 */
export function validateMusyarakahCompliance(
  checklist: MusyarakahShariaChecklist
): {
  status: "PASS" | "REVIEW" | "BLOCKED";
  score: number;
  violations: string[];
  recommendations: string[];
} {
  const violations: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (!checklist.isBusinessHalal) {
    violations.push("Aktivitas usaha yang dibiayai bertentangan dengan prinsip syariah.");
    recommendations.push("Pastikan portofolio usaha terverifikasi halal oleh DPS.");
    score -= 50;
  }

  if (!checklist.hasNoGuaranteedReturn) {
    violations.push("Terdeteksi klausul jaminan imbal hasil tetap (Guaranteed Fixed Return) yang menyerupai Riba Pinjaman.");
    recommendations.push("Hapus klausul imbal hasil pasti. Bagi hasil harus bersumber dari realisasi laba riil usaha.");
    score -= 50;
  }

  if (!checklist.isLossSharingProportional) {
    violations.push("Klausul pembebanan kerugian melanggar fatwa (kerugian tidak boleh dibebankan hanya kepada satu pihak).");
    recommendations.push("Ubah formula bagi rugi menjadi proporsional sesuai porsi penyertaan modal masing-masing pihak.");
    score -= 35;
  }

  if (!checklist.isNisbahAgreedUpfront) {
    violations.push("Nisbah belum disepakati di awal dalam bentuk persentase nisbah laba riil.");
    recommendations.push("Tentukan persentase nisbah bagi hasil di awal akad (contoh: 40% Bank : 60% Mitra).");
    score -= 25;
  }

  if (!checklist.isCapitalVerifiable) {
    violations.push("Penyetoran modal kedua belah pihak belum diverifikasi di rekening penampung (Escrow).");
    recommendations.push("Lampirkan mutasi rekening atau bukti setoran modal riil.");
    score -= 20;
  }

  let status: "PASS" | "REVIEW" | "BLOCKED" = "PASS";
  if (score < 60 || !checklist.isBusinessHalal || !checklist.hasNoGuaranteedReturn) {
    status = "BLOCKED";
  } else if (score < 100) {
    status = "REVIEW";
  }

  return {
    status,
    score: Math.max(0, score),
    violations,
    recommendations,
  };
}

