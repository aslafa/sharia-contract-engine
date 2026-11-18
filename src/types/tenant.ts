export const ORGANIZATION_TYPES = [
  "ISLAMIC_BANK",
  "ISLAMIC_BUSINESS_UNIT",
  "BPRS",
  "ISLAMIC_COOPERATIVE",
  "BMT",
  "ISLAMIC_FINTECH",
  "OTHER",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const SUBSCRIPTION_TIERS = [
  "STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
  "CUSTOM",
] as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

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

