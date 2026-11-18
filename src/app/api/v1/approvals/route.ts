import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/types/api";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const approvalActionSchema = z.object({
  contractId: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]),
  comments: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const orgId = req.headers.get("x-organization-id");
    const userId = req.headers.get("x-user-id") || "00000000-0000-0000-0000-000000000000";

    if (!orgId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED_TENANT",
            message: "Tenant header 'x-organization-id' wajib disertakan.",
          },
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = approvalActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Parameter persetujuan tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { contractId, action, comments } = parsed.data;

    // Verify contract exists and belongs to the tenant
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, organizationId: orgId },
    });

    if (!contract) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Kontrak tidak ditemukan dalam lingkup organisasi ini.",
          },
        },
        { status: 404 }
      );
    }

    // Update status based on decision
    let nextStatus = contract.status;
    if (action === "APPROVE") {
      nextStatus = "APPROVED";
    } else if (action === "REJECT") {
      nextStatus = "SHARIA_NON_COMPLIANT";
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: { status: nextStatus },
    });

    // Record in audit log
    await createAuditLog({
      organizationId: orgId,
      userId,
      action: action === "APPROVE" ? "APPROVE_CONTRACT" : "REJECT_CONTRACT",
      entityName: "Contract",
      entityId: contractId,
      details: { previousStatus: contract.status, newStatus: nextStatus, comments },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Tindakan persetujuan (${action}) berhasil dicatat.`,
      data: updatedContract,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "APPROVAL_FAILED",
          message: "Gagal memproses alur persetujuan kontrak.",
        },
      },
      { status: 500 }
    );
  }
}

