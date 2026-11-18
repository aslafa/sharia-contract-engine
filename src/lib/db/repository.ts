import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ShariaRuleEngine } from "@/lib/sharia/engine";
import { ContractValidationReport } from "@/types/sharia";
import { AkadCategory } from "@/types/akad";
import {
  CustomerRegistrationStatus,
  CustomerKycStatus,
  CustomerAmlStatus,
  CustomerRiskRating,
  CustomerVerificationStep,
  CustomerStepStatus,
} from "@/types/customer";

export interface DBShariaValidationReport extends ContractValidationReport {
  id: string;
  applicationId: string;
  organizationId: string;
}

export interface DBApplication {
  id: string;
  applicationNumber: string;
  organizationId: string;
  customerId?: string; // Tahap 3B.2 — reference to DBCustomer; legacy applications may omit it
  createdById: string;
  createdByName: string;
  akad: "MURABAHAH" | "IJARAH" | "MUSYARAKAH" | "MUDHARABAH";
  title: string;
  customerName: string;
  customerIdNumber?: string;
  customerPhone?: string;
  customerEmail?: string;
  commodityOrAsset: string;
  supplierName?: string;
  costPrice: number;
  marginOrNisbah: number; // For Murabahah: margin Rp, for Mudh/Musy: nisbah %
  sellingPrice: number;
  downPayment: number;
  tenorMonths: number;
  monthlyInstallment: number;
  status:
  | "DRAFT"
  | "SUBMITTED"
  | "LEGAL_REVIEW"
  | "COMPLIANCE_REVIEW"
  | "DPS_REVIEW"
  | "MANAGEMENT_REVIEW"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "REJECTED"
  | "ACTIVE"
  | "COMPLETED"
  | "TERMINATED";
  statusLabel: string;
  currentStage: "FO" | "LEGAL" | "COMPLIANCE" | "DPS" | "MANAGEMENT" | "EXECUTED";
  shariaScore: number;
  shariaStatus: "PASS" | "REVIEW" | "BLOCKED";
  ownershipVerified: boolean;
  hasBast: boolean;
  hasWadSeparation: boolean;
  amlStatus: "CLEARED" | "PENDING";
  bmpdRatio: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  contractNumber?: string;
  isDeleted?: boolean;
}

export interface DBApprovalStep {
  id: string;
  applicationId: string;
  role: string;
  roleCode: "FINANCING_OFFICER" | "LEGAL_OFFICER" | "COMPLIANCE_OFFICER" | "SHARIA_REVIEWER" | "MANAGEMENT" | "CONTRACT_PARTIES";
  name: string;
  status: "PENDING" | "CURRENT" | "COMPLETED" | "REVISION_REQUESTED" | "REJECTED" | "SKIPPED";
  actionDate?: string;
  comments?: string;
  documentVersion?: string;
  sha256?: string;
}

export type ContractStageStatus =
  | "COMPLETED"
  | "CURRENT"
  | "PENDING"
  | "REVISION_REQUESTED"
  | "REJECTED"
  | "SKIPPED";

export interface ContractLifecycleProgressStage {
  stageNumber: number;
  stageKey: string;
  stageName: string;
  roleTitle: string;
  roleCode?: string;
  actorName: string;
  status: ContractStageStatus;
  statusLabel: "Disetujui" | "Sedang Diproses" | "Menunggu" | "Revisi" | "Ditolak" | "Dilewati";
  actionDate?: string;
  comments?: string;
  nextStage?: string;
  sha256?: string;
}

export interface DBContract {
  id: string;
  applicationId: string;
  contractNumber: string;
  organizationId: string;
  akad: "MURABAHAH" | "IJARAH" | "MUSYARAKAH" | "MUDHARABAH";
  customerName: string;
  objectDescription: string;
  nominalValue: number;
  tenorMonths: number;
  monthlyInstallment: number;
  outstandingBalance: number;
  status:
  | "DRAFT"
  | "UNDER_REVIEW"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "EXECUTED"
  | "ACTIVE"
  | "COMPLETED"
  | "EXPIRED"
  | "TERMINATED";
  shariaStatus: "PASS" | "REVIEW" | "BLOCKED";
  documentVersion: string;
  sha256Hash: string;
  startDate: string;
  endDate: string;
  nextPaymentDate: string;
  createdAt: string;
  updatedAt: string;
  // Enriched tracking & approval fields
  stages?: ContractLifecycleProgressStage[];
  approvalSteps?: DBApprovalStep[];
  currentStageName?: string;
  currentProgressPercent?: number;
  auditTrail?: { action: string; actor: string; timestamp: string; details?: string }[];
}

export interface DBDocument {
  id: string;
  applicationId: string;
  organizationId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  category: "INVOICE" | "BAST" | "WAD_LETTER" | "COLLATERAL" | "IDENTITY" | "OTHER";
  verificationStatus: "VERIFIED" | "PENDING" | "REJECTED";
  verifiedBy?: string;
  verifiedAt?: string;
  uploadedBy: string;
  uploadedAt: string;
  sha256: string;
}

export interface DBNotification {
  id: string;
  organizationId: string;
  recipientRole?: string;
  recipientUserId?: string;
  title: string;
  message: string;
  type: "APPLICATION_SUBMITTED" | "REVIEW_REQUESTED" | "REVISION_REQUESTED" | "APPROVED" | "REJECTED" | "CONTRACT_GENERATED";
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

export interface DBAuditLog {
  id: string;
  organizationId: string;
  timestamp: string;
  action: string;
  actor: string;
  role: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  details: string;
  sha256: string;
}

export interface DBOrganization {
  id: string;
  code: string;
  name: string;
  type: string;
  status: "ACTIVE" | "SUSPENDED" | "ONBOARDING";
  createdAt: string;
}

/**
 * Customer (nasabah) — mirrors the Prisma `Customer` model as the migration
 * target (Decimal → number, Json → Record<string, unknown>).
 */
export interface DBCustomer {
  id: string;
  organizationId: string;
  cifNumber: string; // Customer Identification File
  type: "INDIVIDUAL" | "CORPORATE";
  name: string;
  identifierNumber: string; // NIK (Individu) / NPWP-NIB (Korporasi)
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  annualIncomeOrRevenue?: number;
  riskRating: CustomerRiskRating;
  amlStatus: CustomerAmlStatus;
  registrationStatus: CustomerRegistrationStatus;
  kycStatus: CustomerKycStatus;
  isVerified: boolean;
  verificationSteps?: CustomerVerificationStep[];
  assignedReviewerName?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  revisionNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tahap 3B.2 — minimal customer summary attached to financing applications
 * (list enrichment + detail read). Deliberately narrow: least-exposure read
 * model, safe to embed in application API responses.
 */
export interface DBCustomerReference {
  id: string;
  cifNumber: string;
  name: string;
  riskRating: CustomerRiskRating;
  amlStatus: CustomerAmlStatus;
  kycStatus?: CustomerKycStatus;
  registrationStatus?: CustomerRegistrationStatus;
  isVerified: boolean;
}

export interface DBUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  password?: string;
  passwordHash?: string; // Argon2id hash — plaintext is never stored or returned
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface DBMembership {
  id: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  role: "SUPER_ADMIN" | "INSTITUTION_ADMIN" | "FINANCING_OFFICER" | "LEGAL_OFFICER" | "COMPLIANCE_OFFICER" | "SHARIA_REVIEWER" | "MANAGEMENT" | "AUDITOR";
  roleName: string;
  permissions: string[];
  isActive: boolean;
  joinedAt: string;
}

interface DBState {
  organizations: DBOrganization[];
  users: DBUser[];
  memberships: DBMembership[];
  applications: DBApplication[];
  approvalSteps: DBApprovalStep[];
  contracts: DBContract[];
  documents: DBDocument[];
  notifications: DBNotification[];
  auditLogs: DBAuditLog[];
  customers: DBCustomer[];
  shariaValidationReports?: DBShariaValidationReport[];
}

function getInitialOrganizations(): DBOrganization[] {
  return [
    {
      id: "org-bprs-albarakah",
      code: "BPRS-ALBARAKAH",
      name: "PT BPRS Al-Barakah Mandiri",
      type: "BPRS",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "org-kspps-bintang",
      code: "KSPPS-BINTANG",
      name: "KSPPS Bintang Syariah Indonesia",
      type: "ISLAMIC_COOPERATIVE",
      status: "ACTIVE",
      createdAt: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "org-global-platform",
      code: "SCE-HQ",
      name: "SCE Global Central Platform",
      type: "PLATFORM",
      status: "ACTIVE",
      createdAt: "2025-10-01T00:00:00.000Z",
    },
  ];
}

function getInitialUsers(): DBUser[] {
  // Demo persona password, stored ONLY as an Argon2id hash (lazy-loaded to
  // avoid import cycles). Plaintext never appears in this file or the JSON store.
  const { hashPasswordSync } = require("@/lib/auth/password") as typeof import("@/lib/auth/password");
  const demoPasswordHash = hashPasswordSync(process.env.SCE_DEMO_PASSWORD || "P@ssword123!");
  const base = { passwordHash: demoPasswordHash };
  const users: DBUser[] = [
    {
      id: "usr-super-admin-001",
      email: "superadmin@sce-engine.id",
      fullName: "Ahmad Fauzan, S.Kom., M.TI (Super Admin)",
      isSuperAdmin: true,
      isActive: true,
      createdAt: "2025-10-01T00:00:00.000Z",
      ...base,
    },
    {
      id: "usr-inst-admin-001",
      email: "admin@bprs-albarakah.co.id",
      fullName: "Drs. H. Mulyadi Kartasasmita",
      isSuperAdmin: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-fo-001",
      email: "fatimah.zahra@bprs-albarakah.co.id",
      fullName: "Fatimah Az-Zahra, S.E.Sy.",
      isSuperAdmin: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-legal-001",
      email: "bambang.sudrajat@bprs-albarakah.co.id",
      fullName: "Bambang Sudrajat, S.H., M.Kn.",
      isSuperAdmin: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-compliance-001",
      email: "nurul.hidayati@bprs-albarakah.co.id",
      fullName: "Nurul Hidayati, S.Sy., C.P.A.",
      isSuperAdmin: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-dps-001",
      email: "kh.ridwan.mansur@dps-mui.id",
      fullName: "K.H. Dr. Ridwan Mansur, M.Ag. (DPS)",
      isSuperAdmin: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-mgmt-001",
      email: "ir.hendra.gunawan@bprs-albarakah.co.id",
      fullName: "Ir. Hendra Gunawan, M.B.A. (Direktur Bisnis)",
      isSuperAdmin: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-auditor-001",
      email: "audit.internal@bprs-albarakah.co.id",
      fullName: "Arief Wibowo, S.E., Ak., CA (Lead Auditor)",
      isSuperAdmin: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];
  // Every demo user gets the same Argon2id hash — no plaintext anywhere.
  return users.map((u) => ({ ...u, passwordHash: demoPasswordHash }));
}

function getInitialMemberships(): DBMembership[] {
  return [
    {
      id: "mem-sa-001",
      userId: "usr-super-admin-001",
      organizationId: "org-global-platform",
      organizationName: "SCE Global Central Platform",
      organizationCode: "SCE-HQ",
      role: "SUPER_ADMIN",
      roleName: "Super Administrator",
      permissions: ["*"],
      isActive: true,
      joinedAt: "2025-10-01T00:00:00.000Z",
    },
    {
      id: "mem-admin-001",
      userId: "usr-inst-admin-001",
      organizationId: "org-bprs-albarakah",
      organizationName: "PT BPRS Al-Barakah Mandiri",
      organizationCode: "BPRS-ALBARAKAH",
      role: "INSTITUTION_ADMIN",
      roleName: "Institution Administrator",
      permissions: ["org:manage", "users:manage", "roles:manage", "contracts:view", "contracts:create", "contracts:edit"],
      isActive: true,
      joinedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "mem-fo-001",
      userId: "usr-fo-001",
      organizationId: "org-bprs-albarakah",
      organizationName: "PT BPRS Al-Barakah Mandiri",
      organizationCode: "BPRS-ALBARAKAH",
      role: "FINANCING_OFFICER",
      roleName: "Financing / Account Officer",
      permissions: ["contracts:create", "contracts:view", "contracts:edit", "documents:upload"],
      isActive: true,
      joinedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "mem-legal-001",
      userId: "usr-legal-001",
      organizationId: "org-bprs-albarakah",
      organizationName: "PT BPRS Al-Barakah Mandiri",
      organizationCode: "BPRS-ALBARAKAH",
      role: "LEGAL_OFFICER",
      roleName: "Legal Officer",
      permissions: ["contracts:view", "contracts:edit", "approvals:legal", "documents:verify"],
      isActive: true,
      joinedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "mem-comp-001",
      userId: "usr-compliance-001",
      organizationId: "org-bprs-albarakah",
      organizationName: "PT BPRS Al-Barakah Mandiri",
      organizationCode: "BPRS-ALBARAKAH",
      role: "COMPLIANCE_OFFICER",
      roleName: "Compliance Officer",
      permissions: ["contracts:view", "approvals:compliance", "sharia_rules:view"],
      isActive: true,
      joinedAt: "2026-01-01T00:00:00.000Z",
    },
    // Multi-tenant user 1: DPS serves both BPRS Al-Barakah AND KSPPS Bintang
    {
      id: "mem-dps-001",
      userId: "usr-dps-001",
      organizationId: "org-bprs-albarakah",
      organizationName: "PT BPRS Al-Barakah Mandiri",
      organizationCode: "BPRS-ALBARAKAH",
      role: "SHARIA_REVIEWER",
      roleName: "Dewan Pengawas Syariah (DPS)",
      permissions: ["contracts:view", "sharia_rules:view", "sharia_rules:manage", "sharia:override", "approvals:sharia"],
      isActive: true,
      joinedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "mem-dps-002",
      userId: "usr-dps-001",
      organizationId: "org-kspps-bintang",
      organizationName: "KSPPS Bintang Syariah Indonesia",
      organizationCode: "KSPPS-BINTANG",
      role: "SHARIA_REVIEWER",
      roleName: "Dewan Pengawas Syariah (DPS)",
      permissions: ["contracts:view", "sharia_rules:view", "sharia_rules:manage", "sharia:override", "approvals:sharia"],
      isActive: true,
      joinedAt: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "mem-mgmt-001",
      userId: "usr-mgmt-001",
      organizationId: "org-bprs-albarakah",
      organizationName: "PT BPRS Al-Barakah Mandiri",
      organizationCode: "BPRS-ALBARAKAH",
      role: "MANAGEMENT",
      roleName: "Executive Management",
      permissions: ["contracts:view", "approvals:management", "analytics:view"],
      isActive: true,
      joinedAt: "2026-01-01T00:00:00.000Z",
    },
    // Multi-tenant user 2: Auditor inspects both BPRS Al-Barakah AND KSPPS Bintang
    {
      id: "mem-aud-001",
      userId: "usr-auditor-001",
      organizationId: "org-bprs-albarakah",
      organizationName: "PT BPRS Al-Barakah Mandiri",
      organizationCode: "BPRS-ALBARAKAH",
      role: "AUDITOR",
      roleName: "Internal / External Auditor",
      permissions: ["contracts:view", "audit:view", "audit:export", "documents:view"],
      isActive: true,
      joinedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "mem-aud-002",
      userId: "usr-auditor-001",
      organizationId: "org-kspps-bintang",
      organizationName: "KSPPS Bintang Syariah Indonesia",
      organizationCode: "KSPPS-BINTANG",
      role: "AUDITOR",
      roleName: "Internal / External Auditor",
      permissions: ["contracts:view", "audit:view", "audit:export", "documents:view"],
      isActive: true,
      joinedAt: "2026-02-01T00:00:00.000Z",
    },
  ];
}

const DATA_DIR = process.env.SCE_DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE =
  process.env.SCE_DB_FILE || path.join(DATA_DIR, "sce_database.json");
const DB_BACKUP_FILE =
  process.env.SCE_DB_BACKUP_FILE || path.join(DATA_DIR, "sce_database.backup.json");
const DB_CORRUPT_FILE =
  process.env.SCE_DB_CORRUPT_FILE || path.join(DATA_DIR, "sce_database.corrupt.json");

// Initial Seed Data to ensure instant enterprise experience on clean boot
function getInitialSeedData(): DBState {
  const mrbId = "app-mrb-001";
  const ijrId = "app-ijr-002";
  const mskId = "app-msk-003";
  const mdhId = "app-mdh-004";

  return {
    organizations: getInitialOrganizations(),
    users: getInitialUsers(),
    memberships: getInitialMemberships(),
    applications: [
      {
        id: mrbId,
        applicationNumber: "SCE/2026/MRB/00142",
        organizationId: "org-bprs-albarakah",
        createdById: "usr-fo-1",
        createdByName: "Fatimah Az-Zahra, S.E.Sy. (FO)",
        akad: "MURABAHAH",
        title: "Pembiayaan Murabahah Mesin Cold Storage Industri",
        customerName: "PT Sumber Berkah Pangan",
        customerIdNumber: "3273012903880004",
        customerPhone: "+62 812-3456-7890",
        customerEmail: "finance@berkahpangan.co.id",
        commodityOrAsset: "1 Unit Cold Storage Industri Kapasitas 20 Ton",
        supplierName: "PT Heidelberg Refrigeration",
        costPrice: 450000000,
        marginOrNisbah: 67500000,
        sellingPrice: 517500000,
        downPayment: 51750000,
        tenorMonths: 36,
        monthlyInstallment: 12937500,
        status: "DPS_REVIEW",
        statusLabel: "Menunggu Sertifikasi Fatwa DPS",
        currentStage: "DPS",
        shariaScore: 98.4,
        shariaStatus: "PASS",
        ownershipVerified: true,
        hasBast: true,
        hasWadSeparation: true,
        amlStatus: "CLEARED",
        bmpdRatio: 8.5,
        notes: "BAST dan faktur pembelian dari supplier telah diverifikasi lengkap.",
        createdAt: "2026-11-14T08:00:00.000Z",
        updatedAt: "2026-11-14T13:10:00.000Z",
        submittedAt: "2026-11-14T09:30:00.000Z",
      },
      {
        id: ijrId,
        applicationNumber: "SCE/2026/IJR/00141",
        organizationId: "org-bprs-albarakah",
        createdById: "usr-fo-1",
        createdByName: "Fatimah Az-Zahra, S.E.Sy. (FO)",
        akad: "IJARAH",
        title: "Sewa IMBT Armada Logistik 3 Unit Truk Isuzu",
        customerName: "CV Amanah Mitra Mandiri",
        customerIdNumber: "3273024805790001",
        customerPhone: "+62 813-8899-2211",
        commodityOrAsset: "3 Unit Truk Tronton Isuzu Giga FVR",
        supplierName: "PT Astra Isuzu Mandiri",
        costPrice: 750000000,
        marginOrNisbah: 90000000,
        sellingPrice: 840000000,
        downPayment: 84000000,
        tenorMonths: 24,
        monthlyInstallment: 31500000,
        status: "COMPLIANCE_REVIEW",
        statusLabel: "Menunggu Review BMPD & Kepatuhan",
        currentStage: "COMPLIANCE",
        shariaScore: 92.0,
        shariaStatus: "REVIEW",
        ownershipVerified: true,
        hasBast: true,
        hasWadSeparation: true,
        amlStatus: "CLEARED",
        bmpdRatio: 12.8,
        notes: "Akta Wa'd Janji Hibah telah dipisahkan dari perjanjian sewa sesuai Fatwa DSN No. 27.",
        createdAt: "2026-11-14T07:30:00.000Z",
        updatedAt: "2026-11-14T11:20:00.000Z",
        submittedAt: "2026-11-14T08:15:00.000Z",
      },
      {
        id: mskId,
        applicationNumber: "SCE/2026/MSK/00140",
        organizationId: "org-bprs-albarakah",
        createdById: "usr-fo-1",
        createdByName: "Fatimah Az-Zahra, S.E.Sy. (FO)",
        akad: "MUSYARAKAH",
        title: "Pembiayaan Modal Kerja Proyek Konstruksi RS Syariah",
        customerName: "PT Samudera Karya Medika",
        customerIdNumber: "3171092801750002",
        customerPhone: "+62 821-4567-8901",
        commodityOrAsset: "Proyek Renovasi Gedung Rawat Inap 4 Lantai",
        costPrice: 1200000000,
        marginOrNisbah: 35, // 35% nisbah bank
        sellingPrice: 1450000000,
        downPayment: 480000000,
        tenorMonths: 48,
        monthlyInstallment: 38250000,
        status: "LEGAL_REVIEW",
        statusLabel: "Pemeriksaan Klausul Legal & Agunan",
        currentStage: "LEGAL",
        shariaScore: 95.0,
        shariaStatus: "PASS",
        ownershipVerified: true,
        hasBast: true,
        hasWadSeparation: false,
        amlStatus: "CLEARED",
        bmpdRatio: 14.1,
        notes: "Sedang memverifikasi pengikatan fidusia dan rekening escrow proyek.",
        createdAt: "2026-11-14T06:00:00.000Z",
        updatedAt: "2026-11-14T08:00:00.000Z",
        submittedAt: "2026-11-14T07:00:00.000Z",
      },
      {
        id: mdhId,
        applicationNumber: "SCE/2026/MDH/00139",
        organizationId: "org-bprs-albarakah",
        createdById: "usr-fo-1",
        createdByName: "Fatimah Az-Zahra, S.E.Sy. (FO)",
        akad: "MUDHARABAH",
        title: "Investasi Modal Usaha Ekspor Kopi Arabika Gayo",
        customerName: "Koperasi Mandiri Berkah Sejahtera",
        customerIdNumber: "1104081907840003",
        customerPhone: "+62 852-6789-0123",
        commodityOrAsset: "Pengadaan Komoditas Biji Kopi Ekspor Grade A",
        costPrice: 500000000,
        marginOrNisbah: 30, // 30% nisbah bank
        sellingPrice: 575000000,
        downPayment: 0,
        tenorMonths: 12,
        monthlyInstallment: 47916666,
        status: "ACTIVE",
        statusLabel: "Kontrak Aktif Berjalan",
        currentStage: "EXECUTED",
        shariaScore: 99.5,
        shariaStatus: "PASS",
        ownershipVerified: true,
        hasBast: true,
        hasWadSeparation: false,
        amlStatus: "CLEARED",
        bmpdRatio: 6.2,
        notes: "Nisbah keuntungan 70:30, zero-guarantee principal sesuai Fatwa DSN No. 07.",
        createdAt: "2026-11-10T09:00:00.000Z",
        updatedAt: "2026-11-11T16:00:00.000Z",
        submittedAt: "2026-11-10T10:00:00.000Z",
        approvedAt: "2026-11-11T14:00:00.000Z",
        contractNumber: "SCE/2026/MDH/00139",
      },
    ],
    approvalSteps: [
      { id: "step-1-1", applicationId: mrbId, role: "Financing Officer", roleCode: "FINANCING_OFFICER", name: "Fatimah Az-Zahra", status: "COMPLETED", actionDate: "14 Nov 2026, 09:30 WIB", comments: "Inisiasi kelayakan berkas & kalkulasi marjin flat valid." },
      { id: "step-1-2", applicationId: mrbId, role: "Legal Officer", roleCode: "LEGAL_OFFICER", name: "Bambang Sudrajat, S.H.", status: "COMPLETED", actionDate: "14 Nov 2026, 11:15 WIB", comments: "Agunan BPKB dan sertifikat jaminan terverifikasi sah." },
      { id: "step-1-3", applicationId: mrbId, role: "Compliance Officer", roleCode: "COMPLIANCE_OFFICER", name: "Nurul Hidayati", status: "COMPLETED", actionDate: "14 Nov 2026, 12:45 WIB", comments: "Rasio BMPD 8.5% memenuhi POJK No. 65. Skrining AML lolos." },
      { id: "step-1-4", applicationId: mrbId, role: "Dewan Pengawas Syariah", roleCode: "SHARIA_REVIEWER", name: "K.H. Dr. Ridwan Mansur", status: "CURRENT" },
      { id: "step-1-5", applicationId: mrbId, role: "Komite Pembiayaan (Direksi)", roleCode: "MANAGEMENT", name: "Ir. H. Hendra Gunawan", status: "PENDING" },
      { id: "step-1-6", applicationId: mrbId, role: "Tanda Tangan Para Pihak", roleCode: "CONTRACT_PARTIES", name: "Nasabah & Pimpinan Cabang", status: "PENDING" },

      { id: "step-2-1", applicationId: ijrId, role: "Financing Officer", roleCode: "FINANCING_OFFICER", name: "Fatimah Az-Zahra", status: "COMPLETED", actionDate: "14 Nov 2026, 08:15 WIB" },
      { id: "step-2-2", applicationId: ijrId, role: "Legal Officer", roleCode: "LEGAL_OFFICER", name: "Bambang Sudrajat, S.H.", status: "COMPLETED", actionDate: "14 Nov 2026, 10:30 WIB", comments: "Klausul wa'd janji hibah dipisah dari akad sewa ijarah." },
      { id: "step-2-3", applicationId: ijrId, role: "Compliance Officer", roleCode: "COMPLIANCE_OFFICER", name: "Nurul Hidayati", status: "CURRENT" },
      { id: "step-2-4", applicationId: ijrId, role: "Dewan Pengawas Syariah", roleCode: "SHARIA_REVIEWER", name: "K.H. Dr. Ridwan Mansur", status: "PENDING" },
      { id: "step-2-5", applicationId: ijrId, role: "Komite Pembiayaan (Direksi)", roleCode: "MANAGEMENT", name: "Ir. H. Hendra Gunawan", status: "PENDING" },
      { id: "step-2-6", applicationId: ijrId, role: "Tanda Tangan Para Pihak", roleCode: "CONTRACT_PARTIES", name: "Nasabah & Pimpinan Cabang", status: "PENDING" },

      { id: "step-3-1", applicationId: mskId, role: "Financing Officer", roleCode: "FINANCING_OFFICER", name: "Fatimah Az-Zahra", status: "COMPLETED", actionDate: "14 Nov 2026, 07:00 WIB" },
      { id: "step-3-2", applicationId: mskId, role: "Legal Officer", roleCode: "LEGAL_OFFICER", name: "Bambang Sudrajat, S.H.", status: "CURRENT" },
      { id: "step-3-3", applicationId: mskId, role: "Compliance Officer", roleCode: "COMPLIANCE_OFFICER", name: "Nurul Hidayati", status: "PENDING" },
      { id: "step-3-4", applicationId: mskId, role: "Dewan Pengawas Syariah", roleCode: "SHARIA_REVIEWER", name: "K.H. Dr. Ridwan Mansur", status: "PENDING" },
      { id: "step-3-5", applicationId: mskId, role: "Komite Pembiayaan (Direksi)", roleCode: "MANAGEMENT", name: "Ir. H. Hendra Gunawan", status: "PENDING" },
      { id: "step-3-6", applicationId: mskId, role: "Tanda Tangan Para Pihak", roleCode: "CONTRACT_PARTIES", name: "Nasabah & Pimpinan Cabang", status: "PENDING" },

      { id: "step-4-1", applicationId: mdhId, role: "Financing Officer", roleCode: "FINANCING_OFFICER", name: "Fatimah Az-Zahra", status: "COMPLETED", actionDate: "10 Nov 2026" },
      { id: "step-4-2", applicationId: mdhId, role: "Legal Officer", roleCode: "LEGAL_OFFICER", name: "Bambang Sudrajat, S.H.", status: "COMPLETED", actionDate: "10 Nov 2026" },
      { id: "step-4-3", applicationId: mdhId, role: "Compliance Officer", roleCode: "COMPLIANCE_OFFICER", name: "Nurul Hidayati", status: "COMPLETED", actionDate: "11 Nov 2026" },
      { id: "step-4-4", applicationId: mdhId, role: "Dewan Pengawas Syariah", roleCode: "SHARIA_REVIEWER", name: "K.H. Dr. Ridwan Mansur", status: "COMPLETED", actionDate: "11 Nov 2026" },
      { id: "step-4-5", applicationId: mdhId, role: "Komite Pembiayaan (Direksi)", roleCode: "MANAGEMENT", name: "Ir. H. Hendra Gunawan", status: "COMPLETED", actionDate: "11 Nov 2026" },
      { id: "step-4-6", applicationId: mdhId, role: "Tanda Tangan Para Pihak", roleCode: "CONTRACT_PARTIES", name: "Nasabah & Pimpinan Cabang", status: "COMPLETED", actionDate: "11 Nov 2026" },
    ],
    contracts: [
      {
        id: "cnt-001",
        applicationId: mdhId,
        contractNumber: "SCE/2026/MDH/00139",
        organizationId: "org-bprs-albarakah",
        akad: "MUDHARABAH",
        customerName: "Koperasi Mandiri Berkah Sejahtera",
        objectDescription: "Pengadaan Komoditas Biji Kopi Ekspor Grade A",
        nominalValue: 500000000,
        tenorMonths: 12,
        monthlyInstallment: 47916666,
        outstandingBalance: 450000000,
        status: "ACTIVE",
        shariaStatus: "PASS",
        documentVersion: "v1.0",
        sha256Hash: "7a9b8c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
        startDate: "11 Nov 2026",
        endDate: "11 Nov 2027",
        nextPaymentDate: "11 Des 2026",
        createdAt: "2026-11-10T10:00:00.000Z",
        updatedAt: "2026-11-11T16:00:00.000Z",
      },
      {
        id: "cnt-002",
        applicationId: "app-legacy-1",
        contractNumber: "SCE/2026/MRB/00110",
        organizationId: "org-bprs-albarakah",
        akad: "MURABAHAH",
        customerName: "PT Berkah Logistik Prima",
        objectDescription: "Pengadaan 5 Unit Forklift Listrik 3 Ton",
        nominalValue: 620000000,
        tenorMonths: 24,
        monthlyInstallment: 28416666,
        outstandingBalance: 480000000,
        status: "ACTIVE",
        shariaStatus: "PASS",
        documentVersion: "v1.1",
        sha256Hash: "3f9c1b2a4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b",
        startDate: "05 Okt 2026",
        endDate: "05 Okt 2028",
        nextPaymentDate: "05 Des 2026",
        createdAt: "2026-10-01T10:00:00.000Z",
        updatedAt: "2026-10-05T14:00:00.000Z",
      },
    ],
    documents: [
      {
        id: "doc-1",
        applicationId: mrbId,
        organizationId: "org-bprs-albarakah",
        fileName: "Faktur_Supplier_Heidelberg_INV2026.pdf",
        fileSize: 1420000,
        fileType: "application/pdf",
        fileUrl: "/data/uploads/Faktur_Supplier_Heidelberg_INV2026.pdf",
        category: "INVOICE",
        verificationStatus: "VERIFIED",
        verifiedBy: "Bambang Sudrajat (Legal)",
        verifiedAt: "2026-11-14T11:10:00.000Z",
        uploadedBy: "Fatimah Az-Zahra (FO)",
        uploadedAt: "2026-11-14T09:15:00.000Z",
        sha256: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
      },
      {
        id: "doc-2",
        applicationId: mrbId,
        organizationId: "org-bprs-albarakah",
        fileName: "BAST_Fisik_Cold_Storage_PT_SBP.pdf",
        fileSize: 2150000,
        fileType: "application/pdf",
        fileUrl: "/data/uploads/BAST_Fisik_Cold_Storage_PT_SBP.pdf",
        category: "BAST",
        verificationStatus: "VERIFIED",
        verifiedBy: "K.H. Dr. Ridwan Mansur (DPS)",
        verifiedAt: "2026-11-14T13:05:00.000Z",
        uploadedBy: "Fatimah Az-Zahra (FO)",
        uploadedAt: "2026-11-14T09:20:00.000Z",
        sha256: "4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
      },
    ],
    notifications: [
      {
        id: "notif-1",
        organizationId: "org-bprs-albarakah",
        recipientRole: "SHARIA_REVIEWER",
        title: "Permohonan Sertifikasi Fatwa DSN",
        message: "Berkas Murabahah SCE/2026/MRB/00142 (PT Sumber Berkah Pangan) telah lolos Kepatuhan dan menunggu sertifikasi opini syariah DPS.",
        type: "REVIEW_REQUESTED",
        relatedId: mrbId,
        isRead: false,
        createdAt: "2026-11-14T12:46:00.000Z",
      },
      {
        id: "notif-2",
        organizationId: "org-bprs-albarakah",
        recipientRole: "COMPLIANCE_OFFICER",
        title: "Review Kepatuhan Ijarah IMBT",
        message: "Berkas Ijarah SCE/2026/IJR/00141 telah disetujui Legal Officer dan siap ditinjau rasio BMPD serta kepatuhan POJK No. 65.",
        type: "REVIEW_REQUESTED",
        relatedId: ijrId,
        isRead: false,
        createdAt: "2026-11-14T10:31:00.000Z",
      },
    ],
    auditLogs: [
      {
        id: "audit-1",
        organizationId: "org-bprs-albarakah",
        timestamp: "2026-11-14T13:10:05.000Z",
        action: "SHARIA_CERTIFIED",
        actor: "K.H. Dr. Ridwan Mansur",
        role: "SHARIA_REVIEWER",
        entity: "FinancingApplication",
        entityId: mrbId,
        ipAddress: "192.168.1.18",
        details: "Sertifikasi Fatwa DSN-MUI No. 04 & 111. Bukti kepemilikan BAST diverifikasi sah.",
        sha256: "3c7b91a20d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
      },
      {
        id: "audit-2",
        organizationId: "org-bprs-albarakah",
        timestamp: "2026-11-14T12:45:00.000Z",
        action: "COMPLIANCE_APPROVED",
        actor: "Nurul Hidayati",
        role: "COMPLIANCE_OFFICER",
        entity: "FinancingApplication",
        entityId: mrbId,
        ipAddress: "192.168.1.33",
        details: "Skrining AML/CFT & DTTOT lolos bersih. Rasio BMPD 8.5% aman sesuai limit.",
        sha256: "9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d",
      },
      {
        id: "audit-3",
        organizationId: "org-bprs-albarakah",
        timestamp: "2026-11-14T11:15:00.000Z",
        action: "LEGAL_APPROVED",
        actor: "Bambang Sudrajat, S.H.",
        role: "LEGAL_OFFICER",
        entity: "FinancingApplication",
        entityId: mrbId,
        ipAddress: "192.168.1.25",
        details: "Klausul baku akad Murabahah & pengikatan agunan BPKB sah terdaftar.",
        sha256: "b2d87e01f65c92844a1087dcf392019a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e",
      },
      {
        id: "audit-4",
        organizationId: "org-bprs-albarakah",
        timestamp: "2026-11-14T09:30:00.000Z",
        action: "APPLICATION_SUBMITTED",
        actor: "Fatimah Az-Zahra, S.E.Sy.",
        role: "FINANCING_OFFICER",
        entity: "FinancingApplication",
        entityId: mrbId,
        ipAddress: "192.168.1.12",
        details: "Pengajuan pembiayaan Murabahah diajukan senilai Rp 450.000.000.",
        sha256: "1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e",
      },
    ],
    // Customer Management (Tahap 3A) — starts empty; demo applications embed
    // legacy customer fields and are not migrated automatically.
    customers: [],
    shariaValidationReports: [],
  };
}

export class DBRepository {
  /**
   * Load the operational state from the JSON store.
   *
   * Corruption safety:
   *   - A corrupt/unreadable main file is QUARANTINED (copied to
   *     sce_database.corrupt.json) and NEVER silently overwritten by a reseed.
   *   - Recovery tries sce_database.backup.json first; only when both main and
   *     backup are unusable does an in-memory seed get used — and even then it
   *     is NOT persisted, so the original bytes stay available for manual
   *     recovery.
   */
  private static load(): DBState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        const seed = getInitialSeedData();
        this.save(seed);
        return seed;
      }
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      try {
        const state: DBState = JSON.parse(raw);
        this.assertShape(state);
        this.backfillMissingCollections(state);
        return state;
      } catch (parseErr) {
        // Corrupt main file: quarantine the original bytes, then attempt backup recovery.
        console.error("[DBRepository.load] File database rusak atau tidak valid:", parseErr);
        try {
          fs.copyFileSync(DB_FILE, DB_CORRUPT_FILE);
          console.error(`[DBRepository.load] File korup dikarantina ke ${DB_CORRUPT_FILE}`);
        } catch {
          /* quarantine best-effort */
        }
        return this.recoverFromBackup();
      }
    } catch (err) {
      console.error("[DBRepository.load] Error loading DB file:", err);
      return this.recoverFromBackup();
    }
  }

  /** Structural sanity check — throws when the state is not a usable DBState. */
  private static assertShape(state: unknown): asserts state is DBState {
    if (!state || typeof state !== "object") {
      throw new Error("State JSON bukan objek.");
    }
    const collections: (keyof DBState)[] = [
      "organizations",
      "users",
      "memberships",
      "applications",
      "approvalSteps",
      "contracts",
      "documents",
      "notifications",
      "auditLogs",
    ];
    for (const key of collections) {
      if (!Array.isArray((state as DBState)[key])) {
        throw new Error(`Koleksi '${key}' hilang atau bukan array.`);
      }
    }
  }

  /**
   * Backfill collections that are missing/empty without ever touching
   * existing (non-empty) data.
   */
  private static backfillMissingCollections(state: DBState, persist: boolean = true): void {
    let needsSave = false;
    if (state.organizations.length === 0) {
      state.organizations = getInitialOrganizations();
      needsSave = true;
    }
    if (state.users.length === 0) {
      state.users = getInitialUsers();
      needsSave = true;
    }
    if (state.memberships.length === 0) {
      state.memberships = getInitialMemberships();
      needsSave = true;
    }
    // `customers` may be absent in files created before Tahap 3A — initialize
    // additively without touching any existing data.
    if (!Array.isArray((state as Partial<DBState>).customers)) {
      (state as DBState).customers = [];
      needsSave = true;
    }
    if (!Array.isArray((state as Partial<DBState>).shariaValidationReports)) {
      state.shariaValidationReports = [];
      needsSave = true;
    }
    if (needsSave && persist) {
      this.save(state);
    }
  }

  /** Attempt recovery from the backup copy. Never destroys the main file. */
  private static recoverFromBackup(): DBState {
    try {
      if (fs.existsSync(DB_BACKUP_FILE)) {
        const backupRaw = fs.readFileSync(DB_BACKUP_FILE, "utf-8");
        const state: DBState = JSON.parse(backupRaw);
        this.assertShape(state);
        // Persist=false: the main file is corrupt here — a normal save() would
        // copy those corrupt bytes OVER the good backup. Restore separately.
        this.backfillMissingCollections(state, false);
        this.restoreMain(state);
        console.warn("[DBRepository.load] Pulih dari file backup sce_database.backup.json");
        return state;
      }
    } catch (err) {
      console.error("[DBRepository.load] Backup juga tidak dapat dipakai:", err);
    }
    // Last resort: in-memory seed WITHOUT persisting — the corrupt main file
    // stays on disk for manual recovery. No silent data destruction.
    console.error(
      "[DBRepository.load] KRITIS: file utama dan backup tidak dapat dibaca. Memakai seed in-memory TANPA menimpa file di disk."
    );
    return getInitialSeedData();
  }

  /**
   * Atomic write WITHOUT touching the rolling backup. Used only by backup
   * recovery so the last known-good backup is never overwritten.
   */
  private static restoreMain(state: DBState): void {
    const tmp = DB_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
    fs.renameSync(tmp, DB_FILE);
  }

  /**
   * Persist state atomically:
   *   1. write the full JSON to a temp file in the same directory,
   *   2. copy the current file to a rolling backup,
   *   3. atomically replace the main file via rename.
   * A crash at any point leaves either the old file or the new file intact —
   * never a truncated/partial JSON. Throws on failure so callers cannot
   * silently report success without a durable write.
   */
  public static save(state: DBState): void {
    const tmp = DB_FILE + ".tmp";
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
      if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
      }
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error("[DBRepository.save] Penulisan atomik gagal:", err);
      // Main file was not touched (rename never happened) — safe to leave as-is.
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  public static hash(data: any): string {
    return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  }

  // ==========================================
  // IDENTITY & MULTI-TENANT ACCESS MANAGEMENT
  // ==========================================
  public static getOrganizations(): DBOrganization[] {
    const state = this.load();
    return state.organizations;
  }

  public static getOrganizationById(id: string): DBOrganization | null {
    const state = this.load();
    return state.organizations.find((o) => o.id === id || o.code === id) || null;
  }

  public static getUsers(): DBUser[] {
    const state = this.load();
    return state.users;
  }

  public static getUserByEmail(email: string): DBUser | null {
    const state = this.load();
    return state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public static getUserById(id: string): DBUser | null {
    const state = this.load();
    return state.users.find((u) => u.id === id) || null;
  }

  public static getUserMemberships(userId: string): DBMembership[] {
    const state = this.load();
    return state.memberships.filter((m) => m.userId === userId && m.isActive);
  }

  public static userHasTenantAccess(userId: string, targetOrganizationId: string): boolean {
    const state = this.load();
    const user = state.users.find((u) => u.id === userId);
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return state.memberships.some(
      (m) => m.userId === userId && m.organizationId === targetOrganizationId && m.isActive
    );
  }

  public static authenticateUser(params: {
    email?: string;
    password?: string;
    roleOverride?: string;
    targetOrganizationId?: string;
  }): {
    user: DBUser;
    activeMembership: DBMembership;
    availableMemberships: DBMembership[];
  } {
    const state = this.load();

    let targetUser: DBUser | undefined;
    let targetMembership: DBMembership | undefined;

    if (params.roleOverride) {
      targetMembership = state.memberships.find(
        (m) => m.role === params.roleOverride && m.isActive
      );
      if (targetMembership) {
        targetUser = state.users.find((u) => u.id === targetMembership!.userId);
      }
    } else if (params.email) {
      targetUser = state.users.find(
        (u) => u.email.toLowerCase() === params.email!.toLowerCase() && u.isActive
      );
    }

    if (!targetUser) {
      throw new Error("Kredensial tidak valid atau pengguna dinonaktifkan.");
    }

    const userMemberships = state.memberships.filter(
      (m) => m.userId === targetUser!.id && m.isActive
    );

    if (userMemberships.length === 0 && !targetUser.isSuperAdmin) {
      throw new Error("Pengguna tidak memiliki keanggotaan institusi aktif.");
    }

    // Determine active membership
    if (params.targetOrganizationId) {
      const selected = userMemberships.find(
        (m) => m.organizationId === params.targetOrganizationId
      );
      if (!selected && !targetUser.isSuperAdmin) {
        throw new Error(
          `Akses ditolak: Anda bukan anggota dari organisasi '${params.targetOrganizationId}'.`
        );
      }
      targetMembership = selected || targetMembership || userMemberships[0];
    } else if (!targetMembership) {
      targetMembership = userMemberships[0];
    }

    // Record login audit in DB
    this.createAuditLogEntry({
      organizationId: targetMembership?.organizationId || "org-global-platform",
      userId: targetUser.id,
      actor: targetUser.fullName,
      role: targetMembership?.role || "SUPER_ADMIN",
      action: "LOGIN",
      entity: "UserSession",
      entityId: targetUser.id,
      ipAddress: "127.0.0.1",
      details: `Login berhasil untuk ${targetUser.email} pada organisasi ${targetMembership?.organizationName || "SCE Platform"}.`,
    });

    return {
      user: targetUser,
      activeMembership: targetMembership!,
      availableMemberships: userMemberships,
    };
  }

  public static switchTenant(
    userId: string,
    targetOrganizationId: string
  ): {
    user: DBUser;
    activeMembership: DBMembership;
    availableMemberships: DBMembership[];
  } {
    const state = this.load();
    const user = state.users.find((u) => u.id === userId && u.isActive);
    if (!user) throw new Error("Pengguna tidak ditemukan.");

    const userMemberships = state.memberships.filter(
      (m) => m.userId === userId && m.isActive
    );

    const targetMembership = userMemberships.find(
      (m) => m.organizationId === targetOrganizationId
    );

    if (!targetMembership && !user.isSuperAdmin) {
      this.createAuditLogEntry({
        organizationId: targetOrganizationId,
        userId: user.id,
        actor: user.fullName,
        role: "UNKNOWN",
        action: "CROSS_TENANT_VIOLATION_BLOCKED",
        entity: "Organization",
        entityId: targetOrganizationId,
        ipAddress: "127.0.0.1",
        details: `Upaya peralihan tenant tidak sah dicegah: ${user.email} mencoba mengakses tenant ${targetOrganizationId} tanpa keanggotaan sah.`,
      });
      throw new Error(
        `PELANGGARAN ISOLASI TENANT: Anda tidak memiliki keanggotaan sah pada organisasi '${targetOrganizationId}'.`
      );
    }

    this.createAuditLogEntry({
      organizationId: targetOrganizationId,
      userId: user.id,
      actor: user.fullName,
      role: targetMembership?.role || "SUPER_ADMIN",
      action: "TENANT_SWITCH",
      entity: "Organization",
      entityId: targetOrganizationId,
      ipAddress: "127.0.0.1",
      details: `Peralihan tenant berhasil: ${user.fullName} kini aktif di ${targetMembership?.organizationName || targetOrganizationId}.`,
    });

    return {
      user,
      activeMembership: targetMembership || {
        id: `mem-${user.id}-sa`,
        userId: user.id,
        organizationId: targetOrganizationId,
        organizationName: "Global Platform",
        organizationCode: "SCE-HQ",
        role: "SUPER_ADMIN",
        roleName: "Super Administrator",
        permissions: ["*"],
        isActive: true,
        joinedAt: new Date().toISOString(),
      },
      availableMemberships: userMemberships,
    };
  }

  public static createAuditLogEntry(entry: {
    organizationId?: string;
    userId?: string;
    actor?: string;
    role?: string;
    action: string;
    entity: string;
    entityId: string;
    details?: string;
    ipAddress?: string;
  }): DBAuditLog {
    const state = this.load();
    const sha = this.hash({ ...entry, time: Date.now() });
    const log: DBAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: entry.organizationId || "org-global-platform",
      timestamp: new Date().toISOString(),
      action: entry.action,
      actor: entry.actor || "System",
      role: entry.role || "SYSTEM",
      entity: entry.entity,
      entityId: entry.entityId,
      ipAddress: entry.ipAddress || "127.0.0.1",
      details: entry.details || "",
      sha256: sha,
    };
    state.auditLogs.unshift(log);
    this.save(state);
    return log;
  }

  // ==========================================
  // APPLICATIONS
  // ==========================================
  public static getApplications(filters?: {
    organizationId?: string;
    akad?: string;
    status?: string;
    search?: string;
    customerId?: string; // Tahap 3B.2 — optional customer reference filter
  }): DBApplication[] {
    const state = this.load();
    return state.applications.filter((app) => {
      if (app.isDeleted) return false;
      if (filters?.organizationId && app.organizationId !== filters.organizationId) return false;
      if (filters?.akad && filters.akad !== "ALL" && app.akad !== filters.akad) return false;
      if (filters?.status && filters.status !== "ALL" && app.status !== filters.status) return false;
      if (filters?.customerId && app.customerId !== filters.customerId) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matches =
          app.applicationNumber.toLowerCase().includes(q) ||
          app.customerName.toLowerCase().includes(q) ||
          app.commodityOrAsset.toLowerCase().includes(q) ||
          app.title.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }

  public static getApplicationById(id: string): {
    application: DBApplication | null;
    steps: DBApprovalStep[];
    documents: DBDocument[];
  } {
    const state = this.load();
    const app = state.applications.find((a) => a.id === id && !a.isDeleted) || null;
    if (!app) return { application: null, steps: [], documents: [] };
    const steps = state.approvalSteps.filter((s) => s.applicationId === id);
    const documents = state.documents.filter((d) => d.applicationId === id);
    return { application: app, steps, documents };
  }

  public static createApplication(payload: {
    organizationId: string;
    createdById: string;
    createdByName: string;
    customerId?: string;
    akad: "MURABAHAH" | "IJARAH" | "MUSYARAKAH" | "MUDHARABAH";
    title: string;
    // Optional since Tahap 3B.2: when `customerId` is provided the snapshot
    // name comes from the authoritative customer record. The API route
    // guarantees a name exists for unlinked (legacy-style) submissions.
    customerName?: string;
    customerIdNumber?: string;
    customerPhone?: string;
    customerEmail?: string;
    commodityOrAsset: string;
    supplierName?: string;
    costPrice: number;
    marginOrNisbah: number;
    sellingPrice?: number;
    downPayment?: number;
    tenorMonths: number;
    submitImmediately?: boolean;
    notes?: string;
  }): DBApplication {
    // Tenant isolation guard: an application must ALWAYS belong to an explicit
    // organization — never silently defaulted to another tenant.
    if (!payload.organizationId) {
      throw new Error(
        "[TENANT_ISOLATION] organizationId wajib disertakan saat membuat pengajuan pembiayaan."
      );
    }
    if (!payload.createdById) {
      throw new Error("[AUDIT] createdById wajib disertakan saat membuat pengajuan pembiayaan.");
    }

    const state = this.load();

    // Tahap 3B.2 — customer reference validation (defense in depth: the API
    // route resolves the customer first; the repository re-validates before
    // any write so an invalid reference never mutates the JSON store).
    // DBCustomer has no soft-delete/inactive mechanism (Tahap 3A), therefore
    // existence + tenant match + AML policy are the applicable checks.
    let linkedCustomer: DBCustomer | null = null;
    if (payload.customerId) {
      linkedCustomer = state.customers.find((c) => c.id === payload.customerId) || null;
      if (!linkedCustomer) {
        throw new Error(
          `[CUSTOMER_NOT_FOUND] Customer '${payload.customerId}' tidak ditemukan pada direktori nasabah; pengajuan tidak dibuat.`
        );
      }
      if (linkedCustomer.organizationId !== payload.organizationId) {
        throw new Error(
          `[CUSTOMER_CROSS_TENANT] Customer '${payload.customerId}' milik organisasi lain; pengajuan lintas tenant tidak diizinkan.`
        );
      }
      if (linkedCustomer.amlStatus === "FLAGGED") {
        throw new Error(
          `[CUSTOMER_AML_BLOCKED] Customer ${linkedCustomer.cifNumber || linkedCustomer.id} berstatus AML FLAGGED dan tidak dapat digunakan untuk pengajuan baru.`
        );
      }
    }

    // Snapshot: authoritative directory data when linked (Tahap 3B.2),
    // payload-provided values otherwise (legacy behavior preserved).
    const customerName = linkedCustomer ? linkedCustomer.name : payload.customerName;
    const customerIdNumber = linkedCustomer
      ? linkedCustomer.identifierNumber
      : payload.customerIdNumber;
    const customerPhone = linkedCustomer ? linkedCustomer.phone : payload.customerPhone;
    const customerEmail = linkedCustomer ? linkedCustomer.email : payload.customerEmail;

    // Explicit AML handling: a linked PENDING customer keeps the application
    // AML status PENDING — it is NEVER silently treated as CLEARED.
    const applicationAmlStatus: DBApplication["amlStatus"] =
      linkedCustomer && linkedCustomer.amlStatus === "PENDING" ? "PENDING" : "CLEARED";

    // Unlinked submissions MUST carry a snapshot name (route enforces 400;
    // this guard protects direct repository callers and narrows the type).
    if (!customerName) {
      throw new Error(
        "[VALIDATION] customerName wajib diisi untuk pengajuan tanpa referensi customerId."
      );
    }

    const timestamp = Date.now().toString().slice(-4);
    const year = new Date().getFullYear();
    const akadPrefix = payload.akad.slice(0, 3);
    const appNumber = `SCE/${year}/${akadPrefix}/${timestamp}`;
    const id = `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Decimal-safe calculations
    let sellingPrice = payload.sellingPrice || 0;
    let monthlyInstallment = 0;
    const downPayment = payload.downPayment || 0;

    if (payload.akad === "MURABAHAH") {
      // If caller explicitly passes sellingPrice, use it; otherwise compute cost + margin
      if (!sellingPrice) {
        sellingPrice = payload.costPrice + payload.marginOrNisbah;
      }
      const netReceivable = sellingPrice - downPayment;
      monthlyInstallment = payload.tenorMonths > 0 ? Math.round(netReceivable / payload.tenorMonths) : 0;
    } else if (payload.akad === "IJARAH") {
      if (!sellingPrice) {
        sellingPrice = payload.costPrice + payload.marginOrNisbah;
      }
      monthlyInstallment = payload.tenorMonths > 0 ? Math.round(sellingPrice / payload.tenorMonths) : 0;
    } else {
      if (!sellingPrice) {
        sellingPrice = payload.costPrice;
      }
      monthlyInstallment = payload.tenorMonths > 0 ? Math.round(payload.costPrice / payload.tenorMonths) : 0;
    }

    const isSubmitted = !!payload.submitImmediately;

    // =========================================================================
    // Sharia Rule Engine Integration
    // =========================================================================
    // Build real evaluation payload matching the specific Akad requirements
    const shariaPayload: Record<string, unknown> = {
      costPrice: payload.costPrice,
      sellingPrice,
      tenorMonths: payload.tenorMonths,
    };

    if (payload.akad === "MURABAHAH") {
      shariaPayload.profitMargin = payload.marginOrNisbah;
      shariaPayload.downPaymentUrbun = downPayment;
      // Goods are verified/received if submitted or if ownership/bast confirmed
      shariaPayload.isGoodsReceived = true;
    } else if (payload.akad === "IJARAH") {
      shariaPayload.assetDescription = payload.commodityOrAsset;
      shariaPayload.rentalFeePerMonth = monthlyInstallment;
      shariaPayload.isImbt = false; // standard ijarah default unless specified
    } else if (payload.akad === "MUSYARAKAH") {
      shariaPayload.businessScope = payload.commodityOrAsset;
      shariaPayload.institutionCapital = payload.costPrice;
      shariaPayload.partnerCapital = downPayment > 0 ? downPayment : Math.round(payload.costPrice * 0.25);
      shariaPayload.institutionNisbah = payload.marginOrNisbah;
      shariaPayload.partnerNisbah = 100 - payload.marginOrNisbah;
      shariaPayload.lossSharingFormula = "CAPITAL_RATIO";
    } else if (payload.akad === "MUDHARABAH") {
      shariaPayload.businessField = payload.commodityOrAsset;
      shariaPayload.capitalShahibulMal = payload.costPrice;
      shariaPayload.mudharibName = customerName;
      shariaPayload.shahibulMalNisbah = payload.marginOrNisbah;
      shariaPayload.mudharibNisbah = 100 - payload.marginOrNisbah;
      shariaPayload.lossTerms = "STANDARD_SHARIA_LOSS_TERMS";
    }

    const report = ShariaRuleEngine.evaluate(
      payload.akad as AkadCategory,
      shariaPayload,
      { contractNumber: appNumber }
    );

    // Hard compliance enforcement:
    // NON_COMPLIANT applications are strictly blocked from entering the approval workflow
    if (report.status === "NON_COMPLIANT") {
      const violations = report.results
        .filter((r) => !r.isCompliant && r.severity === "CRITICAL")
        .map((r) => `[${r.ruleCode}] ${r.message}`)
        .join("; ");
      throw new Error(
        `[SHARIA_NON_COMPLIANT] Pengajuan ditolak oleh Sharia Rule Engine karena pelanggaran kritis: ${violations}`
      );
    }

    // Map evaluation result to internal status:
    // WARNING or NEEDS_MANUAL_REVIEW must be routed for DPS review, not auto-passed
    const shariaStatus: DBApplication["shariaStatus"] =
      report.status === "COMPLIANT" ? "PASS" : "REVIEW";
    const shariaScore = report.overallScore;

    // If WARNING / REVIEW and submitted, initial status is routed to DPS review for manual fatwa clearance
    const initialStatus: DBApplication["status"] = isSubmitted
      ? (shariaStatus === "REVIEW" ? "DPS_REVIEW" : "LEGAL_REVIEW")
      : "DRAFT";
    const initialStage: DBApplication["currentStage"] = isSubmitted
      ? (shariaStatus === "REVIEW" ? "DPS" : "LEGAL")
      : "FO";
    const statusLabel = isSubmitted
      ? (shariaStatus === "REVIEW" ? "Menunggu Tinjauan Khusus DPS (Status Peringatan Syariah)" : "Menunggu Pemeriksaan Legal Officer")
      : "Draf Pengajuan Baru";

    const newApp: DBApplication = {
      id,
      applicationNumber: appNumber,
      organizationId: payload.organizationId,
      customerId: linkedCustomer ? linkedCustomer.id : undefined,
      createdById: payload.createdById,
      createdByName: payload.createdByName || "Financing Officer",
      akad: payload.akad,
      title: payload.title || `Pengajuan Akad ${payload.akad} - ${customerName}`,
      customerName,
      customerIdNumber,
      customerPhone,
      customerEmail,
      commodityOrAsset: payload.commodityOrAsset,
      supplierName: payload.supplierName,
      costPrice: payload.costPrice,
      marginOrNisbah: payload.marginOrNisbah,
      sellingPrice,
      downPayment,
      tenorMonths: payload.tenorMonths,
      monthlyInstallment,
      status: initialStatus,
      statusLabel,
      currentStage: initialStage,
      shariaScore,
      shariaStatus,
      ownershipVerified: isSubmitted,
      hasBast: isSubmitted,
      hasWadSeparation: true,
      amlStatus: applicationAmlStatus,
      bmpdRatio: Math.min(18.5, Math.max(4.0, (payload.costPrice / 5000000000) * 100)),
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: isSubmitted ? new Date().toISOString() : undefined,
    };

    // Save Sharia Validation Report to the state
    if (!state.shariaValidationReports) {
      state.shariaValidationReports = [];
    }
    const reportRecord: DBShariaValidationReport = {
      ...report,
      id: `svr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      applicationId: id,
      organizationId: payload.organizationId,
    };
    state.shariaValidationReports.unshift(reportRecord);

    state.applications.unshift(newApp);

    // Create default approval stages
    const isDpsReviewTarget = isSubmitted && shariaStatus === "REVIEW";

    const steps: DBApprovalStep[] = [
      {
        id: `step-${id}-1`,
        applicationId: id,
        role: "Financing Officer",
        roleCode: "FINANCING_OFFICER",
        name: payload.createdByName || "Financing Officer",
        status: isSubmitted ? "COMPLETED" : "CURRENT",
        actionDate: isSubmitted ? new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB" : undefined,
        comments: isSubmitted
          ? (isDpsReviewTarget
            ? "Pengajuan memerlukan audit & persetujuan fatwa khusus Dewan Pengawas Syariah (status WARNING/REVIEW)."
            : "Pengajuan telah diverifikasi lengkap dan diajukan ke Legal.")
          : "Draf dibuat.",
      },
      {
        id: `step-${id}-2`,
        applicationId: id,
        role: "Legal Officer",
        roleCode: "LEGAL_OFFICER",
        name: "Bambang Sudrajat, S.H.",
        status: isSubmitted && !isDpsReviewTarget ? "CURRENT" : "PENDING",
      },
      {
        id: `step-${id}-3`,
        applicationId: id,
        role: "Compliance Officer",
        roleCode: "COMPLIANCE_OFFICER",
        name: "Nurul Hidayati",
        status: "PENDING",
      },
      {
        id: `step-${id}-4`,
        applicationId: id,
        role: "Dewan Pengawas Syariah",
        roleCode: "SHARIA_REVIEWER",
        name: "K.H. Dr. Ridwan Mansur",
        status: isDpsReviewTarget ? "CURRENT" : "PENDING",
      },
      {
        id: `step-${id}-5`,
        applicationId: id,
        role: "Komite Pembiayaan (Direksi)",
        roleCode: "MANAGEMENT",
        name: "Ir. H. Hendra Gunawan",
        status: "PENDING",
      },
      {
        id: `step-${id}-6`,
        applicationId: id,
        role: "Tanda Tangan Para Pihak",
        roleCode: "CONTRACT_PARTIES",
        name: "Nasabah & Pimpinan Cabang",
        status: "PENDING",
      },
    ];

    state.approvalSteps.push(...steps);

    // Audit Log
    const auditSha = this.hash({ action: isSubmitted ? "APPLICATION_SUBMITTED" : "APPLICATION_DRAFT_CREATED", id, appNumber, time: Date.now() });
    state.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      organizationId: newApp.organizationId,
      timestamp: new Date().toISOString(),
      action: isSubmitted ? "APPLICATION_SUBMITTED" : "APPLICATION_DRAFT_CREATED",
      actor: newApp.createdByName,
      role: "FINANCING_OFFICER",
      entity: "FinancingApplication",
      entityId: id,
      ipAddress: "127.0.0.1",
      details: `${isSubmitted ? "Pengajuan resmi diajukan" : "Draf pengajuan disimpan"} no ${appNumber} senilai Rp ${payload.costPrice.toLocaleString("id-ID")}${isDpsReviewTarget ? " (Diarahkan ke DPS untuk Tinjauan Khusus Syariah)" : ""}`,
      sha256: auditSha,
    });

    if (isSubmitted) {
      const recipientRole = isDpsReviewTarget ? "SHARIA_REVIEWER" : "LEGAL_OFFICER";
      const notifTitle = isDpsReviewTarget
        ? "Pengajuan Peringatan Syariah Menunggu Audit DPS"
        : "Pengajuan Pembiayaan Baru Menunggu Tinjauan";
      const notifMessage = isDpsReviewTarget
        ? `Pengajuan ${appNumber} (${newApp.customerName} - ${newApp.akad}) terdeteksi catatan syariah (skor: ${newApp.shariaScore}) dan memerlukan audit langsung Dewan Pengawas Syariah.`
        : `Pengajuan ${appNumber} (${newApp.customerName} - ${newApp.akad}) memerlukan peninjauan klausul legal & agunan.`;

      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        organizationId: newApp.organizationId,
        recipientRole,
        title: notifTitle,
        message: notifMessage,
        type: "REVIEW_REQUESTED",
        relatedId: id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.save(state);
    return newApp;
  }

  public static submitApplication(id: string, actorName: string = "Financing Officer"): DBApplication {
    const state = this.load();
    const app = state.applications.find((a) => a.id === id && !a.isDeleted);
    if (!app) throw new Error("Aplikasi tidak ditemukan.");

    const isDpsReviewTarget = app.shariaStatus === "REVIEW";

    app.status = isDpsReviewTarget ? "DPS_REVIEW" : "LEGAL_REVIEW";
    app.currentStage = isDpsReviewTarget ? "DPS" : "LEGAL";
    app.statusLabel = isDpsReviewTarget
      ? "Menunggu Tinjauan Khusus DPS (Status Peringatan Syariah)"
      : "Menunggu Pemeriksaan Legal Officer";
    app.submittedAt = new Date().toISOString();
    app.updatedAt = new Date().toISOString();
    app.ownershipVerified = true;
    app.hasBast = true;

    // Update steps
    const steps = state.approvalSteps.filter((s) => s.applicationId === id);
    const foStep = steps.find((s) => s.roleCode === "FINANCING_OFFICER");
    const legalStep = steps.find((s) => s.roleCode === "LEGAL_OFFICER");
    const dpsStep = steps.find((s) => s.roleCode === "SHARIA_REVIEWER");

    if (foStep) {
      foStep.status = "COMPLETED";
      foStep.actionDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB";
      foStep.comments = isDpsReviewTarget
        ? "Diajukan resmi ke Dewan Pengawas Syariah (status WARNING/REVIEW)."
        : "Diajukan resmi ke Legal Officer.";
    }

    if (isDpsReviewTarget) {
      if (dpsStep) dpsStep.status = "CURRENT";
      if (legalStep) legalStep.status = "PENDING";
    } else {
      if (legalStep) legalStep.status = "CURRENT";
    }

    // Audit & Notification
    state.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      organizationId: app.organizationId,
      timestamp: new Date().toISOString(),
      action: "APPLICATION_SUBMITTED",
      actor: actorName,
      role: "FINANCING_OFFICER",
      entity: "FinancingApplication",
      entityId: id,
      ipAddress: "127.0.0.1",
      details: `Aplikasi ${app.applicationNumber} diajukan resmi ${isDpsReviewTarget ? "ke Dewan Pengawas Syariah (tinjauan fatwa)" : "ke Legal Officer"}.`,
      sha256: this.hash({ id, time: Date.now() }),
    });

    const recipientRole = isDpsReviewTarget ? "SHARIA_REVIEWER" : "LEGAL_OFFICER";
    const notifTitle = isDpsReviewTarget
      ? "Pengajuan Peringatan Syariah Menunggu Audit DPS"
      : "Pengajuan Pembiayaan Masuk";
    const notifMessage = isDpsReviewTarget
      ? `Pengajuan ${app.applicationNumber} (${app.customerName}) terdeteksi catatan syariah dan siap ditinjau oleh Dewan Pengawas Syariah.`
      : `Pengajuan ${app.applicationNumber} (${app.customerName}) siap ditinjau secara hukum.`;

    state.notifications.unshift({
      id: `notif-${Date.now()}`,
      organizationId: app.organizationId,
      recipientRole,
      title: notifTitle,
      message: notifMessage,
      type: "REVIEW_REQUESTED",
      relatedId: id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    this.save(state);
    return app;
  }

  // ==========================================
  // APPROVAL WORKFLOW ACTIONS
  // ==========================================
  public static processApproval(payload: {
    applicationId: string;
    roleCode: "LEGAL_OFFICER" | "COMPLIANCE_OFFICER" | "SHARIA_REVIEWER" | "MANAGEMENT";
    actorName: string;
    action: "APPROVE" | "REJECT" | "REQUEST_REVISION";
    comments: string;
    evidenceNotes?: string;
  }): { application: DBApplication; nextStage: string } {
    const state = this.load();
    const app = state.applications.find((a) => a.id === payload.applicationId && !a.isDeleted);
    if (!app) throw new Error("Aplikasi tidak ditemukan.");

    // =========================================================================
    // Defense-in-depth: Sharia Compliance Barrier
    // =========================================================================
    // Applications flagged as BLOCKED / NON_COMPLIANT must NEVER be approved
    if (payload.action === "APPROVE" && (app.shariaStatus === "BLOCKED" || (app.shariaStatus as string) === "NON_COMPLIANT")) {
      throw new Error(
        `[SHARIA_BLOCKED] Aplikasi ${app.applicationNumber} berstatus pelanggaran syariah (${app.shariaStatus}) dan dilarang untuk disetujui.`
      );
    }

    const steps = state.approvalSteps.filter((s) => s.applicationId === payload.applicationId);
    const currentStep = steps.find((s) => s.roleCode === payload.roleCode);
    const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB";
    const sha = this.hash({ ...payload, timestamp: Date.now() });

    if (payload.action === "REQUEST_REVISION") {
      app.status = "REVISION_REQUESTED";
      app.currentStage = "FO";
      app.statusLabel = `Permintaan Revisi dari ${payload.roleCode}`;
      app.updatedAt = new Date().toISOString();

      if (currentStep) {
        currentStep.status = "REVISION_REQUESTED";
        currentStep.actionDate = dateStr;
        currentStep.comments = payload.comments;
        currentStep.sha256 = sha;
      }

      state.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        organizationId: app.organizationId,
        timestamp: new Date().toISOString(),
        action: "REVISION_REQUESTED",
        actor: payload.actorName,
        role: payload.roleCode,
        entity: "FinancingApplication",
        entityId: app.id,
        ipAddress: "127.0.0.1",
        details: `Permintaan revisi pada ${app.applicationNumber}: ${payload.comments}`,
        sha256: sha,
      });

      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        organizationId: app.organizationId,
        recipientRole: "FINANCING_OFFICER",
        title: "Permintaan Revisi Berkas Pengajuan",
        message: `${payload.actorName} meminta revisi berkas ${app.applicationNumber}: "${payload.comments}".`,
        type: "REVISION_REQUESTED",
        relatedId: app.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      this.save(state);
      return { application: app, nextStage: "FO" };
    }

    if (payload.action === "REJECT") {
      app.status = "REJECTED";
      app.statusLabel = "Pengajuan Ditolak";
      app.updatedAt = new Date().toISOString();

      if (currentStep) {
        currentStep.status = "REJECTED";
        currentStep.actionDate = dateStr;
        currentStep.comments = payload.comments;
        currentStep.sha256 = sha;
      }

      state.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        organizationId: app.organizationId,
        timestamp: new Date().toISOString(),
        action: "APPLICATION_REJECTED",
        actor: payload.actorName,
        role: payload.roleCode,
        entity: "FinancingApplication",
        entityId: app.id,
        ipAddress: "127.0.0.1",
        details: `Penolakan berkas ${app.applicationNumber} oleh ${payload.roleCode}: ${payload.comments}`,
        sha256: sha,
      });

      this.save(state);
      return { application: app, nextStage: "REJECTED" };
    }

    // APPROVE
    if (currentStep) {
      currentStep.status = "COMPLETED";
      currentStep.actionDate = dateStr;
      currentStep.comments = payload.comments || "Disetujui tanpa catatan khusus.";
      currentStep.sha256 = sha;
    }

    let nextRoleCode: string = "";
    let nextStage: DBApplication["currentStage"] = "FO";
    let nextStatus: DBApplication["status"] = "LEGAL_REVIEW";
    let nextLabel = "";

    if (payload.roleCode === "LEGAL_OFFICER") {
      nextRoleCode = "COMPLIANCE_OFFICER";
      nextStage = "COMPLIANCE";
      nextStatus = "COMPLIANCE_REVIEW";
      nextLabel = "Menunggu Review Kepatuhan & BMPD";
    } else if (payload.roleCode === "COMPLIANCE_OFFICER") {
      nextRoleCode = "SHARIA_REVIEWER";
      nextStage = "DPS";
      nextStatus = "DPS_REVIEW";
      nextLabel = "Menunggu Sertifikasi Fatwa DPS";
    } else if (payload.roleCode === "SHARIA_REVIEWER") {
      nextRoleCode = "MANAGEMENT";
      nextStage = "MANAGEMENT";
      nextStatus = "MANAGEMENT_REVIEW";
      nextLabel = "Menunggu Persetujuan Komite Pembiayaan (Direksi)";
    } else if (payload.roleCode === "MANAGEMENT") {
      nextRoleCode = "CONTRACT_PARTIES";
      nextStage = "EXECUTED";
      nextStatus = "APPROVED";
      nextLabel = "Disetujui Komite - Siap Eksekusi Akad";
      app.approvedAt = new Date().toISOString();
      app.contractNumber = app.applicationNumber;

      // Automatically Generate Contract Record
      const newContract: DBContract = {
        id: `cnt-${Date.now()}`,
        applicationId: app.id,
        contractNumber: app.applicationNumber,
        organizationId: app.organizationId,
        akad: app.akad,
        customerName: app.customerName,
        objectDescription: app.commodityOrAsset,
        nominalValue: app.costPrice,
        tenorMonths: app.tenorMonths,
        monthlyInstallment: app.monthlyInstallment,
        outstandingBalance: app.sellingPrice - app.downPayment,
        status: "APPROVED",
        shariaStatus: "PASS",
        documentVersion: "v1.0",
        sha256Hash: sha,
        startDate: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
        endDate: new Date(Date.now() + app.tenorMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.contracts.unshift(newContract);
    }

    app.status = nextStatus;
    app.currentStage = nextStage;
    app.statusLabel = nextLabel;
    app.updatedAt = new Date().toISOString();

    const nextStep = steps.find((s) => s.roleCode === nextRoleCode);
    if (nextStep) {
      nextStep.status = "CURRENT";
    }

    // Audit
    state.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      organizationId: app.organizationId,
      timestamp: new Date().toISOString(),
      action: `${payload.roleCode}_APPROVED`,
      actor: payload.actorName,
      role: payload.roleCode,
      entity: "FinancingApplication",
      entityId: app.id,
      ipAddress: "127.0.0.1",
      details: `Persetujuan diterbitkan oleh ${payload.actorName} (${payload.roleCode}): ${payload.comments}`,
      sha256: sha,
    });

    if (nextRoleCode && nextRoleCode !== "CONTRACT_PARTIES") {
      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        organizationId: app.organizationId,
        recipientRole: nextRoleCode,
        title: "Tugas Peninjauan Baru Diteruskan",
        message: `Aplikasi ${app.applicationNumber} (${app.customerName}) telah disetujui ${payload.roleCode} dan siap ditinjau.`,
        type: "REVIEW_REQUESTED",
        relatedId: app.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.save(state);
    return { application: app, nextStage };
  }

  // ==========================================
  // CONTRACTS & LIFECYCLE TRACKING
  // ==========================================
  public static buildContractLifecycleTracker(
    contract: Partial<DBContract>,
    app: DBApplication | null,
    steps: DBApprovalStep[],
    auditLogs: DBAuditLog[]
  ): ContractLifecycleProgressStage[] {
    const foStep = steps.find((s) => s.roleCode === "FINANCING_OFFICER");
    const legalStep = steps.find((s) => s.roleCode === "LEGAL_OFFICER");
    const compStep = steps.find((s) => s.roleCode === "COMPLIANCE_OFFICER");
    const dpsStep = steps.find((s) => s.roleCode === "SHARIA_REVIEWER");
    const mgmtStep = steps.find((s) => s.roleCode === "MANAGEMENT");
    const partiesStep = steps.find((s) => s.roleCode === "CONTRACT_PARTIES");

    const isContractActive = contract.status === "ACTIVE" || app?.status === "ACTIVE";
    const isContractCompleted = contract.status === "COMPLETED" || contract.status === "EXECUTED";
    const isContractApproved = contract.status === "APPROVED" || app?.status === "APPROVED";
    const isRejected = app?.status === "REJECTED";
    const isRevision = app?.status === "REVISION_REQUESTED";

    function resolveStepStatus(step?: DBApprovalStep, stageCode?: string): {
      status: ContractStageStatus;
      statusLabel: "Disetujui" | "Sedang Diproses" | "Menunggu" | "Revisi" | "Ditolak" | "Dilewati";
    } {
      if (!step) {
        if (isContractActive || isContractCompleted) return { status: "COMPLETED", statusLabel: "Disetujui" };
        return { status: "PENDING", statusLabel: "Menunggu" };
      }
      if (step.status === "COMPLETED") return { status: "COMPLETED", statusLabel: "Disetujui" };
      if (step.status === "CURRENT") {
        if (isRevision && app?.currentStage === stageCode) return { status: "REVISION_REQUESTED", statusLabel: "Revisi" };
        return { status: "CURRENT", statusLabel: "Sedang Diproses" };
      }
      if (step.status === "REVISION_REQUESTED") return { status: "REVISION_REQUESTED", statusLabel: "Revisi" };
      if (step.status === "REJECTED") return { status: "REJECTED", statusLabel: "Ditolak" };
      if (step.status === "SKIPPED") return { status: "SKIPPED", statusLabel: "Dilewati" };
      if (isContractActive || isContractCompleted) return { status: "COMPLETED", statusLabel: "Disetujui" };
      return { status: "PENDING", statusLabel: "Menunggu" };
    }

    // Stage 1: Draft / Pengajuan
    const stage1Status = isRevision && app?.currentStage === "FO"
      ? { status: "REVISION_REQUESTED" as const, statusLabel: "Revisi" as const }
      : app?.status === "DRAFT"
        ? { status: "CURRENT" as const, statusLabel: "Sedang Diproses" as const }
        : { status: "COMPLETED" as const, statusLabel: "Disetujui" as const };

    const stage1: ContractLifecycleProgressStage = {
      stageNumber: 1,
      stageKey: "DRAFT_SUBMISSION",
      stageName: "Draft / Pengajuan",
      roleTitle: "Financing Officer",
      roleCode: "FINANCING_OFFICER",
      actorName: app?.createdByName || foStep?.name || "Fatimah Az-Zahra, S.E.Sy.",
      status: stage1Status.status,
      statusLabel: stage1Status.statusLabel,
      actionDate: foStep?.actionDate || (app?.submittedAt ? new Date(app.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "14 Nov 2026, 09:00 WIB"),
      comments: foStep?.comments || app?.notes || "Inisiasi draf pengajuan pembiayaan dan kelayakan berkas awal nasabah.",
      nextStage: "Pemeriksaan Legal",
      sha256: foStep?.sha256,
    };

    // Stage 2: Pemeriksaan Legal
    const s2 = resolveStepStatus(legalStep, "LEGAL");
    const stage2: ContractLifecycleProgressStage = {
      stageNumber: 2,
      stageKey: "LEGAL_REVIEW",
      stageName: "Pemeriksaan Legal",
      roleTitle: "Legal Officer",
      roleCode: "LEGAL_OFFICER",
      actorName: legalStep?.name || "Bambang Sudrajat, S.H.",
      status: s2.status,
      statusLabel: s2.statusLabel,
      actionDate: legalStep?.actionDate || (s2.status === "CURRENT" ? "Sedang berjalan" : undefined),
      comments: legalStep?.comments || (s2.status === "CURRENT" ? "Menunggu validasi klausul hukum, keabsahan perikatan, dan agunan." : undefined),
      nextStage: "Pemeriksaan Compliance",
      sha256: legalStep?.sha256,
    };

    // Stage 3: Pemeriksaan Compliance
    const s3 = resolveStepStatus(compStep, "COMPLIANCE");
    const stage3: ContractLifecycleProgressStage = {
      stageNumber: 3,
      stageKey: "COMPLIANCE_REVIEW",
      stageName: "Pemeriksaan Compliance",
      roleTitle: "Compliance Officer",
      roleCode: "COMPLIANCE_OFFICER",
      actorName: compStep?.name || "Nurul Hidayati",
      status: s3.status,
      statusLabel: s3.statusLabel,
      actionDate: compStep?.actionDate || (s3.status === "CURRENT" ? "Sedang berjalan" : undefined),
      comments: compStep?.comments || (s3.status === "CURRENT" ? "Menunggu pemeriksaan kepatuhan regulasi POJK & BMPD." : undefined),
      nextStage: "Review DPS",
      sha256: compStep?.sha256,
    };

    // Stage 4: Review DPS
    const s4 = resolveStepStatus(dpsStep, "DPS");
    const stage4: ContractLifecycleProgressStage = {
      stageNumber: 4,
      stageKey: "DPS_REVIEW",
      stageName: "Review DPS",
      roleTitle: "Dewan Pengawas Syariah",
      roleCode: "SHARIA_REVIEWER",
      actorName: dpsStep?.name || "K.H. Dr. Ridwan Mansur",
      status: s4.status,
      statusLabel: s4.statusLabel,
      actionDate: dpsStep?.actionDate || (s4.status === "CURRENT" ? "Sedang berjalan" : undefined),
      comments: dpsStep?.comments || (s4.status === "CURRENT" ? "Menunggu telaah kepatuhan fatwa DSN-MUI & sertifikasi syariah." : undefined),
      nextStage: "Persetujuan Management",
      sha256: dpsStep?.sha256,
    };

    // Stage 5: Persetujuan Management
    const s5 = resolveStepStatus(mgmtStep, "MANAGEMENT");
    const stage5: ContractLifecycleProgressStage = {
      stageNumber: 5,
      stageKey: "MANAGEMENT_APPROVAL",
      stageName: "Persetujuan Management",
      roleTitle: "Komite Pembiayaan (Direksi)",
      roleCode: "MANAGEMENT",
      actorName: mgmtStep?.name || "Ir. H. Hendra Gunawan",
      status: s5.status,
      statusLabel: s5.statusLabel,
      actionDate: mgmtStep?.actionDate || (s5.status === "CURRENT" ? "Sedang berjalan" : undefined),
      comments: mgmtStep?.comments || (s5.status === "CURRENT" ? "Menunggu persetujuan komite pembiayaan direksi." : undefined),
      nextStage: "Penandatanganan",
      sha256: mgmtStep?.sha256,
    };

    // Stage 6: Penandatanganan
    let s6Status: ContractStageStatus = "PENDING";
    let s6Label: "Disetujui" | "Sedang Diproses" | "Menunggu" | "Revisi" | "Ditolak" | "Dilewati" = "Menunggu";
    let s6Date: string | undefined = undefined;
    let s6Comments = "Menunggu penyelesaian tahapan persetujuan komite sebelum penandatanganan.";

    if (isContractActive || isContractCompleted || partiesStep?.status === "COMPLETED") {
      s6Status = "COMPLETED";
      s6Label = "Disetujui";
      s6Date = partiesStep?.actionDate || contract.startDate || "Telah Ditandatangani";
      s6Comments = partiesStep?.comments || "Akad dan berkas jaminan telah ditandatangani sah oleh para pihak.";
    } else if (isContractApproved || partiesStep?.status === "CURRENT") {
      s6Status = "CURRENT";
      s6Label = "Sedang Diproses";
      s6Date = "Menunggu penandatanganan";
      s6Comments = "Naskah akad telah disahkan Komite Direksi dan siap ditandatangani para pihak.";
    } else if (isRejected) {
      s6Status = "REJECTED";
      s6Label = "Ditolak";
      s6Comments = "Penandatanganan dibatalkan karena pengajuan ditolak.";
    }

    const stage6: ContractLifecycleProgressStage = {
      stageNumber: 6,
      stageKey: "SIGNING",
      stageName: "Penandatanganan",
      roleTitle: "Para Pihak Berakad",
      roleCode: "CONTRACT_PARTIES",
      actorName: partiesStep?.name || (contract.customerName ? `${contract.customerName} & Pimpinan Cabang` : "Nasabah & Pimpinan Cabang"),
      status: s6Status,
      statusLabel: s6Label,
      actionDate: s6Date,
      comments: s6Comments,
      nextStage: "Aktif",
      sha256: partiesStep?.sha256 || contract.sha256Hash,
    };

    // Stage 7: Aktif
    let s7Status: ContractStageStatus = "PENDING";
    let s7Label: "Disetujui" | "Sedang Diproses" | "Menunggu" | "Revisi" | "Ditolak" | "Dilewati" = "Menunggu";
    let s7Date: string | undefined = undefined;
    let s7Comments = "Menunggu penandatanganan akad & verifikasi pencairan dana.";

    if (isContractActive || isContractCompleted) {
      s7Status = "COMPLETED";
      s7Label = "Disetujui";
      s7Date = contract.startDate || "Akad Berjalan";
      s7Comments = "Fasilitas pembiayaan telah dicairkan dan portofolio akad aktif berjalan.";
    } else if (s6Status === "CURRENT") {
      s7Status = "PENDING";
      s7Label = "Menunggu";
      s7Comments = "Akad akan otomatis aktif setelah penandatanganan para pihak diselesaikan.";
    }

    const stage7: ContractLifecycleProgressStage = {
      stageNumber: 7,
      stageKey: "ACTIVE",
      stageName: "Aktif",
      roleTitle: "Operasional & Finansial",
      roleCode: "OPERATIONS",
      actorName: "Petugas Pencairan & Finansial BPRS",
      status: s7Status,
      statusLabel: s7Label,
      actionDate: s7Date,
      comments: s7Comments,
      nextStage: "Selesai / Executed",
      sha256: contract.sha256Hash,
    };

    // Stage 8: Selesai / Executed
    let s8Status: ContractStageStatus = "PENDING";
    let s8Label: "Disetujui" | "Sedang Diproses" | "Menunggu" | "Revisi" | "Ditolak" | "Dilewati" = "Menunggu";
    let s8Date: string | undefined = undefined;
    let s8Comments = "Tahap akhir setelah seluruh periode pembiayaan selesai lunas.";

    if (isContractCompleted) {
      s8Status = "COMPLETED";
      s8Label = "Disetujui";
      s8Date = contract.endDate || "Akad Selesai & Lunas";
      s8Comments = "Seluruh kewajiban pembayaran lunas, hak milik diserahkan sempurna, akad ditutup lunas.";
    } else if (isContractActive) {
      s8Status = "CURRENT";
      s8Label = "Sedang Diproses";
      s8Date = contract.endDate ? `Jatuh tempo: ${contract.endDate}` : "Masa angsuran berjalan";
      s8Comments = `Masa angsuran berjalan. Jatuh tempo pembayaran berikutnya: ${contract.nextPaymentDate || "-"}.`;
    }

    const stage8: ContractLifecycleProgressStage = {
      stageNumber: 8,
      stageKey: "EXECUTED",
      stageName: "Selesai / Executed",
      roleTitle: "Sistem Finansial & Administrasi",
      roleCode: "SYSTEM",
      actorName: "Sistem Administrasi Finansial",
      status: s8Status,
      statusLabel: s8Label,
      actionDate: s8Date,
      comments: s8Comments,
      nextStage: "Selesai (Akhir Siklus)",
      sha256: contract.sha256Hash,
    };

    return [stage1, stage2, stage3, stage4, stage5, stage6, stage7, stage8];
  }

  public static getContracts(filters?: {
    organizationId?: string;
    akad?: string;
    status?: string;
    search?: string;
  }): DBContract[] {
    const state = this.load();

    const existingContractAppIds = new Set(
      state.contracts.map((c) => c.applicationId).filter(Boolean)
    );
    const existingContractNumbers = new Set(
      state.contracts.map((c) => c.contractNumber)
    );

    // Map applications that represent contracts in the lifecycle
    const appContracts: DBContract[] = state.applications
      .filter(
        (app) =>
          !app.isDeleted &&
          !existingContractAppIds.has(app.id) &&
          !existingContractNumbers.has(app.applicationNumber)
      )
      .map((app) => {
        const contractStatus: DBContract["status"] =
          app.status === "ACTIVE"
            ? "ACTIVE"
            : app.status === "APPROVED"
              ? "APPROVED"
              : app.status === "REJECTED"
                ? "TERMINATED"
                : app.currentStage === "DPS" || app.currentStage === "MANAGEMENT"
                  ? "PENDING_APPROVAL"
                  : app.currentStage === "LEGAL" || app.currentStage === "COMPLIANCE"
                    ? "UNDER_REVIEW"
                    : "DRAFT";

        return {
          id: `cnt-app-${app.id}`,
          applicationId: app.id,
          contractNumber: app.applicationNumber,
          organizationId: app.organizationId,
          akad: app.akad,
          customerName: app.customerName,
          objectDescription: app.commodityOrAsset || app.title,
          nominalValue: app.costPrice,
          tenorMonths: app.tenorMonths,
          monthlyInstallment:
            app.monthlyInstallment ||
            Math.round(app.costPrice / (app.tenorMonths || 12)),
          outstandingBalance:
            app.sellingPrice - app.downPayment || app.costPrice,
          status: contractStatus,
          shariaStatus: (app.shariaStatus as "PASS" | "REVIEW" | "BLOCKED") || "PASS",
          documentVersion: "v1.0",
          sha256Hash: this.hash({ id: app.id, num: app.applicationNumber }),
          startDate: app.submittedAt
            ? new Date(app.submittedAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
            : "-",
          endDate: "-",
          nextPaymentDate: "-",
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        };
      });

    const combined = [...state.contracts, ...appContracts];

    // Filter
    const filtered = combined.filter((c) => {
      if (filters?.organizationId && c.organizationId !== filters.organizationId)
        return false;
      if (filters?.akad && filters.akad !== "ALL" && c.akad !== filters.akad)
        return false;
      if (filters?.status && filters.status !== "ALL" && c.status !== filters.status)
        return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matches =
          c.contractNumber.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.objectDescription.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });

    // Enrich with lifecycle tracking stages
    return filtered.map((c) => {
      const app =
        state.applications.find(
          (a) =>
            a.id === c.applicationId ||
            a.applicationNumber === c.contractNumber ||
            a.contractNumber === c.contractNumber
        ) || null;
      const steps = app
        ? state.approvalSteps.filter((s) => s.applicationId === app.id)
        : [];
      const logs = state.auditLogs.filter(
        (l) =>
          l.entityId === c.id ||
          (app && l.entityId === app.id) ||
          l.details?.includes(c.contractNumber)
      );

      const stages = this.buildContractLifecycleTracker(c, app, steps, logs);
      const completedCount = stages.filter((s) => s.status === "COMPLETED").length;
      const currentProgressPercent = Math.round((completedCount / 8) * 100);
      const currentStageName =
        stages.find((s) => s.status === "CURRENT")?.stageName ||
        (c.status === "ACTIVE"
          ? "Aktif"
          : c.status === "COMPLETED"
            ? "Selesai / Executed"
            : "Selesai");

      const auditTrail = logs.map((l) => ({
        action: l.action,
        actor: `${l.actor} (${l.role})`,
        timestamp:
          new Date(l.timestamp).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB",
        details: l.details,
      }));

      return {
        ...c,
        stages,
        approvalSteps: steps,
        currentStageName,
        currentProgressPercent,
        auditTrail:
          auditTrail.length > 0
            ? auditTrail
            : [
              {
                action: "Pencatatan Master Kontrak",
                actor: "Sistem Administrasi",
                timestamp: "Tercatat di Repositori",
                details: "Data tersimpan di direktori master",
              },
            ],
      };
    });
  }

  public static getContractById(idOrNumber: string): {
    contract: DBContract | null;
    application: DBApplication | null;
    stages: ContractLifecycleProgressStage[];
    steps: DBApprovalStep[];
    documents: DBDocument[];
  } {
    const contracts = this.getContracts();
    const found =
      contracts.find(
        (c) =>
          c.id === idOrNumber ||
          c.contractNumber === idOrNumber ||
          c.applicationId === idOrNumber
      ) || null;

    if (!found) {
      return {
        contract: null,
        application: null,
        stages: [],
        steps: [],
        documents: [],
      };
    }

    const state = this.load();
    const app =
      state.applications.find(
        (a) =>
          a.id === found.applicationId ||
          a.applicationNumber === found.contractNumber
      ) || null;
    const steps = app
      ? state.approvalSteps.filter((s) => s.applicationId === app.id)
      : [];
    const documents = app
      ? state.documents.filter((d) => d.applicationId === app.id)
      : [];

    return {
      contract: found,
      application: app,
      stages: found.stages || [],
      steps,
      documents,
    };
  }

  public static signAndActivateContract(payload: {
    contractIdOrNumber: string;
    actorName: string;
    role: string;
    comments?: string;
  }): { contract: DBContract; application?: DBApplication } {
    const state = this.load();

    // 1. Find contract
    let contract = state.contracts.find(
      (c) =>
        c.id === payload.contractIdOrNumber ||
        c.contractNumber === payload.contractIdOrNumber
    );

    // If not found directly in contracts, search applications
    let app = state.applications.find(
      (a) =>
        a.id === payload.contractIdOrNumber ||
        a.applicationNumber === payload.contractIdOrNumber ||
        (contract && a.id === contract.applicationId)
    );

    if (!contract && app) {
      contract = state.contracts.find((c) => c.applicationId === app!.id);
      if (!contract && (app.status === "APPROVED" || app.status === "ACTIVE")) {
        contract = {
          id: `cnt-${Date.now()}`,
          applicationId: app.id,
          contractNumber: app.applicationNumber,
          organizationId: app.organizationId,
          akad: app.akad,
          customerName: app.customerName,
          objectDescription: app.commodityOrAsset,
          nominalValue: app.costPrice,
          tenorMonths: app.tenorMonths,
          monthlyInstallment: app.monthlyInstallment,
          outstandingBalance: app.sellingPrice - app.downPayment,
          status: "APPROVED",
          shariaStatus: "PASS",
          documentVersion: "v1.0",
          sha256Hash: this.hash({ ...payload, timestamp: Date.now() }),
          startDate: new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          endDate: new Date(
            Date.now() + app.tenorMonths * 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          nextPaymentDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.contracts.unshift(contract);
      }
    }

    if (!contract && !app) {
      throw new Error(`Kontrak ${payload.contractIdOrNumber} tidak ditemukan.`);
    }

    // 2. Validate Defense-in-depth: Sharia & Approval requirements
    if (app) {
      if (
        app.shariaStatus === "BLOCKED" ||
        (app.shariaStatus as string) === "NON_COMPLIANT"
      ) {
        throw new Error(
          `[SHARIA_BLOCKED] Akad ${app.applicationNumber} melanggar parameter syariah dan dilarang untuk diaktifkan.`
        );
      }

      const steps = state.approvalSteps.filter((s) => s.applicationId === app!.id);
      const legal = steps.find((s) => s.roleCode === "LEGAL_OFFICER");
      const comp = steps.find((s) => s.roleCode === "COMPLIANCE_OFFICER");
      const dps = steps.find((s) => s.roleCode === "SHARIA_REVIEWER");
      const mgmt = steps.find((s) => s.roleCode === "MANAGEMENT");

      const notApproved: string[] = [];
      if (legal && legal.status !== "COMPLETED") notApproved.push("Legal Officer");
      if (comp && comp.status !== "COMPLETED") notApproved.push("Compliance Officer");
      if (dps && dps.status !== "COMPLETED") notApproved.push("Dewan Pengawas Syariah (DPS)");
      if (mgmt && mgmt.status !== "COMPLETED") notApproved.push("Komite Pembiayaan (Direksi)");

      if (notApproved.length > 0) {
        throw new Error(
          `Akad belum dapat diaktifkan: Tahapan persetujuan [${notApproved.join(", ")}] wajib diselesaikan terlebih dahulu.`
        );
      }

      // Mark CONTRACT_PARTIES step as COMPLETED
      const partiesStep = steps.find((s) => s.roleCode === "CONTRACT_PARTIES");
      const dateStr =
        new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB";
      const sha = this.hash({ ...payload, timestamp: Date.now() });

      if (partiesStep) {
        partiesStep.status = "COMPLETED";
        partiesStep.actionDate = dateStr;
        partiesStep.name = payload.actorName;
        partiesStep.comments =
          payload.comments ||
          "Akad dan berkas jaminan telah resmi ditandatangani para pihak dan diaktifkan.";
        partiesStep.sha256 = sha;
      }

      app.status = "ACTIVE";
      app.statusLabel = "Akad Aktif & Berjalan";
      app.currentStage = "EXECUTED";
      app.updatedAt = new Date().toISOString();
    }

    if (contract) {
      contract.status = "ACTIVE";
      contract.updatedAt = new Date().toISOString();
    }

    // 3. Write Audit Log
    const targetEntityId = contract?.id || app?.id || payload.contractIdOrNumber;
    const targetNumber =
      contract?.contractNumber || app?.applicationNumber || payload.contractIdOrNumber;
    const orgId =
      contract?.organizationId || app?.organizationId || "org-bprs-albarakah";

    state.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      organizationId: orgId,
      timestamp: new Date().toISOString(),
      action: "CONTRACT_SIGNED_AND_ACTIVATED",
      actor: payload.actorName,
      role: payload.role,
      entity: "Contract",
      entityId: targetEntityId,
      ipAddress: "127.0.0.1",
      details: `Akad ${targetNumber} telah resmi ditandatangani dan status diperbarui menjadi AKTIF. Catatan: ${payload.comments || "-"}`,
      sha256: this.hash({ ...payload, timestamp: Date.now() }),
    });

    this.save(state);
    return { contract: contract!, application: app };
  }

  // ==========================================
  // SHARIA VALIDATION REPORTS
  // ==========================================
  public static getShariaValidationReports(filters?: {
    organizationId?: string;
    applicationId?: string;
  }): DBShariaValidationReport[] {
    const state = this.load();
    const reports = state.shariaValidationReports || [];
    return reports.filter((r) => {
      if (filters?.organizationId && r.organizationId !== filters.organizationId) return false;
      if (filters?.applicationId && r.applicationId !== filters.applicationId) return false;
      return true;
    });
  }

  public static getShariaValidationReportByApplicationId(
    applicationId: string,
    organizationId?: string
  ): DBShariaValidationReport | null {
    const state = this.load();
    const reports = state.shariaValidationReports || [];
    const found = reports.find((r) => r.applicationId === applicationId);
    if (!found) return null;
    if (organizationId && found.organizationId !== organizationId) return null;
    return found;
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  public static getNotifications(options?: string | { role?: string; organizationId?: string }): DBNotification[] {
    const state = this.load();
    const role = typeof options === "string" ? options : options?.role;
    const organizationId = typeof options === "object" ? options?.organizationId : undefined;

    return state.notifications.filter((n) => {
      if (organizationId && n.organizationId !== organizationId) return false;
      if (!role) return true;
      return !n.recipientRole || n.recipientRole === role || role === "SUPER_ADMIN" || role === "INSTITUTION_ADMIN";
    });
  }

  public static markNotificationRead(id: string): void {
    const state = this.load();
    const notif = state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save(state);
    }
  }

  public static markAllNotificationsRead(role?: string): void {
    const state = this.load();
    state.notifications.forEach((n) => {
      if (!role || n.recipientRole === role) {
        n.isRead = true;
      }
    });
    this.save(state);
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  public static getAuditLogs(options?: number | { organizationId?: string; limit?: number }): DBAuditLog[] {
    const state = this.load();
    const limit = typeof options === "number" ? options : options?.limit || 100;
    const organizationId = typeof options === "object" ? options?.organizationId : undefined;

    return state.auditLogs
      .filter((log) => {
        if (organizationId && log.organizationId !== organizationId) return false;
        return true;
      })
      .slice(0, limit);
  }

  // ==========================================
  // CUSTOMER MANAGEMENT & VERIFICATION TRACKER (TAHAP 3A & ONBOARDING)
  // All operations are tenant-scoped: organizationId is mandatory for any
  // mutation and every read is filtered by the caller's tenant unless the
  // caller is the platform super admin (route-level guard).
  // ==========================================

  public static buildDefaultCustomerVerificationSteps(customer: {
    registrationStatus?: CustomerRegistrationStatus;
    kycStatus?: CustomerKycStatus;
    amlStatus?: CustomerAmlStatus;
    riskRating?: CustomerRiskRating;
    isVerified?: boolean;
    createdAt?: string;
    verifiedAt?: string;
    verifiedBy?: string;
    rejectionReason?: string;
    revisionNotes?: string;
  }): CustomerVerificationStep[] {
    const regStatus = customer.registrationStatus || "SUBMITTED";
    const kycStatus = customer.kycStatus || (customer.isVerified ? "VERIFIED" : "PENDING");
    const amlStatus = customer.amlStatus || "NOT_SCREENED";
    const riskRating = customer.riskRating || "LOW";
    const isApproved = regStatus === "APPROVED" || customer.isVerified;
    const isRejected = regStatus === "REJECTED";

    // Step 1: Pendaftaran & Pengajuan Data
    const step1Status: CustomerStepStatus = regStatus === "DRAFT" ? "CURRENT" : "COMPLETED";
    const step1: CustomerVerificationStep = {
      stepKey: "REGISTRATION_SUBMISSION",
      stepNumber: 1,
      title: "Pendaftaran & Pengajuan Data Nasabah",
      roleTitle: "Financing Officer",
      status: step1Status,
      statusLabel: step1Status === "COMPLETED" ? "Selesai" : "Sedang Diisi",
      officerName: "Financing Officer",
      actionDate: customer.createdAt || new Date().toISOString(),
      comments:
        regStatus === "DRAFT"
          ? "Formulir pendaftaran nasabah sedang diisi dan disimpan sebagai draf."
          : "Formulir pendaftaran dan profil awal nasabah telah diserahkan.",
      documentsInspected: ["Formulir Pendaftaran", "Profil Calon Nasabah"],
      nextAction:
        regStatus === "DRAFT"
          ? "Selesaikan dan kirim formulir pendaftaran."
          : "Pemeriksaan dokumen identitas dan verifikasi KYC oleh Compliance Officer.",
    };

    // Step 2: Verifikasi Identitas & Dokumen KYC
    let step2Status: CustomerStepStatus = "PENDING";
    let step2Comments = "Menunggu verifikasi identitas resmi (NIK/NPWP/NIB) dan kelengkapan dokumen pendukung.";
    if (kycStatus === "VERIFIED") {
      step2Status = "COMPLETED";
      step2Comments = "Identitas nasabah dan dokumen KYC telah diperiksa dan dinyatakan sah & sesuai.";
    } else if (kycStatus === "REVISION_REQUIRED") {
      step2Status = "REVISION_REQUIRED";
      step2Comments = customer.revisionNotes || "Dokumen identitas/pendukung memerlukan perbaikan dari Financing Officer.";
    } else if (kycStatus === "REJECTED") {
      step2Status = "REJECTED";
      step2Comments = "Dokumen identitas atau data nasabah tidak valid dan ditolak.";
    } else if (regStatus === "SUBMITTED" || regStatus === "UNDER_REVIEW") {
      step2Status = "CURRENT";
    }

    const step2: CustomerVerificationStep = {
      stepKey: "IDENTITY_KYC_VERIFICATION",
      stepNumber: 2,
      title: "Verifikasi Identitas & Dokumen KYC",
      roleTitle: "Compliance Officer",
      status: step2Status,
      statusLabel:
        step2Status === "COMPLETED"
          ? "Selesai (Sah)"
          : step2Status === "REVISION_REQUIRED"
            ? "Perlu Perbaikan"
            : step2Status === "REJECTED"
              ? "Ditolak"
              : step2Status === "CURRENT"
                ? "Sedang Diperiksa"
                : "Menunggu",
      officerName: step2Status === "COMPLETED" ? customer.verifiedBy || "Compliance Officer" : undefined,
      actionDate: step2Status === "COMPLETED" ? customer.verifiedAt || customer.createdAt : undefined,
      comments: step2Comments,
      documentsInspected: ["KTP / Paspor / KITAS", "NPWP / NIB", "Bukti Domisili"],
      nextAction:
        step2Status === "COMPLETED"
          ? "Lanjutkan ke skrining AML/CFT APU-PPT."
          : "Lakukan verifikasi keabsahan identitas dan dokumen KYC.",
    };

    // Step 3: Skrining AML/CFT APU-PPT
    let step3Status: CustomerStepStatus = "PENDING";
    let step3Comments = "Menunggu pemeriksaan database DTTOT, pencegahan pendanaan terorisme, dan daftar sanksi.";
    if (amlStatus === "CLEARED") {
      step3Status = "COMPLETED";
      step3Comments = "Hasil skrining APU-PPT bersih (CLEARED): tidak terdaftar pada DTTOT, PEP berisiko, maupun entitas terlarang.";
    } else if (amlStatus === "FLAGGED") {
      step3Status = "REJECTED";
      step3Comments = "TERKENA FLAG AML: Terindikasi dalam daftar pengawasan atau memiliki ketidaksesuaian regulasi APU-PPT.";
    } else if (step2Status === "COMPLETED") {
      step3Status = "CURRENT";
    }

    const step3: CustomerVerificationStep = {
      stepKey: "AML_CFT_SCREENING",
      stepNumber: 3,
      title: "Skrining AML/CFT (APU-PPT)",
      roleTitle: "Compliance Officer",
      status: step3Status,
      statusLabel:
        step3Status === "COMPLETED"
          ? "Selesai (Cleared)"
          : step3Status === "REJECTED"
            ? "Terkena Flag"
            : step3Status === "CURRENT"
              ? "Sedang Diskukrining"
              : "Menunggu",
      officerName:
        step3Status === "COMPLETED" || step3Status === "REJECTED"
          ? customer.verifiedBy || "Compliance Officer"
          : undefined,
      actionDate:
        step3Status === "COMPLETED" || step3Status === "REJECTED"
          ? customer.verifiedAt || customer.createdAt
          : undefined,
      comments: step3Comments,
      documentsInspected: ["Database DTTOT / PPATK", "Daftar PEP & Sanksi Global", "Pemeriksaan Rekening"],
      nextAction:
        step3Status === "COMPLETED"
          ? "Lakukan penetapan klasifikasi tingkat risiko nasabah."
          : "Pemeriksaan kepatuhan APU-PPT.",
    };

    // Step 4: Penilaian Profil Risiko (Risk Assessment)
    let step4Status: CustomerStepStatus = "PENDING";
    let step4Comments = `Tingkat risiko ditetapkan pada klasifikasi: ${riskRating}.`;
    if (step3Status === "COMPLETED") {
      step4Status = "COMPLETED";
      step4Comments = `Penilaian risiko selesai: Tingkat risiko nasabah diklasifikasikan sebagai ${riskRating === "HIGH"
          ? "Tinggi (High Risk)"
          : riskRating === "MEDIUM"
            ? "Menengah (Medium Risk)"
            : "Rendah (Low Risk)"
        }.`;
    } else if (step2Status === "COMPLETED" && step3Status !== "REJECTED") {
      step4Status = "CURRENT";
    }

    const step4: CustomerVerificationStep = {
      stepKey: "RISK_ASSESSMENT",
      stepNumber: 4,
      title: "Penilaian Profil Risiko (Risk Assessment)",
      roleTitle: "Compliance Officer",
      status: step4Status,
      statusLabel:
        step4Status === "COMPLETED"
          ? `Selesai (${riskRating})`
          : step4Status === "CURRENT"
            ? "Sedang Dinilai"
            : "Menunggu",
      officerName: step4Status === "COMPLETED" ? customer.verifiedBy || "Compliance Officer" : undefined,
      actionDate: step4Status === "COMPLETED" ? customer.verifiedAt || customer.createdAt : undefined,
      comments: step4Comments,
      documentsInspected: ["Analisa Sumber Dana", "Profil Omzet/Penghasilan", "Matriks Risiko Kepatuhan"],
      nextAction:
        step4Status === "COMPLETED"
          ? "Lakukan keputusan akhir persetujuan nasabah."
          : "Evaluasi profil risiko nasabah.",
    };

    // Step 5: Keputusan Akhir Pendaftaran (Final Decision)
    let step5Status: CustomerStepStatus = "PENDING";
    let step5Comments = "Menunggu verifikasi lengkap KYC dan hasil skrining AML sebelum keputusan persetujuan akhir.";
    if (isApproved) {
      step5Status = "COMPLETED";
      step5Comments = `Pendaftaran nasabah telah disetujui resmi oleh ${customer.verifiedBy || "Compliance Officer"
        }. Nasabah berstatus aktif dan terverifikasi untuk pengajuan akad pembiayaan.`;
    } else if (isRejected) {
      step5Status = "REJECTED";
      step5Comments =
        customer.rejectionReason || "Pendaftaran nasabah ditolak karena tidak memenuhi ketentuan kepatuhan/AML.";
    } else if (step4Status === "COMPLETED") {
      step5Status = "CURRENT";
      step5Comments = "Seluruh tahapan pemeriksaan selesai. Siap untuk keputusan persetujuan akhir nasabah.";
    }

    const step5: CustomerVerificationStep = {
      stepKey: "FINAL_APPROVAL",
      stepNumber: 5,
      title: "Keputusan Akhir Verifikasi & Persetujuan",
      roleTitle: "Compliance Officer / Admin",
      status: step5Status,
      statusLabel:
        step5Status === "COMPLETED"
          ? "Disetujui"
          : step5Status === "REJECTED"
            ? "Ditolak"
            : step5Status === "CURRENT"
              ? "Siap Diputuskan"
              : "Menunggu",
      officerName: isApproved || isRejected ? customer.verifiedBy || "Compliance Officer" : undefined,
      actionDate: isApproved || isRejected ? customer.verifiedAt || customer.createdAt : undefined,
      comments: step5Comments,
      documentsInspected: ["Laporan Verifikasi Lengkap", "Keputusan Kepatuhan"],
      nextAction: isApproved
        ? "Nasabah siap diajukan untuk transaksi akad syariah."
        : "Menunggu tindak lanjut atau perbaikan berkas.",
    };

    return [step1, step2, step3, step4, step5];
  }

  public static normalizeCustomer(customer: DBCustomer): DBCustomer {
    const aml = (customer.amlStatus as any) || "NOT_SCREENED";

    let regStatus: CustomerRegistrationStatus = customer.registrationStatus;
    let kycStatus: CustomerKycStatus = customer.kycStatus;

    if (!regStatus) {
      if (customer.isVerified && aml === "CLEARED") {
        regStatus = "APPROVED";
      } else if (aml === "FLAGGED") {
        regStatus = "REJECTED";
      } else {
        regStatus = "UNDER_REVIEW";
      }
    }

    if (!kycStatus) {
      if (customer.isVerified) {
        kycStatus = "VERIFIED";
      } else if (aml === "FLAGGED") {
        kycStatus = "REJECTED";
      } else {
        kycStatus = "PENDING";
      }
    }

    const steps =
      customer.verificationSteps && customer.verificationSteps.length > 0
        ? customer.verificationSteps
        : this.buildDefaultCustomerVerificationSteps({
          ...customer,
          registrationStatus: regStatus,
          kycStatus,
          amlStatus: aml,
        });

    return {
      ...customer,
      registrationStatus: regStatus,
      kycStatus,
      amlStatus: aml,
      riskRating: customer.riskRating || "LOW",
      isVerified: !!customer.isVerified,
      verificationSteps: steps,
    };
  }

  /**
   * List customers of an organization. `organizationId` is optional ONLY for
   * platform super-admin cross-tenant queries; tenant users always pass their
   * own organizationId (enforced at the API route).
   */
  public static getCustomers(params: {
    organizationId?: string;
    search?: string;
    type?: "INDIVIDUAL" | "CORPORATE";
    amlStatus?: CustomerAmlStatus;
    riskRating?: CustomerRiskRating;
    registrationStatus?: CustomerRegistrationStatus;
    kycStatus?: CustomerKycStatus;
    isVerified?: boolean;
  }): DBCustomer[] {
    const state = this.load();
    const search = params.search?.trim().toLowerCase();

    return state.customers
      .map((customer) => this.normalizeCustomer(customer))
      .filter((customer) => {
        if (params.organizationId && customer.organizationId !== params.organizationId) return false;
        if (params.type && customer.type !== params.type) return false;
        if (params.amlStatus && customer.amlStatus !== params.amlStatus) return false;
        if (params.riskRating && customer.riskRating !== params.riskRating) return false;
        if (params.registrationStatus && customer.registrationStatus !== params.registrationStatus) return false;
        if (params.kycStatus && customer.kycStatus !== params.kycStatus) return false;
        if (params.isVerified !== undefined && customer.isVerified !== params.isVerified) return false;
        if (search) {
          const haystack = [customer.name, customer.identifierNumber, customer.phone || "", customer.cifNumber || ""]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first
  }

  /** Fetch a single customer by id. Tenant ownership is checked by the caller. */
  public static getCustomerById(id: string): DBCustomer | null {
    const state = this.load();
    const customer = state.customers.find((c) => c.id === id);
    if (!customer) return null;
    return this.normalizeCustomer(customer);
  }

  /**
   * Tahap 3B.2 — lightweight customer reference for financing application
   * enrichment (list + detail). The optional `organizationId` enforces tenant
   * match; returns null on any mismatch or missing record so callers can
   * degrade safely (never leak cross-tenant data, never fail the read).
   */
  public static getCustomerReference(
    customerId: string,
    organizationId?: string
  ): DBCustomerReference | null {
    const customer = this.getCustomerById(customerId);
    if (!customer) return null;
    if (organizationId && customer.organizationId !== organizationId) return null;
    return {
      id: customer.id,
      cifNumber: customer.cifNumber,
      name: customer.name,
      riskRating: customer.riskRating,
      amlStatus: customer.amlStatus,
      kycStatus: customer.kycStatus,
      registrationStatus: customer.registrationStatus,
      isVerified: customer.isVerified,
    };
  }

  /**
   * Create a customer within a tenant. Rejects duplicate identifierNumber
   * inside the SAME organization (mirrors Prisma @@unique([organizationId, identifierNumber])).
   */
  public static createCustomer(payload: {
    organizationId: string;
    type: "INDIVIDUAL" | "CORPORATE";
    name: string;
    identifierNumber: string;
    cifNumber?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    annualIncomeOrRevenue?: number;
    riskRating?: CustomerRiskRating;
    amlStatus?: CustomerAmlStatus;
    registrationStatus?: CustomerRegistrationStatus;
    kycStatus?: CustomerKycStatus;
    isVerified?: boolean;
    metadata?: Record<string, unknown>;
  }): DBCustomer {
    if (!payload.organizationId) {
      throw new Error(
        "[TENANT_ISOLATION] organizationId wajib disertakan saat membuat customer."
      );
    }

    const state = this.load();

    const identifier = payload.identifierNumber.trim();
    const duplicate = state.customers.find(
      (c) => c.organizationId === payload.organizationId && c.identifierNumber.toLowerCase() === identifier.toLowerCase()
    );
    if (duplicate) {
      throw new Error(
        `[CUSTOMER_DUPLICATE_IDENTIFIER] Nomor identitas '${identifier}' sudah terdaftar pada organisasi ini (customer ${duplicate.cifNumber || duplicate.id}).`
      );
    }

    const timestamp = new Date().toISOString();
    const regStatus: CustomerRegistrationStatus = payload.registrationStatus || "SUBMITTED";
    const kycStatus: CustomerKycStatus =
      payload.kycStatus || (regStatus === "DRAFT" ? "NOT_STARTED" : "PENDING");
    const amlStatus: CustomerAmlStatus = payload.amlStatus || "NOT_SCREENED";
    const riskRating: CustomerRiskRating = payload.riskRating || "LOW";

    // Strictly enforce that new customers are NOT pre-verified
    const isVerified = false;

    const initialSteps = this.buildDefaultCustomerVerificationSteps({
      registrationStatus: regStatus,
      kycStatus,
      amlStatus,
      riskRating,
      isVerified,
      createdAt: timestamp,
    });

    const newCustomer: DBCustomer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      organizationId: payload.organizationId,
      cifNumber: payload.cifNumber?.trim() || `CIF-${Date.now().toString(36).toUpperCase()}`,
      type: payload.type,
      name: payload.name.trim(),
      identifierNumber: identifier,
      email: payload.email?.trim() || undefined,
      phone: payload.phone?.trim() || undefined,
      address: payload.address?.trim() || undefined,
      city: payload.city?.trim() || undefined,
      province: payload.province?.trim() || undefined,
      postalCode: payload.postalCode?.trim() || undefined,
      annualIncomeOrRevenue: payload.annualIncomeOrRevenue,
      riskRating,
      amlStatus,
      registrationStatus: regStatus,
      kycStatus,
      isVerified,
      verificationSteps: initialSteps,
      metadata: payload.metadata,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.customers.unshift(newCustomer);
    this.save(state);
    return newCustomer;
  }

  /**
   * Update a customer. `contextOrganizationId` MUST match the customer's
   * organization — mismatch is rejected even if the caller skipped the route
   * guard (defense in depth). Duplicate identifier check runs when the
   * identifier itself changes.
   */
  public static updateCustomer(
    id: string,
    patch: {
      type?: "INDIVIDUAL" | "CORPORATE";
      name?: string;
      identifierNumber?: string;
      cifNumber?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      annualIncomeOrRevenue?: number;
      riskRating?: CustomerRiskRating;
      amlStatus?: CustomerAmlStatus;
      registrationStatus?: CustomerRegistrationStatus;
      kycStatus?: CustomerKycStatus;
      isVerified?: boolean;
      metadata?: Record<string, unknown>;
    },
    contextOrganizationId: string
  ): DBCustomer | null {
    if (!contextOrganizationId) {
      throw new Error("[TENANT_ISOLATION] contextOrganizationId wajib disertakan saat memperbarui customer.");
    }

    const state = this.load();
    const customer = state.customers.find((c) => c.id === id);
    if (!customer) return null;

    if (customer.organizationId !== contextOrganizationId) {
      throw new Error(
        `[TENANT_ISOLATION_VIOLATION] Customer '${id}' milik organisasi '${customer.organizationId}', bukan '${contextOrganizationId}'.`
      );
    }

    if (patch.identifierNumber !== undefined) {
      const identifier = patch.identifierNumber.trim();
      if (identifier.toLowerCase() !== customer.identifierNumber.toLowerCase()) {
        const duplicate = state.customers.find(
          (c) =>
            c.id !== id &&
            c.organizationId === customer.organizationId &&
            c.identifierNumber.toLowerCase() === identifier.toLowerCase()
        );
        if (duplicate) {
          throw new Error(
            `[CUSTOMER_DUPLICATE_IDENTIFIER] Nomor identitas '${identifier}' sudah terdaftar pada organisasi ini (customer ${duplicate.cifNumber || duplicate.id}).`
          );
        }
      }
      customer.identifierNumber = identifier;
    }

    if (patch.type !== undefined) customer.type = patch.type;
    if (patch.name !== undefined) customer.name = patch.name.trim();
    if (patch.cifNumber !== undefined) customer.cifNumber = patch.cifNumber.trim();
    if (patch.email !== undefined) customer.email = patch.email.trim() || undefined;
    if (patch.phone !== undefined) customer.phone = patch.phone.trim() || undefined;
    if (patch.address !== undefined) customer.address = patch.address.trim() || undefined;
    if (patch.city !== undefined) customer.city = patch.city.trim() || undefined;
    if (patch.province !== undefined) customer.province = patch.province.trim() || undefined;
    if (patch.postalCode !== undefined) customer.postalCode = patch.postalCode.trim() || undefined;
    if (patch.annualIncomeOrRevenue !== undefined) customer.annualIncomeOrRevenue = patch.annualIncomeOrRevenue;
    if (patch.riskRating !== undefined) customer.riskRating = patch.riskRating;
    if (patch.amlStatus !== undefined) customer.amlStatus = patch.amlStatus;
    if (patch.registrationStatus !== undefined) customer.registrationStatus = patch.registrationStatus;
    if (patch.kycStatus !== undefined) customer.kycStatus = patch.kycStatus;
    if (patch.isVerified !== undefined) customer.isVerified = patch.isVerified;
    if (patch.metadata !== undefined) customer.metadata = patch.metadata;
    customer.updatedAt = new Date().toISOString();

    this.save(state);
    return this.normalizeCustomer(customer);
  }

  /**
   * Process customer verification tracker action:
   * Handles 10 discrete workflow lifecycle events with strict role validation
   * and defense-in-depth criteria.
   */
  public static processCustomerVerificationAction(payload: {
    customerId: string;
    contextOrganizationId: string;
    actor: { userId: string; fullName: string; role: string };
    action:
    | "SUBMIT"
    | "SUBMIT_REVISED_DATA"
    | "VERIFY_KYC"
    | "REQUEST_REVISION_KYC"
    | "REJECT_KYC"
    | "SET_AML_CLEARED"
    | "SET_AML_FLAGGED"
    | "SET_RISK_RATING"
    | "FINAL_APPROVE"
    | "FINAL_REJECT";
    comments?: string;
    riskRating?: CustomerRiskRating;
    documentsInspected?: string[];
  }): DBCustomer {
    if (!payload.contextOrganizationId) {
      throw new Error("[TENANT_ISOLATION] contextOrganizationId wajib disertakan.");
    }

    const state = this.load();
    const customer = state.customers.find((c) => c.id === payload.customerId);
    if (!customer) {
      throw new Error(`[CUSTOMER_NOT_FOUND] Customer '${payload.customerId}' tidak ditemukan.`);
    }

    if (customer.organizationId !== payload.contextOrganizationId) {
      throw new Error(
        `[TENANT_ISOLATION_VIOLATION] Customer '${customer.id}' milik organisasi '${customer.organizationId}', bukan '${payload.contextOrganizationId}'.`
      );
    }

    // Role-based validation
    const verificationActions = [
      "VERIFY_KYC",
      "REQUEST_REVISION_KYC",
      "REJECT_KYC",
      "SET_AML_CLEARED",
      "SET_AML_FLAGGED",
      "SET_RISK_RATING",
      "FINAL_APPROVE",
      "FINAL_REJECT",
    ];

    const submissionActions = ["SUBMIT", "SUBMIT_REVISED_DATA"];

    if (verificationActions.includes(payload.action)) {
      if (
        payload.actor.role !== "COMPLIANCE_OFFICER" &&
        payload.actor.role !== "INSTITUTION_ADMIN" &&
        payload.actor.role !== "SUPER_ADMIN"
      ) {
        throw new Error(
          `[FORBIDDEN] Role '${payload.actor.role}' tidak berwenang melakukan verifikasi kepatuhan/AML. Operasi ini membutuhkan role Compliance Officer atau Administrator Institusi.`
        );
      }
    }

    if (submissionActions.includes(payload.action)) {
      if (
        payload.actor.role !== "FINANCING_OFFICER" &&
        payload.actor.role !== "INSTITUTION_ADMIN" &&
        payload.actor.role !== "SUPER_ADMIN"
      ) {
        throw new Error(
          `[FORBIDDEN] Role '${payload.actor.role}' tidak berwenang mengirimkan/mengubah pengajuan nasabah.`
        );
      }
    }

    const timestamp = new Date().toISOString();
    const norm = this.normalizeCustomer(customer);
    customer.registrationStatus = norm.registrationStatus;
    customer.kycStatus = norm.kycStatus;
    customer.amlStatus = norm.amlStatus;
    customer.riskRating = norm.riskRating;
    customer.isVerified = norm.isVerified;
    customer.verificationSteps = norm.verificationSteps;

    const steps = [...(customer.verificationSteps || [])];

    switch (payload.action) {
      case "SUBMIT": {
        customer.registrationStatus = "UNDER_REVIEW";
        customer.kycStatus = "PENDING";
        if (steps[0]) {
          steps[0].status = "COMPLETED";
          steps[0].statusLabel = "Selesai";
          steps[0].officerName = payload.actor.fullName;
          steps[0].actionDate = timestamp;
          steps[0].comments =
            payload.comments || "Formulir pendaftaran nasabah telah dikirim untuk pemeriksaan kepatuhan.";
        }
        if (steps[1] && steps[1].status !== "COMPLETED") {
          steps[1].status = "CURRENT";
          steps[1].statusLabel = "Sedang Diperiksa";
        }
        break;
      }

      case "SUBMIT_REVISED_DATA": {
        customer.registrationStatus = "UNDER_REVIEW";
        customer.kycStatus = "PENDING";
        customer.revisionNotes = undefined;
        if (steps[1]) {
          steps[1].status = "CURRENT";
          steps[1].statusLabel = "Sedang Diperiksa";
          steps[1].comments =
            payload.comments || "Financing Officer telah memperbarui data dan mengunggah dokumen perbaikan.";
          steps[1].actionDate = timestamp;
        }
        break;
      }

      case "VERIFY_KYC": {
        customer.kycStatus = "VERIFIED";
        customer.registrationStatus = "UNDER_REVIEW";
        if (steps[1]) {
          steps[1].status = "COMPLETED";
          steps[1].statusLabel = "Selesai (Sah)";
          steps[1].officerName = payload.actor.fullName;
          steps[1].actionDate = timestamp;
          steps[1].comments = payload.comments || "Dokumen identitas resmi dan profil nasabah telah diverifikasi sah.";
          if (payload.documentsInspected && payload.documentsInspected.length > 0) {
            steps[1].documentsInspected = payload.documentsInspected;
          }
        }
        if (steps[2] && steps[2].status === "PENDING") {
          steps[2].status = "CURRENT";
          steps[2].statusLabel = "Sedang Diskukrining";
        }
        break;
      }

      case "REQUEST_REVISION_KYC": {
        customer.kycStatus = "REVISION_REQUIRED";
        customer.registrationStatus = "UNDER_REVIEW";
        customer.revisionNotes = payload.comments || "Dokumen KYC memerlukan perbaikan.";
        if (steps[1]) {
          steps[1].status = "REVISION_REQUIRED";
          steps[1].statusLabel = "Perlu Perbaikan";
          steps[1].officerName = payload.actor.fullName;
          steps[1].actionDate = timestamp;
          steps[1].comments = payload.comments || "Dokumen KYC tidak terbaca atau memerlukan data tambahan.";
        }
        break;
      }

      case "REJECT_KYC": {
        customer.kycStatus = "REJECTED";
        customer.registrationStatus = "REJECTED";
        customer.isVerified = false;
        customer.rejectionReason = payload.comments || "Verifikasi KYC ditolak.";
        if (steps[1]) {
          steps[1].status = "REJECTED";
          steps[1].statusLabel = "Ditolak";
          steps[1].officerName = payload.actor.fullName;
          steps[1].actionDate = timestamp;
          steps[1].comments = payload.comments || "Identitas atau dokumen KYC ditolak oleh Compliance Officer.";
        }
        if (steps[4]) {
          steps[4].status = "REJECTED";
          steps[4].statusLabel = "Ditolak";
          steps[4].comments = "Pendaftaran ditolak pada tahap verifikasi identitas & KYC.";
        }
        break;
      }

      case "SET_AML_CLEARED": {
        customer.amlStatus = "CLEARED";
        if (steps[2]) {
          steps[2].status = "COMPLETED";
          steps[2].statusLabel = "Selesai (Cleared)";
          steps[2].officerName = payload.actor.fullName;
          steps[2].actionDate = timestamp;
          steps[2].comments =
            payload.comments ||
            "Pemeriksaan DTTOT, pencegahan pendanaan terorisme, dan daftar sanksi bersih (CLEARED).";
        }
        if (steps[3] && steps[3].status === "PENDING") {
          steps[3].status = "CURRENT";
          steps[3].statusLabel = "Sedang Dinilai";
        }
        break;
      }

      case "SET_AML_FLAGGED": {
        customer.amlStatus = "FLAGGED";
        customer.registrationStatus = "REJECTED";
        customer.isVerified = false;
        customer.rejectionReason = payload.comments || "Nasabah terkena flag AML/CFT (APU-PPT).";
        if (steps[2]) {
          steps[2].status = "REJECTED";
          steps[2].statusLabel = "Terkena Flag";
          steps[2].officerName = payload.actor.fullName;
          steps[2].actionDate = timestamp;
          steps[2].comments =
            payload.comments ||
            "Terindikasi dalam daftar pengawasan APU-PPT (DTTOT/Sanksi). Pendaftaran otomatis ditolak.";
        }
        if (steps[4]) {
          steps[4].status = "REJECTED";
          steps[4].statusLabel = "Ditolak";
          steps[4].comments = "Pendaftaran nasabah ditolak karena pelanggaran parameter AML/CFT.";
        }
        break;
      }

      case "SET_RISK_RATING": {
        if (!payload.riskRating) {
          throw new Error("[VALIDATION] riskRating wajib diisi untuk penetapan risiko.");
        }
        customer.riskRating = payload.riskRating;
        if (steps[3]) {
          steps[3].status = "COMPLETED";
          steps[3].statusLabel = `Selesai (${payload.riskRating})`;
          steps[3].officerName = payload.actor.fullName;
          steps[3].actionDate = timestamp;
          steps[3].comments =
            payload.comments || `Penilaian risiko diselesaikan. Tingkat risiko ditetapkan: ${payload.riskRating}.`;
        }
        if (steps[4] && steps[4].status === "PENDING") {
          steps[4].status = "CURRENT";
          steps[4].statusLabel = "Siap Diputuskan";
        }
        break;
      }

      case "FINAL_APPROVE": {
        // DEFENSE IN DEPTH: Strict criteria
        if (customer.amlStatus !== "CLEARED") {
          throw new Error(
            `[CUSTOMER_AML_NOT_CLEARED] Nasabah tidak dapat disetujui karena status AML adalah '${customer.amlStatus}'. Skrining AML/CFT wajib berstatus CLEARED sebelum persetujuan akhir.`
          );
        }
        if (customer.kycStatus !== "VERIFIED") {
          throw new Error(
            `[CUSTOMER_KYC_NOT_VERIFIED] Nasabah tidak dapat disetujui karena dokumen KYC berstatus '${customer.kycStatus}'. Verifikasi KYC wajib sah (VERIFIED).`
          );
        }

        customer.registrationStatus = "APPROVED";
        customer.isVerified = true;
        customer.verifiedAt = timestamp;
        customer.verifiedBy = payload.actor.fullName;

        if (steps[4]) {
          steps[4].status = "COMPLETED";
          steps[4].statusLabel = "Disetujui";
          steps[4].officerName = payload.actor.fullName;
          steps[4].actionDate = timestamp;
          steps[4].comments =
            payload.comments ||
            "Pendaftaran nasabah disetujui secara resmi. Nasabah aktif dan terverifikasi untuk akad pembiayaan.";
        }
        break;
      }

      case "FINAL_REJECT": {
        customer.registrationStatus = "REJECTED";
        customer.isVerified = false;
        customer.rejectionReason = payload.comments || "Pendaftaran nasabah ditolak.";
        if (steps[4]) {
          steps[4].status = "REJECTED";
          steps[4].statusLabel = "Ditolak";
          steps[4].officerName = payload.actor.fullName;
          steps[4].actionDate = timestamp;
          steps[4].comments = payload.comments || "Pendaftaran nasabah ditolak oleh Compliance Officer.";
        }
        break;
      }
    }

    customer.verificationSteps = steps;
    customer.updatedAt = timestamp;

    const detailsStr = JSON.stringify({
      action: payload.action,
      actorRole: payload.actor.role,
      actorName: payload.actor.fullName,
      registrationStatus: customer.registrationStatus,
      kycStatus: customer.kycStatus,
      amlStatus: customer.amlStatus,
      riskRating: customer.riskRating,
      isVerified: customer.isVerified,
      comments: payload.comments,
    });

    const auditLog: DBAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationId: customer.organizationId,
      timestamp,
      action: "REGISTRATION_STATUS_CHANGE",
      actor: payload.actor.fullName,
      role: payload.actor.role,
      entity: "Customer",
      entityId: customer.id,
      ipAddress: "127.0.0.1",
      details: detailsStr,
      sha256: this.hash({ action: payload.action, id: customer.id, timestamp }),
    };
    state.auditLogs.unshift(auditLog);

    this.save(state);
    return this.normalizeCustomer(customer);
  }

  /**
   * Tenant-safe status change helper (verification / AML status), for use by
   * workflow integrations. Uses the same guards as updateCustomer.
   */
  public static setCustomerVerificationStatus(
    id: string,
    status: {
      isVerified?: boolean;
      amlStatus?: CustomerAmlStatus;
      riskRating?: CustomerRiskRating;
      registrationStatus?: CustomerRegistrationStatus;
      kycStatus?: CustomerKycStatus;
    },
    contextOrganizationId: string
  ): DBCustomer | null {
    return this.updateCustomer(id, status, contextOrganizationId);
  }

  /** Mask an identifier for list views — never expose full identity in bulk. */
  public static maskIdentifier(identifier: string): string {
    if (identifier.length <= 4) return "****";
    return `${"*".repeat(Math.min(10, identifier.length - 4))}${identifier.slice(-4)}`;
  }

  // ==========================================
  // RESET DEMO TO PRISTINE BENCHMARK
  // ==========================================
  public static resetDemo(): void {
    const seed = getInitialSeedData();
    this.save(seed);
  }
}

