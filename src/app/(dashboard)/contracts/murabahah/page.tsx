"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/enterprise/page-header";
import {
  calculateMurabahah,
  validateMurabahahCompliance,
  MurabahahCalculationResult,
  MurabahahShariaChecklist,
} from "@/lib/akad/murabahah";
import { formatIDR } from "@/lib/utils";
import { CustomerPicker, SelectedCustomer } from "@/components/contracts/customer-picker";
import { SectionCard, FormField } from "@/components/contracts/section-card";
import { useSession } from "@/lib/hooks/use-session";
import { AccessDeniedPanel, ReadOnlyPanel } from "@/components/enterprise/access-notice";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Calculator,
  ShieldCheck,
  Building,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Receipt,
  Truck,
  FileText,
  BadgeAlert,
  ChevronRight,
  Info,
  Loader2,
  ExternalLink,
  X,
  Clock,
  User,
  Hash,
} from "lucide-react";

interface MurabahahContractItem {
  id: string;
  applicationNumber: string;
  customerName: string;
  customerIdNumber?: string;
  customerPhone?: string;
  customerEmail?: string;
  /** Tahap 3B.2/3B.4 — referensi ringkas dari direktori (opsional, legacy = null). */
  customer?: {
    id: string;
    cifNumber: string;
    name: string;
    riskRating: string;
    amlStatus: string;
    isVerified: boolean;
  } | null;
  commodityOrAsset: string;
  supplierName?: string;
  costPrice: number;
  marginOrNisbah: number;
  sellingPrice: number;
  downPayment: number;
  tenorMonths: number;
  monthlyInstallment: number;
  ownershipVerified: boolean;
  shariaStatus: "PASS" | "REVIEW" | "BLOCKED";
  status: string;
  statusLabel: string;
  currentStage: string;
  createdAt: string;
  submittedAt?: string;
  notes?: string;
}

export default function MurabahahEnginePage() {
  // Tahap 3B.5 — permission gating dari sesi aktif (server tetap otoritas).
  const { loading: sessionLoading, can } = useSession();
  const canView = can("contracts:view");
  const canCreate = can("contracts:create");

  const [activeTab, setActiveTab] = React.useState<"list" | "create" | "verification" | "schedule">("list");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Server state
  const [applications, setApplications] = React.useState<MurabahahContractItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Selected for Detail Modal
  const [selectedApp, setSelectedApp] = React.useState<MurabahahContractItem | null>(null);

  // Create Application Form State
  const [costPrice, setCostPrice] = React.useState<number>(300000000);
  const [profitMargin, setProfitMargin] = React.useState<number>(45000000);
  const [downPayment, setDownPayment] = React.useState<number>(30000000);
  const [tenorMonths, setTenorMonths] = React.useState<number>(24);
  // Tahap 3B.4 — profil nasabah diambil dari direktori via CustomerPicker.
  // Tidak ada lagi default nasabah dummy / input manual profil.
  const [selectedCustomer, setSelectedCustomer] = React.useState<SelectedCustomer | null>(null);
  const [commodityDescription, setCommodityDescription] = React.useState("1 Unit Mesin Cetak Offset 4 Warna Heidelberg");
  const [supplierName, setSupplierName] = React.useState("PT Heidelberg Indonesia");
  const [formNotes, setFormNotes] = React.useState("Pengajuan investasi peremajaan mesin percetakan.");

  // Sharia Verification Checklist State
  const [checklist, setChecklist] = React.useState<MurabahahShariaChecklist>({
    isCommodityHalal: true,
    isCostPriceDisclosed: true,
    isBankOwnershipVerified: true,
    hasSeparatePurchaseInvoice: true,
    hasDeliveryOrderOrBast: true,
    isWakalahExecutedFirst: true,
  });

  // Fetch applications from real database API
  const fetchApplications = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/applications?akad=MURABAHAH");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setApplications(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat aplikasi murabahah:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Calculate Murabahah result in real-time
  const calcResult: MurabahahCalculationResult = React.useMemo(() => {
    return calculateMurabahah({
      costPrice: costPrice || 0,
      profitMargin: profitMargin || 0,
      downPaymentUrbun: downPayment || 0,
      tenorMonths: tenorMonths > 0 ? tenorMonths : 1,
    });
  }, [costPrice, profitMargin, downPayment, tenorMonths]);

  // Evaluate Sharia Compliance in real-time
  const complianceResult = React.useMemo(() => {
    return validateMurabahahCompliance(checklist);
  }, [checklist]);

  // Tahap 3B.4 — payload dibentuk oleh SATU fungsi agar draft & submit selalu
  // konsisten dan keduanya wajib membawa customerId dari CustomerPicker.
  const buildPayload = (customer: SelectedCustomer, submitImmediately: boolean) => ({
    akad: "MURABAHAH" as const,
    title: `Pembiayaan Murabahah - ${commodityDescription}`,
    customerId: customer.id,
    commodityOrAsset: commodityDescription,
    supplierName,
    costPrice,
    marginOrNisbah: profitMargin,
    sellingPrice: calcResult.sellingPrice,
    downPayment,
    tenorMonths,
    submitImmediately,
    notes: formNotes,
  });

  // Tahap 3B.4 — pesan khusus untuk penolakan backend terkait customer.
  const customerAwareErrorMessage = (json: any, fallback: string): string => {
    const code = json?.error?.code;
    if (code === "CUSTOMER_AML_BLOCKED") {
      return "Nasabah terpilih berstatus AML FLAGGED dan tidak dapat digunakan untuk pengajuan baru. Silakan pilih nasabah lain.";
    }
    if (code === "CUSTOMER_NOT_FOUND") {
      return "Nasabah yang dipilih tidak lagi tersedia pada direktori. Silakan pilih ulang nasabah.";
    }
    if (code === "CUSTOMER_CROSS_TENANT_ACCESS") {
      return "Nasabah yang dipilih bukan milik tenant lembaga Anda. Pilih nasabah dari direktori lembaga Anda sendiri.";
    }
    return json?.error?.message || fallback;
  };

  // Handle Save Draft
  const handleSaveDraft = async () => {
    if (!selectedCustomer) {
      setAlertMessage({
        type: "error",
        text: "Pilih nasabah terdaftar terlebih dahulu — setiap pengajuan wajib terhubung ke direktori Customer Management.",
      });
      return;
    }
    if (!commodityDescription.trim() || costPrice <= 0) {
      setAlertMessage({ type: "error", text: "Deskripsi komoditas barang dan harga pokok wajib diisi." });
      return;
    }

    try {
      setIsSubmitting(true);
      setAlertMessage(null);
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(selectedCustomer, false)),
      });

      const json = await res.json();
      if (json.success) {
        setAlertMessage({ type: "success", text: `Draf pengajuan no ${json.data.applicationNumber} berhasil disimpan ke database!` });
        await fetchApplications();
        setActiveTab("list");
      } else {
        setAlertMessage({ type: "error", text: customerAwareErrorMessage(json, "Gagal menyimpan draf.") });
      }
    } catch (err: any) {
      setAlertMessage({ type: "error", text: err.message || "Terjadi kesalahan jaringan." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Submit Application
  const handleSubmitApplication = async () => {
    if (!selectedCustomer) {
      setAlertMessage({
        type: "error",
        text: "Pilih nasabah terdaftar terlebih dahulu — setiap pengajuan wajib terhubung ke direktori Customer Management.",
      });
      return;
    }
    if (!commodityDescription.trim() || costPrice <= 0) {
      setAlertMessage({ type: "error", text: "Lengkapi deskripsi objek akad dan harga pokok." });
      return;
    }

    if (!checklist.isCommodityHalal || !checklist.isCostPriceDisclosed) {
      setAlertMessage({ type: "error", text: "Rukun Murabahah belum lengkap: Komoditas harus halal dan harga pokok wajib diungkapkan secara transparan." });
      return;
    }

    try {
      setIsSubmitting(true);
      setAlertMessage(null);
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(selectedCustomer, true)),
      });

      const json = await res.json();
      if (json.success) {
        setAlertMessage({
          type: "success",
          text: `Aplikasi ${json.data.applicationNumber} berhasil diajukan resmi! Notifikasi peninjauan telah diteruskan ke Legal Officer.`,
        });
        await fetchApplications();
        setActiveTab("list");
      } else {
        setAlertMessage({ type: "error", text: customerAwareErrorMessage(json, "Gagal mengajukan pembiayaan.") });
      }
    } catch (err: any) {
      setAlertMessage({ type: "error", text: err.message || "Terjadi kesalahan jaringan." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Applications
  const filteredApplications = applications.filter((c) => {
    const matchesSearch =
      c.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer?.cifNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.commodityOrAsset?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Murabahah Engine (Cost-Plus Financing)"
        description="Pengelolaan akad jual-beli amanah murabahah, verifikasi kepemilikan aset (Milkiyyah), kalkulasi marjin presisi, dan jadwal amortisasi piutang."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Manajemen Akad", href: "/contracts" },
          { label: "Murabahah Engine" },
        ]}
        badge={
          <Badge variant="primary" dot>
            Fatwa DSN-MUI No. 04/2000
          </Badge>
        }
      />

      {/* FEEDBACK ALERT */}
      {alertMessage && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-xs font-semibold ${
            alertMessage.type === "success"
              ? "bg-[#16A36A]/10 text-[#16A36A] border border-[#16A36A]/30"
              : "bg-[#DC3545]/10 text-[#DC3545] border border-[#DC3545]/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <span>{alertMessage.text}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-current hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-white shadow-xs rounded-xl hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Pengajuan Terdata</p>
            <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">{applications.length} Aplikasi</p>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Data Tersimpan di Database
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs rounded-xl hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menunggu Tinjauan</p>
            <p className="text-xl font-bold text-[#00549c] font-mono tabular-nums">
              {applications.filter((a) => a.status.includes("REVIEW")).length} Berkas
            </p>
            <p className="text-[10px] text-[#00549c] font-semibold">Alur Persetujuan Aktif</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs rounded-xl hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Verifikasi Milkiyyah</p>
            <p className="text-xl font-bold text-emerald-600 font-mono tabular-nums">100% Sah</p>
            <p className="text-[10px] text-slate-500">Wajib BAST & Faktur Pisah</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs rounded-xl hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Marjin Efektif Rata-Rata</p>
            <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">14.5% p.a.</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Transparan Disepakati</p>
          </CardContent>
        </Card>
      </div>

      {/* MODULE TAB NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "list" ? "border-[#00549c] text-[#00549c] font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Daftar Pengajuan ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "create" ? "border-[#00549c] text-[#00549c] font-bold" : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Pengajuan Baru & Kalkulator</span>
        </button>

        <button
          onClick={() => setActiveTab("verification")}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "verification" ? "border-[#00549c] text-[#00549c] font-bold" : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Verifikasi Milkiyyah & Rukun ({complianceResult.status})</span>
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "schedule" ? "border-[#00549c] text-[#00549c] font-bold" : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Simulasi Jadwal Amortisasi</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR APLIKASI MURABAHAH */}
      {activeTab === "list" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#172B4D]">
                  Direktori Pembiayaan Murabahah Terdaftar
                </CardTitle>
                <CardDescription className="text-xs">
                  Seluruh pengajuan murabahah yang tercatat di database dengan status verifikasi dan alur persetujuan.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => setActiveTab("create")} variant="primary" size="sm" className="text-xs font-semibold">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Tambah Pengajuan Baru
                </Button>
              </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                <Input
                  placeholder="Cari nomor pengajuan, nama nasabah, atau objek komoditas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <select
                aria-label="Filter status pengajuan murabahah"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-[#E2E8F0] rounded-md px-3 py-2 bg-white text-[#172B4D] font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">DRAFT</option>
                <option value="LEGAL_REVIEW">LEGAL_REVIEW</option>
                <option value="COMPLIANCE_REVIEW">COMPLIANCE_REVIEW</option>
                <option value="DPS_REVIEW">DPS_REVIEW</option>
                <option value="MANAGEMENT_REVIEW">MANAGEMENT_REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#00549c]" />
                <span>Memuat data pengajuan dari database...</span>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                Tidak ada data pengajuan yang sesuai kriteria pencarian.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">No. Pengajuan</th>
                    <th className="px-4 py-3">Nasabah & Komoditas</th>
                    <th className="px-4 py-3 text-right">Harga Pokok (Cost)</th>
                    <th className="px-4 py-3 text-right">Harga Jual (Total)</th>
                    <th className="px-4 py-3 text-right">Angsuran / Bln</th>
                    <th className="px-4 py-3 text-center">Milkiyyah</th>
                    <th className="px-4 py-3 text-center">Status Syariah</th>
                    <th className="px-4 py-3 text-center">Status Alur</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredApplications.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-mono font-bold text-[#00549c]">
                        {c.applicationNumber}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-[#172B4D]">{c.customer?.name ?? c.customerName ?? "—"}</p>
                        {c.customer?.cifNumber && (
                          <p className="font-mono text-[10px] text-[#00549c]">CIF {c.customer.cifNumber}</p>
                        )}
                        <p className="text-[11px] text-[#64748B] truncate max-w-[200px]">{c.commodityOrAsset}</p>
                      </td>

                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800">
                        {formatIDR(c.costPrice)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-[#00549c]">
                        {formatIDR(c.sellingPrice)}
                        <span className="block text-[9px] text-emerald-600 font-normal">
                          +Marjin {formatIDR(c.marginOrNisbah)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatIDR(c.monthlyInstallment)}
                        <span className="block text-[9px] text-slate-500 font-normal">{c.tenorMonths} Bulan</span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {c.ownershipVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A36A] bg-[#16A36A]/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Milik Sah
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B4690E] bg-[#E9A23B]/10 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" /> Menunggu BAST
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={c.shariaStatus === "PASS" ? "success" : c.shariaStatus === "REVIEW" ? "warning" : "danger"}
                          className="text-[10px]"
                        >
                          {c.shariaStatus}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            c.status === "ACTIVE" || c.status === "APPROVED"
                              ? "success"
                              : c.status === "REVISION_REQUESTED"
                              ? "danger"
                              : "primary"
                          }
                          className="text-[10px] font-semibold"
                        >
                          {c.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApp(c)}
                          className="text-[11px] h-7 px-2 font-medium"
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: KALKULATOR & PENGAJUAN BARU */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INPUT FORM */}
          <Card className="lg:col-span-7 border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#00549c]" />
                <CardTitle className="text-sm font-bold text-[#172B4D]">
                  Formulir Pengajuan Pembiayaan Murabahah
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Kalkulasi harga jual, marjin, dan uang muka sesuai prinsip keterbukaan informasi syariah. Data langsung tersimpan ke database.
              </CardDescription>
            </CardHeader>

            {/* Tahap 3B.5: URL-direct access tetap diperiksa — panel akses
                menggantikan form bagi peran tanpa permission terkait. */}
            {!sessionLoading && !canView && (
              <CardContent>
                <AccessDeniedPanel
                  permission="contracts:view"
                  message="Peran Anda tidak memiliki izin melihat modul akad Murabahah."
                />
              </CardContent>
            )}
            {!sessionLoading && canView && !canCreate && (
              <CardContent className="p-6">
                <ReadOnlyPanel
                  message="Peran Anda tidak memiliki izin 'contracts:create', sehingga formulir pengajuan baru disembunyikan. Gunakan tab Daftar Pengajuan untuk memantau progres akad yang sudah berjalan."
                  hint="Pengajuan baru dibuat oleh Financing Officer, Administrator Institusi, atau Super Admin — dan tetap diverifikasi ulang oleh backend pada setiap POST."
                />
              </CardContent>
            )}
            {(sessionLoading || canCreate) && (
            <CardContent className="space-y-4 text-xs">
              {/* SECTION 1: DATA NASABAH (CustomerPicker) */}
              <SectionCard
                step={1}
                title="Data Nasabah"
                description="Pilih nasabah terdaftar dari direktori Customer Management. Profil identitas, telepon, dan email terisi otomatis dari data CIF — tidak perlu input manual."
              >
                <CustomerPicker value={selectedCustomer} onChange={setSelectedCustomer} />
              </SectionCard>

              {/* SECTION 2: DETAIL OBJEK PEMBIAYAAN */}
              <SectionCard
                step={2}
                title="Detail Objek Pembiayaan"
                description="Barang ni'mah yang menjadi objek jual-beli murabahah beserta pemasoknya."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Deskripsi Komoditas Objek Akad"
                    htmlFor="murabahah-commodity"
                    required
                  >
                    <Input
                      id="murabahah-commodity"
                      value={commodityDescription}
                      onChange={(e) => setCommodityDescription(e.target.value)}
                      placeholder="Merk, spesifikasi, dan tipe aset"
                    />
                  </FormField>

                  <FormField
                    label="Nama Pemasok / Supplier"
                    htmlFor="murabahah-supplier"
                  >
                    <Input
                      id="murabahah-supplier"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Contoh: PT Distributor Mesin Utama"
                    />
                  </FormField>
                </div>
              </SectionCard>

              {/* SECTION 3: STRUKTUR PEMBIAYAAN */}
              <SectionCard
                step={3}
                title="Struktur Pembiayaan"
                description="Kalkulasi harga pokok, marjin yang disepakati, uang muka, dan tenor sesuai prinsip transparansi syariah."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Harga Pokok Perolehan (Cost Price - Rp)"
                    htmlFor="murabahah-cost"
                    required
                    hint="Biaya riil beli barang dari vendor"
                  >
                    <Input
                      id="murabahah-cost"
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                    />
                  </FormField>

                  <FormField
                    label="Marjin Keuntungan Disepakati (Rp)"
                    htmlFor="murabahah-margin"
                    required
                    hint={
                      <span className="text-[#16A36A] font-mono">
                        Marjin Efektif: {calcResult.effectiveMarginPercentage}%
                      </span>
                    }
                  >
                    <Input
                      id="murabahah-margin"
                      type="number"
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(Number(e.target.value))}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Uang Muka / Urbun (Rp)"
                    htmlFor="murabahah-down"
                    hint={`Maks. 50% dari harga jual (${formatIDR(downPayment)})`}
                  >
                    <Input
                      id="murabahah-down"
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                    />
                  </FormField>

                  <FormField
                    label="Jangka Waktu Tenor (Bulan)"
                    htmlFor="murabahah-tenor"
                    required
                    hint="Durasi angsuran tetap bulanan"
                  >
                    <Input
                      id="murabahah-tenor"
                      type="number"
                      value={tenorMonths}
                      min={1}
                      max={120}
                      onChange={(e) => setTenorMonths(Number(e.target.value))}
                    />
                  </FormField>
                </div>
              </SectionCard>

              {/* SECTION 4: INFORMASI TAMBAHAN */}
              <SectionCard
                step={4}
                title="Informasi Tambahan"
                description="Catatan permohonan dan analisa pemrakarsa."
              >
                <FormField
                  label="Catatan Permohonan / Analisa Pemrakarsa"
                  htmlFor="murabahah-notes"
                >
                  <textarea
                    id="murabahah-notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-md border border-[#E2E8F0] focus:ring-1 focus:ring-[#00549c]"
                    placeholder="Catatan tambahan analisa karakter dan kapasitas nasabah..."
                  />
                </FormField>
              </SectionCard>

              {/* FOOTER ACTION */}
              <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveDraft}
                  className="w-full sm:w-1/2 font-semibold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Simpan Draft (DRAFT)
                </Button>

                <Button
                  variant="primary"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitApplication}
                  className="w-full sm:w-1/2 font-bold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Ajukan Pembiayaan (SUBMIT)
                </Button>
              </div>
            </CardContent>
            )}
          </Card>

          {/* CALCULATION SUMMARY CARD */}
          <Card className="lg:col-span-5 border-[#E2E8F0] bg-[#F8FAFC]">
            <CardHeader className="border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase font-bold text-[#64748B]">
                  Struktur Keuangan Murabahah
                </CardTitle>
                <Badge variant="primary" className="text-[10px] font-mono">
                  Decimal-Safe Calc
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              <div className="p-4 bg-white rounded-lg border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Harga Pokok Perolehan:</span>
                  <span className="font-mono font-bold text-[#172B4D]">{formatIDR(calcResult.costPrice)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748B]">Marjin Keuntungan ({calcResult.effectiveMarginPercentage}%):</span>
                  <span className="font-mono font-bold text-[#16A36A]">+{formatIDR(calcResult.profitMargin)}</span>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex justify-between text-sm font-black text-[#172B4D]">
                  <span>Harga Jual Total:</span>
                  <span className="font-mono text-[#00549c]">{formatIDR(calcResult.sellingPrice)}</span>
                </div>

                <div className="flex justify-between text-[#64748B] text-[11px]">
                  <span>Uang Muka (Urbun):</span>
                  <span className="font-mono text-[#DC3545]">-{formatIDR(calcResult.downPaymentUrbun)}</span>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex justify-between font-bold text-[#172B4D]">
                  <span>Sisa Piutang Pembiayaan:</span>
                  <span className="font-mono">{formatIDR(calcResult.remainingReceivable)}</span>
                </div>
              </div>

              {/* MONTHLY INSTALLMENT HIGHLIGHT */}
              <div className="p-4 bg-gradient-to-r from-[#00549c] to-[#0F6FB5] rounded-lg text-white space-y-1">
                <p className="text-[10px] uppercase font-bold text-[#DCEAF5] tracking-wider">
                  Angsuran Tetap Bulanan (Equal Installment)
                </p>
                <p className="text-2xl font-black font-mono">
                  {formatIDR(calcResult.equalMonthlyInstallment)}
                </p>
                <p className="text-[10px] text-[#DCEAF5]/90">
                  Tenor {calcResult.tenorMonths} bulan • Beban bunga floating 0% (Haram)
                </p>
              </div>

              <div className="text-[11px] text-[#64748B] p-3 rounded bg-white border border-[#E2E8F0] space-y-1">
                <div className="flex items-center gap-1 font-bold text-[#172B4D]">
                  <Info className="h-3.5 w-3.5 text-[#00549c]" />
                  <span>Kaidah Fiqh Murabahah:</span>
                </div>
                <p>
                  Harga jual yang disepakati di awal bersifat mengikat (Qath&apos;i). Bank dilarang mengubah harga jual atau mengenakan denda komersial jika nasabah mengalami kesulitan keuangan.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: VERIFIKASI KEPEMILIKAN (MILKIYYAH) */}
      {activeTab === "verification" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#00549c]" />
                  <span>Protokol Verifikasi Kepemilikan Barang (Milkiyyah Tammah)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Sesuai Fatwa DSN-MUI No. 04/2000: Bank dilarang menjual barang yang belum dimiliki dan dikuasai secara sah. Upload faktur supplier saja belum cukup membuktikan kepemilikan tanpa verifikasi pejabat berwenang.
                </CardDescription>
              </div>

              <Badge
                variant={complianceResult.status === "PASS" ? "success" : complianceResult.status === "REVIEW" ? "warning" : "danger"}
                className="text-xs px-3 py-1"
                dot
              >
                Status Syariah: {complianceResult.status} ({complianceResult.score}/100)
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CHECKLIST ITEMS */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white cursor-pointer hover:bg-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={checklist.isCommodityHalal}
                    onChange={(e) => setChecklist({ ...checklist, isCommodityHalal: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded text-[#00549c]"
                  />
                  <div>
                    <p className="font-bold text-[#172B4D]">Komoditas Halal & Bermanfaat (Mutaqawwam)</p>
                    <p className="text-[11px] text-[#64748B]">Barang tidak termasuk komoditas haram zat maupun peruntukannya.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white cursor-pointer hover:bg-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={checklist.isCostPriceDisclosed}
                    onChange={(e) => setChecklist({ ...checklist, isCostPriceDisclosed: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded text-[#00549c]"
                  />
                  <div>
                    <p className="font-bold text-[#172B4D]">Keterbukaan Harga Pokok Perolehan (Amanah)</p>
                    <p className="text-[11px] text-[#64748B]">Harga pokok riil dan diskon dari vendor diberitahukan jujur ke nasabah.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white cursor-pointer hover:bg-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={checklist.isBankOwnershipVerified}
                    onChange={(e) => setChecklist({ ...checklist, isBankOwnershipVerified: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded text-[#00549c]"
                  />
                  <div>
                    <p className="font-bold text-[#172B4D]">Penguasaan Fisik / Kepemilikan Sah (Milkiyyah)</p>
                    <p className="text-[11px] text-[#64748B]">Bank telah menguasai barang atau menerima surat serah terima sebelum menjual.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white cursor-pointer hover:bg-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={checklist.hasSeparatePurchaseInvoice}
                    onChange={(e) => setChecklist({ ...checklist, hasSeparatePurchaseInvoice: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded text-[#00549c]"
                  />
                  <div>
                    <p className="font-bold text-[#172B4D]">Faktur Pembelian Terpisah (Supplier Invoice)</p>
                    <p className="text-[11px] text-[#64748B]">Faktur terbit atas nama LKS / Bank sebagai pembeli dari vendor pertama.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white cursor-pointer hover:bg-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={checklist.hasDeliveryOrderOrBast}
                    onChange={(e) => setChecklist({ ...checklist, hasDeliveryOrderOrBast: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded text-[#00549c]"
                  />
                  <div>
                    <p className="font-bold text-[#172B4D]">Berita Acara Serah Terima (BAST Fisik)</p>
                    <p className="text-[11px] text-[#64748B]">Terdapat bukti fisik penyerahan barang yang diverifikasi petugas berwenang.</p>
                  </div>
                </label>
              </div>

              {/* AUDIT DIAGNOSTIC */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#172B4D] text-xs uppercase tracking-wide">
                  Hasil Diagnosa Kepatuhan Mesin Syariah:
                </h4>

                {complianceResult.violations.length === 0 ? (
                  <div className="p-4 rounded-lg bg-[#16A36A]/10 border border-[#16A36A]/30 text-[#16A36A] space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Rukun & Syarat Sah Murabahah Terpenuhi Penuh (100%)</span>
                    </div>
                    <p className="text-[11px] text-[#16A36A]/90">
                      Seluruh dokumen pembuktian kepemilikan dan transparansi harga telah diverifikasi. Kontrak siap dicetak dan ditandatangani.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {complianceResult.violations.map((violation, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#DC3545]/10 border border-[#DC3545]/30 text-[#DC3545] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Temuan Cacat Akad #{i + 1}</span>
                        </div>
                        <p className="text-[11px]">{violation}</p>
                        {complianceResult.recommendations[i] && (
                          <p className="text-[10px] text-[#172B4D] font-medium pt-1 border-t border-[#DC3545]/20">
                            💡 <strong>Tindakan Perbaikan:</strong> {complianceResult.recommendations[i]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: JADWAL AMORTISASI ANGSURAN */}
      {activeTab === "schedule" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#172B4D]">
                  Jadwal Amortisasi Angsuran Piutang Murabahah
                </CardTitle>
                <CardDescription className="text-xs">
                  Simulasi rincian pokok dan marjin per bulan untuk pembiayaan Rp {formatIDR(calcResult.remainingReceivable)} ({calcResult.tenorMonths} Bulan).
                </CardDescription>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#64748B]">Angsuran Bulanan:</span>
                <p className="text-base font-black font-mono text-[#00549c]">
                  {formatIDR(calcResult.equalMonthlyInstallment)}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Bulan Ke-</th>
                  <th className="px-4 py-3 text-right">Porsi Pokok (Rp)</th>
                  <th className="px-4 py-3 text-right">Porsi Marjin (Rp)</th>
                  <th className="px-4 py-3 text-right">Total Angsuran (Rp)</th>
                  <th className="px-4 py-3 text-right">Sisa Saldo Pokok (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-mono">
                {calcResult.installmentSchedule.map((row) => (
                  <tr key={row.periodMonth} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-2.5 font-bold text-[#172B4D]">Bulan {row.periodMonth}</td>
                    <td className="px-4 py-2.5 text-right text-[#172B4D]">{formatIDR(row.principalPortion)}</td>
                    <td className="px-4 py-2.5 text-right text-[#16A36A]">+{formatIDR(row.marginPortion)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-[#00549c]">{formatIDR(row.totalInstallment)}</td>
                    <td className="px-4 py-2.5 text-right text-[#64748B]">{formatIDR(row.remainingPrincipalBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* DETAIL MODAL / DRAWER */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-mono font-bold text-[#00549c]">Rincian Berkas Pembiayaan</p>
                <h3 className="text-base font-black text-[#172B4D]">{selectedApp.applicationNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B]">Nama Nasabah:</span>
                  <p className="font-bold text-[#172B4D]">{selectedApp.customer?.name ?? selectedApp.customerName ?? "—"}</p>
                  {selectedApp.customer?.cifNumber && (
                    <p className="font-mono text-[10px] text-[#00549c]">CIF {selectedApp.customer.cifNumber}</p>
                  )}
                </div>
                <div>
                  <span className="text-[#64748B]">Objek Komoditas:</span>
                  <p className="font-bold text-[#172B4D]">{selectedApp.commodityOrAsset}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Status Alur Kerja:</span>
                  <p className="font-semibold text-[#00549c]">{selectedApp.statusLabel || selectedApp.status}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Status Milkiyyah:</span>
                  <p className="font-semibold text-[#16A36A]">
                    {selectedApp.ownershipVerified ? "Milik Sah Terverifikasi" : "Menunggu Verifikasi BAST"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white border border-[#E2E8F0] space-y-2">
                <h4 className="font-bold text-[#172B4D] text-xs uppercase">Rincian Finansial Murabahah:</h4>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Harga Pokok Perolehan (Cost):</span>
                  <span className="font-mono font-bold text-[#172B4D]">{formatIDR(selectedApp.costPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Marjin Keuntungan:</span>
                  <span className="font-mono font-bold text-[#16A36A]">+{formatIDR(selectedApp.marginOrNisbah)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-[#E2E8F0] pt-2">
                  <span>Harga Jual Total:</span>
                  <span className="font-mono text-[#00549c]">{formatIDR(selectedApp.sellingPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Uang Muka (Urbun):</span>
                  <span className="font-mono text-[#DC3545]">-{formatIDR(selectedApp.downPayment)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Angsuran Bulanan ({selectedApp.tenorMonths} Bulan):</span>
                  <span className="font-mono text-sm text-[#00549c]">{formatIDR(selectedApp.monthlyInstallment)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Link href={`/documents/generator?appId=${selectedApp.id}`}>
                  <Button variant="primary" size="sm" className="font-semibold">
                    <FileText className="h-4 w-4 mr-1.5" />
                    Generate Dokumen Draf Akad
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
