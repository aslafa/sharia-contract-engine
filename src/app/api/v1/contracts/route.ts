import { NextRequest, NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";
import {
  getAuthenticatedUser,
  assertPermission,
  assertTenantIsolation,
  handleAuthError,
} from "@/lib/auth/guard";
import { z } from "zod";

const createContractSchema = z.object({
  akadCategory: z.enum(["MURABAHAH", "IJARAH", "MUSYARAKAH", "MUDHARABAH"]),
  title: z.string().min(3),
  customerName: z.string().min(2),
  objectDescription: z.string().min(3),
  nominalValue: z.number().positive(),
  tenorMonths: z.number().int().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // 1. Strict Authentication Guard (401 if unauthenticated)
    const session = await getAuthenticatedUser(req);

    // 2. RBAC Permission (403 if unauthorized)
    await assertPermission(session, "contracts:view");

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const akad = searchParams.get("akad") || undefined;
    const status = searchParams.get("status") || undefined;
    const requestedOrgId = searchParams.get("organizationId");

    // 3. Multi-Tenant Isolation
    if (requestedOrgId && requestedOrgId !== session.organizationId) {
      await assertTenantIsolation(session, requestedOrgId, "Contract");
    }

    const organizationId = session.isSuperAdmin
      ? requestedOrgId || undefined
      : session.organizationId;

    const contracts = DBRepository.getContracts({
      search,
      akad,
      status,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      data: contracts,
      total: contracts.length,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Authentication Guard (401 if unauthenticated)
    const session = await getAuthenticatedUser(req);

    // 2. RBAC Permission (403 if unauthorized)
    await assertPermission(session, "contracts:create");

    const body = await req.json();
    const parsed = createContractSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Data draf kontrak tidak valid.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { akadCategory, title, customerName, objectDescription, nominalValue, tenorMonths } = parsed.data;

    // 3. Bound strictly to authenticated session tenant (No client header / body spoofing)
    const app = DBRepository.createApplication({
      organizationId: session.organizationId,
      createdById: session.userId,
      createdByName: session.fullName,
      akad: akadCategory,
      title,
      customerName,
      commodityOrAsset: objectDescription,
      costPrice: nominalValue,
      marginOrNisbah: Math.round(nominalValue * 0.15),
      tenorMonths,
      submitImmediately: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Draf kontrak berhasil dibuat dan tercatat di repositori data.",
        data: app,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return handleAuthError(error);
  }
}
