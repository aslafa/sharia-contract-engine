"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldAlert } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-[#172B4D]">
          Pemulihan Kata Sandi Institusi
        </h2>
        <p className="mt-1 text-xs text-[#64748B]">
          Masukkan email resmi institusi Anda yang terdaftar untuk menerima tautan pemulihan kata sandi berkeamanan tinggi.
        </p>
      </div>

      {submitted ? (
        <div className="p-4 bg-[#16A36A]/10 border border-[#16A36A]/30 rounded-lg space-y-3 text-xs animate-in fade-in-50">
          <div className="flex items-center gap-2 text-[#16A36A] font-bold">
            <CheckCircle2 className="h-5 w-5" />
            <span>Tautan Pemulihan Telah Dikirim!</span>
          </div>
          <p className="text-[#172B4D]">
            Instruksi penyetelan ulang kata sandi telah dikirimkan ke <strong>{email}</strong>. Tautan kedaluwarsa dalam 15 menit.
          </p>
          <div className="pt-2">
            <Link href="/reset-password">
              <Button variant="outline" className="w-full text-xs">
                Lanjut ke Halaman Setel Ulang Sandi (Demo)
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[#172B4D]">Email Kerja Institusi</label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-2.5 text-[#94A3B8]" />
              <Input
                type="email"
                placeholder="nama@bank-syariah.co.id"
                required
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg flex items-start gap-2 text-[11px] text-[#64748B]">
            <ShieldAlert className="h-4 w-4 text-[#E9A23B] shrink-0 mt-0.5" />
            <span>
              Demi alasan keamanan perbankan, permintaan pemulihan kata sandi akan dicatat pada log audit kepatuhan lembaga.
            </span>
          </div>

          <Button type="submit" className="w-full gap-2 text-xs" disabled={loading}>
            <span>{loading ? "Memproses Permintaan..." : "Kirim Tautan Pemulihan"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="text-center text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
        <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-[#00549c] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Halaman Masuk</span>
        </Link>
      </div>
    </div>
  );
}

