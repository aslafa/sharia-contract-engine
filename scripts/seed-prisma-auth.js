/**
 * SCE — Prisma Authentication Seed
 * Seeds the SAME demo dataset as data/sce_database.json into PostgreSQL:
 *   organizations, system roles, permissions, role-permission links,
 *   demo users (Argon2id password hashes) and tenant memberships.
 *
 * Idempotent (upserts). Never logs passwords or hashes.
 *
 * Usage: node scripts/seed-prisma-auth.js
 */

const path = require("path");
const jiti = require("jiti")(process.cwd(), {
  alias: { "@": path.resolve("src") },
});
const { PERMISSIONS, SYSTEM_ROLE_DEFINITIONS } = jiti(path.resolve("src/lib/auth/roles.ts"));
const { hashPassword } = jiti(path.resolve("src/lib/auth/password.ts"));
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Demo password for the DEMO dataset only (matches the SCE demo login page).
// Stored solely as an Argon2id hash. NEVER logged, NEVER used for production accounts.
const DEMO_PASSWORD = process.env.SCE_DEMO_PASSWORD || "P@ssword123!";

function permissionCategory(code) {
  if (code.startsWith("contracts:")) return "CONTRACTS";
  if (code.startsWith("sharia")) return "SHARIA_RULES";
  if (code.startsWith("approvals:")) return "APPROVALS";
  if (code.startsWith("org:") || code.startsWith("members:") || code.startsWith("roles:")) return "ORGANIZATION";
  if (code.startsWith("billing:")) return "BILLING";
  if (code.startsWith("audit:")) return "SECURITY";
  if (code.startsWith("documents:")) return "DOCUMENTS";
  if (code.startsWith("platform:")) return "PLATFORM";
  return "OTHER";
}

const ORGANIZATIONS = [
  {
    id: "org-bprs-albarakah",
    code: "BPRS-ALBARAKAH",
    name: "PT BPRS Al-Barakah Mandiri",
    type: "BPRS",
  },
  {
    id: "org-kspps-bintang",
    code: "KSPPS-BINTANG",
    name: "KSPPS Bintang Syariah Indonesia",
    type: "ISLAMIC_COOPERATIVE",
  },
  {
    id: "org-global-platform",
    code: "SCE-HQ",
    name: "SCE Global Central Platform",
    type: "OTHER", // Prisma OrganizationType has no PLATFORM value
  },
];

const USERS = [
  { id: "usr-super-admin-001", email: "superadmin@sce-engine.id", fullName: "Ahmad Fauzan, S.Kom., M.TI (Super Admin)", isSuperAdmin: true },
  { id: "usr-inst-admin-001", email: "admin@bprs-albarakah.co.id", fullName: "Drs. H. Mulyadi Kartasasmita", isSuperAdmin: false },
  { id: "usr-fo-001", email: "fatimah.zahra@bprs-albarakah.co.id", fullName: "Fatimah Az-Zahra, S.E.Sy.", isSuperAdmin: false },
  { id: "usr-legal-001", email: "bambang.sudrajat@bprs-albarakah.co.id", fullName: "Bambang Sudrajat, S.H., M.Kn.", isSuperAdmin: false },
  { id: "usr-compliance-001", email: "nurul.hidayati@bprs-albarakah.co.id", fullName: "Nurul Hidayati, S.Sy., C.P.A.", isSuperAdmin: false },
  { id: "usr-dps-001", email: "kh.ridwan.mansur@dps-mui.id", fullName: "K.H. Dr. Ridwan Mansur, M.Ag. (DPS)", isSuperAdmin: false },
  { id: "usr-mgmt-001", email: "ir.hendra.gunawan@bprs-albarakah.co.id", fullName: "Ir. Hendra Gunawan, M.B.A. (Direktur Bisnis)", isSuperAdmin: false },
  { id: "usr-auditor-001", email: "audit.internal@bprs-albarakah.co.id", fullName: "Arief Wibowo, S.E., Ak., CA (Lead Auditor)", isSuperAdmin: false },
];

// Memberships mirror the JSON demo dataset — incl. dual-tenant DPS & Auditor.
const MEMBERSHIPS = [
  { id: "mem-sa-001", userId: "usr-super-admin-001", organizationId: "org-global-platform", roleCode: "SUPER_ADMIN", isOwner: true },
  { id: "mem-admin-001", userId: "usr-inst-admin-001", organizationId: "org-bprs-albarakah", roleCode: "INSTITUTION_ADMIN", isOwner: true },
  { id: "mem-fo-001", userId: "usr-fo-001", organizationId: "org-bprs-albarakah", roleCode: "FINANCING_OFFICER", isOwner: false },
  { id: "mem-legal-001", userId: "usr-legal-001", organizationId: "org-bprs-albarakah", roleCode: "LEGAL_OFFICER", isOwner: false },
  { id: "mem-comp-001", userId: "usr-compliance-001", organizationId: "org-bprs-albarakah", roleCode: "COMPLIANCE_OFFICER", isOwner: false },
  { id: "mem-dps-001", userId: "usr-dps-001", organizationId: "org-bprs-albarakah", roleCode: "SHARIA_REVIEWER", isOwner: false },
  { id: "mem-dps-002", userId: "usr-dps-001", organizationId: "org-kspps-bintang", roleCode: "SHARIA_REVIEWER", isOwner: false },
  { id: "mem-mgmt-001", userId: "usr-mgmt-001", organizationId: "org-bprs-albarakah", roleCode: "MANAGEMENT", isOwner: false },
  { id: "mem-aud-001", userId: "usr-auditor-001", organizationId: "org-bprs-albarakah", roleCode: "AUDITOR", isOwner: false },
  { id: "mem-aud-002", userId: "usr-auditor-001", organizationId: "org-kspps-bintang", roleCode: "AUDITOR", isOwner: false },
];

async function main() {
  console.log("[SEED] Memulai seed autentikasi Prisma...");

  // 1. Roles (system templates, organizationId = null)
  for (const [roleKey, def] of Object.entries(SYSTEM_ROLE_DEFINITIONS)) {
    const existing = await prisma.role.findFirst({ where: { code: roleKey, organizationId: null } });
    if (existing) {
      await prisma.role.update({
        where: { id: existing.id },
        data: {
          name: def.name,
          systemRole: roleKey,
          isSystemRole: true,
          description: def.description,
        },
      });
    } else {
      await prisma.role.create({
        data: {
          code: roleKey,
          name: def.name,
          systemRole: roleKey,
          isSystemRole: true,
          description: def.description,
        },
      });
    }
  }
  console.log(`[SEED] Roles system: ${Object.keys(SYSTEM_ROLE_DEFINITIONS).length} OK`);

  // 2. Permissions
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      update: { category: permissionCategory(code) },
      create: { code, category: permissionCategory(code), name: code },
    });
  }
  console.log(`[SEED] Permissions: ${Object.values(PERMISSIONS).length} OK`);

  // 3. RolePermission links (role defaults from code definitions)
  const allRoles = await prisma.role.findMany({ where: { organizationId: null, isSystemRole: true } });
  for (const role of allRoles) {
    const def = SYSTEM_ROLE_DEFINITIONS[role.systemRole];
    if (!def) continue;
    for (const permCode of def.permissions) {
      const permission = await prisma.permission.findUnique({ where: { code: permCode } });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  const rpCount = await prisma.rolePermission.count();
  console.log(`[SEED] RolePermission links: ${rpCount} OK`);

  // 4. Organizations
  for (const org of ORGANIZATIONS) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: { code: org.code, name: org.name, type: org.type },
      create: { id: org.id, code: org.code, name: org.name, type: org.type },
    });
  }
  console.log(`[SEED] Organizations: ${ORGANIZATIONS.length} OK`);

  // 5. Users (single Argon2id hash reused across demo personas)
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { id: user.id, fullName: user.fullName, isSuperAdmin: user.isSuperAdmin, passwordHash },
      create: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isSuperAdmin: user.isSuperAdmin,
        passwordHash,
      },
    });
  }
  console.log(`[SEED] Users: ${USERS.length} OK (password disimpan sebagai hash Argon2id)`);

  // 6. Memberships
  for (const mem of MEMBERSHIPS) {
    const role = await prisma.role.findFirst({ where: { code: mem.roleCode, organizationId: null } });
    if (!role) throw new Error(`Role '${mem.roleCode}' tidak ditemukan.`);
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: mem.organizationId, userId: mem.userId } },
      update: { roleId: role.id, isActive: true, isOwner: mem.isOwner },
      create: {
        id: mem.id,
        organizationId: mem.organizationId,
        userId: mem.userId,
        roleId: role.id,
        isOwner: mem.isOwner,
        isActive: true,
      },
    });
  }
  console.log(`[SEED] Memberships: ${MEMBERSHIPS.length} OK (termasuk DPS & Auditor multi-tenant)`);

  console.log("[SEED] Selesai.");
}

main()
  .catch((e) => {
    console.error("[SEED_ERROR]", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
