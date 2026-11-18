import { NextRequest, NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";
import {
  getAuthenticatedUser,
  assertTenantIsolation,
  assertPermission,
  handleAuthError,
  AuthorizationError,
} from "@/lib/auth/guard";
import { z } from "zod";

const approvalSchema = z.object({
  roleCode: z.enum(["LEGAL_OFFICER", "COMPLIANCE_OFFICER", "SHARIA_REVIEWER", "MANAGEMENT"]),
  actorName: z.string().min(2),
  action: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]),
  comments: z.string().min(1, "Catatan / alasan wajib disertakan"),
  evidenceNotes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Strict Authentication Guard (Rejects unauthenticated with 401)
    const session = await getAuthenticatedUser(req);

    const body = await req.json();
    const parsed = approvalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Format tindakan persetujuan tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    // 2. Check application existence
    const { application: app } = DBRepository.getApplicationById(params.id);
    if (!app) {
      return NextResponse.json(
        { success: false, error: { message: "Aplikasi pembiayaan tidak ditemukan." } },
        { status: 404 }
      );
    }

    // 3. Strict Multi-Tenant Isolation (Blocks cross-tenant with 403 & logs violation)
    await assertTenantIsolation(session, app.organizationId, "FinancingApplication", app.id);

    // 4. RBAC Permission Check (Blocks unauthorized role actions with 403)
    const actionPermission =
      parsed.data.action === "APPROVE"
        ? "approvals:approve"
        : parsed.data.action === "REQUEST_REVISION"
          ? "approvals:revise"
          : "approvals:reject";
    await assertPermission(session, actionPermission);

    // 5. Verify actor role matches active session (Super Admin cannot bypass transaction approvals)
    if (session.role !== parsed.data.roleCode) {
      throw new AuthorizationError(
        `Otorisasi ditolak: Peran aktif Anda '${session.role}' tidak berwenang mengeksekusi keputusan persetujuan transaksi atas nama '${parsed.data.roleCode}'.`
      );
    }

    const expectedStageForRole: Record<string, string> = {
      LEGAL_OFFICER: "LEGAL",
      COMPLIANCE_OFFICER: "COMPLIANCE",
      SHARIA_REVIEWER: "DPS",
      MANAGEMENT: "MANAGEMENT",
    };

    const allowedStage = expectedStageForRole[parsed.data.roleCode];
    if (app.currentStage !== allowedStage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Wewenang ditolak: Pengajuan ${app.applicationNumber} saat ini berada pada tahap '${app.currentStage}' (${app.statusLabel}), tidak dapat diproses oleh ${parsed.data.roleCode}.`,
          },
        },
        { status: 403 }
      );
    }

    // 6. Defense-in-depth: Strict Sharia Compliance Check on Approval Action
    if (
      parsed.data.action === "APPROVE" &&
      (app.shariaStatus === "BLOCKED" || (app.shariaStatus as string) === "NON_COMPLIANT")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SHARIA_NON_COMPLIANT_BLOCKED",
            message: `Persetujuan ditolak: Pengajuan ${app.applicationNumber} terdeteksi berstatus pelanggaran syariah (${app.shariaStatus}) dan tidak dapat disetujui.`,
          },
        },
        { status: 422 }
      );
    }

    const result = DBRepository.processApproval({
      applicationId: params.id,
      ...parsed.data,
      actorName: session.fullName || parsed.data.actorName,
    });

    return NextResponse.json({
      success: true,
      message:
        parsed.data.action === "APPROVE"
          ? `Persetujuan berhasil diterbitkan oleh ${parsed.data.roleCode}.`
          : parsed.data.action === "REQUEST_REVISION"
            ? "Permintaan revisi telah dikirimkan ke Financing Officer."
            : "Pengajuan telah ditolak resmi.",
      data: result,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

