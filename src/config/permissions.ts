export const PERMISSIONS = {
  // Contracts
  CONTRACTS_VIEW: "contracts:view",
  CONTRACTS_CREATE: "contracts:create",
  CONTRACTS_EDIT: "contracts:edit",
  CONTRACTS_DELETE: "contracts:delete",
  CONTRACTS_EXECUTE: "contracts:execute",

  // Sharia Compliance
  SHARIA_RULES_VIEW: "sharia_rules:view",
  SHARIA_RULES_MANAGE: "sharia_rules:manage",
  SHARIA_VALIDATE: "sharia:validate",
  SHARIA_OVERRIDE: "sharia:override", // Only DPS (Dewan Pengawas Syariah)

  // Approvals
  APPROVALS_SUBMIT: "approvals:submit",
  APPROVALS_APPROVE: "approvals:approve",
  APPROVALS_REJECT: "approvals:reject",

  // Organization & Members
  ORG_SETTINGS_VIEW: "org:view",
  ORG_SETTINGS_EDIT: "org:edit",
  MEMBERS_MANAGE: "members:manage",

  // Billing
  BILLING_VIEW: "billing:view",
  BILLING_MANAGE: "billing:manage",

  // Audit Logs
  AUDIT_LOGS_VIEW: "audit:view",
} as const;

export const DEFAULT_ROLES = {
  ORG_ADMIN: {
    code: "ORG_ADMIN",
    name: "Administrator Lembaga",
    description: "Akses penuh konfigurasi organisasi, anggota, dan seluruh alur kerja kontrak.",
    permissions: Object.values(PERMISSIONS),
  },
  DPS_MEMBER: {
    code: "DPS_MEMBER",
    name: "Dewan Pengawas Syariah (DPS)",
    description: "Pemeriksaan kepatuhan syariah, audit fatwa, persetujuan fatwa khusus, dan validasi akad.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.SHARIA_RULES_VIEW,
      PERMISSIONS.SHARIA_RULES_MANAGE,
      PERMISSIONS.SHARIA_VALIDATE,
      PERMISSIONS.SHARIA_OVERRIDE,
      PERMISSIONS.APPROVALS_APPROVE,
      PERMISSIONS.APPROVALS_REJECT,
      PERMISSIONS.AUDIT_LOGS_VIEW,
    ],
  },
  COMPLIANCE_OFFICER: {
    code: "COMPLIANCE_OFFICER",
    name: "Sharia & Legal Compliance Officer",
    description: "Verifikasi hukum positif dan syariah atas draf kontrak sebelum pengajuan persetujuan.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.SHARIA_RULES_VIEW,
      PERMISSIONS.SHARIA_VALIDATE,
      PERMISSIONS.APPROVALS_APPROVE,
      PERMISSIONS.APPROVALS_REJECT,
      PERMISSIONS.AUDIT_LOGS_VIEW,
    ],
  },
  FINANCING_OFFICER: {
    code: "FINANCING_OFFICER",
    name: "Account Officer / Financing Officer",
    description: "Pembuat draf pengajuan, entri data nasabah, dan inisiasi draf akad kontrak.",
    permissions: [
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.CONTRACTS_CREATE,
      PERMISSIONS.CONTRACTS_EDIT,
      PERMISSIONS.SHARIA_VALIDATE,
      PERMISSIONS.APPROVALS_SUBMIT,
    ],
  },
};

