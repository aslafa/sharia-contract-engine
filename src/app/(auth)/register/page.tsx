"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  UserCheck,
  PackageCheck,
  FileCheck2,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Identitas Institusi", icon: Building2 },
  { id: 2, title: "Penanggung Jawab", icon: UserCheck },
  { id: 3, title: "Kebutuhan Produk", icon: PackageCheck },
  { id: 4, title: "Dokumen Legalitas", icon: FileCheck2 },
  { id: 5, title: "Tinjau & Kirim", icon: ClipboardCheck },
];

export default function RegisterWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form State
  const [formData, setFormData] = React.useState({
    // Step 1: Institution Info
    institutionType: "BPRS",
    institutionName: "",
    legalEntityNumber: "",
    businessLicense: "",
    officialEmail: "",
    phone: "",
    officeAddress: "",
    city: "Jakarta Selatan",
    province: "DKI Jakarta",

    // Step 2: Authorized Representative
    repFullName: "",
    repPosition: "",
    repEmail: "",
    repPhone: "",

    // Step 3: Product Requirements
    requiredAkadModules: ["MURABAHAH", "IJARAH", "MUSYARAKAH", "MUDHARABAH"],
    preferredSubscription: "PROFESSIONAL",
    estimatedMonthlyVolume: 100,

    // Step 4: Documents (simulated file metadata)
    documents: [
      { category: "AKTA_PENDIRIAN", fileName: "Akta_Pendirian_Lembaga.pdf", fileSizeBytes: 1850000, sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" },
      { category: "IZIN_USAHA", fileName: "Izin_Operasional_OJK.pdf", fileSizeBytes: 1420000, sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" },
      { category: "SURAT_KUASA", fileName: "Surat_Kuasa_Perwakilan_Resmi.pdf", fileSizeBytes: 750000, sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a" },
    ],

    // Step 5: Compliance Acknowledgement
    shariaDeclarationAgreed: true,
  });

  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.institutionName.trim()) errors.institutionName = "Nama institusi wajib diisi.";
      if (!formData.legalEntityNumber.trim()) errors.legalEntityNumber = "Nomor akta pendirian/AHU wajib diisi.";
      if (!formData.businessLicense.trim()) errors.businessLicense = "Nomor izin OJK / Kemenkop wajib diisi.";
      if (!formData.officialEmail.trim() || !formData.officialEmail.includes("@")) {
        errors.officialEmail = "Email resmi institusi harus valid.";
      }
      if (!formData.phone.trim()) errors.phone = "Nomor telepon kantor wajib diisi.";
      if (!formData.officeAddress.trim()) errors.officeAddress = "Alamat kantor pusat wajib diisi.";
    }

    if (step === 2) {
      if (!formData.repFullName.trim()) errors.repFullName = "Nama penanggung jawab wajib diisi.";
      if (!formData.repPosition.trim()) errors.repPosition = "Jabatan perwakilan resmi wajib diisi.";
      if (!formData.repEmail.trim() || !formData.repEmail.includes("@")) {
        errors.repEmail = "Email resmi penanggung jawab harus valid.";
      }
      if (!formData.repPhone.trim()) errors.repPhone = "Nomor handphone penanggung jawab wajib diisi.";
    }

    if (step === 3) {
      if (formData.requiredAkadModules.length === 0) {
        errors.requiredAkadModules = "Pilih minimal 1 modul akad syariah yang dibutuhkan.";
      }
    }

    if (step === 5) {
      if (!formData.shariaDeclarationAgreed) {
        errors.shariaDeclarationAgreed = "Wajib menyetujui komitmen kepatuhan Fiqh Muamalah DSN-MUI.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setErrorMessage(null);
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleAkadModule = (moduleKey: string) => {
    setFormData((prev) => {
      const exists = prev.requiredAkadModules.includes(moduleKey);
      const nextModules = exists
        ? prev.requiredAkadModules.filter((m) => m !== moduleKey)
        : [...prev.requiredAkadModules, moduleKey];
      return { ...prev, requiredAkadModules: nextModules };
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/onboarding/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Gagal mengirimkan pendaftaran.");
      }

      // Navigate to real-time status tracker
      const regId = data.data?.registration?.id || "REG-SAMPLE-001";
      router.push(`/onboarding/status/${regId}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan saat pendaftaran.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Badge variant="neutral" className="mb-2">
          Pendaftaran B2B SaaS Terakreditasi
        </Badge>
        <h2 className="text-xl font-bold tracking-tight text-[#172B4D]">
          Pendaftaran Lembaga Keuangan Syariah
        </h2>
        <p className="mt-1 text-xs text-[#64748B]">
          Lengkapi formulir 5 langkah untuk menerbitkan lingkungan kerja multi-tenant terisolasi SHARIA CONTRACT ENGINE.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-5 gap-2 pb-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                isCurrent
                  ? "bg-[#DCEAF5]/50 border-[#00549c]"
                  : isCompleted
                  ? "bg-[#F5F8FC] border-[#16A36A]/40 text-[#16A36A]"
                  : "bg-white border-[#E2E8F0] opacity-60"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                  isCurrent
                    ? "bg-[#00549c] text-white"
                    : isCompleted
                    ? "bg-[#16A36A] text-white"
                    : "bg-[#E2E8F0] text-[#64748B]"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              <span className="text-[11px] font-semibold text-[#172B4D] hidden sm:inline truncate w-full">
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="p-3 bg-[#DC3545]/10 border border-[#DC3545]/20 rounded-md flex items-center gap-2 text-xs text-[#DC3545]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Institution Info */}
      {currentStep === 1 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3 border-b border-[#E2E8F0]">
            <CardTitle className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#00549c]" />
              Langkah 1: Identitas & Legalitas Lembaga
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Kategori Lembaga *</label>
                <Select
                  value={formData.institutionType}
                  onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                >
                  <option value="ISLAMIC_BANK">Bank Umum Syariah (BUS)</option>
                  <option value="ISLAMIC_BUSINESS_UNIT">Unit Usaha Syariah (UUS)</option>
                  <option value="BPRS">Bank Perekonomian Rakyat Syariah (BPRS)</option>
                  <option value="ISLAMIC_COOPERATIVE">Koperasi Syariah (KSPPS)</option>
                  <option value="BMT">Baitul Maal wat Tamwil (BMT)</option>
                  <option value="ISLAMIC_FINTECH">Fintech Syariah</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nama Resmi Institusi *</label>
                <Input
                  placeholder="e.g. PT BPRS Al-Barakah Mandiri Sejahtera"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  error={Boolean(validationErrors.institutionName)}
                />
                {validationErrors.institutionName && (
                  <p className="text-[10px] text-[#DC3545]">{validationErrors.institutionName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nomor Akta / SK Kemenkumham (AHU) *</label>
                <Input
                  placeholder="AHU-0012398.AH.01.02.TAHUN.2021"
                  value={formData.legalEntityNumber}
                  onChange={(e) => setFormData({ ...formData, legalEntityNumber: e.target.value })}
                  error={Boolean(validationErrors.legalEntityNumber)}
                />
                {validationErrors.legalEntityNumber && (
                  <p className="text-[10px] text-[#DC3545]">{validationErrors.legalEntityNumber}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nomor Izin Operasional OJK / Kemenkop *</label>
                <Input
                  placeholder="KEP-44/D.03/2021 atau No. Induk Koperasi"
                  value={formData.businessLicense}
                  onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                  error={Boolean(validationErrors.businessLicense)}
                />
                {validationErrors.businessLicense && (
                  <p className="text-[10px] text-[#DC3545]">{validationErrors.businessLicense}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Email Resmi Institusi *</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                  <Input
                    type="email"
                    placeholder="sekretariat@bprs-albarakah.co.id"
                    className="pl-9"
                    value={formData.officialEmail}
                    onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    error={Boolean(validationErrors.officialEmail)}
                  />
                </div>
                {validationErrors.officialEmail && (
                  <p className="text-[10px] text-[#DC3545]">{validationErrors.officialEmail}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nomor Telepon Kantor *</label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                  <Input
                    placeholder="+62 21 8291 0022"
                    className="pl-9"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={Boolean(validationErrors.phone)}
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-[10px] text-[#DC3545]">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#172B4D]">Alamat Kantor Pusat *</label>
              <div className="relative">
                <MapPin className="h-4 w-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                <Input
                  placeholder="Gedung Menara Syariah Lt. 8, Jl. TB Simatupang No. 45"
                  className="pl-9"
                  value={formData.officeAddress}
                  onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                  error={Boolean(validationErrors.officeAddress)}
                />
              </div>
              {validationErrors.officeAddress && (
                <p className="text-[10px] text-[#DC3545]">{validationErrors.officeAddress}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Authorized Representative */}
      {currentStep === 2 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3 border-b border-[#E2E8F0]">
            <CardTitle className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#00549c]" />
              Langkah 2: Data Penanggung Jawab Berwenang (PIC)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-xs">
            <div className="p-3 bg-[#DCEAF5]/30 border border-[#DCEAF5] rounded-lg text-[#172B4D]">
              <p className="font-semibold text-xs">Ketentuan Penanggung Jawab:</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Perwakilan resmi yang didaftarkan harus memiliki wewenang hukum (Direksi, Pimpinan Cabang, atau Kuasa Direksi) untuk menandatangani Nota Kesepahaman implementasi SaaS.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nama Lengkap & Gelar *</label>
                <Input
                  placeholder="e.g. Drs. H. Mulyadi Kartasasmita, M.M."
                  value={formData.repFullName}
                  onChange={(e) => setFormData({ ...formData, repFullName: e.target.value })}
                  error={Boolean(validationErrors.repFullName)}
                />
                {validationErrors.repFullName && (
                  <p className="text-[10px] text-[#DC3545]">{validationErrors.repFullName}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Jabatan Resmi *</label>
                <Input
                  placeholder="Direktur Utama / Direktur Kepatuhan"
                  value={formData.repPosition}
                  onChange={(e) => setFormData({ ...formData, repPosition: e.target.value })}
                  error={Boolean(validationErrors.repPosition)}
                />
                {validationErrors.repPosition && (
                  <p className="text-[10px] text-[#DC3545]">{validationErrors.repPosition}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Email Kerja PIC *</label>
                <Input
                  type="email"
                  placeholder="mulyadi@bprs-albarakah.co.id"
                  value={formData.repEmail}
                  onChange={(e) => setFormData({ ...formData, repEmail: e.target.value })}
                  error={Boolean(validationErrors.repEmail)}
                />
                {validationErrors.repEmail && (
                  <p className="text-[10px] text-[#DC3545]">{validationErrors.repEmail}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nomor HP / WhatsApp Resmi *</label>
                <Input
                  placeholder="+62 811 9876 5432"
                  value={formData.repPhone}
                  onChange={(e) => setFormData({ ...formData, repPhone: e.target.value })}
                  error={Boolean(validationErrors.repPhone)}
                />
                {validationErrors.repPhone && (
                  <p className="text-[10px] text-[#DC3545]">{validationErrors.repPhone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Product Requirements */}
      {currentStep === 3 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3 border-b border-[#E2E8F0]">
            <CardTitle className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-[#00549c]" />
              Langkah 3: Pemilihan Modul Akad & Paket Langganan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="space-y-2">
              <label className="font-semibold text-[#172B4D]">Modul Akad Syariah yang Dibutuhkan *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: "MURABAHAH", name: "Murabahah Engine", desc: "Jual beli dengan penetapan margin keuntungan transparan" },
                  { key: "IJARAH", name: "Ijarah & IMBT Engine", desc: "Sewa manfaat barang/jasa dan sewa beli perpindahan hak milik" },
                  { key: "MUSYARAKAH", name: "Musyarakah Engine", desc: "Kemitraan bagi hasil modal bersama (MMQ & Mutanaqisah)" },
                  { key: "MUDHARABAH", name: "Mudharabah Engine", desc: "Pembiayaan permodalan penuh dengan pembagian nisbah hasil usaha" },
                ].map((akad) => {
                  const selected = formData.requiredAkadModules.includes(akad.key);
                  return (
                    <div
                      key={akad.key}
                      onClick={() => toggleAkadModule(akad.key)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selected
                          ? "bg-[#DCEAF5]/40 border-[#00549c] ring-1 ring-[#00549c]"
                          : "bg-white border-[#E2E8F0] hover:bg-[#F5F8FC]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#172B4D]">{akad.name}</span>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {}}
                          className="h-4 w-4 text-[#00549c] rounded border-[#E2E8F0]"
                        />
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1">{akad.desc}</p>
                    </div>
                  );
                })}
              </div>
              {validationErrors.requiredAkadModules && (
                <p className="text-[10px] text-[#DC3545]">{validationErrors.requiredAkadModules}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Preferensi Paket Langganan</label>
                <Select
                  value={formData.preferredSubscription}
                  onChange={(e) => setFormData({ ...formData, preferredSubscription: e.target.value as any })}
                >
                  <option value="STARTER">Starter Tier (BMT & Koperasi)</option>
                  <option value="PROFESSIONAL">Professional Tier (BPRS & Fintech)</option>
                  <option value="ENTERPRISE">Institutional / Enterprise (BUS & UUS)</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Estimasi Volume Kontrak per Bulan</label>
                <Input
                  type="number"
                  min={10}
                  step={10}
                  value={formData.estimatedMonthlyVolume}
                  onChange={(e) => setFormData({ ...formData, estimatedMonthlyVolume: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Supporting Documents */}
      {currentStep === 4 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3 border-b border-[#E2E8F0]">
            <CardTitle className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-[#00549c]" />
              Langkah 4: Unggah Dokumen Legalitas & Integritas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-xs">
            <p className="text-[#64748B]">
              Unggah pindaian dokumen sah untuk ditelaah oleh Tim Kepatuhan SCE. Setiap berkas dienkripsi dengan SHA-256 integrity hash.
            </p>

            <div className="space-y-2.5">
              {formData.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-[#00549c]" />
                    <div>
                      <p className="font-semibold text-[#172B4D]">{doc.fileName}</p>
                      <p className="text-[10px] text-[#64748B]">
                        Kategori: {doc.category} • Hash: {doc.sha256.slice(0, 16)}...
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Tervalidasi SHA-256</Badge>
                </div>
              ))}
            </div>

            <div className="p-4 border-2 border-dashed border-[#CBD5E1] rounded-lg text-center hover:bg-[#F5F8FC] transition-colors cursor-pointer">
              <Upload className="h-6 w-6 text-[#00549c] mx-auto mb-1" />
              <p className="font-semibold text-[#172B4D]">Seret berkas dokumen tambahan atau klik untuk memilih</p>
              <p className="text-[10px] text-[#64748B]">Format yang didukung: PDF, PNG, JPG (Maks. 10 MB)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Review & Submit */}
      {currentStep === 5 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3 border-b border-[#E2E8F0]">
            <CardTitle className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-[#00549c]" />
              Langkah 5: Tinjau Ringkasan & Konfirmasi Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="bg-[#F5F8FC] p-4 rounded-lg border border-[#E2E8F0] space-y-3">
              <h4 className="font-bold text-[#172B4D] text-xs uppercase tracking-wider">
                Ringkasan Pendaftaran Institusi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#64748B]">Nama Lembaga:</span>{" "}
                  <strong className="text-[#172B4D]">{formData.institutionName || "-"}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Kategori:</span>{" "}
                  <strong className="text-[#172B4D]">{formData.institutionType}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Nomor Izin OJK:</span>{" "}
                  <strong className="text-[#172B4D]">{formData.businessLicense || "-"}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Email Resmi:</span>{" "}
                  <strong className="text-[#172B4D]">{formData.officialEmail || "-"}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Perwakilan Resmi:</span>{" "}
                  <strong className="text-[#172B4D]">{formData.repFullName} ({formData.repPosition})</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Paket Langganan:</span>{" "}
                  <strong className="text-[#172B4D]">{formData.preferredSubscription}</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#64748B]">Modul Akad Terpilih:</span>{" "}
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.requiredAkadModules.map((m) => (
                    <Badge key={m} variant="info">{m}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Sharia Declaration Agreement */}
            <div className="p-3 bg-[#16A36A]/10 border border-[#16A36A]/30 rounded-lg flex items-start gap-2.5">
              <input
                type="checkbox"
                id="shariaDecl"
                checked={formData.shariaDeclarationAgreed}
                onChange={(e) => setFormData({ ...formData, shariaDeclarationAgreed: e.target.checked })}
                className="mt-0.5 h-4 w-4 text-[#16A36A] rounded border-[#CBD5E1]"
              />
              <label htmlFor="shariaDecl" className="text-[11px] text-[#172B4D] cursor-pointer">
                <strong>Pernyataan Integritas & Kepatuhan Syariah:</strong> Lembaga kami menyatakan bahwa seluruh data legalitas adalah sah dan berkomitmen menaati standar Fiqh Muamalah DSN-MUI, UU Perbankan Syariah, dan ketentuan regulasi OJK dalam seluruh penerbitan akad.
              </label>
            </div>
            {validationErrors.shariaDeclarationAgreed && (
              <p className="text-[10px] text-[#DC3545]">{validationErrors.shariaDeclarationAgreed}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            className="gap-2 text-xs"
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="gap-2 text-xs"
          >
            <span>Lanjutkan</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            className="gap-2 text-xs bg-[#16A36A] hover:bg-[#16A36A]/90 text-white"
            disabled={loading}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{loading ? "Menerbitkan Tiket Onboarding..." : "Kirim Pendaftaran Resmi"}</span>
          </Button>
        )}
      </div>

      <div className="text-center text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
        Sudah memiliki akun institusi terdaftar?{" "}
        <Link href="/login" className="font-semibold text-[#00549c] hover:underline">
          Masuk ke Portal Institusi
        </Link>
      </div>
    </div>
  );
}
