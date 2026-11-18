"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Lock } from "lucide-react";

/**
 * Tahap 3B.5 — Panel pesan akses role-based yang konsisten.
 * UI-level only: API tetap menjadi otoritas keamanan; panel ini hanya
 * menjelaskan mengapa kontrol edit disembunyikan / halaman tidak dapat dibuka.
 */

export function AccessDeniedPanel({
  permission,
  message,
}: {
  /** Kode permission yang dibutuhkan, mis. "billing:view". */
  permission: string;
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-[#DC3545]/30 bg-[#DC3545]/5 p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-6 w-6 text-[#DC3545] shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-[#172B4D]">403 — Akses Ditolak</h4>
          <p className="text-xs text-[#64748B] leading-relaxed max-w-2xl">
            {message ||
              `Peran Anda saat ini tidak memiliki izin "${permission}" untuk membuka halaman ini. Menu terkait disembunyikan pada sidebar sesuai konfigurasi RBAC.`}
          </p>
          <p className="text-[11px] text-[#64748B]">
            Hubungi <strong>Administrator Institusi</strong> apabila Anda memerlukan akses ke modul ini.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mt-1">
              Kembali ke Meja Kerja
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ReadOnlyPanel({
  message,
  hint,
}: {
  message: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[#E9A23B]/30 bg-[#E9A23B]/5 p-4">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-[#B4690E] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-[#172B4D]">Mode Baca Saja (Read-Only)</h4>
          <p className="text-xs text-[#64748B] leading-relaxed max-w-2xl">{message}</p>
          {hint && <p className="text-[11px] text-[#B4690E]">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
