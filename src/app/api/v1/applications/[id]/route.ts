import { NextRequest, NextResponse } from "next/server";
import { DBRepository, DBCustomerReference } from "@/lib/db/repository";
import {
  getAuthenticatedUser,
  assertTenantIsolation,
  assertPermission,
  handleAuthError,
} from "@/lib/auth/guard";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Strict Authentication Guard (401 if unauthenticated)
    const session = await getAuthenticatedUser(req);

    // 2. RBAC Permission (403 if unauthorized)
    await assertPermission(session, "contracts:view");

    const data = DBRepository.getApplicationById(params.id);
    if (!data.application) {
      return NextResponse.json(
        { success: false, error: { message: "Pengajuan tidak ditemukan." } },
        { status: 404 }
      );
    }

    // 3. Strict Multi-Tenant Isolation (403 if cross-tenant)
    await assertTenantIsolation(session, data.application.organizationId, "FinancingApplication", params.id);

    // Tahap 3B.2 — attach the linked directory customer (minimal reference)
    // when the application carries a customerId. Legacy applications (no
    // customerId) and linked-but-missing customers NEVER fail the detail
    // read: the condition is logged and `customer` is returned as null.
    let customer: DBCustomerReference | null = null;
    if (data.application.customerId) {
      customer = DBRepository.getCustomerReference(
        data.application.customerId,
        data.application.organizationId
      );
      if (!customer) {
        console.warn(
          `[APPLICATION_DETAIL] Customer '${data.application.customerId}' tidak ditemukan untuk aplikasi ${data.application.applicationNumber}; detail tetap dapat dibaca.`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...data, customer },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Strict Authentication Guard (401 if unauthenticated)
    const session = await getAuthenticatedUser(req);

    const { application: app } = DBRepository.getApplicationById(params.id);
    if (!app) {
      return NextResponse.json(
        { success: false, error: { message: "Pengajuan tidak ditemukan." } },
        { status: 404 }
      );
    }

    // 2. Strict Multi-Tenant Isolation (403 if cross-tenant)
    await assertTenantIsolation(session, app.organizationId, "FinancingApplication", params.id);

    // 3. RBAC Permission Guard (403 if unauthorized)
    await assertPermission(session, "contracts:create");

    const actorName = session.fullName;
    const updated = DBRepository.submitApplication(params.id, actorName);
    return NextResponse.json({
      success: true,
      message: "Pengajuan berhasil diajukan ke tahap Legal Officer.",
      data: updated,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

