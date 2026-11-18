import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logRegistrationEvent } from "@/lib/audit";
import { ORGANIZATION_TYPES, SUBSCRIPTION_TIERS } from "@/types/tenant";

const registrationSchema = z.object({
  // Step 1: Institution Info
  institutionType: z.enum(ORGANIZATION_TYPES),
  institutionName: z.string().min(3, "Nama lembaga minimal 3 karakter"),
  legalEntityNumber: z.string().min(3, "Nomor legalitas/akta/AHU wajib diisi"),
  businessLicense: z.string().min(3, "Nomor izin operasional OJK/Kemenkop wajib diisi"),
  officialEmail: z.string().email("Format email resmi institusi tidak valid"),
  phone: z.string().min(6, "Nomor telepon operasional wajib diisi"),
  officeAddress: z.string().min(5, "Alamat kantor pusat wajib diisi"),
  city: z.string().optional().default("Jakarta"),
  province: z.string().optional().default("DKI Jakarta"),

  // Step 2: Authorized Representative
  repFullName: z.string().min(3, "Nama penanggung jawab berwenang wajib diisi"),
  repPosition: z.string().min(2, "Jabatan perwakilan wajib diisi"),
  repEmail: z.string().email("Email perwakilan tidak valid"),
  repPhone: z.string().min(6, "Nomor HP/telepon perwakilan wajib diisi"),

  // Step 3: Product Requirements
  requiredAkadModules: z.array(z.string()).min(1, "Minimal pilih 1 modul akad syariah"),
  preferredSubscription: z.enum(SUBSCRIPTION_TIERS).default("PROFESSIONAL"),
  estimatedMonthlyVolume: z.number().int().positive().default(50),

  // Step 4: Supporting Documents
  documents: z.array(
    z.object({
      category: z.string(),
      fileName: z.string(),
      fileUrl: z.string(),
      fileSizeBytes: z.number().optional().default(102400),
      sha256: z.string().optional().default("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
    })
  ).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validated = registrationSchema.parse(rawData);

    // Generate formal registration number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const regNumber = `REG-${datePrefix}-${randomSuffix}`;

    const registrationRecord = {
      id: `reg-${Date.now()}`,
      registrationNumber: regNumber,
      status: "SUBMITTED",
      currentStageIndex: 1, // Stage 1 of 10: Registration Submitted
      ...validated,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Record audit event
    await logRegistrationEvent(registrationRecord.id, "REGISTRATION_SUBMIT", {
      registrationNumber: regNumber,
      institutionName: validated.institutionName,
      institutionType: validated.institutionType,
      repFullName: validated.repFullName,
      preferredSubscription: validated.preferredSubscription,
      requiredAkadModules: validated.requiredAkadModules,
      documentsCount: validated.documents.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran institusi berhasil diserahkan. Tiket onboarding telah diterbitkan.",
        data: {
          registration: registrationRecord,
          trackingUrl: `/onboarding/status/${registrationRecord.id}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Data pendaftaran institusi tidak valid.",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error("[ONBOARDING_REGISTER_ERROR]", error);
    return NextResponse.json(
      { success: false, error: { message: "Gagal memproses pendaftaran institusi." } },
      { status: 500 }
    );
  }
}

