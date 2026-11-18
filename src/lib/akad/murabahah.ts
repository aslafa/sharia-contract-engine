/**
 * SHARIA CONTRACT ENGINE (SCE)
 * Murabahah Calculation Engine & Verification Rules
 * Aligned with Fatwa DSN-MUI No. 04/DSN-MUI/IV/2000
 */

export interface MurabahahCalculationInput {
  costPrice: number; // Harga Perolehan Riil dari Pemasok
  profitMargin: number; // Marjin Keuntungan Disepakati
  downPaymentUrbun?: number; // Uang Muka (Urbun)
  tenorMonths: number; // Jangka Waktu Pembiayaan (Bulan)
}

export interface InstallmentScheduleItem {
  periodMonth: number;
  principalPortion: number;
  marginPortion: number;
  totalInstallment: number;
  remainingPrincipalBalance: number;
}

export interface MurabahahCalculationResult {
  costPrice: number;
  profitMargin: number;
  sellingPrice: number; // Harga Jual = Harga Perolehan + Marjin
  downPaymentUrbun: number;
  remainingReceivable: number; // Sisa Piutang = Harga Jual - Uang Muka
  tenorMonths: number;
  equalMonthlyInstallment: number; // Angsuran Tetap Bulanan
  effectiveMarginPercentage: number;
  installmentSchedule: InstallmentScheduleItem[];
}

export interface MurabahahShariaChecklist {
  isCommodityHalal: boolean; // Barang halal & bermanfaat secara syar'i
  isCostPriceDisclosed: boolean; // Transparansi harga perolehan kepada nasabah
  isBankOwnershipVerified: boolean; // Bank telah memiliki/menguasai barang sebelum menjual
  hasSeparatePurchaseInvoice: boolean; // Faktur pembelian dari supplier
  hasDeliveryOrderOrBast: boolean; // Berita Acara Serah Terima fisik/wakalah terpisah
  isWakalahExecutedFirst: boolean; // Jika menggunakan wakalah, harus sebelum pembelian
}

/**
 * Decimal-safe round to nearest rupiah or 2 decimal places
 */
export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Execute decimal-safe Murabahah financial calculation
 */
export function calculateMurabahah(
  input: MurabahahCalculationInput
): MurabahahCalculationResult {
  const costPrice = roundCurrency(Math.max(0, input.costPrice));
  const profitMargin = roundCurrency(Math.max(0, input.profitMargin));
  const sellingPrice = roundCurrency(costPrice + profitMargin);
  const downPaymentUrbun = roundCurrency(
    Math.min(sellingPrice, Math.max(0, input.downPaymentUrbun || 0))
  );
  const remainingReceivable = roundCurrency(sellingPrice - downPaymentUrbun);
  const tenorMonths = Math.max(1, Math.floor(input.tenorMonths));

  // Equal monthly installment calculation
  const equalMonthlyInstallment = roundCurrency(remainingReceivable / tenorMonths);

  // Proportional split of principal vs margin
  const principalPortionMonthly = roundCurrency(
    (costPrice - (downPaymentUrbun > costPrice ? costPrice : downPaymentUrbun)) /
      tenorMonths
  );
  const marginPortionMonthly = roundCurrency(
    profitMargin / tenorMonths
  );

  const installmentSchedule: InstallmentScheduleItem[] = [];
  let remainingPrincipal = costPrice;

  for (let month = 1; month <= tenorMonths; month++) {
    const isLastMonth = month === tenorMonths;
    const currentPrincipal = isLastMonth
      ? remainingPrincipal
      : Math.min(remainingPrincipal, principalPortionMonthly);

    remainingPrincipal = Math.max(0, remainingPrincipal - currentPrincipal);

    installmentSchedule.push({
      periodMonth: month,
      principalPortion: currentPrincipal,
      marginPortion: marginPortionMonthly,
      totalInstallment: equalMonthlyInstallment,
      remainingPrincipalBalance: roundCurrency(remainingPrincipal),
    });
  }

  const effectiveMarginPercentage =
    costPrice > 0 ? roundCurrency((profitMargin / costPrice) * 100) : 0;

  return {
    costPrice,
    profitMargin,
    sellingPrice,
    downPaymentUrbun,
    remainingReceivable,
    tenorMonths,
    equalMonthlyInstallment,
    effectiveMarginPercentage,
    installmentSchedule,
  };
}

/**
 * Verify Sharia compliance conditions for Murabahah
 */
export function validateMurabahahCompliance(
  checklist: MurabahahShariaChecklist
): {
  status: "PASS" | "REVIEW" | "BLOCKED";
  score: number;
  violations: string[];
  recommendations: string[];
} {
  const violations: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (!checklist.isCommodityHalal) {
    violations.push("Komoditas objek akad tidak halal atau mengandung unsur haram (Gharar/Maysir/Riba).");
    recommendations.push("Ganti objek pembiayaan dengan barang halal yang terverifikasi.");
    score -= 50;
  }

  if (!checklist.isCostPriceDisclosed) {
    violations.push("Harga pokok perolehan (cost price) tidak diungkapkan secara jujur kepada nasabah.");
    recommendations.push("Lampirkan rincian perolehan riil sesuai prinsip transparansi Murabahah.");
    score -= 30;
  }

  if (!checklist.isBankOwnershipVerified) {
    violations.push("LKS belum memiliki/menguasai barang secara sah (Milkiyyah) sebelum menjual kepada nasabah.");
    recommendations.push("Lengkapi Berita Acara Serah Terima (BAST) atau bukti penyerahan barang dari pemasok ke bank terlebih dahulu.");
    score -= 40;
  }

  if (!checklist.hasSeparatePurchaseInvoice) {
    violations.push("Faktur pembelian dari supplier belum terunggah.");
    recommendations.push("Unggah salinan faktur atau purchase order resmi dari vendor.");
    score -= 15;
  }

  if (!checklist.hasDeliveryOrderOrBast) {
    violations.push("Dokumen bukti kepemilikan/penguasaan fisik (BAST / Delivery Order) belum diverifikasi.");
    recommendations.push("Lakukan verifikasi fisik barang dan terbitkan BAST.");
    score -= 20;
  }

  let status: "PASS" | "REVIEW" | "BLOCKED" = "PASS";
  if (score < 60 || !checklist.isCommodityHalal || !checklist.isBankOwnershipVerified) {
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

