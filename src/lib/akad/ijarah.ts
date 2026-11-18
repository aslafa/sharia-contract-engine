/**
 * SHARIA CONTRACT ENGINE (SCE)
 * Ijarah & IMBT (Ijarah Muntahiya Bittamlik) Calculation & Verification Engine
 * Aligned with Fatwa DSN-MUI No. 09/DSN-MUI/IV/2000 & No. 27/DSN-MUI/III/2002
 */

import { roundCurrency } from "./murabahah";

export interface IjarahCalculationInput {
  assetValue: number; // Nilai Aset / Harga Perolehan Objek Sewa
  rentalFeePerMonth: number; // Ujrah Sewa Bulanan Disepakati
  rentalPeriodMonths: number; // Durasi Periode Sewa (Bulan)
  isImbt: boolean; // Ijarah Muntahiya Bittamlik (Sewa dengan Opsi Pengalihan Hak Milik)
  transferMethod?: "HIBAH" | "JUAL_NOMINAL" | "JUAL_NILAI_WAJAR";
  nominalTransferPrice?: number; // Nilai jual pada akhir periode (jika metode jual)
}

export interface RentalScheduleItem {
  periodMonth: number;
  ujrahAmount: number;
  cumulativeUjrah: number;
  maintenanceReserve: number; // Cadangan pemeliharaan struktural LKS (2% estimasi)
  remainingPeriod: number;
}

export interface IjarahCalculationResult {
  assetValue: number;
  monthlyUjrah: number;
  totalUjrah: number;
  rentalPeriodMonths: number;
  isImbt: boolean;
  transferMethod?: string;
  nominalTransferPrice: number;
  lessorMaintenanceBurden: string; // Pemeliharaan berat/struktural ditanggung Bank
  lesseeMaintenanceBurden: string; // Pemeliharaan ringan/operasional ditanggung Nasabah
  rentalSchedule: RentalScheduleItem[];
}

export interface IjarahShariaChecklist {
  isAssetIdentifiable: boolean; // Objek sewa jelas spesifikasi & fisiknya
  isBenefitPermissible: boolean; // Manfaat sewa halal & tidak bertentangan syariah
  isUjrahDefinedClearly: boolean; // Ujrah (uang sewa) disepakati nominal/periodenya
  isLeaseDurationDefinite: boolean; // Jangka waktu sewa ditetapkan pasti
  isMaintenanceSplitAgreed: boolean; // Pembagian pemeliharaan sesuai ketentuan DSN-MUI
  hasSeparateWaadForImbt: boolean; // Untuk IMBT, janji pemindahan hak milik terpisah (Wa'ad)
  isLessorOwnerOrRightHolder: boolean; // Bank memiliki aset atau hak sewa yang sah
}

/**
 * Execute Ijarah & IMBT financial calculations
 */
export function calculateIjarah(
  input: IjarahCalculationInput
): IjarahCalculationResult {
  const assetValue = roundCurrency(Math.max(0, input.assetValue));
  const monthlyUjrah = roundCurrency(Math.max(0, input.rentalFeePerMonth));
  const rentalPeriodMonths = Math.max(1, Math.floor(input.rentalPeriodMonths));
  const totalUjrah = roundCurrency(monthlyUjrah * rentalPeriodMonths);
  const nominalTransferPrice = roundCurrency(
    input.transferMethod === "HIBAH" ? 0 : Math.max(0, input.nominalTransferPrice || 0)
  );

  const rentalSchedule: RentalScheduleItem[] = [];
  let cumulative = 0;

  for (let month = 1; month <= rentalPeriodMonths; month++) {
    cumulative = roundCurrency(cumulative + monthlyUjrah);
    const maintenanceReserve = roundCurrency(monthlyUjrah * 0.05); // 5% cadangan pemeliharaan

    rentalSchedule.push({
      periodMonth: month,
      ujrahAmount: monthlyUjrah,
      cumulativeUjrah: cumulative,
      maintenanceReserve,
      remainingPeriod: rentalPeriodMonths - month,
    });
  }

  return {
    assetValue,
    monthlyUjrah,
    totalUjrah,
    rentalPeriodMonths,
    isImbt: input.isImbt,
    transferMethod: input.isImbt ? (input.transferMethod || "HIBAH") : undefined,
    nominalTransferPrice,
    lessorMaintenanceBurden: "Pemeliharaan struktural/kerusakan asal (bukan kelalaian nasabah) menjadi tanggung jawab penuh LKS/Bank.",
    lesseeMaintenanceBurden: "Pemeliharaan rutin harian & operasional objek sewa menjadi kewajiban Penyewa/Nasabah.",
    rentalSchedule,
  };
}

/**
 * Verify Sharia compliance conditions for Ijarah & IMBT
 */
export function validateIjarahCompliance(
  checklist: IjarahShariaChecklist,
  isImbt: boolean
): {
  status: "PASS" | "REVIEW" | "BLOCKED";
  score: number;
  violations: string[];
  recommendations: string[];
} {
  const violations: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (!checklist.isAssetIdentifiable) {
    violations.push("Spesifikasi objek sewa tidak jelas (mengandung unsur Gharar).");
    recommendations.push("Identifikasi nomor seri, nomor polisi/mesin, dan kondisi fisik objek secara spesifik.");
    score -= 40;
  }

  if (!checklist.isBenefitPermissible) {
    violations.push("Manfaat objek sewa digunakan untuk kegiatan yang diharamkan syariah.");
    recommendations.push("Pastikan peruntukan objek sewa hanya untuk aktivitas halal.");
    score -= 50;
  }

  if (!checklist.isUjrahDefinedClearly) {
    violations.push("Nominal uang sewa (ujrah) atau jadwal pembayarannya tidak pasti.");
    recommendations.push("Tetapkan besaran ujrah dan jadwal sewa secara transparan.");
    score -= 30;
  }

  if (!checklist.isMaintenanceSplitAgreed) {
    violations.push("Klausul pemeliharaan melanggar fatwa: Bank tidak boleh membebankan pemeliharaan struktural kerusakan asal kepada penyewa.");
    recommendations.push("Sesuaikan klausul perjanjian: Pemeliharaan struktural ditanggung Bank, pemeliharaan operasional oleh nasabah.");
    score -= 25;
  }

  if (isImbt && !checklist.hasSeparateWaadForImbt) {
    violations.push("Akad IMBT belum memiliki dokumen janji (Wa'ad) pengalihan hak milik yang terpisah dari akad sewa pokok.");
    recommendations.push("Terbitkan dokumen Wa'ad Mulzim terpisah untuk menghindari dua akad dalam satu transaksi (Shafqatain fi Shafqah).");
    score -= 35;
  }

  if (!checklist.isLessorOwnerOrRightHolder) {
    violations.push("LKS belum memiliki kepemilikan aset atau hak sewa sah atas objek.");
    recommendations.push("Lengkapi bukti kepemilikan BPKB/Sertifikat atau kontrak sewa induk.");
    score -= 30;
  }

  let status: "PASS" | "REVIEW" | "BLOCKED" = "PASS";
  if (score < 60 || !checklist.isBenefitPermissible || !checklist.isAssetIdentifiable) {
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

