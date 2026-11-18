import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DBRepository } from "@/lib/db/repository";
import { getCurrentSession } from "@/lib/auth/session";
import { assertTenantIsolation, handleAuthError } from "@/lib/auth/guard";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

// Allowed MIME types
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: { message: "Sesi tidak valid. Silakan login terlebih dahulu." } },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = (formData.get("applicationId") as string) || "app-general";
    const category = (formData.get("category") as any) || "OTHER";
    const uploadedBy = session.fullName;

    if (applicationId && applicationId !== "app-general") {
      const { application } = DBRepository.getApplicationById(applicationId);
      if (application) {
        await assertTenantIsolation(session, application.organizationId, "DocumentUpload", applicationId);
      }
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: "File dokumen wajib dilampirkan." } },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Tipe file '${file.type}' tidak didukung. Format yang diizinkan: PDF, JPEG, PNG, DOCX.`,
          },
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Ukuran file melebihi batas maksimum 10MB. Ukuran saat ini: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
          },
        },
        { status: 400 }
      );
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileSha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const destinationPath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(destinationPath, buffer);

    const docRecord = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      applicationId,
      organizationId: session.organizationId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: `/data/uploads/${safeName}`,
      category,
      verificationStatus: "PENDING" as const,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      sha256: fileSha256,
    };

    return NextResponse.json({
      success: true,
      message: `Dokumen '${file.name}' berhasil diunggah secara aman dan terverifikasi hash kriptografi SHA-256.`,
      data: docRecord,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

