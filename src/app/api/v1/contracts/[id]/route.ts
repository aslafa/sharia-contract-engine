import { NextRequest, NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";
import {
  getAuthenticatedUser,
  assertPermission,
  assertTenantIsolation,
  handleAuthError,
  AuthorizationError,
} from "@/lib/auth/guard";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["SIGN_AND_ACTIVATE", "UPDATE_COMMENTS"]),
  comments: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Strict Authentication Guard (401 if unauthenticated)
    const session = await getAuthenticatedUser(req);

    // 2. RBAC Permission (403 if unauthorized)
    await assertPermission(session, "contracts:view");

    // 3. Retrieve Contract with tracking
    const result = DBRepository.getContractById(params.id);
    if (!result.contract) {
      return NextResponse.json(
        { success: false, error: { message: "Kontrak tidak ditemukan." } },
        { status: 404 }
      );
    }

    // 4. Multi-Tenant Isolation
    await assertTenantIsolation(
      session,
      result.contract.organizationId,
      "Contract",
      result.contract.id
    );

    return NextResponse.json({
      success: true,
      data: result,
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
    // 1. Strict Authentication Guard
    const session = await getAuthenticatedUser(req);

    // 2. Strict Auditor Blocking (Auditor is strictly read-only)
    if (session.role === "AUDITOR") {
      throw new AuthorizationError(
        "Otorisasi ditolak: Peran Auditor hanya memiliki akses pengawasan riwayat (Read-Only) dan dilarang mengubah status akad."
      );
    }

    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Format tindakan kontrak tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    // 3. Retrieve Contract to verify existence & tenant
    const existing = DBRepository.getContractById(params.id);
    if (!existing.contract) {
      return NextResponse.json(
        { success: false, error: { message: "Kontrak tidak ditemukan." } },
        { status: 404 }
      );
    }

    await assertTenantIsolation(
      session,
      existing.contract.organizationId,
      "Contract",
      existing.contract.id
    );

    if (parsed.data.action === "SIGN_AND_ACTIVATE") {
      const result = DBRepository.signAndActivateContract({
        contractIdOrNumber: params.id,
        actorName: session.fullName,
        role: session.role,
        comments: parsed.data.comments || "Akad dan berkas perikatan telah ditandatangani para pihak dan diaktifkan.",
      });

      return NextResponse.json({
        success: true,
        message: `Akad ${result.contract.contractNumber} berhasil ditandatangani dan status kini AKTIF.`,
        data: result,
      });
    }

    return NextResponse.json({
      success: true,
      data: existing,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
