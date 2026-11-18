# SHARIA CONTRACT ENGINE (SCE) — USER GUIDE & OPERATIONAL MANUAL

> **Platform:** Sharia Contract Engine (SCE) Enterprise  
> **Audience:** Financing Officers, Legal Counsel, Compliance Officers, Dewan Pengawas Syariah (DPS), Bank Executives, Auditors, System Administrators

---

## Table of Contents
1. [Introduction & Logging In](#1-introduction--logging-in)
2. [Navigating the Workspace](#2-navigating-the-workspace)
3. [Executing Murabahah Contracts (Cost-Plus Sale)](#3-executing-murabahah-contracts)
4. [Executing Ijarah & IMBT Contracts (Lease & Lease-to-Own)](#4-executing-ijarah--imbt-contracts)
5. [Executing Musyarakah Contracts (Partnership Financing)](#5-executing-musyarakah-contracts)
6. [Executing Mudharabah Contracts (Trust Financing)](#6-executing-mudharabah-contracts)
7. [Running Sharia Rule Engine & Resolving Violations](#7-running-sharia-rule-engine)
8. [Generating Legal Contracts & PDF Export](#8-generating-legal-contracts)
9. [6-Stage Multi-Party Approval Workflow](#9-6-stage-multi-party-approval-workflow)
10. [Visual Multi-Akad Mapping](#10-visual-multi-akad-mapping)
11. [Portfolio Analytics & Executive Reports](#11-portfolio-analytics--executive-reports)
12. [Super Admin Command Center](#12-super-admin-command-center)

---

## 1. Introduction & Logging In

1. Open your browser and navigate to the application URL (e.g. `http://localhost:3000`).
2. Click **Login** in the top navigation bar or go directly to `/login`.
3. Use the demo institutional profile or enter your designated institutional email:
   - **Demo Organization:** `BPRS Al-Barakah Mandiri`
   - **Default Role:** `Financing Officer` / `Institution Admin`
4. The system validates your session and routes you automatically to the **Institution Command Center** (`/dashboard`).

---

## 2. Navigating the Workspace

The unified Enterprise Navigation is organized into clean functional groups in the left sidebar:

- **Dashboard:** Operational summary, pending actions, Sharia compliance score, recent transactions.
- **Akad Engines:**
  - *Murabahah:* Applications, Create, Calculation, Sharia Validation, Schedules, Monitoring.
  - *Ijarah & IMBT:* Assets, Create, Schedules, Maintenance, Monitoring.
  - *Musyarakah:* Applications, Create, Capital Tracking, Revenue Reports.
  - *Mudharabah:* Applications, Create, Capital Release, Profit Distribution.
- **Contract Operations:**
  - *Document Generator:* Template selector, live clause editor, draft watermarker, PDF exporter.
  - *Approval Workflow:* 6-stage review queues, revision requests, approval logs.
  - *Multi-Akad Mapping:* Visual transaction tree and dependency inspection.
  - *Contract Registry:* Complete lifecycle tracking (Draft -> Active -> Completed).
- **Compliance & Intelligence:**
  - *Sharia Rule Engine:* DSN-MUI fatwa rules library, severity matrix, override logs.
  - *Financial Analytics:* Portfolio distribution, margin yield curves, risk categorization.
- **Institution Administration:**
  - *Billing & Quotas:* Tier subscriptions, active contract usage, VA invoices.
  - *Brand Assets:* High-resolution SVG vectors of the corporate SCE logo and symbol.

---

## 3. Executing Murabahah Contracts

Murabahah is a sale transaction where the seller clearly states the acquisition cost and profit margin to the buyer (*Ba'i bi Tsaman Ajil*).

### Step-by-Step Workflow:
1. Navigate to **Murabahah -> New Application** (`/murabahah/create`).
2. **Customer & Asset Details:**
   - Enter Customer Name, NIK/NPWP, and Phone.
   - Enter the Asset Name (e.g., *Mesin Produksi Tekstil Otomatis*).
   - Enter Asset Specification and Vendor/Supplier details.
3. **Financial Pricing:**
   - **Acquisition Cost (Harga Pokok):** e.g., `Rp 500.000.000`
   - **Agreed Margin (Margin Keuntungan):** e.g., `Rp 60.000.000` (12% per annum)
   - **Down Payment (Urbun):** e.g., `Rp 50.000.000`
   - The system automatically computes:
     $$\text{Selling Price} = \text{Rp 560.000.000}$$
     $$\text{Financed Amount} = \text{Rp 510.000.000}$$
4. **Tenor & Installment:** Select tenor (e.g. 24 months). The system generates the equal monthly installment (`Rp 21.250.000/mo`).
5. **Asset Ownership Proof (*Milkiyyah*):**
   - Click **Sharia Validation** (`/murabahah/validation`).
   - Confirm bank possession (*Qabd*). In accordance with **Fatwa DSN-MUI No. 04**, the bank must hold title before executing the sale to the customer.
6. Submit for review.

---

## 4. Executing Ijarah & IMBT Contracts

Ijarah transfers usufruct (*manfa'ah*) of an asset for an agreed rental fee (*ujrah*). IMBT concludes with the transfer of asset ownership.

### Key Rules to Follow:
1. Navigate to **Ijarah -> New Contract** (`/ijarah/create`).
2. Select Contract Type:
   - `Ijarah Murni` (Operational Lease — no transfer of ownership).
   - `IMBT` (Lease-to-Own — transfer of ownership at maturity).
3. **Crucial Sharia Requirement (Separate Wa'd):**
   - If selecting IMBT, verify that the **Promise to Transfer Ownership (*Wa'd*)** is maintained as a separate legal deed from the lease contract itself.
   - The SCE Rule Engine blocks contracts that bundle sale and lease into a single agreement (*Bay'atayn fi Bay'ah*).
4. Review the generated **Rental Schedule** (`/ijarah/schedule`) and confirm asset maintenance assignments.

---

## 5. Executing Musyarakah Contracts

Musyarakah is a partnership where all partners contribute capital and share profits and losses.

1. Navigate to **Musyarakah -> New Contract** (`/musyarakah/create`).
2. Enter Total Project Capital:
   - Bank Contribution (e.g., 60% = `Rp 300.000.000`)
   - Partner Contribution (e.g., 40% = `Rp 200.000.000`)
3. Set the **Profit Nisbah** (e.g., Bank 65% : Partner 35%).
4. Verify the **Loss Sharing Rule**:
   - The platform strictly enforces that losses are shared in exact proportion to capital contributions (60% : 40%). Any clause requiring the partner to absorb 100% of commercial loss is automatically blocked by rule `RULE-MSY-001`.
5. Record periodic business performance under **Revenue Reports** (`/musyarakah/revenue`).

---

## 6. Executing Mudharabah Contracts

Mudharabah is a trust partnership where the bank (*Shahibul Mal*) provides 100% of the funds and the entrepreneur (*Mudharib*) manages the business.

1. Navigate to **Mudharabah -> New Contract** (`/mudharabah/create`).
2. Specify the Business Activity and select:
   - `Mudharabah Mutlaqah` (Unrestricted investment)
   - `Mudharabah Muqayyadah` (Restricted investment with specific sector guidelines)
3. Set the agreed profit distribution ratio (e.g., 70% Bank : 30% Mudharib).
4. **Prohibition of Capital Guarantee:**
   - Under Islamic law, *Shahibul Mal* cannot require a guaranteed fixed return or capital insurance against ordinary business loss. Guaranteeing capital transforms the partnership into an interest-bearing loan (*Riba*).

---

## 7. Running Sharia Rule Engine

1. Navigate to **Sharia Rules** (`/sharia-rules`).
2. The interactive rules catalog displays all active DSN-MUI and AAOIFI rules classified by:
   - **Severity:** Critical (Red), High (Amber), Medium (Blue), Info (Slate).
   - **Akad Type:** Murabahah, Ijarah, Musyarakah, Mudharabah, General.
3. To evaluate an application, click **Run Sharia Validation**.
4. If a violation occurs:
   - Review the specific Fatwa reference and remediation guidance.
   - Update transaction parameters to eliminate the non-compliant condition.
   - In exceptional regulatory circumstances, an authorized Dewan Pengawas Syariah (DPS) reviewer can issue an authenticated override with official reasoning.

---

## 8. Generating Legal Contracts & PDF Export

1. Navigate to **Documents -> Contract Generator** (`/documents/generator`).
2. Select the target Akad type and existing Application Number.
3. The generator loads the approved legal template:
   - Clauses: Introduction, Object of Sale/Lease, Pricing & Margin, Payment Method, Rights & Obligations, Default & *Ta'zir*, Dispute Resolution (Basyarnas / Religious Court).
4. **Dynamic Data Population:** Customer details, currency amounts in words (*terbilang*), and dates populate dynamically.
5. **Editing Clauses:** Legal Counsel can customize specific clauses in the live editor.
6. **Watermark Enforcement:** Unapproved documents render with `DRAFT` watermark.
7. Click **Export PDF / Print** to produce a court-ready document with timestamp and verification QR.

---

## 9. 6-Stage Multi-Party Approval Workflow

Navigate to **Approvals** (`/approvals`) to track the review pipeline:

```
Stage 1: Financing Officer  --> Input verification & customer KYC
Stage 2: Legal Officer      --> Clause review & collateral verification
Stage 3: Compliance Officer --> OJK/BI regulatory & AML/CFT screening
Stage 4: DPS Reviewer       --> Sharia compliance validation & Fatwa conformance
Stage 5: Bank Approver      --> Final executive credit committee authorization
Stage 6: Parties Signatures --> Execution by Bank Authorized Signatory & Customer
```

Reviewers can take three distinct actions:
- **Approve:** Advance contract to the next sequential stage.
- **Request Revision:** Return contract to Financing Officer with specific comments.
- **Reject:** Terminate contract due to fatal credit or Sharia deficiencies.

---

## 10. Visual Multi-Akad Mapping

Navigate to **Contracts -> Multi-Akad Mapping** (`/contracts/mapping`):
- Displays interactive relational maps for composite transactions (e.g. *Musyarakah Mutanaqisah* / MMQ or *Ijarah Muntahiyah Bittamlik* / IMBT).
- Verifies the strict chronological sequence of transactions:
  $$\text{Asset Acquisition} \longrightarrow \text{Ownership Transfer} \longrightarrow \text{Akad Execution} \longrightarrow \text{Settlement}$$
- Highlights potential Sharia risks if dependency links violate Islamic contract independence rules.

---

## 11. Portfolio Analytics & Executive Reports

Navigate to **Analytics** (`/analytics`):
- Interactive visual charts powered by Recharts:
  - **Financing Volume by Akad:** Breakdown of portfolio across Murabahah, Ijarah, Musyarakah, and Mudharabah.
  - **Monthly Disbursement & Yield Curves:** Tracking monthly growth and profit margins.
  - **Sharia Health Index:** Aggregate compliance ratings across all active branches.
- Use the date range selector (Current Month, Last Quarter, Full Year) to filter metrics.
- Click **Export CSV** to download consolidated reporting spreadsheets for OJK / DPS submission.

---

## 12. Super Admin Command Center

*(Restricted to platform operations team via `/admin`)*
- **Tenant Management:** Real-time directory of all enrolled Islamic banks, BPRS, and cooperatives.
- **Onboarding Approvals:** Review new institutional registration wizard submissions, verify business licenses, and approve tenant provisionings.
- **Platform Telemetry:** Monitor Monthly Recurring Revenue (MRR), total processed contract volume, and system health.

---

*For additional assistance or custom integration inquiries, contact the SCE Enterprise Support Desk at `support@sce.id`.*

