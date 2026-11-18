import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          user: null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: {
        user: session,
      },
    });
  } catch (error) {
    console.error("[SESSION_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: { message: "Gagal memuat sesi." } },
      { status: 500 }
    );
  }
}

