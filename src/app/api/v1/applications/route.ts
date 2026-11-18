import { NextRequest, NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, assertTenantIsolation, handleAuthError } from "@/lib/auth/guard";
import { z } from "zod";

// Tahap 3B.2 — `customerId` links the application to a directory customer.
// `customerName` becomes optional when a customerId is supplied: the snapshot
// is then filled from the authoritative customer record (see POST handler).
const createApplicationSchema = z.object({
  akad: z.enum(["MURABAHAH", "IJARAH", "MUSYARAKAH", "MUDHARABAH"]),
  title: z.string().min(3),
  customerId: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  customerName: z
    .union([z.string().trim().min(2).max(200), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  customerIdNumber: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  commodityOrAsset: z.string().min(3),
  supplierName: z.string().optional(),
  costPrice: z.number().positive(),
  marginOrNisbah: z.number().nonnegative(),
  sellingPrice: z.number().optional(),
  downPayment: z.number().nonnegative().optional(),
  tenorMonths: z.number().int().positive(),
  submitImmediately: z.boolean().optional(),
  notes: z.string().optional(),
});

/** Tahap 3B.2 — map repository customer-reference errors to HTTP responses. */
function mapCustomerReferenceError(error: unknown): NextResponse | null {
  if (!(error instanceof Error)) return null;

  const mappings: Record<string, { status: number; code: string }> = {
    "[CUSTOMER_NOT_FOUND]": { status: 400, code: "CUSTOMER_NOT_FOUND" },
    "[CUSTOMER_CROSS_TENANT]": { status: 403, code: "CUSTOMER_CROSS_TENANT_ACCESS" },
    "[CUSTOMER_AML_BLOCKED]": { status: 403, code: "CUSTOMER_AML_BLOCKED" },
  };

  for (const [prefix, meta] of Object.entries(mappings)) {
    if (error.message.startsWith(prefix)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: meta.code,
            message: error.message.replace(`${prefix} `, ""),
          },
        },
        { status: meta.status }
      );
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const akad = searchParams.get("akad") || undefined;
    const status = searchParams.get("status") || undefined;
    // Tahap 3B.2 — optional customer reference filter.
    const customerId = searchParams.get("customerId") || undefined;

    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    // Tahap 3B.2 — the list endpoint is now guarded with the SAME permission
    // as the detail endpoint (contracts:view). All 8 system roles hold this
    // permission, so legitimate role workflows are unaffected.
    await assertPermission(session, "contracts:view");

    const requestedOrgId = searchParams.get("organizationId") || req.headers.get("x-organization-id");

    // Multi-tenant check: if requesting a specific org, ensure user has access
    if (requestedOrgId && requestedOrgId !== session.organizationId) {
      await assertTenantIsolation(session, requestedOrgId, "FinancingApplication");
    }

    const targetOrgId = session.isSuperAdmin
      ? requestedOrgId || undefined
      : session.organizationId;

    const items = DBRepository.getApplications({
      search,
      akad,
      status,
      customerId,
      organizationId: targetOrgId,
    });

    // Tahap 3B.2 — enrich applications linked to a directory customer with a
    // minimal customer summary. Legacy applications (no customerId) are
    // returned unchanged; a linked-but-missing customer never fails the read.
    const itemsWithCustomer = items.map((app) => {
      if (!app.customerId) return app;
      const customer = DBRepository.getCustomerReference(app.customerId, targetOrgId);
      if (!customer) {
        console.warn(
          `[APPLICATIONS_LIST] Customer '${app.customerId}' (aplikasi ${app.applicationNumber}) tidak ditemukan pada direktori.`
        );
        return { ...app, customer: null };
      }
      return { ...app, customer };
    });

    return NextResponse.json({
      success: true,
      data: itemsWithCustomer,
      total: itemsWithCustomer.length,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Sesi tidak valid. Silakan login." } },
        { status: 401 }
      );
    }

    // RBAC: Verify user has permission to create financing applications
    await assertPermission(session, "contracts:create");

    const body = await req.json();
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Data pengajuan pembiayaan tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const orgId = session.organizationId;
    const userId = session.userId;
    const userName = session.fullName;

    // Tahap 3B.2 — resolve the referenced directory customer. The tenant is
    // ALWAYS the active session tenant: organizationId is never accepted from
    // the request body. The repository re-validates everything (defense in
    // depth) and aborts without JSON mutation on any failure.
    let customerSnapshot: {
      customerName?: string;
      customerIdNumber?: string;
      customerPhone?: string;
      customerEmail?: string;
    } = {};

    if (parsed.data.customerId) {
      const customer = DBRepository.getCustomerById(parsed.data.customerId);
      if (!customer) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CUSTOMER_NOT_FOUND",
              message: `Customer '${parsed.data.customerId}' tidak ditemukan pada direktori nasabah.`,
            },
          },
          { status: 400 }
        );
      }
      if (customer.organizationId !== orgId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CUSTOMER_CROSS_TENANT_ACCESS",
              message: "Customer yang dipilih bukan milik tenant lembaga Anda.",
            },
          },
          { status: 403 }
        );
      }
      // AML policy: FLAGGED customers are never eligible for new applications.
      if (customer.amlStatus === "FLAGGED") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CUSTOMER_AML_BLOCKED",
              message: `Customer ${customer.cifNumber} berstatus AML FLAGGED dan tidak dapat digunakan untuk pengajuan baru.`,
            },
          },
          { status: 403 }
        );
      }

      // Snapshot from the directory customer (authoritative source).
      customerSnapshot = {
        customerName: customer.name,
        customerIdNumber: customer.identifierNumber,
        customerPhone: customer.phone,
        customerEmail: customer.email,
      };
    } else if (!parsed.data.customerName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Nama nasabah wajib diisi untuk pengajuan tanpa referensi customerId.",
          },
        },
        { status: 400 }
      );
    }

    const created = DBRepository.createApplication({
      ...parsed.data,
      ...customerSnapshot,
      organizationId: orgId,
      createdById: userId,
      createdByName: userName,
    });

    return NextResponse.json(
      {
        success: true,
        message: parsed.data.submitImmediately
          ? "Pengajuan pembiayaan berhasil diajukan resmi ke Legal Officer."
          : "Draf pengajuan pembiayaan berhasil disimpan.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const mapped = mapCustomerReferenceError(error);
    if (mapped) return mapped;
    return handleAuthError(error);
  }
}
