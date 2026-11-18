/**
 * SHARIA CONTRACT ENGINE (SCE)
 * Mudharabah (Trust Financing) Calculation & Sharia Rule Engine
 * Aligned with Fatwa DSN-MUI No. 07/DSN-MUI/IV/2000
 */

import { roundCurrency } from "./murabahah";

export interface MudharabahCalculationInput {
  capitalShahibulMal: number; // 100% Modal Finansial dari Bank / LKS
  shahibulMalNisbah: number; // Nisbah Shahibul Maal (%) - e.g. 70
  mudharibNisbah: number; // Nisbah Mudharib (%) - e.g. 30
  projectedProfitPerPeriod?: number; // Ekspektasi Laba Usaha
  realizedGrossProfit?: number; // Realisasi Laba Kotor Usaha
  realizedOperatingExpense?: number; // Beban Usaha yang Dibolehkan Syariah
}

export interface MudharabahDistributionResult {
  totalCapitalProvided: number; // 100% oleh Shahibul Maal
  shahibulMalNisbah: number;
  mudharibNisbah: number;
  realizedNetDistributableProfit: number;
  shahibulMalProfitShare: number; // Hak LKS = Laba × Nisbah
  mudharibProfitShare: number; // Hak Pengelola = Laba × Nisbah
  isLossOccurred: boolean;
  totalLossAmount: number;
  shahibulMalFinancialLoss: number; // 100% Kerugian Finansial ditanggung Shahibul Maal
  mudharibEffortLoss: string; // Pengelola kehilangan tenaga & waktu tanpa imbalan
  lossLiabilityRule: string;
}

export interface MudharabahShariaChecklist {
  is100PercentBankCapital: boolean; // Seluruh modal finansial (100%) disediakan oleh Shahibul Maal
  isBusinessPermissible: boolean; // Usaha halal & jelas ruang lingkupnya
  isNisbahAgreedUpfront: boolean; // Nisbah disepakati di awal dalam bentuk persentase laba riil
  hasNoGuaranteedCapitalOrReturn: boolean; // Tidak ada jaminan modal kembali utuh atau laba pasti
  hasNoInterferenceInDayToDay: boolean; // Bank tidak mengintervensi operasional harian teknis mudharib
  isFinancialReportingPeriodic: boolean; // Laporan keuangan periodik transparan
}

/**
 * Execute Mudharabah profit & loss calculation
 */
export function calculateMudharabahDistribution(
  input: MudharabahCalculationInput
): MudharabahDistributionResult {
  const totalCapitalProvided = roundCurrency(Math.max(0, input.capitalShahibulMal));
  const shahibulMalNisbah = Number(input.shahibulMalNisbah) || 70;
  const mudharibNisbah = Number(input.mudharibNisbah) || 30;

  const grossProfit = roundCurrency(Math.max(0, input.realizedGrossProfit || 0));
  const expenses = roundCurrency(Math.max(0, input.realizedOperatingExpense || 0));
  const realizedNetDistributableProfit = roundCurrency(grossProfit - expenses);

  const isLossOccurred = realizedNetDistributableProfit < 0;
  const totalLossAmount = isLossOccurred ? Math.abs(realizedNetDistributableProfit) : 0;

  let shahibulMalProfitShare = 0;
  let mudharibProfitShare = 0;
  let shahibulMalFinancialLoss = 0;

  if (!isLossOccurred && realizedNetDistributableProfit > 0) {
    // Profit distributed according to agreed NISBAH
    shahibulMalProfitShare = roundCurrency(
      realizedNetDistributableProfit * (shahibulMalNisbah / 100)
    );
    mudharibProfitShare = roundCurrency(
      realizedNetDistributableProfit * (mudharibNisbah / 100)
    );
  } else if (isLossOccurred) {
    // In Sharia Mudharabah, financial loss is 100% borne by Shahibul Maal (reducing capital)
    shahibulMalFinancialLoss = roundCurrency(Math.min(totalCapitalProvided, totalLossAmount));
  }

  return {
    totalCapitalProvided,
    shahibulMalNisbah,
    mudharibNisbah,
    realizedNetDistributableProfit,
    shahibulMalProfitShare,
    mudharibProfitShare,
    isLossOccurred,
    totalLossAmount,
    shahibulMalFinancialLoss,
    mudharibEffortLoss:
      "Mudharib tidak menanggung kerugian finansial, namun kehilangan waktu, tenaga, dan keahlian tanpa memperoleh imbalan bagi hasil pada periode rugi tersebut.",
    lossLiabilityRule:
      "Sesuai Fatwa DSN-MUI No. 07/DSN-MUI/IV/2000: Kerugian finansial sepenuhnya ditanggung oleh penyedia dana (Shahibul Maal) sepanjang kerugian tersebut bukan diakibatkan oleh kelalaian (Tafrith), kesengajaan (Ta'addi), atau pelanggaran kesepakatan (Mukhalafatusy Syuruth) oleh Mudharib.",
  };
}

/**
 * Validate Sharia compliance conditions for Mudharabah
 */
export function validateMudharabahCompliance(
  checklist: MudharabahShariaChecklist
): {
  status: "PASS" | "REVIEW" | "BLOCKED";
  score: number;
  violations: string[];
  recommendations: string[];
} {
  const violations: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (!checklist.isBusinessPermissible) {
    violations.push("Objek usaha pembiayaan Mudharabah tidak memenuhi syarat kehalalan syariah.");
    recommendations.push("Sesuaikan lini bisnis pengelola agar 100% halal dan sesuai standar DSN-MUI.");
    score -= 50;
  }

  if (!checklist.hasNoGuaranteedCapitalOrReturn) {
    violations.push("Terdeteksi klausul jaminan modal pokok atau jaminan laba pasti (Riba Pinjaman terselubung).");
    recommendations.push("Hapus jaminan pokok modal. Pengelola dana (Mudharib) adalah pemegang amanah (Amin), bukan penjamin utang (Dhamin).");
    score -= 50;
  }

  if (!checklist.is100PercentBankCapital) {
    violations.push("Porsi penyertaan modal bukan 100% dari Bank (Jika nasabah ikut menyertakan modal finansial, gunakan akad Musyarakah).");
    recommendations.push("Migrasikan kontrak ke Akad Musyarakah jika nasabah ikut menyertakan modal uang.");
    score -= 30;
  }

  if (!checklist.isNisbahAgreedUpfront) {
    violations.push("Nisbah persentase bagi hasil belum disepakati di awal akad.");
    recommendations.push("Sepakati nisbah bagi hasil di awal (contoh: Shahibul Maal 70% : Mudharib 30%).");
    score -= 25;
  }

  if (!checklist.isFinancialReportingPeriodic) {
    violations.push("Ketentuan pelaporan keuangan usaha secara periodik belum ditetapkan.");
    recommendations.push("Wajibkan pelaporan buku kas dan pembukuan laba berkala minimal bulanan/triwulanan.");
    score -= 20;
  }

  let status: "PASS" | "REVIEW" | "BLOCKED" = "PASS";
  if (score < 60 || !checklist.isBusinessPermissible || !checklist.hasNoGuaranteedCapitalOrReturn) {
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

