export type AkadCategory = "MURABAHAH" | "IJARAH" | "MUSYARAKAH" | "MUDHARABAH";

export type ContractStatus =
  | "DRAFT"
  | "SHARIA_VALIDATION_PENDING"
  | "SHARIA_NON_COMPLIANT"
  | "PENDING_INTERNAL_APPROVAL"
  | "APPROVED"
  | "PENDING_CUSTOMER_SIGNATURE"
  | "PENDING_INSTITUTION_SIGNATURE"
  | "ACTIVE"
  | "TERMINATED"
  | "COMPLETED"
  | "DEFAULTED";

// --- Murabahah Types ---
export interface MurabahahInput {
  costPrice: number;
  profitMargin: number;
  downPaymentUrbun?: number;
  tenorMonths: number;
  commodityDescription: string;
  supplierName?: string;
  wakalahContractRef?: string;
  isGoodsReceived: boolean;
  deliveryDate?: string | Date;
}

export interface MurabahahSummary {
  costPrice: number;
  profitMargin: number;
  sellingPrice: number;
  downPaymentUrbun: number;
  remainingBalance: number;
  monthlyInstallment: number;
  profitPercentage: number;
}

// --- Ijarah Types ---
export interface IjarahInput {
  assetDescription: string;
  assetValue: number;
  rentalFeePerMonth: number;
  rentalPeriodMonths: number;
  isImbt: boolean; // Ijarah Muntahiya Bittamlik
  transferMethod?: "HIBAH" | "JUAL";
  waadPromiseRef?: string;
  maintenanceTerms?: string;
}

export interface IjarahSummary {
  assetValue: number;
  monthlyUjrah: number;
  totalUjrah: number;
  periodMonths: number;
  isImbt: boolean;
}

// --- Musyarakah Types ---
export interface MusyarakahInput {
  businessScope: string;
  institutionCapital: number;
  partnerCapital: number;
  institutionNisbah: number; // e.g. 40 (%)
  partnerNisbah: number; // e.g. 60 (%)
  calculationBasis: "REVENUE_SHARING" | "PROFIT_SHARING";
  distributionPeriod?: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  projectedProfitRate?: number;
}

export interface MusyarakahSummary {
  totalCapital: number;
  institutionCapitalShare: number;
  partnerCapitalShare: number;
  institutionCapitalPercentage: number;
  partnerCapitalPercentage: number;
  institutionNisbah: number;
  partnerNisbah: number;
  lossSharingMethod: string;
}

// --- Mudharabah Types ---
export interface MudharabahInput {
  businessField: string;
  capitalShahibulMal: number; // 100% Institution capital
  mudharibName: string;
  shahibulMalNisbah: number; // e.g. 70 (%)
  mudharibNisbah: number; // e.g. 30 (%)
  calculationMethod: "REVENUE_SHARING" | "PROFIT_SHARING";
  reportingFrequency?: "MONTHLY" | "QUARTERLY";
  capitalReturnTerms: string;
}

export interface MudharabahSummary {
  totalCapitalProvided: number;
  shahibulMalNisbah: number;
  mudharibNisbah: number;
  lossLiabilityParty: string; // 100% Shahibul Mal in Sharia unless negligence
}

