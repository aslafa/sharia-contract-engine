# SHARIA CONTRACT ENGINE (SCE) — DATABASE SCHEMA DOCUMENTATION

> **Database Engine:** PostgreSQL 15+ / Supabase PostgreSQL  
> **ORM Layer:** Prisma 5.22.0  
> **Tenant Isolation:** Logical Multi-Tenant with mandatory `organizationId` foreign key constraints  
> **Auditing Strategy:** Append-Only Temporal Logs

---

## 1. Entity-Relationship Overview

The database schema is structured into 8 cohesive functional domains:

1. **Identity, Organization & RBAC:** `Organization`, `User`, `Membership`, `Role`, `Permission`, `RolePermission`
2. **Institutional Onboarding:** `OnboardingRegistration`, `AuditLog`
3. **Application & Financing Core:** `FinancingApplication`, `ApplicationDocument`
4. **Akad Specific Models:**
   - Murabahah: `MurabahahFinancing`, `MurabahahInstallment`
   - Ijarah & IMBT: `IjarahContract`, `IjarahAsset`, `IjarahRentalSchedule`, `IjarahMaintenanceLog`
   - Musyarakah: `MusyarakahContract`, `MusyarakahPartnerContribution`, `MusyarakahRevenueReport`
   - Mudharabah: `MudharabahContract`, `MudharabahCapitalRelease`, `MudharabahProfitDistribution`
5. **Sharia Rule Engine:** `ShariaRule`, `ShariaRuleCategory`, `ShariaValidationResult`, `ShariaViolationLog`, `ShariaOverride`
6. **Contract Management:** `Contract`, `ContractDocument`, `ContractVersion`, `ContractParty`, `MultiAkadMap`
7. **Approval Workflows:** `ApprovalRequest`, `ApprovalStep`, `ApprovalHistory`
8. **Billing & Subscriptions:** `Subscription`, `Invoice`, `UsageQuota`

---

## 2. Table-by-Table Technical Reference

### 2.1 Multi-Tenant Identity & Access Management

#### `Organization`
Stores registered financial institutions (BUS, UUS, BPRS, KSPPS, BMT, Islamic Fintech).
- `id` (UUID, Primary Key)
- `code` (VarChar 50, Unique) — Institutional identifier (e.g. `ALBARAKAH-BPRS`)
- `name` (VarChar 255) — Official registered entity name
- `type` (`OrganizationType` Enum) — `ISLAMIC_BANK`, `ISLAMIC_BUSINESS_UNIT`, `BPRS`, `ISLAMIC_COOPERATIVE`, `BMT`, `ISLAMIC_FINTECH`
- `licenseNumber` (VarChar 100) — OJK / Ministry license registration number
- `status` (`OrganizationStatus` Enum) — `ACTIVE`, `SUSPENDED`, `ONBOARDING`
- `createdAt`, `updatedAt` (DateTime)

#### `User`
Institutional users and platform operators.
- `id` (UUID, Primary Key)
- `email` (VarChar 255, Unique)
- `fullName` (VarChar 255)
- `phoneNumber` (VarChar 50)
- `isActive` (Boolean)
- `mfaEnabled` (Boolean)
- `createdAt`, `updatedAt` (DateTime)

#### `Membership`
Maps users to organizations with designated roles.
- `id` (UUID, Primary Key)
- `userId` (FK -> `User.id`)
- `organizationId` (FK -> `Organization.id`)
- `roleId` (FK -> `Role.id`)
- `isActive` (Boolean)
- **Unique Constraint:** `[userId, organizationId]`

---

### 2.2 Financing Core & Four Akad Engines

#### `FinancingApplication`
Central container for financing submissions before conversion to legal contracts.
- `id` (UUID, Primary Key)
- `organizationId` (FK -> `Organization.id`)
- `applicationNumber` (VarChar 100, Unique)
- `customerName` (VarChar 255)
- `customerType` (Enum: `INDIVIDUAL`, `CORPORATE`)
- `akadType` (`AkadCategory` Enum: `MURABAHAH`, `IJARAH`, `MUSYARAKAH`, `MUDHARABAH`)
- `requestedAmount` (Decimal 18, 2)
- `tenorMonths` (Integer)
- `purpose` (Text)
- `status` (`ApplicationStatus` Enum)

#### `MurabahahFinancing`
Specialized cost-plus financing parameters.
- `id` (UUID, Primary Key)
- `applicationId` (FK -> `FinancingApplication.id`, Unique)
- `assetName` (VarChar 255) — Object of sale
- `assetSpecification` (Text)
- `assetOwnershipStatus` (Enum: `BANK_OWNED`, `WAKALAH_PURCHASE`, `SUPPLIER_COMMITTED`)
- `ownershipEvidenceDoc` (VarChar 500) — Incontrovertible proof of possession (*qabd*)
- `acquisitionCost` (Decimal 18, 2) — *Ra's al-Mal*
- `agreedMargin` (Decimal 18, 2) — *Ribh*
- `sellingPrice` (Decimal 18, 2) — Acquisition Cost + Agreed Margin
- `downPayment` (Decimal 18, 2) — *Urbun*
- `totalFinancedAmount` (Decimal 18, 2) — Selling Price - Down Payment
- `monthlyInstallment` (Decimal 18, 2)
- `marginPercentage` (Decimal 5, 2)

#### `IjarahContract`
Lease and Lease-Purchase (IMBT) parameters.
- `id` (UUID, Primary Key)
- `applicationId` (FK -> `FinancingApplication.id`, Unique)
- `ijarahType` (Enum: `IJARAH_MURNI`, `IJARAH_MUNTAHIYAH_BITTAMLIK`)
- `assetName` (VarChar 255)
- `assetValue` (Decimal 18, 2)
- `benefitDescription` (Text) — Explicit scope of usufruct (*manfa'ah*)
- `rentalPeriodMonths` (Integer)
- `monthlyRentalAmount` (Decimal 18, 2) — *Ujrah*
- `totalRentalAmount` (Decimal 18, 2)
- `wadTransferType` (Enum: `HIBAH`, `JUAL_JANJI_SEBELUM`, `JUAL_HARGA_PASAR`) — *Wa'd* commitment mechanism
- `isWadDocumentSeparated` (Boolean) — Enforces DSN-MUI rule against two in-one contracts

#### `MusyarakahContract`
Partnership financing parameters.
- `id` (UUID, Primary Key)
- `applicationId` (FK -> `FinancingApplication.id`, Unique)
- `businessSector` (VarChar 255)
- `projectScope` (Text)
- `totalProjectCapital` (Decimal 18, 2)
- `bankCapitalShare` (Decimal 18, 2)
- `customerCapitalShare` (Decimal 18, 2)
- `bankProfitNisbah` (Decimal 5, 2) — Profit share percentage
- `customerProfitNisbah` (Decimal 5, 2)
- `lossSharingRule` (VarChar 255) — Strictly capital ratio proportion (*Al-Ghurmu bil Ghunmi*)
- `revenueCalculationBasis` (Enum: `NET_REVENUE_SHARING`, `PROFIT_SHARING`)

#### `MudharabahContract`
Trust financing parameters.
- `id` (UUID, Primary Key)
- `applicationId` (FK -> `FinancingApplication.id`, Unique)
- `mudharabahType` (Enum: `MUTLAQAH`, `MUQAYYADAH`)
- `businessActivity` (Text)
- `totalCapitalAmount` (Decimal 18, 2) — 100% provided by *Shahibul Mal* (Bank)
- `bankProfitNisbah` (Decimal 5, 2)
- `customerProfitNisbah` (Decimal 5, 2)
- `isCapitalGuaranteed` (Boolean) — Must be FALSE; TRUE triggers Sharia block
- `lossLiabilityParty` (VarChar 100) — *Shahibul Mal* except for proven negligence

---

### 2.3 Sharia Rule Engine & Compliance

#### `ShariaRule`
Codified rules representing DSN-MUI fatwas and AAOIFI standards.
- `id` (UUID, Primary Key)
- `code` (VarChar 50, Unique) — e.g. `RULE-MRB-001`, `RULE-IJR-002`, `RULE-MDH-001`
- `category` (`AkadCategory` Enum)
- `fatwaReference` (VarChar 255) — e.g. `Fatwa DSN-MUI No. 04/DSN-MUI/IV/2000`
- `description` (Text)
- `severity` (`RuleSeverity` Enum: `CRITICAL`, `HIGH`, `MEDIUM`, `INFO`)
- `isActive` (Boolean)
- `version` (VarChar 20) — Ruleset versioning

#### `ShariaValidationResult`
Validation results generated for each financing application / contract.
- `id` (UUID, Primary Key)
- `organizationId` (FK -> `Organization.id`)
- `contractId` / `applicationId` (UUID)
- `overallStatus` (`ValidationStatus` Enum: `COMPLIANT`, `NON_COMPLIANT`, `WARNING`, `NEEDS_MANUAL_REVIEW`)
- `complianceScore` (Decimal 5, 2)
- `evaluatedAt` (DateTime)
- `evaluatedBy` (VarChar 100)

#### `ShariaViolationLog`
Detailed record of specific violations caught during rule evaluation.
- `id` (UUID, Primary Key)
- `validationResultId` (FK -> `ShariaValidationResult.id`)
- `ruleCode` (VarChar 50)
- `severity` (`RuleSeverity` Enum)
- `violationMessage` (Text)
- `remediationGuidance` (Text)
- `isResolved` (Boolean)

---

### 2.4 Contracts, Versioning & Approvals

#### `Contract`
The legally binding contract entity.
- `id` (UUID, Primary Key)
- `organizationId` (FK -> `Organization.id`)
- `contractNumber` (VarChar 100, Unique) — Formatted e.g. `SCE/MRB/2026/02/0088`
- `akadType` (`AkadCategory` Enum)
- `status` (`ContractStatus` Enum)
- `currentVersion` (VarChar 20) — e.g. `v1.2`
- `totalAmount` (Decimal 18, 2)
- `effectiveDate` (DateTime)
- `maturityDate` (DateTime)
- `isDraftWatermarked` (Boolean)

#### `ApprovalRequest`
Orchestrates the 6-stage approval lifecycle.
- `id` (UUID, Primary Key)
- `organizationId` (FK -> `Organization.id`)
- `contractId` (FK -> `Contract.id`)
- `currentStage` (Enum: `FINANCING_OFFICER`, `LEGAL_OFFICER`, `COMPLIANCE_OFFICER`, `DPS_REVIEWER`, `BANK_APPROVER`, `PARTIES_SIGNATURE`)
- `status` (`ApprovalStatus` Enum: `PENDING`, `APPROVED`, `REJECTED`, `REVISION_REQUESTED`)
- `submittedAt` (DateTime)
- `completedAt` (DateTime)

#### `ApprovalStep`
Audit record for each individual approval gate.
- `id` (UUID, Primary Key)
- `approvalRequestId` (FK -> `ApprovalRequest.id`)
- `stage` (VarChar 50)
- `reviewerId` (FK -> `User.id`)
- `reviewerRole` (VarChar 50)
- `action` (`ApprovalAction` Enum: `APPROVE`, `REJECT`, `REQUEST_REVISION`)
- `comments` (Text)
- `documentVersion` (VarChar 20)
- `decidedAt` (DateTime)

---

### 2.5 Security & Audit Trail

#### `AuditLog`
Append-only tamper-evident security and activity log.
- `id` (UUID, Primary Key)
- `organizationId` (UUID, Indexed)
- `actorId` (UUID)
- `actorEmail` (VarChar 255)
- `action` (VarChar 100) — e.g. `CONTRACT_CREATED`, `SHARIA_CHECK_OVERRIDDEN`, `CONTRACT_APPROVED`
- `entityType` (VarChar 50) — e.g. `Contract`, `MurabahahFinancing`, `ShariaRule`
- `entityId` (UUID)
- `ipAddress` (VarChar 50)
- `userAgent` (Text)
- `payloadBefore` (JSONB)
- `payloadAfter` (JSONB)
- `createdAt` (DateTime, Default: `now()`)

---

## 3. Database Indexes & Performance Optimizations

```sql
-- Multi-Tenant Composite Indexes for High Performance
CREATE INDEX idx_contracts_org_status ON contracts(organization_id, status);
CREATE INDEX idx_contracts_org_akad ON contracts(organization_id, akad_type);
CREATE INDEX idx_applications_org_status ON financing_applications(organization_id, status);
CREATE INDEX idx_audit_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_approval_req_contract ON approval_requests(contract_id, status);
CREATE INDEX idx_sharia_violations_res ON sharia_violation_logs(validation_result_id);
```

---

*Compiled from Prisma Schema Definition `prisma/schema.prisma`.*

