export type OrganizationType =
  | "ISLAMIC_BANK"
  | "ISLAMIC_BUSINESS_UNIT"
  | "BPRS"
  | "ISLAMIC_COOPERATIVE"
  | "BMT"
  | "ISLAMIC_FINTECH"
  | "OTHER";

export interface OrganizationContext {
  id: string;
  code: string;
  name: string;
  type: OrganizationType;
  isActive: boolean;
  settings?: Record<string, unknown>;
}

export interface UserContext {
  id: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  activeMembership?: {
    organizationId: string;
    organizationName: string;
    roleCode: string;
    roleName: string;
    permissions: string[];
  };
}

export interface TenantScopedEntity {
  organizationId: string;
}

