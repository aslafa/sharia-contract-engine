import { NextRequest, NextResponse } from "next/server";
import { assertTenantIsolation, assertRole, assertPermission, TenantIsolationError, AuthorizationError } from "@/lib/auth/guard";
import { DEMO_USERS } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/roles";

export async function POST(req: NextRequest) {
  const results = [];

  // ---------------------------------------------------------------------------
  // TEST SUITE 1: Cross-Tenant Isolation Barrier
  // Tenant A user attempts to access Tenant B private contract
  // ---------------------------------------------------------------------------
  try {
    const userTenantA = DEMO_USERS.FINANCING_OFFICER; // Belongs to org-bprs-albarakah
    const foreignTenantId = "org-bank-syariah-foreign-999"; // Distinct tenant

    try {
      await assertTenantIsolation(
        userTenantA,
        foreignTenantId,
        "ContractDocument",
        "doc-confidential-001",
        "127.0.0.1"
      );
      results.push({
        testId: "SEC-01",
        name: "Cross-Tenant Access Prevention",
        description: "User of Org A attempts to access confidential document of Org B",
        passed: false,
        error: "CRITICAL FAILURE: Isolation check did not throw an error!",
      });
    } catch (err) {
      if (err instanceof TenantIsolationError) {
        results.push({
          testId: "SEC-01",
          name: "Cross-Tenant Access Prevention",
          description: "User of Org A attempts to access confidential document of Org B",
          passed: true,
          status: 403,
          violationCaught: err.message,
          auditLogged: true,
        });
      } else {
        throw err;
      }
    }
  } catch (outerErr) {
    results.push({
      testId: "SEC-01",
      name: "Cross-Tenant Access Prevention",
      passed: false,
      error: outerErr instanceof Error ? outerErr.message : "Unknown error",
    });
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 2: RBAC Auditor Mutation Prevention
  // Auditor role (Read-Only) attempts to create or edit a financing contract
  // ---------------------------------------------------------------------------
  try {
    const auditorUser = DEMO_USERS.AUDITOR;

    try {
      await assertPermission(auditorUser, PERMISSIONS.CONTRACTS_CREATE);
      results.push({
        testId: "SEC-02",
        name: "Auditor Mutation Protection",
        description: "Auditor attempts to invoke CONTRACTS_CREATE mutation",
        passed: false,
        error: "CRITICAL FAILURE: Auditor was granted mutation permission!",
      });
    } catch (err) {
      if (err instanceof AuthorizationError) {
        results.push({
          testId: "SEC-02",
          name: "Auditor Mutation Protection",
          description: "Auditor attempts to invoke CONTRACTS_CREATE mutation",
          passed: true,
          status: 403,
          blockedReason: err.message,
        });
      } else {
        throw err;
      }
    }
  } catch (outerErr) {
    results.push({
      testId: "SEC-02",
      name: "Auditor Mutation Protection",
      passed: false,
      error: outerErr instanceof Error ? outerErr.message : "Unknown error",
    });
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 3: Sharia Board Fatwa Override Privilege
  // Financing Officer attempts to trigger SHARIA_OVERRIDE (DPS Exclusive)
  // ---------------------------------------------------------------------------
  try {
    const foUser = DEMO_USERS.FINANCING_OFFICER;

    try {
      await assertPermission(foUser, PERMISSIONS.SHARIA_OVERRIDE);
      results.push({
        testId: "SEC-03",
        name: "Sharia Board Privilege Restriction",
        description: "Financing Officer attempts to perform SHARIA_OVERRIDE",
        passed: false,
        error: "CRITICAL FAILURE: Non-DPS user was granted sharia override!",
      });
    } catch (err) {
      if (err instanceof AuthorizationError) {
        results.push({
          testId: "SEC-03",
          name: "Sharia Board Privilege Restriction",
          description: "Financing Officer attempts to perform SHARIA_OVERRIDE",
          passed: true,
          status: 403,
          blockedReason: err.message,
        });
      } else {
        throw err;
      }
    }
  } catch (outerErr) {
    results.push({
      testId: "SEC-03",
      name: "Sharia Board Privilege Restriction",
      passed: false,
      error: outerErr instanceof Error ? outerErr.message : "Unknown error",
    });
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 4: DPS Legitimacy Verification
  // DPS User validates and applies SHARIA_OVERRIDE with valid authority
  // ---------------------------------------------------------------------------
  try {
    const dpsUser = DEMO_USERS.SHARIA_REVIEWER;
    await assertPermission(dpsUser, PERMISSIONS.SHARIA_OVERRIDE);
    results.push({
      testId: "SEC-04",
      name: "DPS Authorized Execution",
      description: "Dewan Pengawas Syariah (DPS) executes SHARIA_OVERRIDE",
      passed: true,
      status: 200,
      authorizedRole: dpsUser.role,
    });
  } catch (err) {
    results.push({
      testId: "SEC-04",
      name: "DPS Authorized Execution",
      passed: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE 5: Valid Same-Tenant Authorized Access
  // User accesses own tenant resources without impediment
  // ---------------------------------------------------------------------------
  try {
    const userTenantA = DEMO_USERS.FINANCING_OFFICER;
    await assertTenantIsolation(
      userTenantA,
      userTenantA.organizationId,
      "Contract",
      "cnt-valid-001"
    );
    results.push({
      testId: "SEC-05",
      name: "Intra-Tenant Authorized Operation",
      description: "Financing Officer queries record belonging to their own organization",
      passed: true,
      status: 200,
      tenantId: userTenantA.organizationId,
    });
  } catch (err) {
    results.push({
      testId: "SEC-05",
      name: "Intra-Tenant Authorized Operation",
      passed: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }

  const allPassed = results.every((r) => r.passed);

  return NextResponse.json({
    success: allPassed,
    summary: {
      totalTests: results.length,
      passedTests: results.filter((r) => r.passed).length,
      failedTests: results.filter((r) => !r.passed).length,
      securityStatus: allPassed ? "SECURE_AND_VERIFIED" : "VULNERABILITIES_DETECTED",
      timestamp: new Date().toISOString(),
    },
    results,
  });
}

