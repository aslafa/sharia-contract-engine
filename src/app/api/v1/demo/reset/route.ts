import { NextRequest, NextResponse } from "next/server";
import { DBRepository } from "@/lib/db/repository";
import { getAuthenticatedUser, handleAuthError } from "@/lib/auth/guard";

/**
 * Tahap 3B.5 (RBAC audit fix) — Endpoint ini SEBELUMNYA tanpa autentikasi
 * sehingga siapa pun (bahkan tanpa login) dapat me-reset seluruh operational
 * store. Sekarang dijaga sesi + hanya role administratif yang berwenang:
 * SUPER_ADMIN & INSTITUTION_ADMIN (pemilik demo environment lembaga).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedUser(req);

    const isAdministrativeRole =
      session.isSuperAdmin ||
      session.role === "SUPER_ADMIN" ||
      session.role === "INSTITUTION_ADMIN";

    if (!isAdministrativeRole) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message:
              "Akses ditolak: hanya Super Admin atau Administrator Institusi yang dapat me-reset data demo.",
          },
        },
        { status: 403 }
      );
    }

    DBRepository.resetDemo();
    return NextResponse.json({
      success: true,
      message: "Database demo berhasil di-reset ke kondisi awal benchmark perbankan syariah.",
    });
  } catch (error: any) {
    // handleAuthError maps AuthenticationError → 401, AuthorizationError → 403.
    return handleAuthError(error);
  }
}
