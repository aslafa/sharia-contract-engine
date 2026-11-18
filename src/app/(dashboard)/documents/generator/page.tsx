"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/enterprise/page-header";
import { useSession } from "@/lib/hooks/use-session";
import { ReadOnlyPanel } from "@/components/enterprise/access-notice";
import { AkadCategory } from "@/types/akad";
import { generateLegalContractText, ContractTemplateData } from "@/lib/contracts/templates";
import { SCELogo } from "@/components/brand/sce-logo";
import { formatIDR } from "@/lib/utils";
import {
  FileText,
  Printer,
  Download,
  History,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Save,
  Send,
  Eye,
  Edit3,
  Copy,
  Check,
} from "lucide-react";

interface ContractVersionItem {
  version: string;
  timestamp: string;
  author: string;
  summary: string;
  content: string;
}

export default function ContractGeneratorPage() {
  const [akadType, setAkadType] = React.useState<AkadCategory>("MURABAHAH");
  const [customerName, setCustomerName] = React.useState("PT Berkah Logistik Nusantara");
  const [customerIdentity, setCustomerIdentity] = React.useState("NIB: 9120004318892");
  const [customerAddress, setCustomerAddress] = React.useState("Kawasan Industri Pulogadung Blok B No. 14, Jakarta Timur");
  const [contractNumber, setContractNumber] = React.useState("SCE/2026/MRB/00142");
  const [nominalAmount, setNominalAmount] = React.useState<number>(450000000);
  const [profitMargin, setProfitMargin] = React.useState<number>(67500000);
  const [downPayment, setDownPayment] = React.useState<number>(51750000);
  const [tenorMonths, setTenorMonths] = React.useState<number>(36);
  const [commodityDescription, setCommodityDescription] = React.useState("1 Unit Truk Isuzu Giga FVR 34P 285 PS");

  // Template Data Builder
  const templateData: ContractTemplateData = React.useMemo(() => {
    const monthlyInstallment = Math.round(
      (nominalAmount + profitMargin - downPayment) / Math.max(1, tenorMonths)
    );

    return {
      institutionName: "BPRS Al-Barakah Mandiri",
      institutionAddress: "Gedung Menara Syariah Lt. 8, Jl. H.R. Rasuna Said, Jakarta Selatan",
      authorizedSignerName: "H. Muhammad Zulkarnain, S.E., M.Si.",
      authorizedSignerTitle: "Direktur Pembiayaan & Kepatuhan",
      customerName,
      customerIdentityNumber: customerIdentity,
      customerAddress,
      contractNumber,
      contractDate: "14 November 2026",
      nominalAmount,
      tenorMonths,
      akadType,
      costPrice: nominalAmount,
      profitMargin,
      downPayment,
      monthlyInstallment,
      commodityDescription,
      ujrahAmount: 14500000,
      isImbt: true,
      transferMethod: "HIBAH",
      institutionNisbah: 45,
      partnerNisbah: 55,
      businessScope: "Logistik & Transportasi Komersial",
    };
  }, [
    akadType,
    customerName,
    customerIdentity,
    customerAddress,
    contractNumber,
    nominalAmount,
    profitMargin,
    downPayment,
    tenorMonths,
    commodityDescription,
  ]);

  // Live editable contract document text
  const [editableDocument, setEditableDocument] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<"editor" | "preview" | "history">("preview");
  const [copied, setCopied] = React.useState(false);

  // Version History State
  const [versions, setVersions] = React.useState<ContractVersionItem[]>([
    {
      version: "v1.0",
      timestamp: "14 Nov 2026, 10:15 WIB",
      author: "Budi Santoso (Account Officer)",
      summary: "Inisiasi draf awal kontrak Murabahah dari parameter pengajuan nasabah.",
      content: generateLegalContractText(templateData),
    },
  ]);

  // Auto regenerate when templateData changes if user hasn't heavily customized
  React.useEffect(() => {
    const generated = generateLegalContractText(templateData);
    setEditableDocument(generated);
  }, [templateData]);

  // Handle Save New Version
  const handleSaveRevision = () => {
    const nextVer = `v1.${versions.length}`;
    const newVer: ContractVersionItem = {
      version: nextVer,
      timestamp: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB",
      author: "Legal Officer (Penelaah)",
      summary: `Pembaruan klausul pasal dan penyesuaian nominal (${nextVer}).`,
      content: editableDocument,
    };
    setVersions([newVer, ...versions]);
  };

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  // Tahap 3B.5 — simpan kontrak = POST /api/v1/contracts (contracts:create).
  const { loading: sessionLoading, can } = useSession();
  const canCreateContract = can("contracts:create");
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const handleSaveToDatabase = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          akadCategory: akadType,
          title: `Perjanjian Pembiayaan Akad ${akadType} - ${customerName}`,
          customerName,
          objectDescription: commodityDescription,
          nominalValue: nominalAmount,
          tenorMonths,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        handleSaveRevision();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else if (res.status === 403) {
        setSaveError(
          "403 — Akses ditolak: peran Anda tidak memiliki izin 'contracts:create'. Gunakan menu Cetak/Ekspor PDF untuk dokumentasi, atau minta Financing Officer / Administrator untuk menyimpan draf kontrak ini."
        );
      } else if (res.status === 401) {
        setSaveError("Sesi Anda telah berakhir. Silakan login kembali untuk menyimpan kontrak.");
      } else {
        setSaveError(json?.error?.message || "Gagal menyimpan kontrak ke database.");
      }
    } catch (e) {
      console.error(e);
      setSaveError("Tidak dapat menghubungi server. Periksa koneksi jaringan Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <div className="p-3.5 bg-[#16A36A] text-white text-xs font-bold rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>✓ Berkas draf kontrak berhasil disimpan ke database dan tercatat dalam versi dokumen!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#172B4D] text-xs font-semibold rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-[#DC3545] shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Tahap 3B.5 — mode baca saja bagi peran tanpa contracts:create */}
      {!sessionLoading && !canCreateContract && (
        <ReadOnlyPanel
          message="Peran Anda tidak memiliki izin 'contracts:create', sehingga tombol 'Simpan Draf Kontrak' tidak tersedia. Penyimpanan kontrak ke database tetap diverifikasi ulang oleh backend (POST /api/v1/contracts)."
          hint="Anda tetap dapat menyusun klausul, meninjau pratinjau, mencetak, dan menyalin naskah kontrak."
        />
      )}

      <PageHeader
        title="Generator & Editor Kontrak Akad Dinamis"
        description="Penyusunan naskah hukum perjanjian pembiayaan syariah otomatis, penyesuaian klausul khusus, pratinjau siap cetak, dan rekam riwayat revisi (versioning)."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Brankas Dokumen", href: "/documents" },
          { label: "Contract Generator" },
        ]}
        badge={
          <Badge variant="warning" dot>
            Status: DRAFT (Belum Disahkan)
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            {(!sessionLoading && canCreateContract) && (
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={handleSaveToDatabase}
                className="font-semibold text-xs text-[#00549c] border-[#00549c]/30 hover:bg-[#00549c]/5"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                {isSaving ? "Menyimpan..." : "Simpan Draf Kontrak"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-1 text-[#00549c]" />
              Cetak / Ekspor PDF
            </Button>
            <Link href="/approvals">
              <Button variant="primary" size="sm">
                <Send className="h-3.5 w-3.5 mr-1" />
                Ajukan ke Alur Persetujuan
              </Button>
            </Link>
          </div>
        }
      />

      {/* TOP CONTROLS: AKAD SELECTOR & VIEW TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(["MURABAHAH", "IJARAH", "MUSYARAKAH", "MUDHARABAH"] as AkadCategory[]).map((akad) => (
            <button
              key={akad}
              type="button"
              onClick={() => setAkadType(akad)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                akadType === akad
                  ? "bg-[#00549c] text-white shadow-sm"
                  : "bg-white text-[#64748B] hover:bg-[#F5F8FC] border border-[#E2E8F0]"
              }`}
            >
              Akad {akad}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "bg-[#DCEAF5] text-[#00549c]"
                : "text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Pratinjau Dokumen Resmi
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
              activeTab === "editor"
                ? "bg-[#DCEAF5] text-[#00549c]"
                : "text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Editor Teks Klausul
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-[#DCEAF5] text-[#00549c]"
                : "text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Riwayat Revisi ({versions.length})
          </button>
        </div>
      </div>

      {/* WORKSPACE CONTENT */}
      {activeTab === "preview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: QUICK FORM PARAMETERS */}
          <Card className="lg:col-span-4 border-[#E2E8F0] h-fit">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-xs uppercase font-bold text-[#64748B]">
                Parameter Variabel Perjanjian
              </CardTitle>
              <CardDescription className="text-xs">
                Ubah isian data untuk memperbarui dokumen secara dinamis.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nomor Kontrak</label>
                <Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nama Nasabah / Mitra</label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nomor Identitas (NIK/NIB)</label>
                <Input value={customerIdentity} onChange={(e) => setCustomerIdentity(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Objek / Komoditas Pembiayaan</label>
                <Input value={commodityDescription} onChange={(e) => setCommodityDescription(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Plafon Pokok (Rp)</label>
                <Input type="number" value={nominalAmount} onChange={(e) => setNominalAmount(Number(e.target.value))} />
              </div>

              {akadType === "MURABAHAH" && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172B4D]">Marjin Keuntungan (Rp)</label>
                    <Input type="number" value={profitMargin} onChange={(e) => setProfitMargin(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172B4D]">Uang Muka / Urbun (Rp)</label>
                    <Input type="number" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Tenor Waktu (Bulan)</label>
                <Input type="number" value={tenorMonths} onChange={(e) => setTenorMonths(Number(e.target.value))} />
              </div>

              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="w-full text-xs">
                  {copied ? <Check className="h-3.5 w-3.5 mr-1 text-[#16A36A]" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "Naskah Tersalin" : "Salin Seluruh Naskah"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: OFFICIAL LEGAL DOCUMENT PAPER PREVIEW */}
          <div className="lg:col-span-8 flex justify-center">
            <Card className="w-full max-w-[820px] border border-slate-300 shadow-xs bg-white relative overflow-hidden print:shadow-none print:border-none rounded-sm">
              {/* WATERMARK DRAFT */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-[0.04] rotate-[-25deg]">
                <span className="text-7xl font-black uppercase tracking-widest text-[#00549c]">
                  DRAFT AKAD SYARIAH
                </span>
              </div>

              <CardContent className="p-8 sm:p-12 space-y-6 text-[#172B4D] relative z-20 leading-relaxed text-xs sm:text-sm">
                {/* OFFICIAL HEADER KOP SURAT */}
                <div className="flex items-center justify-between border-b-2 border-[#00549c] pb-4 select-none">
                  <div className="space-y-1">
                    <SCELogo size="sm" showTagline={false} />
                    <p className="text-[10px] font-mono text-slate-500 font-semibold tracking-wider uppercase">
                      Sharia Banking Legal Instrument
                    </p>
                  </div>
                  <div className="text-right text-[11px] font-sans text-[#64748B]">
                    <p className="font-bold text-[#00549c] text-xs">PT BPRS AL-BARAKAH MANDIRI</p>
                    <p className="text-[10px] text-slate-600">Izin Operasional Otoritas Jasa Keuangan No. KEP-109/D.03/2020</p>
                    <p className="text-[10px] text-slate-500">Anggota Penjaminan LPS • Terdaftar &amp; Diawasi OJK</p>
                  </div>
                </div>

                {/* DOCUMENT BODY */}
                <div className="whitespace-pre-line font-serif text-[12px] sm:text-[13px] leading-relaxed text-slate-900 bg-white p-2">
                  {editableDocument}
                </div>

                {/* SIGNATURE BLOCKS (RUKUN PARATERTANDATANGAN) */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs select-none">
                  <div className="space-y-12">
                    <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">PIHAK PERTAMA (BANK)</p>
                    <div>
                      <div className="w-32 border-b border-slate-700 mx-auto" />
                      <p className="font-bold text-slate-900 text-[11px] mt-1.5">{templateData.authorizedSignerName}</p>
                      <p className="text-[10px] text-slate-500">{templateData.authorizedSignerTitle}</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">PIHAK KEDUA (NASABAH)</p>
                    <div>
                      <div className="w-32 border-b border-slate-700 mx-auto" />
                      <p className="font-bold text-slate-900 text-[11px] mt-1.5">{customerName}</p>
                      <p className="text-[10px] text-slate-500">{customerIdentity}</p>
                    </div>
                  </div>

                  <div className="space-y-12 col-span-2 sm:col-span-1">
                    <p className="font-bold text-[#00549c] text-[11px] uppercase tracking-wider">DEWAN PENGAWAS SYARIAH</p>
                    <div>
                      <div className="w-32 border-b border-dashed border-[#00549c] mx-auto" />
                      <p className="font-bold text-slate-900 text-[11px] mt-1.5">K.H. Ridwan Mansur, M.A.</p>
                      <p className="text-[10px] text-slate-500">Sertifikasi Fatwa DSN-MUI</p>
                    </div>
                  </div>
                </div>

                {/* FOOTER NOTICE */}
                <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 font-sans flex flex-col sm:flex-row items-center justify-between gap-1">
                  <span>Dokumen sah digital • Sharia Contract Engine (SCE) • Enkripsi SHA-256</span>
                  <span className="font-mono font-bold text-[#00549c]">KODE REGISTER: {contractNumber}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: IN-BROWSER DOCUMENT EDITOR */}
      {activeTab === "editor" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-[#172B4D]">
                Editor Naskah Klausul Khusus Perjanjian
              </CardTitle>
              <CardDescription className="text-xs">
                Ubah redaksi pasal atau tambahkan syarat khusus sesuai arahan komite legal/DPS.
              </CardDescription>
            </div>

            <Button variant="primary" size="sm" onClick={handleSaveRevision} className="text-xs font-bold">
              <Save className="h-3.5 w-3.5 mr-1" />
              Simpan Sebagai Versi Baru
            </Button>
          </CardHeader>

          <CardContent className="p-4">
            <textarea
              rows={26}
              value={editableDocument}
              onChange={(e) => setEditableDocument(e.target.value)}
              className="w-full rounded-md border border-[#E2E8F0] p-4 font-mono text-xs text-[#172B4D] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#00549c]"
            />
          </CardContent>
        </Card>
      )}

      {/* TAB 3: VERSION HISTORY */}
      {activeTab === "history" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#172B4D]">
              Riwayat Revisi Dokumen Kontrak (Version History)
            </CardTitle>
            <CardDescription className="text-xs">
              Audit trail setiap perubahan redaksi klausul perjanjian sebelum diajukan ke komite.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Versi</th>
                  <th className="px-4 py-3">Waktu Pembaruan</th>
                  <th className="px-4 py-3">Petugas / Jabatan</th>
                  <th className="px-4 py-3">Catatan Perubahan</th>
                  <th className="px-4 py-3 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {versions.map((v, idx) => (
                  <tr key={idx} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 font-mono font-bold text-[#00549c]">
                      {v.version}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] font-mono">{v.timestamp}</td>
                    <td className="px-4 py-3 font-bold text-[#172B4D]">{v.author}</td>
                    <td className="px-4 py-3 text-[#172B4D]">{v.summary}</td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditableDocument(v.content);
                          setActiveTab("preview");
                        }}
                        className="h-7 text-xs text-[#00549c]"
                      >
                        Pulihkan Versi Ini
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

