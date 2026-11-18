"use client";

export interface WorkflowStep {
  role: string;
  name: string;
  status: "COMPLETED" | "CURRENT" | "PENDING" | "REVISION_REQUESTED";
  actionDate?: string;
  comments?: string;
}

export interface WorkflowItem {
  id: string;
  contractNumber: string;
  title: string;
  customer: string;
  akad: "MURABAHAH" | "IJARAH" | "MUSYARAKAH" | "MUDHARABAH";
  amount: number;
  tenorMonths: number;
  marginOrNisbah: string;
  currentStage: "FO" | "LEGAL" | "COMPLIANCE" | "DPS" | "MANAGEMENT" | "EXECUTED";
  status: "DRAFT" | "LEGAL_REVIEW" | "COMPLIANCE_REVIEW" | "DPS_REVIEW" | "MANAGEMENT_REVIEW" | "ACTIVE" | "REVISION" | "REVISION_REQUESTED" | "REJECTED";
  statusLabel: string;
  submittedBy: string;
  submittedAt: string;
  documentVersion: string;
  hasBast: boolean;
  hasWadSeparation: boolean;
  amlStatus: "CLEARED" | "PENDING";
  bmpdRatio: number; // e.g. 12.8%
  shariaScore: number;
  dpsOpinionNotes?: string;
  managementNotes?: string;
  steps: WorkflowStep[];
  sha256Hash: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  role: string;
  entity: string;
  ipAddress: string;
  details: string;
  sha256: string;
}

export interface StaffEntry {
  id: string;
  name: string;
  email: string;
  role: string;
  roleCode: string;
  status: "ACTIVE" | "INACTIVE";
  joinedDate: string;
}

export interface TenantEntry {
  id: string;
  name: string;
  code: string;
  type: string;
  tier: "STARTER" | "PROFESSIONAL" | "INSTITUTIONAL";
  contractsCount: number;
  status: "ACTIVE" | "PENDING_REVIEW" | "SUSPENDED";
  licenseNumber: string;
}

const INITIAL_ITEMS: WorkflowItem[] = [
  {
    id: "wf-1",
    contractNumber: "SCE/2026/MRB/00142",
    title: "Pembiayaan Pengadaan Mesin Konveksi Otomatis",
    customer: "PT Berkah Logistik Nusantara",
    akad: "MURABAHAH",
    amount: 450000000,
    tenorMonths: 36,
    marginOrNisbah: "Marjin 12.0% p.a.",
    currentStage: "MANAGEMENT",
    status: "MANAGEMENT_REVIEW",
    statusLabel: "Menunggu Komite Pembiayaan",
    submittedBy: "Fatimah Az-Zahra (FO)",
    submittedAt: "14 Nov 2026, 09:30 WIB",
    documentVersion: "v1.2",
    hasBast: true,
    hasWadSeparation: true,
    amlStatus: "CLEARED",
    bmpdRatio: 8.5,
    shariaScore: 99.2,
    dpsOpinionNotes: "Lolos Fatwa DSN-MUI No. 04 & 111. Bukti kepemilikan bank (BAST) valid.",
    sha256Hash: "8f4a1c92e7b3019d65a88941cfb23490",
    steps: [
      { role: "Financing Officer", name: "Fatimah Az-Zahra", status: "COMPLETED", actionDate: "14 Nov 2026, 09:30 WIB", comments: "Kalkulasi marjin & BAST lengkap." },
      { role: "Legal Officer", name: "Bambang Sudrajat", status: "COMPLETED", actionDate: "14 Nov 2026, 10:45 WIB", comments: "Klausul perikatan & hak jaminan sah." },
      { role: "Compliance Officer", name: "Nurul Hidayati", status: "COMPLETED", actionDate: "14 Nov 2026, 11:20 WIB", comments: "AML/CFT lolos. BMPD 8.5% aman." },
      { role: "Dewan Pengawas Syariah", name: "K.H. Dr. Ridwan Mansur", status: "COMPLETED", actionDate: "14 Nov 2026, 13:10 WIB", comments: "Sertifikasi fatwa DSN-MUI diterbitkan." },
      { role: "Komite Pembiayaan (Direksi)", name: "Ir. H. Hendra Gunawan", status: "CURRENT", comments: "Menunggu tanda tangan komite pembiayaan." },
      { role: "Tanda Tangan Para Pihak", name: "Nasabah & Pimpinan Cabang", status: "PENDING" },
    ],
  },
  {
    id: "wf-2",
    contractNumber: "SCE/2026/IJR/00141",
    title: "Pembiayaan Sewa Beli (IMBT) Alat USG 4D Medika",
    customer: "Klinik Medika Syariah Sehat",
    akad: "IJARAH",
    amount: 280000000,
    tenorMonths: 24,
    marginOrNisbah: "Ujrah Rp 13.800.000/bln",
    currentStage: "DPS",
    status: "DPS_REVIEW",
    statusLabel: "Menunggu Opini DPS",
    submittedBy: "Fatimah Az-Zahra (FO)",
    submittedAt: "13 Nov 2026, 14:15 WIB",
    documentVersion: "v1.1",
    hasBast: true,
    hasWadSeparation: true,
    amlStatus: "CLEARED",
    bmpdRatio: 5.2,
    shariaScore: 97.8,
    dpsOpinionNotes: "",
    sha256Hash: "b2d87e01f65c92844a1087dcf392019a",
    steps: [
      { role: "Financing Officer", name: "Fatimah Az-Zahra", status: "COMPLETED", actionDate: "13 Nov 2026, 14:15 WIB", comments: "BAST supplier & rincian sewa lengkap." },
      { role: "Legal Officer", name: "Bambang Sudrajat", status: "COMPLETED", actionDate: "13 Nov 2026, 15:30 WIB", comments: "Akta Wa'd Janji Hibah telah dipisahkan dari akta sewa pokok." },
      { role: "Compliance Officer", name: "Nurul Hidayati", status: "COMPLETED", actionDate: "14 Nov 2026, 09:10 WIB", comments: "Skrining nasabah bersih." },
      { role: "Dewan Pengawas Syariah", name: "K.H. Dr. Ridwan Mansur", status: "CURRENT", comments: "Menunggu verifikasi Fatwa DSN No. 27." },
      { role: "Komite Pembiayaan (Direksi)", name: "Ir. H. Hendra Gunawan", status: "PENDING" },
      { role: "Tanda Tangan Para Pihak", name: "Nasabah & Pimpinan Cabang", status: "PENDING" },
    ],
  },
  {
    id: "wf-3",
    contractNumber: "SCE/2026/MSY/00140",
    title: "Pembiayaan Kemitraan Modal Kerja Gudang Pangan",
    customer: "CV Agro Tani Makmur",
    akad: "MUSYARAKAH",
    amount: 850000000,
    tenorMonths: 12,
    marginOrNisbah: "Nisbah Bank 65% : Mitra 35%",
    currentStage: "LEGAL",
    status: "LEGAL_REVIEW",
    statusLabel: "Menunggu Telaah Legal",
    submittedBy: "Fatimah Az-Zahra (FO)",
    submittedAt: "14 Nov 2026, 08:00 WIB",
    documentVersion: "v1.0",
    hasBast: true,
    hasWadSeparation: false,
    amlStatus: "CLEARED",
    bmpdRatio: 14.1,
    shariaScore: 95.0,
    sha256Hash: "e5f2a1b9c3d4087192a8b7c6d5e4f3a2",
    steps: [
      { role: "Financing Officer", name: "Fatimah Az-Zahra", status: "COMPLETED", actionDate: "14 Nov 2026, 08:00 WIB", comments: "Proposal modal kerja & verifikasi modal mitra 40%." },
      { role: "Legal Officer", name: "Bambang Sudrajat", status: "CURRENT", comments: "Sedang memeriksa pengikatan jaminan fidusia." },
      { role: "Compliance Officer", name: "Nurul Hidayati", status: "PENDING" },
      { role: "Dewan Pengawas Syariah", name: "K.H. Dr. Ridwan Mansur", status: "PENDING" },
      { role: "Komite Pembiayaan (Direksi)", name: "Ir. H. Hendra Gunawan", status: "PENDING" },
      { role: "Tanda Tangan Para Pihak", name: "Nasabah & Pimpinan Cabang", status: "PENDING" },
    ],
  },
  {
    id: "wf-4",
    contractNumber: "SCE/2026/MDH/00139",
    title: "Investasi Modal Usaha Perdagangan Komoditas Kopi",
    customer: "Koperasi Mandiri Berkah",
    akad: "MUDHARABAH",
    amount: 150000000,
    tenorMonths: 6,
    marginOrNisbah: "Nisbah 70% : 30%",
    currentStage: "EXECUTED",
    status: "ACTIVE",
    statusLabel: "Aktif Terverifikasi",
    submittedBy: "Fatimah Az-Zahra (FO)",
    submittedAt: "10 Nov 2026, 10:00 WIB",
    documentVersion: "v1.0",
    hasBast: true,
    hasWadSeparation: false,
    amlStatus: "CLEARED",
    bmpdRatio: 2.8,
    shariaScore: 99.5,
    sha256Hash: "7a9b8c6d5e4f3a2b1c0d9e8f7a6b5c4d",
    steps: [
      { role: "Financing Officer", name: "Fatimah Az-Zahra", status: "COMPLETED", actionDate: "10 Nov 2026, 10:00 WIB" },
      { role: "Legal Officer", name: "Bambang Sudrajat", status: "COMPLETED", actionDate: "10 Nov 2026, 11:30 WIB" },
      { role: "Compliance Officer", name: "Nurul Hidayati", status: "COMPLETED", actionDate: "10 Nov 2026, 13:15 WIB" },
      { role: "Dewan Pengawas Syariah", name: "K.H. Dr. Ridwan Mansur", status: "COMPLETED", actionDate: "10 Nov 2026, 14:45 WIB" },
      { role: "Komite Pembiayaan (Direksi)", name: "Ir. H. Hendra Gunawan", status: "COMPLETED", actionDate: "10 Nov 2026, 16:00 WIB" },
      { role: "Tanda Tangan Para Pihak", name: "Nasabah & Pimpinan Cabang", status: "COMPLETED", actionDate: "11 Nov 2026, 09:00 WIB" },
    ],
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-1",
    timestamp: "14 Nov 2026, 14:22:10 WIB",
    action: "CONTRACT_APPROVED",
    actor: "Ir. H. Hendra Gunawan",
    role: "MANAGEMENT",
    entity: "SCE/2026/MRB/00142",
    ipAddress: "192.168.1.42",
    details: "Persetujuan komite pembiayaan diterbitkan dengan plafon Rp 450.000.000.",
    sha256: "8f4a1c92e7b3019d65a88941cfb23490",
  },
  {
    id: "log-2",
    timestamp: "14 Nov 2026, 13:10:05 WIB",
    action: "SHARIA_CERTIFIED",
    actor: "K.H. Dr. Ridwan Mansur",
    role: "SHARIA_REVIEWER",
    entity: "SCE/2026/MRB/00142",
    ipAddress: "192.168.1.18",
    details: "Sertifikasi Fatwa DSN-MUI No. 04 & 111. Bukti kepemilikan BAST diverifikasi.",
    sha256: "3c7b91a20d4e5f6a7b8c9d0e1f2a3b4c",
  },
  {
    id: "log-3",
    timestamp: "14 Nov 2026, 11:20:44 WIB",
    action: "COMPLIANCE_CLEARED",
    actor: "Nurul Hidayati",
    role: "COMPLIANCE_OFFICER",
    entity: "SCE/2026/MRB/00142",
    ipAddress: "192.168.1.33",
    details: "Skrining AML/CFT & DTTOT lolos bersih. Rasio BMPD 8.5% aman.",
    sha256: "9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b",
  },
  {
    id: "log-4",
    timestamp: "13 Nov 2026, 15:30:19 WIB",
    action: "LEGAL_APPROVED",
    actor: "Bambang Sudrajat",
    role: "LEGAL_OFFICER",
    entity: "SCE/2026/IJR/00141",
    ipAddress: "192.168.1.25",
    details: "Akta Wa'd Janji Hibah dipisahkan dari perjanjian sewa pokok (Fatwa No. 27).",
    sha256: "b2d87e01f65c92844a1087dcf392019a",
  },
];

const INITIAL_STAFF: StaffEntry[] = [
  { id: "stf-1", name: "Fatimah Az-Zahra, S.E.Sy.", email: "fatimah.zahra@bprs-albarakah.co.id", role: "Financing Officer", roleCode: "FINANCING_OFFICER", status: "ACTIVE", joinedDate: "10 Jan 2026" },
  { id: "stf-2", name: "Bambang Sudrajat, S.H., M.Kn.", email: "bambang.sudrajat@bprs-albarakah.co.id", role: "Legal Officer", roleCode: "LEGAL_OFFICER", status: "ACTIVE", joinedDate: "15 Jan 2026" },
  { id: "stf-3", name: "Nurul Hidayati, S.Sy., C.P.A.", email: "nurul.hidayati@bprs-albarakah.co.id", role: "Compliance Officer", roleCode: "COMPLIANCE_OFFICER", status: "ACTIVE", joinedDate: "15 Jan 2026" },
  { id: "stf-4", name: "K.H. Dr. Ridwan Mansur, M.Ag.", email: "kh.ridwan.mansur@dps-mui.id", role: "Dewan Pengawas Syariah", roleCode: "SHARIA_REVIEWER", status: "ACTIVE", joinedDate: "05 Jan 2026" },
  { id: "stf-5", name: "Ir. H. Hendra Gunawan, M.M.", email: "ir.hendra.gunawan@bprs-albarakah.co.id", role: "Direktur Utama", roleCode: "MANAGEMENT", status: "ACTIVE", joinedDate: "01 Jan 2026" },
  { id: "stf-6", name: "Ahmad Rifai, S.E., Ak., CA", email: "audit.internal@bprs-albarakah.co.id", role: "Auditor Syariah", roleCode: "AUDITOR", status: "ACTIVE", joinedDate: "20 Jan 2026" },
];

const INITIAL_TENANTS: TenantEntry[] = [
  { id: "tnt-1", name: "PT BPRS Al-Barakah Mandiri", code: "BPRS-ALBARAKAH", type: "BPRS", tier: "PROFESSIONAL", contractsCount: 142, status: "ACTIVE", licenseNumber: "KEP-OJK-BPRS/2024/098" },
  { id: "tnt-2", name: "KSPPS Baitul Maal Bintang Syariah", code: "KSPPS-BINTANG", type: "KSPPS", tier: "STARTER", contractsCount: 48, status: "ACTIVE", licenseNumber: "KEMENKOP-UKM/SP/2023/112" },
  { id: "tnt-3", name: "PT Amanah Fintech P2P Syariah", code: "FINTECH-AMANAH", type: "Fintech", tier: "INSTITUTIONAL", contractsCount: 210, status: "ACTIVE", licenseNumber: "KEP-OJK-FINTECH/2025/044" },
  { id: "tnt-4", name: "Bank Syariah Sejahtera Indonesia", code: "BSS-BANK", type: "BUS", tier: "INSTITUTIONAL", contractsCount: 520, status: "PENDING_REVIEW", licenseNumber: "OJK-BUS/2026/012" },
];

export const STORAGE_KEY = "sce_workflow_store_v2";

export function loadStoredData() {
  if (typeof window === "undefined") {
    return {
      items: INITIAL_ITEMS,
      auditLogs: INITIAL_AUDIT_LOGS,
      staff: INITIAL_STAFF,
      tenants: INITIAL_TENANTS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Gagal membaca storage:", err);
  }

  return {
    items: INITIAL_ITEMS,
    auditLogs: INITIAL_AUDIT_LOGS,
    staff: INITIAL_STAFF,
    tenants: INITIAL_TENANTS,
  };
}

export function saveStoredData(data: {
  items: WorkflowItem[];
  auditLogs: AuditLogEntry[];
  staff: StaffEntry[];
  tenants: TenantEntry[];
}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Gagal menyimpan storage:", err);
  }
}
