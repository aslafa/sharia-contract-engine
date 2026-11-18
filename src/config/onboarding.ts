export interface OnboardingStageConfig {
  index: number;
  key: string;
  title: string;
  description: string;
}

export const ONBOARDING_STAGES: OnboardingStageConfig[] = [
  { index: 1, key: "REGISTRATION", title: "Registrasi Lembaga", description: "Pengisian profil & perwakilan resmi" },
  { index: 2, key: "EMAIL_VERIFICATION", title: "Verifikasi Email", description: "Validasi email domain institusi" },
  { index: 3, key: "DOCUMENT_REVIEW", title: "Penelaahan Dokumen", description: "Verifikasi keabsahan legalitas & izin OJK" },
  { index: 4, key: "INSTITUTION_APPROVAL", title: "Persetujuan Lembaga", description: "Kelayakan onboarding oleh Super Admin" },
  { index: 5, key: "DEMO_SESSION", title: "Demo & Asesmen Fiqh", description: "Presentasi modul akad & simulasi sistem" },
  { index: 6, key: "SUBSCRIPTION_CHOICE", title: "Pemilihan Paket", description: "Penetapan tier Starter / Pro / Enterprise" },
  { index: 7, key: "SLA_AGREEMENT", title: "Perjanjian Kerjasama (PKS)", description: "Penandatanganan kontrak B2B SaaS" },
  { index: 8, key: "INVOICE_ISSUANCE", title: "Penerbitan Invoice", description: "Penerbitan tagihan langganan resmi" },
  { index: 9, key: "PAYMENT_VERIFICATION", title: "Verifikasi Pembayaran", description: "Rekonsiliasi pembayaran via Bank Syariah" },
  { index: 10, key: "WORKSPACE_ACTIVATED", title: "Aktivasi Workspace", description: "Penerbitan tenant ID & portal aktif" },
];

