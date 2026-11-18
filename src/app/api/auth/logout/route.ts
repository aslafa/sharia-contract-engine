import { NextResponse } from "next/server";
import { getCurrentSession, destroySession } from "@/lib/auth/session";
import { logAuthEvent } from "@/lib/audit";

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (session) {
      await logAuthEvent("LOGOUT", session.userId, session.organizationId, {
        email: session.email,
        role: session.role,
      });
    }

    await destroySession();

    return NextResponse.json({
      success: true,
      message: "Sesi berhasil diakhiri.",
    });
  } catch (error) {
    console.error("[LOGOUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: { message: "Gagal memproses logout." } },
      { status: 500 }
    );
  }
}

