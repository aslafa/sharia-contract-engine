# SHARIA CONTRACT ENGINE (SCE)

> **"One Engine, Every Contract. Smart Finance, Sharia Assured."**

Enterprise-grade B2B SaaS platform engineered for Islamic financial institutions (**Bank Umum Syariah / BUS**, **Unit Usaha Syariah / UUS**, **BPRS**, **KSPPS**, **BMT**, and **Islamic Fintech**) to automate, validate, and manage Islamic financing contracts against official **Fatwa Dewan Syari'ah Nasional (DSN-MUI)**, **OJK regulations**, and **AAOIFI** standards.

---

## 🏛️ System Overview

The **Sharia Contract Engine (SCE)** bridges traditional Islamic jurisprudence (*Fiqh Muamalah*) with modern enterprise cloud software. By codifying fatwa rules into an automated, dynamic rule engine, SCE prevents Sharia non-compliance risks (*Sharia non-compliance risk*), eliminates costly contract drafting errors, and accelerates institutional financing lifecycles from days to minutes.

```
       [ Client Application ]
                 │
                 ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                SHARIA CONTRACT ENGINE (SCE)                 │
 ├─────────────────────────────────────────────────────────────┤
 │ • Multi-Tenant Enterprise Gateway (Edge Middleware + RBAC)  │
 │ • 4 Core Akad Engines: Murabahah, Ijarah, Musyarakah, Mudh. │
 │ • Dynamic Sharia Rule Engine (DSN-MUI & AAOIFI Codified)    │
 │ • Contract Generator, Dynamic Templates & PDF Exporter      │
 │ • 6-Stage Governance & Multi-Party Approval Workflow        │
 │ • Multi-Akad Visual Mapping & Transaction Dependency Tree   │
 │ • Financial Portfolio Analytics & OJK / DPS Export Reports  │
 ├─────────────────────────────────────────────────────────────┤
 │               TENANT-SCOPED PRISMA 5.22 ORM                 │
 └─────────────────────────────────────────────────────────────┘
                 │
                 ▼
     [ PostgreSQL 15+ Database ]
```

---

## 🚀 Key Modules & Capabilities

### 1. Four Core Akad Engines
- **Murabahah Engine:** Cost-plus financing (*Ba'i al-Murabahah*). Verified acquisition costs (*Ra's al-Mal*), transparent profit margin (*Ribh*), down payment (*Urbun*), equal monthly installments, and strict proof of bank ownership (*Milkiyyah*) before sale.
- **Ijarah & IMBT Engine:** Usufruct lease (*Ijarah*) and lease-purchase (*IMBT*). Segregated structural maintenance obligations and mandatory separation between the lease deed and the ownership transfer promise (*Wa'd*).
- **Musyarakah Engine:** Partnership financing (*Syirkah al-'Inan*). Capital contributions, negotiated profit-sharing ratios (*Nisbah*), and strict capital-proportional loss sharing (*Al-Ghurmu bil Ghunmi*).
- **Mudharabah Engine:** Trust financing (*Qiradh*). 100% bank-funded capital, operational entrepreneurship, profit distribution according to agreed ratio, and absolute prohibition of guaranteed principal returns.

### 2. Dynamic Sharia Rule Engine
- **Codified Fatwa Database:** Pre-loaded with DSN-MUI fatwas (Fatwa No. 04, 07, 08, 09, 27, 111, 114, 115) and AAOIFI standards.
- **Hierarchical Severity:** CRITICAL (hard block), HIGH (DPS signoff required), MEDIUM (warning), and INFO (advisory).
- **Automated Validation:** Instant evaluation of financing terms, asset titles, and payment conditions with remediation instructions.
- **Authorized Overrides:** Cryptographically logged DPS review overrides for complex multi-party structures.

### 3. Contract Generation & Lifecycle Management
- **Dynamic Legal Templates:** Standardized contracts with automated data binding and number-to-words currency translation (*terbilang*).
- **Live In-Browser Editor:** Modify clauses, conditions, and collateral details directly within the browser.
- **Court-Ready PDF Exporter:** Automatic `DRAFT` watermarking until final authorization, document versioning (`v1.0`, `v1.1`), and verification QR markers.
- **Lifecycle Registry:** Complete tracking across 9 states: Draft, Review, Approved, Active, Defaulted, Completed.

### 4. 6-Stage Multi-Party Approval Workflow
Sequential institutional governance pipeline:
1. **Financing Officer:** Application intake & KYC verification.
2. **Legal Officer:** Contract terms & collateral inspection.
3. **Compliance Officer:** OJK prudential & AML/CFT screening.
4. **DPS Reviewer:** Sharia Fatwa conformance signoff.
5. **Bank Approver:** Executive credit committee final authorization.
6. **Parties Signatures:** Execution by Bank Authorized Signatory & Customer.

### 5. Multi-Akad Transaction Mapping
Visual tree mapping for composite Islamic financing products (e.g. *Musyarakah Mutanaqisah* / MMQ and *IMBT*), enforcing strict chronological sequences and eliminating invalid contract interdependencies.

### 6. Institutional Multi-Tenancy & Security
- **Strict Data Isolation:** Row-level tenant partitioning via `organizationId` foreign keys enforced at the ORM layer.
- **Role-Based Access Control (RBAC):** 8 discrete roles with server-side authorization enforcement.
- **Tamper-Evident Audit Trails:** Append-only logging of all operational events with actor IDs, IP addresses, and state diffs.

---

## 🎨 Brand Identity & User Experience

SCE features a bespoke corporate identity engineered for enterprise financial trust:
- **Logo Symbol:** An interlocking geometric Islamic diamond seal framing a sculpted **"SCE"** corporate monogram in royal sapphire blue (`#00549c`) and celestial gold (`#F59E0B`).
- **Interactive UI & Motion:** Smooth rotating hero typography (`AnimatedHeroTitle`), glowing gradient greetings, interactive flip badges, and responsive tables.
- **Color Palette:**
  - `Primary Blue`: `#00549c`
  - `Secondary Blue`: `#0F6FB5`
  - `Accent Gold / Sharia Badge`: `#F59E0B`
  - `Background Canvas`: `#FFFFFF` & `#F5F8FC`
  - `High-Contrast Text`: `#172B4D`
  - `Success / Compliant`: `#16A36A`
  - `Warning / Pending DPS`: `#E9A23B`
  - `Danger / Violation`: `#DC3545`

---

## 📚 Technical Documentation Directory

Comprehensive engineering and operational guides are included in the repository:

| Document | Description |
| :--- | :--- |
| **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)** | Multi-tenant isolation model, domain service layer, security pipeline, and architectural diagrams. |
| **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** | Full technical dictionary of all 22 Prisma models, relational integrity rules, and database indexes. |
| **[TESTING_REPORT.md](TESTING_REPORT.md)** | Complete QA audit, functional test matrices, Sharia compliance tests, and Next.js build verification. |
| **[USER_GUIDE.md](USER_GUIDE.md)** | Step-by-step operational manual for bank officers, legal counsel, DPS reviewers, and administrators. |

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 14.2 (App Router)](https://nextjs.org/)
- **Language:** [TypeScript 5.6](https://www.typescriptlang.org/)
- **Database ORM:** [Prisma 5.22.0](https://www.prisma.io/)
- **Database Engine:** [PostgreSQL 15+](https://www.postgresql.org/) / Supabase
- **Styling & UI:** [Tailwind CSS 3.4](https://tailwindcss.com/), Radix UI, Lucide Icons
- **Data Visualizations:** [Recharts 2.15](https://recharts.org/)
- **Date Utilities:** `date-fns`

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Node.js 18.17.0+ or Node.js 20+
- PostgreSQL database or Supabase project

### 2. Clone & Install
```bash
git clone https://github.com/your-org/sharia-contract-engine.git
cd sharia-contract-engine
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sce_db?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/sce_db?schema=public"
NEXTAUTH_SECRET="your-super-secret-enterprise-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Initialization
```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Build Commands

```bash
# Execute TypeScript Static Analysis (0 errors)
npm run typecheck

# Compile Production Build (All 48 routes)
npm run build

# Start Production Server
npm run start
```

---

## 👥 Demo Institutional Accounts

| Organization | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **BPRS Al-Barakah Mandiri** | Financing Officer | `fo@albarakah.co.id` | *(Pre-authenticated demo)* |
| **BPRS Al-Barakah Mandiri** | Legal Officer | `legal@albarakah.co.id` | *(Pre-authenticated demo)* |
| **BPRS Al-Barakah Mandiri** | Compliance Officer | `compliance@albarakah.co.id` | *(Pre-authenticated demo)* |
| **BPRS Al-Barakah Mandiri** | DPS / Sharia Reviewer | `dps@albarakah.co.id` | *(Pre-authenticated demo)* |
| **BPRS Al-Barakah Mandiri** | Institution Admin | `admin@albarakah.co.id` | *(Pre-authenticated demo)* |
| **Platform HQ** | Super Admin | `superadmin@sce.id` | *(Pre-authenticated demo)* |

---

## 📄 License & Intellectual Property

Copyright © 2026 PT Sharia Contract Engine Indonesia. All rights reserved.  
Compliant with Bank Indonesia, Otoritas Jasa Keuangan (OJK), and Dewan Syari'ah Nasional - Majelis Ulama Indonesia (DSN-MUI).
