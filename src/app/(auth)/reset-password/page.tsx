"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-[#172B4D]">
          Setel Ulang Kata Sandi
        </h2>
        <p className="mt-1 text-xs text-[#64748B]">
          Tentukan kata sandi baru yang memenuhi standar keamanan perbankan (kombinasi huruf besar, angka, dan simbol).
        </p>
      </div>

      {success ? (
        <div className="p-4 bg-[#16A36A]/10 border border-[#16A36A]/30 rounded-lg space-y-2 text-xs text-center animate-in fade-in-50">
          <CheckCircle2 className="h-8 w-8 text-[#16A36A] mx-auto" />
          <h3 className="font-bold text-[#172B4D]">Kata Sandi Berhasil Diperbarui!</h3>
          <p className="text-[#64748B]">
            Mengarahkan Anda kembali ke portal login institusi...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-[#DC3545]/10 border border-[#DC3545]/25 rounded text-[#DC3545]">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-[#172B4D]">Kata Sandi Baru *</label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-2.5 text-[#94A3B8]" />
              <Input
                type="password"
                placeholder="Minimal 8 karakter"
                required
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#172B4D]">Konfirmasi Kata Sandi Baru *</label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-2.5 text-[#94A3B8]" />
              <Input
                type="password"
                placeholder="Ulangi kata sandi baru"
                required
                className="pl-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg space-y-1 text-[11px] text-[#64748B]">
            <span className="font-semibold text-[#172B4D] flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#16A36A]" />
              Kebijakan Keamanan Kredensial:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[10px]">
              <li>Minimal 8 karakter</li>
              <li>Wajib mengandung huruf besar, huruf kecil, dan angka</li>
              <li>Tidak boleh menggunakan 3 sandi terakhir yang pernah dipakai</li>
            </ul>
          </div>

          <Button type="submit" className="w-full gap-2 text-xs" disabled={loading}>
            <span>{loading ? "Menyimpan Kata Sandi..." : "Simpan & Masuk"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="text-center text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
        <Link href="/login" className="font-semibold text-[#00549c] hover:underline">
          Batal dan Kembali ke Login
        </Link>
      </div>
    </div>
  );
}

