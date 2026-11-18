"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Lock,
  Mail,
  Shield,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SystemRole } from "@/types";

interface RoleAccountGuide {
  role: SystemRole;
  roleTitle: string;
  department: string;
  email: string;
}

const INSTITUTION_ACCOUNTS: RoleAccountGuide[] = [
  { role: "FINANCING_OFFICER", roleTitle: "Petugas Pembiayaan (FO)", department: "Bisnis & Inisiasi Akad", email: "fatimah.zahra@bprs-albarakah.co.id" },
  { role: "LEGAL_OFFICER", roleTitle: "Legal Officer", department: "Telaah Hukum & Agunan", email: "bambang.sudrajat@bprs-albarakah.co.id" },
  { role: "COMPLIANCE_OFFICER", roleTitle: "Compliance Officer", department: "Kepatuhan Regulasi & OJK", email: "nurul.hidayati@bprs-albarakah.co.id" },
  { role: "SHARIA_REVIEWER", roleTitle: "Dewan Pengawas Syariah (DPS)", department: "Sertifikasi Fatwa & Fiqh", email: "kh.ridwan.mansur@dps-mui.id" },
  { role: "MANAGEMENT", roleTitle: "Direksi / Manajemen", department: "Komite Pembiayaan", email: "ir.hendra.gunawan@bprs-albarakah.co.id" },
  { role: "AUDITOR", roleTitle: "Auditor Kepatuhan Syariah", department: "Pengawasan Independen (Read-Only)", email: "audit.internal@bprs-albarakah.co.id" },
  { role: "INSTITUTION_ADMIN", roleTitle: "Administrator Institusi", department: "Tata Kelola Staf & Tenant", email: "admin@bprs-albarakah.co.id" },
  { role: "SUPER_ADMIN", roleTitle: "Super Admin Platform", department: "Master SaaS Multi-Tenant", email: "superadmin@sce-engine.id" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [mfaCode, setMfaCode] = React.useState("");
  const [showMfaInput, setShowMfaInput] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showGuide, setShowGuide] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Silakan masukkan email kerja institusi Anda.");
      return;
    }
    if (!password) {
      setErrorMessage("Silakan masukkan kata sandi.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          mfaCode: showMfaInput ? mfaCode.trim() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Kombinasi email dan kata sandi tidak valid.");
      }

      const activeRole = json.data?.user?.role as SystemRole | undefined;

      // Role-based redirection
      if (activeRole === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan sistem saat otentikasi.");
      setLoading(false);
    }
  };

  const handleSelectGuideEmail = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5 border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] font-mono text-[#00549c] border-[#00549c]/30 bg-[#00549c]/5">
            Sistem Perbankan Syariah Terproteksi
          </Badge>
          <span className="text-[10px] text-slate-500 font-medium">DSN-MUI &amp; POJK 65</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#172B4D]">
          Masuk ke Portal Institusi
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Autentikasi terenkripsi Sharia Contract Engine (SCE) dengan pemisahan hak akses berbasis 8 peran sistem (RBAC) dan isolasi multi-tenant.
        </p>
      </div>

      {/* Error Alert Panel */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in-50">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Gagal Masuk</p>
            <p className="text-[11px] text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4 text-xs">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-800 flex items-center justify-between">
            <span>Email Kerja Institusi</span>
            <span className="text-[10px] text-slate-500 font-normal">Contoh: nama@lembaga.co.id</span>
          </label>
          <div className="relative">
            <Mail className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              type="email"
              placeholder="nama@bprs-albarakah.co.id"
              required
              autoComplete="email"
              className="pl-9 text-xs h-9 border-slate-300 focus:border-[#00549c] focus:ring-[#00549c]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Password Field with Show/Hide toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-800">Kata Sandi Akun</label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-[#00549c] hover:underline font-medium"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <Lock className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi Anda"
              required
              autoComplete="current-password"
              className="pl-9 pr-10 text-xs h-9 border-slate-300 focus:border-[#00549c] focus:ring-[#00549c]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Optional Multi-Factor Authentication (MFA) */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <KeyRound className="h-3.5 w-3.5 text-[#00549c]" />
              Verifikasi Tambahan (MFA / OTP)
            </span>
            <button
              type="button"
              onClick={() => setShowMfaInput(!showMfaInput)}
              className="text-[#00549c] hover:underline font-semibold"
            >
              {showMfaInput ? "Sembunyikan Kode OTP" : "+ Masukkan Kode OTP"}
            </button>
          </div>

          {showMfaInput && (
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 animate-in fade-in-50">
              <label className="text-[10px] font-semibold text-slate-700">
                Kode Verifikasi 6-Digit (Aplikasi Authenticator / SMS Token)
              </label>
              <Input
                placeholder="123456"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="font-mono text-center tracking-widest text-sm h-9 bg-white"
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full gap-2 mt-3 bg-[#00549c] hover:bg-[#00427c] text-white font-semibold h-9 shadow-xs"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Memverifikasi Otorisasi Sesi...</span>
            </>
          ) : (
            <>
              <span>Masuk ke Portal Lembaga</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Directory of Authorized Accounts (Emails only, no exposed passwords) */}
      <div className="pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between py-1.5 text-[11px] text-slate-600 hover:text-[#00549c] transition-colors"
        >
          <span className="flex items-center gap-1.5 font-semibold">
            <HelpCircle className="h-3.5 w-3.5 text-[#00549c]" />
            Panduan Alamat Akun Berdasarkan 8 Peran Institusi
          </span>
          {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showGuide && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 animate-in fade-in-50">
            <p className="text-[10px] text-slate-500 mb-1.5">
              Klik alamat email untuk mengisi kolom email secara otomatis:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {INSTITUTION_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectGuideEmail(acc.email)}
                  className="text-left p-2 rounded-md bg-white border border-slate-200 hover:border-[#00549c] hover:bg-slate-50/80 transition-all text-[11px]"
                >
                  <p className="font-bold text-slate-900 leading-tight">{acc.roleTitle}</p>
                  <p className="text-[10px] font-mono text-[#00549c] truncate mt-0.5">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 text-center text-[11px] text-slate-500 space-y-2">
        <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <Shield className="h-3 w-3 text-emerald-600" />
          <span>Enkripsi Sesi HMAC-SHA256 • Perlindungan Multi-Tenant • Standar POJK No. 65</span>
        </p>
        <p>
          Lembaga keuangan syariah baru?{" "}
          <Link href="/register" className="font-semibold text-[#00549c] hover:underline">
            Daftarkan Institusi Anda
          </Link>
        </p>
      </div>
    </div>
  );
}
