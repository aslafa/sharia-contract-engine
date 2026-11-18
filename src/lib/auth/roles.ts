import { SystemRole } from "@/types";

export type { SystemRole };

export interface RoleDefinition {
  code: SystemRole;
  name: string;
  nameId: string;
  category: "SYSTEM" | "INSTITUTION";
  description: string;
  permissions: string[];
}

export const PERMISSIONS = {
  // Contracts
  CONTRACTS_VIEW: "contracts:view",
  CONTRACTS_CREATE: "contracts:create",
  CONTRACTS_EDIT: "contracts:edit",
  CONTRACTS_DELETE: "contracts:delete",
  CONTRACTS_EXECUTE: "contracts:execute",
  CONTRACTS_SIGN: "contracts:sign",

  // Sharia Compliance & DPS
  SHARIA_RULES_VIEW: "sharia_rules:view",
  SHARIA_RULES_MANAGE: "sharia_rules:manage",
  SHARIA_VALIDATE: "sharia:validate",
  SHARIA_OVERRIDE: "sharia:override", // Only DPS (Dewan Pengawas Syariah)
  SHARIA_APPROVE: "sharia:approve",

  // Approvals Workflow
  APPROVALS_VIEW: "approvals:view",
  APPROVALS_SUBMIT: "approvals:submit",
  APPROVALS_APPROVE: "approvals:approve",
  APPROVALS_REJECT: "approvals:reject",
  APPROVALS_REVISE: "approvals:revise",

  // Organization & Multi-Tenancy
  ORG_SETTINGS_VIEW: "org:view",
  ORG_SETTINGS_EDIT: "org:edit",
  MEMBERS_VIEW: "members:view",
  MEMBERS_MANAGE: "members:manage",
  ROLES_MANAGE: "roles:manage",

  // Billing & Subscriptions
  BILLING_VIEW: "billing:view",
  BILLING_MANAGE: "billing:manage",

  // Audit Logs & Security
  AUDIT_LOGS_VIEW: "audit:view",
  AUDIT_LOGS_EXPORT: "audit:export",

  // Documents
  DOCUMENTS_VIEW: "documents:view",
  DOCUMENTS_UPLOAD: "documents:upload",
  DOCUMENTS_DELETE: "documents:delete",

  // Customer Management (Tahap 3A)
  CUSTOMERS_VIEW: "customers:view",
  CUSTOMERS_CREATE: "customers:create",
  CUSTOMERS_EDIT: "customers:edit",
  CUSTOMERS_VERIFY: "customers:verify",

  // Super Admin Platform Operations
  PLATFORM_MANAGE_TENANTS: "platform:manage_tenants",
  PLATFORM_MANAGE_RULES: "platform:manage_rules",
  PLATFORM_VIEW_METRICS: "platform:view_metrics",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const SYSTEM_ROLE_DEFINITIONS: Record<SystemRole, RoleDefinition> = {
  SUPER_ADMIN: {
    code: "SUPER_ADMIN",
    name: "Super Administrator",
    nameId: "Super Admin Platform",
    category: "SYSTEM",
    description: "Akses master global untuk mengelola seluruh tenant institusi, rule fatwa DSN-MUI global, dan metrik sistem SaaS.",
    permissions: Object.values(PERMISSIONS),
  },

  INSTITUTION_ADMIN: {
    code: "INSTITUTION_ADMIN",
    name: "Institution Administrator",
    nameId: "Administrator Institusi",
    category: "INSTITUTION",
    description: "Pengelola utama konfigurasi lembaga, manajemen staf, struktur approval internal, serta langganan dan penagihan.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.CONTRACTS_CREATE,
      PERMISSIONS.CONTRACTS_EDIT,
      PERMISSIONS.CONTRACTS_DELETE,
      PERMISSIONS.CONTRACTS_EXECUTE,
      PERMISSIONS.CONTRACTS_SIGN,
      PERMISSIONS.SHARIA_RULES_VIEW,
      PERMISSIONS.SHARIA_VALIDATE,
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.APPROVALS_SUBMIT,
      PERMISSIONS.APPROVALS_APPROVE,
      PERMISSIONS.APPROVALS_REJECT,
      PERMISSIONS.ORG_SETTINGS_VIEW,
      PERMISSIONS.ORG_SETTINGS_EDIT,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.MEMBERS_MANAGE,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.BILLING_VIEW,
      PERMISSIONS.BILLING_MANAGE,
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.DOCUMENTS_VIEW,
      PERMISSIONS.DOCUMENTS_UPLOAD,
      PERMISSIONS.DOCUMENTS_DELETE,
      // Customer Management
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_CREATE,
      PERMISSIONS.CUSTOMERS_EDIT,
      PERMISSIONS.CUSTOMERS_VERIFY,
    ],
  },

  FINANCING_OFFICER: {
    code: "FINANCING_OFFICER",
    name: "Financing / Account Officer",
    nameId: "Petugas Pembiayaan (AO / FO)",
    category: "INSTITUTION",
    description: "Inisiasi permohonan pembiayaan nasabah, kalkulasi margin/ujrah/nisbah, pembuatan draf akad, dan inisiasi validasi syariah.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.CONTRACTS_CREATE,
      PERMISSIONS.CONTRACTS_EDIT,
      PERMISSIONS.SHARIA_RULES_VIEW,
      PERMISSIONS.SHARIA_VALIDATE,
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.APPROVALS_SUBMIT,
      PERMISSIONS.DOCUMENTS_VIEW,
      PERMISSIONS.DOCUMENTS_UPLOAD,
      // Customer Management (pusat data nasabah dikelola FO)
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_CREATE,
      PERMISSIONS.CUSTOMERS_EDIT,
    ],
  },

  LEGAL_OFFICER: {
    code: "LEGAL_OFFICER",
    name: "Legal Officer",
    nameId: "Petugas Legal & Hukum",
    category: "INSTITUTION",
    description: "Peninjauan klausul hukum positif, jaminan/agunan, keabsahan tanda tangan, dan mitigasi risiko hukum kontrak.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.CONTRACTS_EDIT,
      PERMISSIONS.CONTRACTS_EXECUTE,
      PERMISSIONS.CONTRACTS_SIGN,
      PERMISSIONS.SHARIA_RULES_VIEW,
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.APPROVALS_APPROVE,
      PERMISSIONS.APPROVALS_REJECT,
      PERMISSIONS.APPROVALS_REVISE,
      PERMISSIONS.DOCUMENTS_VIEW,
      PERMISSIONS.DOCUMENTS_UPLOAD,
      PERMISSIONS.AUDIT_LOGS_VIEW,
      // Customer Management (read-only)
      PERMISSIONS.CUSTOMERS_VIEW,
    ],
  },

  COMPLIANCE_OFFICER: {
    code: "COMPLIANCE_OFFICER",
    name: "Compliance Officer",
    nameId: "Petugas Kepatuhan & Regulasi",
    category: "INSTITUTION",
    description: "Pemeriksaan kesesuaian regulasi OJK/BI/Kemenkop dan telaah kepatuhan awal fatwa DSN-MUI sebelum persetujuan DPS.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.SHARIA_RULES_VIEW,
      PERMISSIONS.SHARIA_VALIDATE,
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.APPROVALS_APPROVE,
      PERMISSIONS.APPROVALS_REJECT,
      PERMISSIONS.APPROVALS_REVISE,
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.DOCUMENTS_VIEW,
      // Customer Management (telaah AML/risiko nasabah)
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_EDIT,
      PERMISSIONS.CUSTOMERS_VERIFY,
    ],
  },

  SHARIA_REVIEWER: {
    code: "SHARIA_REVIEWER",
    name: "Sharia Reviewer / DPS Member",
    nameId: "Dewan Pengawas Syariah (DPS)",
    category: "INSTITUTION",
    description: "Otoritas tertinggi syariah di lembaga: telaah akad khusus, fatwa override dengan catatan fiqh, persetujuan akhir akad syariah.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.SHARIA_RULES_VIEW,
      PERMISSIONS.SHARIA_RULES_MANAGE,
      PERMISSIONS.SHARIA_VALIDATE,
      PERMISSIONS.SHARIA_OVERRIDE,
      PERMISSIONS.SHARIA_APPROVE,
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.APPROVALS_APPROVE,
      PERMISSIONS.APPROVALS_REJECT,
      PERMISSIONS.APPROVALS_REVISE,
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.DOCUMENTS_VIEW,
      // Customer Management (read-only)
      PERMISSIONS.CUSTOMERS_VIEW,
    ],
  },

  MANAGEMENT: {
    code: "MANAGEMENT",
    name: "Executive Management / Director",
    nameId: "Direksi / Manajemen Eksekutif",
    category: "INSTITUTION",
    description: "Akses pemantauan portofolio pembiayaan, persetujuan kontrak bernilai di atas limit delegasi, dan analitik kinerja.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.APPROVALS_APPROVE,
      PERMISSIONS.APPROVALS_REJECT,
      PERMISSIONS.ORG_SETTINGS_VIEW,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.BILLING_VIEW,
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.DOCUMENTS_VIEW,
      // Customer Management (read-only)
      PERMISSIONS.CUSTOMERS_VIEW,
    ],
  },

  AUDITOR: {
    code: "AUDITOR",
    name: "Internal / External Auditor",
    nameId: "Auditor Kepatuhan & Keuangan",
    category: "INSTITUTION",
    description: "Hak akses read-only lengkap terhadap jejak audit, draf kontrak, verifikasi dokumen, dan laporan kepatuhan syariah.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.SHARIA_RULES_VIEW,
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.ORG_SETTINGS_VIEW,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.BILLING_VIEW,
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.AUDIT_LOGS_EXPORT,
      PERMISSIONS.DOCUMENTS_VIEW,
      // Customer Management (read-only)
      PERMISSIONS.CUSTOMERS_VIEW,
    ],
  },
};

