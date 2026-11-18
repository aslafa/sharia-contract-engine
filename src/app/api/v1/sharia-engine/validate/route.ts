import { NextRequest, NextResponse } from "next/server";
import { ShariaRuleEngine } from "@/lib/sharia/engine";
import { AkadCategory } from "@/types/akad";
import { ApiResponse } from "@/types/api";
import { ContractValidationReport } from "@/types/sharia";
import { getAuthenticatedUser, assertPermission, handleAuthError } from "@/lib/auth/guard";
import { z } from "zod";

const validateRequestSchema = z.object({
  akadCategory: z.enum(["MURABAHAH", "IJARAH", "MUSYARAKAH", "MUDHARABAH"]),
  contractId: z.string().optional(),
  contractNumber: z.string().optional(),
  payload: z.record(z.any()),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Authentication Guard (401 if unauthenticated)
    const session = await getAuthenticatedUser(req);

    // 2. Strict RBAC Permission Check (403 if unauthorized)
    await assertPermission(session, "sharia:validate");

    const body = await req.json();
    const parsed = validateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Parameter validasi tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { akadCategory, payload, contractId, contractNumber } = parsed.data;

    const report = ShariaRuleEngine.evaluate(
      akadCategory as AkadCategory,
      payload,
      { contractId, contractNumber }
    );

    return NextResponse.json<ApiResponse<ContractValidationReport>>({
      success: true,
      message: `Evaluasi Syariah selesai. Status: ${report.status}`,
      data: report,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

