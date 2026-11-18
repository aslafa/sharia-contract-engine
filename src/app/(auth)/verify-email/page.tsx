"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Mail, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const [resending, setResending] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  const handleResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setResent(true);
    }, 800);
  };

  return (
    <div className="space-y-6 text-center">
      <div className="w-12 h-12 bg-[#DCEAF5] rounded-full flex items-center justify-center mx-auto text-[#00549c]">
        <Mail className="h-6 w-6" />
      </div>

      <div>
        <Badge variant="info" className="mb-2">Tahap 2 dari 10: Onboarding</Badge>
        <h2 className="text-lg font-bold tracking-tight text-[#172B4D]">
          Verifikasi Email Institusi Anda
        </h2>
        <p className="mt-1.5 text-xs text-[#64748B] max-w-sm mx-auto">
          Kami telah mengirimkan tautan aktivasi ke alamat email resmi institusi yang didaftarkan. Silakan klik tautan pada email untuk mengonfirmasi kepemilikan domain.
        </p>
      </div>

      {resent && (
        <div className="p-3 bg-[#16A36A]/10 border border-[#16A36A]/30 rounded-lg text-xs text-[#16A36A] flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Email verifikasi baru berhasil dikirim ulang!</span>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <Link href="/login" className="w-full block">
          <Button className="w-full gap-2 text-xs">
            <span>Sudah Verifikasi? Masuk Sekarang</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <Button
          variant="outline"
          onClick={handleResend}
          disabled={resending}
          className="w-full gap-2 text-xs border-[#E2E8F0]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
          <span>{resending ? "Mengirim Ulang..." : "Kirim Ulang Email Verifikasi"}</span>
        </Button>
      </div>

      <div className="pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
        Ada kendala saat menerima email? Hubungi Tim Kepatuhan SCE di{" "}
        <a href="mailto:support@sce-engine.id" className="font-semibold text-[#00549c] hover:underline">
          support@sce-engine.id
        </a>
      </div>
    </div>
  );
}

