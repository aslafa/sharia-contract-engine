/**
 * SCE Design System — Tahap 3C.1
 *
 * Sumber tunggal token tipografi, spacing, dan pemetaan status untuk seluruh
 * halaman dashboard. Fondasi visual (warna, radius, shadow) didefinisikan pada
 * `tailwind.config.ts`; modul ini mengunci pemakaiannya agar UI terasa seperti
 * software perbankan yang konsisten — bukan template dashboard generik.
 *
 * Prinsip:
 *  - Warna biru sebagai identitas, bukan memenuhi layar (dominan putih/abu muda).
 *  - Tanpa gradient dekoratif, tanpa glassmorphism, tanpa shadow tebal.
 *  - Ikon hanya bila berfungsi; tanpa emoji pada elemen antarmuka.
 *  - Bahasa antarmuka formal, ringkas, istilah perbankan syariah.
 */

// ---------------------------------------------------------------------------
// TIPOGRAFI — skala tunggal untuk seluruh halaman
// ---------------------------------------------------------------------------
export const TYPO = {
  /** Judul halaman (PageHeader) */
  pageTitle: "text-xl font-bold tracking-tight text-[#172B4D]",
  /** Deskripsi halaman — satu kalimat, bukan paragraf promosi */
  pageDescription: "text-xs text-[#64748B] leading-relaxed max-w-2xl",
  /** Judul seksi dalam halaman */
  sectionTitle: "text-sm font-bold text-[#172B4D]",
  /** Deskripsi sekunder seksi */
  sectionDescription: "text-xs text-[#64748B]",
  /** Judul card */
  cardTitle: "text-sm font-bold text-[#172B4D]",
  /** Label formulir / kolom kecil */
  label: "text-[11px] font-semibold uppercase tracking-wider text-[#64748B]",
  /** Header tabel */
  tableHeader:
    "text-[11px] font-semibold uppercase tracking-wider text-[#64748B]",
  /** Teks isi / sel tabel */
  body: "text-xs text-[#172B4D]",
  /** Teks sekunder / meta */
  muted: "text-xs text-[#64748B]",
  /** Angka & kode (nomor kontrak, CIF, nominal) */
  data: "text-xs font-mono tabular-nums text-[#172B4D]",
  /** Nilai metrik pada card ringkasan */
  metricValue: "text-2xl font-bold tracking-tight text-[#172B4D]",
} as const;

// ---------------------------------------------------------------------------
// SPACING — pola berulang agar ritme halaman konsisten
// ---------------------------------------------------------------------------
export const SPACE = {
  /** Jarak antar-seksi pada halaman (dipakai wrapper `<main>`) */
  pageGap: "space-y-6",
  /** Jarak antar-blok dalam seksi */
  sectionGap: "space-y-4",
  /** Padding standar card */
  cardPadding: "p-5",
  /** Padding padat (tabel, toolbar) */
  compactPadding: "p-4",
} as const;

// ---------------------------------------------------------------------------
// PEMETAAN STATUS → VARIAN BADGE
// Satu tempat agar seluruh halaman menampilkan status dengan warna & label
// yang sama (tanpa badge warna-warni arbitrer).
// ---------------------------------------------------------------------------

/** Varian Badge yang tersedia: default|primary|secondary|success|warning|danger|info|neutral|outline */
export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "outline";

export interface StatusStyle {
  variant: BadgeVariant;
  label: string;
}

/** Status kontrak & pengajuan (siklus akad sentral). */
export const CONTRACT_STATUS: Record<string, StatusStyle> = {
  DRAFT: { variant: "secondary", label: "Draf" },
  UNDER_REVIEW: { variant: "info", label: "Ditinjau" },
  PENDING_APPROVAL: { variant: "warning", label: "Menunggu Persetujuan" },
  APPROVED: { variant: "primary", label: "Disetujui" },
  EXECUTED: { variant: "primary", label: "Dieksekusi" },
  ACTIVE: { variant: "success", label: "Berjalan" },
  COMPLETED: { variant: "neutral", label: "Selesai" },
  EXPIRED: { variant: "neutral", label: "Kedaluwarsa" },
  TERMINATED: { variant: "danger", label: "Dihentikan" },
};

/** Status kepatuhan syariah (sharia status & hasil validasi). */
export const SHARIA_STATUS: Record<string, StatusStyle> = {
  PASS: { variant: "success", label: "Sesuai Syariah" },
  REVIEW: { variant: "warning", label: "Perlu Peninjauan" },
  BLOCKED: { variant: "danger", label: "Diblokir" },
  COMPLIANT: { variant: "success", label: "Sesuai Syariah" },
  NON_COMPLIANT: { variant: "danger", label: "Tidak Sesuai" },
};

/** Status AML/CFT nasabah. */
export const AML_STATUS: Record<string, StatusStyle> = {
  CLEARED: { variant: "success", label: "Lolos" },
  PENDING: { variant: "warning", label: "Menunggu Verifikasi" },
  FLAGGED: { variant: "danger", label: "Ditandai" },
};

/** Status tahap workflow approval. */
export const STEP_STATUS: Record<string, StatusStyle> = {
  COMPLETED: { variant: "success", label: "Selesai" },
  CURRENT: { variant: "primary", label: "Berjalan" },
  PENDING: { variant: "secondary", label: "Menunggu" },
};

/** Status faktur billing. */
export const INVOICE_STATUS: Record<string, StatusStyle> = {
  PAID: { variant: "success", label: "Terbayar" },
  UNPAID: { variant: "warning", label: "Belum Terbayar" },
  OVERDUE: { variant: "danger", label: "Jatuh Tempo" },
};

/** Ambil gaya status; status tak dikenal jatuh ke neutral (tanpa crash UI). */
export function statusStyle(
  registry: Record<string, StatusStyle>,
  status?: string | null
): StatusStyle {
  if (status && registry[status]) return registry[status];
  return { variant: "neutral", label: status ? status.replace(/_/g, " ") : "-" };
}

// ---------------------------------------------------------------------------
// DENSITAS TABEL
// ---------------------------------------------------------------------------
export const TABLE = {
  /** Header baris tabel (tinggi ringkas, border bawah tegas) */
  headerRow: "bg-[#F5F8FC] text-left",
  headerCell: "px-3 py-2.5",
  /** Sel isi — kompak namun tetap bernapas */
  bodyCell: "px-3 py-2.5 align-middle",
  /** Baris hover halus tanpa highlight berlebihan */
  hoverRow: "hover:bg-[#F5F8FC]/60 transition-colors",
} as const;
