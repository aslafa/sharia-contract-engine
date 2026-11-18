import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AkadRecommendationEngine } from "@/lib/akad/recommendation-engine";
import { ShariaRuleEngine } from "@/lib/sharia/engine";
import { getAuthenticatedUser, assertPermission, handleAuthError } from "@/lib/auth/guard";
import { ApiResponse } from "@/types/api";
import { AkadRecommendationResult } from "@/lib/akad/recommendation-engine";
import { ContractValidationReport } from "@/types/sharia";

// ─── Request Schema ───────────────────────────────────────────────────────────

const recommendSchema = z.object({
  financingPurpose: z.enum([
    "ASSET_PURCHASE", "ASSET_LEASE", "BUSINESS_PARTNERSHIP", "BUSINESS_CAPITAL",
    "PROPERTY", "VEHICLE", "EDUCATION", "WORKING_CAPITAL", "OTHER",
  ]),
  transactionObject: z.string().min(3).max(200).optional(),
  financingAmount: z.number().positive("Nilai pembiayaan harus positif"),
  tenorMonths: z.number().int().min(1).max(360),
  customerType: z.enum(["INDIVIDUAL", "MICRO_BUSINESS", "SME", "CORPORATE"]),
  riskProfile: z.enum(["CONSERVATIVE", "MODERATE", "GROWTH"]),
  wantsOwnershipTransfer: z.boolean().optional(),
  hasCollateral: z.boolean().optional(),
  businessHasTrackRecord: z.boolean().optional(),
  capitalContributionPercent: z.number().min(0).max(100).optional(),
  additionalNotes: z.string().max(500).optional(),
  // Jika true, engine juga menjalankan validasi syariah pada payload hint
  includeValidation: z.boolean().default(false),
});

export type AkadRecommendResponseData = {
  recommendation: AkadRecommendationResult;
  validation?: ContractValidationReport; // hanya ada jika includeValidation=true
};

// ─── POST /api/v1/akad-recommend ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Auth & permission — FO dan role dengan contracts:create dapat mengakses
    const session = await getAuthenticatedUser(req);
    await assertPermission(session, "contracts:create");

    const body = await req.json();
    const parsed = recommendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Parameter tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 2. Jalankan recommendation engine
    const recommendation = AkadRecommendationEngine.recommend(input);

    // 3. Opsional: validasi syariah pada payload hint dari akad yang direkomendasikan
    let validation: ContractValidationReport | undefined;
    if (input.includeValidation) {
      validation = ShariaRuleEngine.evaluate(
        recommendation.recommendedAkad,
        recommendation.shariaPayloadHint,
        { contractNumber: `RECOMMEND-${Date.now()}` }
      );
    }

    return NextResponse.json<ApiResponse<AkadRecommendResponseData>>({
      success: true,
      message: `Rekomendasi akad selesai: ${recommendation.recommendedAkad} (confidence: ${recommendation.confidence})`,
      data: {
        recommendation,
        ...(validation ? { validation } : {}),
      },
    });
  } catch (error: unknown) {
    return handleAuthError(error);
  }
}
