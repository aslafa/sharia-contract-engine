import { NextRequest, NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, assertTenantIsolation, handleAuthError } from "@/lib/auth/guard";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

/**
 * Customer Management API (Tahap 3A)
 * organizationId ALWAYS originates from the active session tenant — never
 * trusted from client input. Cross-tenant reads are blocked via
 * assertTenantIsolation.
 */

const customerTypeEnum = z.enum(["INDIVIDUAL", "CORPORATE"]);
const riskRatingEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
const amlStatusEnum = z.enum(["NOT_SCREENED", "PENDING", "CLEARED", "FLAGGED"]);
const registrationStatusEnum = z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"]);
const kycStatusEnum = z.enum(["NOT_STARTED", "PENDING", "VERIFIED", "REVISION_REQUIRED", "REJECTED"]);

const baseCustomerFields = {
  type: customerTypeEnum,
  name: z.string().trim().min(2).max(200),
  identifierNumber: z
    .string()
    .trim()
    .min(5)
    .max(50)
    .regex(/^[A-Za-z0-9.\-/]+$/, "Nomor identitas hanya boleh berisi huruf, angka, titik, garis miring, atau strip (NIK/NPWP/NIB)."),
  cifNumber: z.string().trim().max(50).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(25).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  province: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(10).optional(),
  annualIncomeOrRevenue: z.number().nonnegative().optional(),
  riskRating: riskRatingEnum.default("LOW"),
  amlStatus: amlStatusEnum.default("NOT_SCREENED"),
  registrationStatus: registrationStatusEnum.default("SUBMITTED"),
  kycStatus: kycStatusEnum.default("PENDING"),
  isVerified: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
};

const createCustomerSchema = z.object({
  ...baseCustomerFields,
  type: customerTypeEnum.default("INDIVIDUAL"),
  riskRating: riskRatingEnum.default("LOW"),
  amlStatus: amlStatusEnum.default("NOT_SCREENED"),
  registrationStatus: registrationStatusEnum.default("SUBMITTED"),
  kycStatus: kycStatusEnum.default("PENDING"),
  isVerified: z.boolean().default(false),
});

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  type: customerTypeEnum.optional(),
  amlStatus: amlStatusEnum.optional(),
  riskRating: riskRatingEnum.optional(),
  registrationStatus: registrationStatusEnum.optional(),
  kycStatus: kycStatusEnum.optional(),
  isVerified: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
});

function isDuplicateError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("CUSTOMER_DUPLICATE_IDENTIFIER");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      amlStatus: searchParams.get("amlStatus") || undefined,
      riskRating: searchParams.get("riskRating") || undefined,
      registrationStatus: searchParams.get("registrationStatus") || undefined,
      kycStatus: searchParams.get("kycStatus") || undefined,
      isVerified: searchParams.get("isVerified") || undefined,
    });
    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Parameter pencarian customer tidak valid.",
            details: parsedQuery.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    await assertPermission(session, "customers:view");

    const requestedOrgId = searchParams.get("organizationId") || req.headers.get("x-organization-id");

    // Multi-tenant check: requesting another org requires legitimate access.
    if (requestedOrgId && requestedOrgId !== session.organizationId) {
      await assertTenantIsolation(session, requestedOrgId, "Customer");
    }

    const targetOrgId = session.isSuperAdmin ? requestedOrgId || undefined : session.organizationId;

    const items = DBRepository.getCustomers({
      organizationId: targetOrgId,
      search: parsedQuery.data.search,
      type: parsedQuery.data.type,
      amlStatus: parsedQuery.data.amlStatus,
      riskRating: parsedQuery.data.riskRating,
      registrationStatus: parsedQuery.data.registrationStatus,
      kycStatus: parsedQuery.data.kycStatus,
      isVerified: parsedQuery.data.isVerified,
    });

    // Least exposure: mask identity numbers in bulk/list responses.
    const safeItems = items.map((customer) => ({
      ...customer,
      identifierNumber: DBRepository.maskIdentifier(customer.identifierNumber),
    }));

    return NextResponse.json({
      success: true,
      data: safeItems,
      total: safeItems.length,
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

    await assertPermission(session, "customers:create");

    const body = await req.json().catch(() => ({}));
    const parsed = createCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Data customer tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    // Tenant binding: organizationId comes from the session, never the client.
    const orgId = session.organizationId;
    const userId = session.userId;

    const created = DBRepository.createCustomer({
      ...parsed.data,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      organizationId: orgId,
    });

    await createAuditLog({
      organizationId: orgId,
      userId,
      action: "CREATE",
      entityName: "Customer",
      entityId: created.id,
      details: {
        cifNumber: created.cifNumber,
        type: created.type,
        name: created.name,
        amlStatus: created.amlStatus,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer berhasil didaftarkan.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (isDuplicateError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CUSTOMER_DUPLICATE_IDENTIFIER",
            message: error.message.replace("[CUSTOMER_DUPLICATE_IDENTIFIER] ", ""),
          },
        },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message.includes("TENANT_ISOLATION")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN_CROSS_TENANT_ACCESS", message: error.message } },
        { status: 403 }
      );
    }
    return handleAuthError(error);
  }
}
