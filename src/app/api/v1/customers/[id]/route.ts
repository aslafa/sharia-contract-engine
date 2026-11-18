import { NextRequest, NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";
import { getCurrentSession } from "@/lib/auth/session";
import { assertPermission, assertTenantIsolation, handleAuthError } from "@/lib/auth/guard";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

/**
 * Customer detail & update API (Tahap 3A).
 * Cross-tenant access is blocked: the customer's organizationId must match the
 * active session tenant (assertTenantIsolation + repository-level re-check).
 */

const customerTypeEnum = z.enum(["INDIVIDUAL", "CORPORATE"]);
const riskRatingEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
const amlStatusEnum = z.enum(["NOT_SCREENED", "PENDING", "CLEARED", "FLAGGED"]);
const registrationStatusEnum = z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"]);
const kycStatusEnum = z.enum(["NOT_STARTED", "PENDING", "VERIFIED", "REVISION_REQUIRED", "REJECTED"]);

const updateCustomerSchema = z
  .object({
    type: customerTypeEnum,
    name: z.string().trim().min(2).max(200),
    identifierNumber: z
      .string()
      .trim()
      .min(5)
      .max(50)
      .regex(/^[A-Za-z0-9.\-/]+$/, "Nomor identitas hanya boleh berisi huruf, angka, titik, garis miring, atau strip (NIK/NPWP/NIB)."),
    cifNumber: z.string().trim().max(50),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    phone: z.string().trim().max(25).optional().or(z.literal("")),
    address: z.string().trim().max(500),
    city: z.string().trim().max(100),
    province: z.string().trim().max(100),
    postalCode: z.string().trim().max(10),
    annualIncomeOrRevenue: z.number().nonnegative(),
    riskRating: riskRatingEnum,
    amlStatus: amlStatusEnum,
    registrationStatus: registrationStatusEnum,
    kycStatus: kycStatusEnum,
    isVerified: z.boolean(),
    metadata: z.record(z.unknown()),
  })
  .partial();

const verificationActionSchema = z.object({
  action: z.enum([
    "SUBMIT",
    "SUBMIT_REVISED_DATA",
    "VERIFY_KYC",
    "REQUEST_REVISION_KYC",
    "REJECT_KYC",
    "SET_AML_CLEARED",
    "SET_AML_FLAGGED",
    "SET_RISK_RATING",
    "FINAL_APPROVE",
    "FINAL_REJECT",
  ]),
  comments: z.string().trim().max(1000).optional(),
  riskRating: riskRatingEnum.optional(),
  documentsInspected: z.array(z.string().trim()).optional(),
});

function isDuplicateError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("CUSTOMER_DUPLICATE_IDENTIFIER");
}

function isTenantViolation(error: unknown): boolean {
  return error instanceof Error && error.message.includes("TENANT_ISOLATION");
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    await assertPermission(session, "customers:view");

    const customer = DBRepository.getCustomerById(params.id);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: "Customer tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Tenant isolation: customers of another organization are unreadable.
    await assertTenantIsolation(session, customer.organizationId, "Customer", customer.id);

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Sesi tidak valid. Silakan login." } },
        { status: 401 }
      );
    }

    await assertPermission(session, "customers:edit");

    const customer = DBRepository.getCustomerById(params.id);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: "Customer tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Tenant isolation before any mutation.
    await assertTenantIsolation(session, customer.organizationId, "Customer", customer.id);

    const body = await req.json().catch(() => ({}));
    const parsed = updateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Data pembaruan customer tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const updated = DBRepository.updateCustomer(params.id, parsed.data, session.organizationId);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { message: "Customer tidak ditemukan." } },
        { status: 404 }
      );
    }

    await createAuditLog({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "UPDATE",
      entityName: "Customer",
      entityId: updated.id,
      details: {
        updatedFields: Object.keys(parsed.data),
        amlStatus: updated.amlStatus,
        riskRating: updated.riskRating,
        isVerified: updated.isVerified,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data customer berhasil diperbarui.",
      data: updated,
    });
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
    if (isTenantViolation(error)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN_CROSS_TENANT_ACCESS", message: error.message } },
        { status: 403 }
      );
    }
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Sesi tidak valid. Silakan login." } },
        { status: 401 }
      );
    }

    const customer = DBRepository.getCustomerById(params.id);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: "Customer tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Tenant isolation
    await assertTenantIsolation(session, customer.organizationId, "Customer", customer.id);

    const body = await req.json().catch(() => ({}));
    const parsed = verificationActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Parameter aksi verifikasi nasabah tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { action, comments, riskRating, documentsInspected } = parsed.data;

    // RBAC permissions check
    const verificationActions = [
      "VERIFY_KYC",
      "REQUEST_REVISION_KYC",
      "REJECT_KYC",
      "SET_AML_CLEARED",
      "SET_AML_FLAGGED",
      "SET_RISK_RATING",
      "FINAL_APPROVE",
      "FINAL_REJECT",
    ];

    if (verificationActions.includes(action)) {
      if (
        session.role !== "COMPLIANCE_OFFICER" &&
        session.role !== "INSTITUTION_ADMIN" &&
        !session.isSuperAdmin
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN_VERIFICATION_ROLE",
              message:
                "Hanya Compliance Officer atau Administrator Institusi yang berwenang melakukan verifikasi kepatuhan, skrining AML, dan persetujuan nasabah.",
            },
          },
          { status: 403 }
        );
      }
    }

    if (action === "SUBMIT" || action === "SUBMIT_REVISED_DATA") {
      if (
        session.role !== "FINANCING_OFFICER" &&
        session.role !== "INSTITUTION_ADMIN" &&
        !session.isSuperAdmin
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN_SUBMISSION_ROLE",
              message: "Hanya Financing Officer yang berwenang mengirimkan atau memperbarui draf pendaftaran nasabah.",
            },
          },
          { status: 403 }
        );
      }
    }

    const updated = DBRepository.processCustomerVerificationAction({
      customerId: params.id,
      contextOrganizationId: session.organizationId,
      actor: {
        userId: session.userId,
        fullName: session.fullName || session.email || "Petugas",
        role: session.role,
      },
      action,
      comments,
      riskRating,
      documentsInspected,
    });

    return NextResponse.json({
      success: true,
      message: `Aksi verifikasi '${action}' berhasil diproses.`,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("CUSTOMER_AML_NOT_CLEARED")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CUSTOMER_AML_NOT_CLEARED",
            message: error.message.replace("[CUSTOMER_AML_NOT_CLEARED] ", ""),
          },
        },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("CUSTOMER_KYC_NOT_VERIFIED")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CUSTOMER_KYC_NOT_VERIFIED",
            message: error.message.replace("[CUSTOMER_KYC_NOT_VERIFIED] ", ""),
          },
        },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("FORBIDDEN")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN_OPERATION",
            message: error.message.replace("[FORBIDDEN] ", ""),
          },
        },
        { status: 403 }
      );
    }
    return handleAuthError(error);
  }
}
