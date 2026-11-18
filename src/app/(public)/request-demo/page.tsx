"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { Calendar, CheckCircle2, ShieldCheck, Sparkles, Clock, ArrowRight } from "lucide-react";

export default function RequestDemoPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    institutionName: "",
    institutionType: "BPRS",
    role: "Komite Pembiayaan / DPS",
    estimatedMonthlyContracts: "50-200 Kontrak",
    preferredDate: "",
    notes: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = "Nama lengkap wajib diisi.";
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errs.email = "Email kantor valid wajib diisi.";
    }
    if (!formData.institutionName.trim()) {
      errs.institutionName = "Nama institusi wajib diisi.";
    }
    if (!formData.preferredDate) {
      errs.preferredDate = "Pilih perkiraan tanggal demo yang diinginkan.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="space-y-16 py-12 container mx-auto max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="primary">Jadwalkan Sesi Privat</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B4D]">
          Request a Live Product Demonstration
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Saksikan langsung bagaimana Sharia Contract Engine (SCE) mengotomasi kalkulasi akad, memvalidasi fatwa DSN-MUI, dan mempercepat alur persetujuan pembiayaan institusi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start">
        {/* Value Proposition Highlights (Left) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-[#F5F8FC] border-[#00549c]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#172B4D]">Apa yang Akan Anda Saksikan?</CardTitle>
              <CardDescription className="text-xs">
                Sesi interaktif berdurasi 30 menit disesuaikan dengan alur institusi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#16A36A] shrink-0 mt-0.5" />
                <span className="text-[#172B4D]">
                  Simulasi live Sharia Rule Engine untuk akad Murabahah, Ijarah, Musyarakah, dan Mudharabah.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#16A36A] shrink-0 mt-0.5" />
                <span className="text-[#172B4D]">
                  Penerbitan otomatis draf kontrak PDF dengan klausul DSN-MUI dan tanda tangan digital.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#16A36A] shrink-0 mt-0.5" />
                <span className="text-[#172B4D]">
                  Demo alur persetujuan berjenjang: Financing Officer ke DPS hingga Pemutus Pembiayaan.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#16A36A] shrink-0 mt-0.5" />
                <span className="text-[#172B4D]">
                  Tinjauan keamanan multi-tenant dan skenario integrasi Core Banking System (CBS).
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 rounded-lg bg-white border border-[#E2E8F0] space-y-1.5 text-xs text-[#64748B]">
            <p className="font-bold text-[#172B4D]">Dukungan Sesi Privat:</p>
            <p>Didampingi langsung oleh Senior Sharia Solution Architect dan Konsultan Fiqh Muamalah bersertifikat.</p>
          </div>
        </div>

        {/* Demo Form (Right) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#172B4D]">
                Formulir Permintaan Demo
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih waktu yang sesuai untuk tim manajemen dan komite syariah Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="p-8 text-center space-y-3 bg-[#16A36A]/10 border border-[#16A36A]/20 rounded-lg">
                  <CheckCircle2 className="h-10 w-10 text-[#16A36A] mx-auto" />
                  <h3 className="text-base font-bold text-[#172B4D]">Permintaan Demo Berhasil Diajukan</h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                    Terima kasih, <strong>{formData.fullName}</strong>. Tim representatif kami telah menerima permohonan demo untuk <strong>{formData.institutionName}</strong> dan akan mengirimkan tautan kalender konfirmasi ke <strong>{formData.email}</strong>.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        fullName: "",
                        email: "",
                        phone: "",
                        institutionName: "",
                        institutionType: "BPRS",
                        role: "Komite Pembiayaan / DPS",
                        estimatedMonthlyContracts: "50-200 Kontrak",
                        preferredDate: "",
                        notes: "",
                      });
                    }}
                    className="mt-2"
                  >
                    Ajukan Permintaan Lainnya
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Nama Lengkap Anda *</label>
                      <Input
                        placeholder="e.g. Ahmad Zaki, S.E."
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        error={Boolean(errors.fullName)}
                      />
                      {errors.fullName && <p className="text-[10px] text-[#DC3545]">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Email Kerja Resmi *</label>
                      <Input
                        type="email"
                        placeholder="zaki@bprs-syariah.id"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        error={Boolean(errors.email)}
                      />
                      {errors.email && <p className="text-[10px] text-[#DC3545]">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Nama Institusi / Lembaga *</label>
                      <Input
                        placeholder="e.g. PT BPRS Al-Barakah Mandiri"
                        value={formData.institutionName}
                        onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                        error={Boolean(errors.institutionName)}
                      />
                      {errors.institutionName && <p className="text-[10px] text-[#DC3545]">{errors.institutionName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Jenis Lembaga</label>
                      <Select
                        value={formData.institutionType}
                        onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                      >
                        {siteConfig.institutionTypes.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Jabatan / Peran Anda</label>
                      <Select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="Direksi / Pimpinan Cabang">Direksi / Pimpinan Cabang</option>
                        <option value="Dewan Pengawas Syariah (DPS)">Dewan Pengawas Syariah (DPS)</option>
                        <option value="Komite Pembiayaan / Legal">Komite Pembiayaan / Legal</option>
                        <option value="IT / Digital Transformation">IT / Digital Transformation</option>
                        <option value="Financing Officer / AO">Financing Officer / AO</option>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Estimasi Volume Akad Bulanan</label>
                      <Select
                        value={formData.estimatedMonthlyContracts}
                        onChange={(e) => setFormData({ ...formData, estimatedMonthlyContracts: e.target.value })}
                      >
                        <option value="< 50 Kontrak / bln">&lt; 50 Kontrak / bulan</option>
                        <option value="50-200 Kontrak / bln">50 - 200 Kontrak / bulan</option>
                        <option value="200-500 Kontrak / bln">200 - 500 Kontrak / bulan</option>
                        <option value="> 500 Kontrak / bln">&gt; 500 Kontrak / bulan</option>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Nomor Telepon / WhatsApp</label>
                      <Input
                        placeholder="+62 812-xxxx-xxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Rencana Tanggal Demo *</label>
                      <Input
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                        error={Boolean(errors.preferredDate)}
                      />
                      {errors.preferredDate && <p className="text-[10px] text-[#DC3545]">{errors.preferredDate}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#172B4D]">Catatan / Modul Khusus yang Ingin Dilihat</label>
                    <Textarea
                      placeholder="e.g. Kami ingin melihat bagaimana sistem memvalidasi akad IMBT dan memisahkan janji Wa'd..."
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2 shadow-sm" disabled={loading}>
                    <Calendar className="h-4 w-4" />
                    <span>{loading ? "Menjadwalkan Sesi..." : "Konfirmasi Jadwal Demo"}</span>
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

