"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    institutionName: "",
    institutionType: "ISLAMIC_BANK",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = "Nama lengkap wajib diisi.";
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errs.email = "Email kantor tidak valid.";
    }
    if (!formData.institutionName.trim()) {
      errs.institutionName = "Nama institusi/lembaga wajib diisi.";
    }
    if (!formData.message.trim()) {
      errs.message = "Pesan atau kebutuhan institusi wajib diisi.";
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
        <Badge variant="default">Hubungi Kami</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B4D]">
          Konsultasikan Kebutuhan Kontrak Syariah Anda
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Tim arsitek solusi dan konsultan hukum syariah kami siap membantu mendiskusikan integrasi, kustomisasi akad, dan rencana deployment untuk institusi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
        {/* Contact Info (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-[#F5F8FC] border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="text-sm text-[#172B4D]">Kantor Pusat Operasional</CardTitle>
              <CardDescription className="text-xs">
                Layanan konsultasi enterprise dan dukungan teknis B2B
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#00549c] shrink-0 mt-0.5" />
                <div className="text-[#172B4D] leading-relaxed">
                  <strong>Sharia Financial Center Indonesia</strong>
                  <br />
                  Menara Syariah Lt. 18, Kawasan Mega Kuningan, Jakarta Selatan 12950
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#00549c] shrink-0" />
                <span className="text-[#172B4D]">kontak@shariacontract.id</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#00549c] shrink-0" />
                <span className="text-[#172B4D] font-mono">+62 (21) 5088-9200</span>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-[#E2E8F0]">
                <Clock className="h-4 w-4 text-[#64748B] shrink-0" />
                <span className="text-[#64748B]">Senin - Jumat: 08:30 - 17:30 WIB</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00549c]">
                SLA Respons Cepat
              </span>
              <p className="text-xs text-[#172B4D] font-semibold">
                Dukungan Konsultasi Prioritas
              </p>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Permintaan informasi produk dan demo akan ditanggapi oleh Sharia Solution Specialist dalam waktu maksimal 4 jam kerja.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form (Right) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#172B4D]">
                Kirimkan Pesan atau Pertanyaan
              </CardTitle>
              <CardDescription className="text-xs">
                Isi formulir di bawah ini dan kami akan segera menghubungi Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="p-8 text-center space-y-3 bg-[#16A36A]/10 border border-[#16A36A]/20 rounded-lg">
                  <CheckCircle2 className="h-10 w-10 text-[#16A36A] mx-auto" />
                  <h3 className="text-base font-bold text-[#172B4D]">Pesan Anda Berhasil Terkirim</h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                    Terima kasih telah menghubungi SHARIA CONTRACT ENGINE. Tim kami telah menerima pesan Anda dan akan menghubungi email <strong>{formData.email}</strong> sesegera mungkin.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        fullName: "",
                        email: "",
                        institutionName: "",
                        institutionType: "ISLAMIC_BANK",
                        phone: "",
                        message: "",
                      });
                    }}
                    className="mt-2"
                  >
                    Kirim Pesan Lainnya
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Nama Lengkap *</label>
                      <Input
                        placeholder="e.g. Ir. H. Ahmad Zaki"
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
                        placeholder="nama@bank-syariah.co.id"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        error={Boolean(errors.email)}
                      />
                      {errors.email && <p className="text-[10px] text-[#DC3545]">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#172B4D]">Nama Lembaga / Institusi *</label>
                      <Input
                        placeholder="e.g. BPRS Al-Barakah Mandiri"
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

                  <div className="space-y-1">
                    <label className="font-semibold text-[#172B4D]">Nomor Telepon / WhatsApp</label>
                    <Input
                      placeholder="+62 812-xxxx-xxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#172B4D]">Pesan atau Kebutuhan Spesifik *</label>
                    <Textarea
                      placeholder="Jelaskan volume akad saat ini, kebutuhan modul, atau integrasi core banking yang diinginkan..."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      error={Boolean(errors.message)}
                    />
                    {errors.message && <p className="text-[10px] text-[#DC3545]">{errors.message}</p>}
                  </div>

                  <Button type="submit" className="w-full gap-2 shadow-sm" disabled={loading}>
                    <Send className="h-4 w-4" />
                    <span>{loading ? "Mengirimkan Pesan..." : "Kirimkan Formulir"}</span>
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

