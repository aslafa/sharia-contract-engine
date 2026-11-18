/**
 * Customer Management & Onboarding Verification Tracker — UI-facing types.
 * Mirrors the `DBCustomer` shape returned by the Customer API
 * (`/api/v1/customers`) without importing server-side repository code.
 */

export type CustomerType = "INDIVIDUAL" | "CORPORATE";
export type CustomerRiskRating = "LOW" | "MEDIUM" | "HIGH";
export type CustomerRegistrationStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
export type CustomerKycStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REVISION_REQUIRED" | "REJECTED";
export type CustomerAmlStatus = "NOT_SCREENED" | "PENDING" | "CLEARED" | "FLAGGED";

export type CustomerStepStatus = "COMPLETED" | "CURRENT" | "PENDING" | "REVISION_REQUIRED" | "REJECTED";

export type CustomerVerificationStepKey =
  | "REGISTRATION_SUBMISSION"
  | "IDENTITY_KYC_VERIFICATION"
  | "AML_CFT_SCREENING"
  | "RISK_ASSESSMENT"
  | "FINAL_APPROVAL";

export interface CustomerVerificationStep {
  stepKey: CustomerVerificationStepKey;
  stepNumber: number;
  title: string;
  roleTitle: string; // e.g. "Financing Officer", "Compliance Officer"
  status: CustomerStepStatus;
  statusLabel: string; // "Selesai" | "Sedang Diproses" | "Menunggu" | "Perlu Perbaikan" | "Ditolak"
  officerName?: string;
  actionDate?: string;
  comments?: string;
  documentsInspected?: string[];
  nextAction?: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  cifNumber: string;
  type: CustomerType;
  name: string;
  identifierNumber: string; // masked in list responses, full in detail responses
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  annualIncomeOrRevenue?: number;
  
  // Independent Status Fields:
  registrationStatus: CustomerRegistrationStatus;
  kycStatus: CustomerKycStatus;
  amlStatus: CustomerAmlStatus;
  riskRating: CustomerRiskRating;
  isVerified: boolean;

  // Verification & Audit metadata
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

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  total: number;
}

export interface CustomerDetailResponse {
  success: boolean;
  data: Customer;
}

/**
 * Tahap 3B.2 — minimal customer summary attached to financing applications
 * (list enrichment + detail). Mirrors the repository `DBCustomerReference`
 * read model without importing server-side code.
 */
export interface CustomerReference {
  id: string;
  cifNumber: string;
  name: string;
  riskRating: CustomerRiskRating;
  amlStatus: CustomerAmlStatus;
  kycStatus?: CustomerKycStatus;
  registrationStatus?: CustomerRegistrationStatus;
  isVerified: boolean;
}

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  INDIVIDUAL: "Individu",
  CORPORATE: "Korporasi",
};

export const REGISTRATION_STATUS_LABELS: Record<CustomerRegistrationStatus, string> = {
  DRAFT: "Draf Pendaftaran",
  SUBMITTED: "Terkirim",
  UNDER_REVIEW: "Dalam Pemeriksaan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export const KYC_STATUS_LABELS: Record<CustomerKycStatus, string> = {
  NOT_STARTED: "Belum Dimulai",
  PENDING: "Menunggu Verifikasi",
  VERIFIED: "Terverifikasi (KYC Sah)",
  REVISION_REQUIRED: "Perlu Perbaikan Dokumen",
  REJECTED: "Ditolak",
};

export const AML_STATUS_LABELS: Record<CustomerAmlStatus, string> = {
  NOT_SCREENED: "Belum Diskukrining",
  PENDING: "Menunggu Pemeriksaan APU-PPT",
  CLEARED: "Lolos AML (Cleared)",
  FLAGGED: "Terkena Flag (DTTOT/Sanksi)",
};

export const RISK_RATING_LABELS: Record<CustomerRiskRating, string> = {
  LOW: "Rendah (Low Risk)",
  MEDIUM: "Menengah (Medium Risk)",
  HIGH: "Tinggi (High Risk)",
};

/**
 * Identity number label depends on customer type:
 * NIK for individuals, NPWP/NIB for corporates.
 */
export function identifierLabel(type: CustomerType): string {
  return type === "CORPORATE" ? "NPWP / NIB" : "NIK";
}

/**
 * Income label depends on customer type:
 * annual income for individuals, annual revenue for corporates.
 */
export function incomeLabel(type: CustomerType): string {
  return type === "CORPORATE" ? "Omzet Tahunan" : "Pendapatan Tahunan";
}
