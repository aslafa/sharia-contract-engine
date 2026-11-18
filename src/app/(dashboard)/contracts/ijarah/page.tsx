"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/enterprise/page-header";
import {
  calculateIjarah,
  validateIjarahCompliance,
  IjarahCalculationResult,
  IjarahShariaChecklist,
} from "@/lib/akad/ijarah";
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
  Wrench,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Car,
  Laptop,
  Check,
  Loader2,
  X,
  FileText,
} from "lucide-react";

export default function IjarahEnginePage() {
  // Tahap 3B.5 — permission gating dari sesi aktif (server tetap otoritas).
  const { loading: sessionLoading, can } = useSession();
  const canView = can("contracts:view");
  const canCreate = can("contracts:create");

  const [activeTab, setActiveTab] = React.useState<"list" | "create" | "verification" | "schedule">("list");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Server state
  const [applications, setApplications] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedApp, setSelectedApp] = React.useState<any | null>(null);

  // Form State
  // Tahap 3B.4 — profil penyewa dari direktori via CustomerPicker (tanpa dummy).
  const [selectedCustomer, setSelectedCustomer] = React.useState<SelectedCustomer | null>(null);
  const [assetName, setAssetName] = React.useState("3 Unit Truk Tronton Isuzu Giga FVR");
  const [assetValue, setAssetValue] = React.useState<number>(750000000);
  const [rentalFeePerMonth, setRentalFeePerMonth] = React.useState<number>(31500000);
  const [rentalPeriodMonths, setRentalPeriodMonths] = React.useState<number>(24);
  const [advanceRentalDeposit, setAdvanceRentalDeposit] = React.useState<number>(63000000);
  const [isImbt, setIsImbt] = React.useState<boolean>(true);
  const [transferMethod, setTransferMethod] = React.useState<"HIBAH" | "JUAL_NOMINAL" | "JUAL_NILAI_WAJAR">("HIBAH");
  const [nominalTransferPrice, setNominalTransferPrice] = React.useState<number>(5000000);

  // Sharia Checklist
  const [checklist, setChecklist] = React.useState<IjarahShariaChecklist>({
    isAssetIdentifiable: true,
    isBenefitPermissible: true,
    isUjrahDefinedClearly: true,
    isLeaseDurationDefinite: true,
    isMaintenanceSplitAgreed: true,
    hasSeparateWaadForImbt: true,
    isLessorOwnerOrRightHolder: true,
  });

  const fetchApplications = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/applications?akad=IJARAH");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setApplications(json.data);
      }
    } catch (err) {
      console.error("Gagal load ijarah:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const calcResult: IjarahCalculationResult = React.useMemo(() => {
    return calculateIjarah({
      assetValue: assetValue || 0,
      rentalFeePerMonth: rentalFeePerMonth || 0,
      rentalPeriodMonths: rentalPeriodMonths > 0 ? rentalPeriodMonths : 1,
      isImbt,
      transferMethod,
      nominalTransferPrice,
    });
  }, [assetValue, rentalFeePerMonth, rentalPeriodMonths, isImbt, transferMethod, nominalTransferPrice]);

  const complianceResult = React.useMemo(() => {
    return validateIjarahCompliance(checklist, isImbt);
  }, [checklist, isImbt]);

  const handleSaveApplication = async (submitImmediately: boolean) => {
    if (!selectedCustomer) {
      setAlertMessage({
        type: "error",
        text: "Pilih nasabah terdaftar terlebih dahulu — setiap pengajuan wajib terhubung ke direktori Customer Management.",
      });
      return;
    }
    if (!assetName.trim() || assetValue <= 0 || rentalFeePerMonth <= 0) {
      setAlertMessage({ type: "error", text: "Lengkapi objek sewa, nilai aset, dan sewa ujrah." });
      return;
    }

    try {
      setIsSubmitting(true);
      setAlertMessage(null);
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          akad: "IJARAH",
          title: `Sewa Ijarah ${isImbt ? "IMBT" : "Murni"} - ${assetName}`,
          customerId: selectedCustomer.id,
          commodityOrAsset: assetName,
          costPrice: assetValue,
          marginOrNisbah: calcResult.totalUjrah - assetValue,
          sellingPrice: calcResult.totalUjrah,
          downPayment: advanceRentalDeposit,
          tenorMonths: rentalPeriodMonths,
          submitImmediately,
          notes: `Akad Ijarah ${isImbt ? "IMBT (Wa'd Hibah Terpisah)" : "Operasional"}. Ujrah bulanan Rp ${rentalFeePerMonth.toLocaleString("id-ID")}.`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAlertMessage({
          type: "success",
          text: `Aplikasi ${json.data.applicationNumber} berhasil ${submitImmediately ? "diajukan ke Legal Officer" : "disimpan sebagai draf"}!`,
        });
        await fetchApplications();
        setActiveTab("list");
      } else if (json?.error?.code === "CUSTOMER_AML_BLOCKED") {
        setAlertMessage({
          type: "error",
          text: "Nasabah terpilih berstatus AML FLAGGED dan tidak dapat digunakan untuk pengajuan baru. Silakan pilih nasabah lain.",
        });
      } else if (json?.error?.code === "CUSTOMER_NOT_FOUND") {
        setAlertMessage({
          type: "error",
          text: "Nasabah yang dipilih tidak lagi tersedia pada direktori. Silakan pilih ulang nasabah.",
        });
      } else if (json?.error?.code === "CUSTOMER_CROSS_TENANT_ACCESS") {
        setAlertMessage({
          type: "error",
          text: "Nasabah yang dipilih bukan milik tenant lembaga Anda. Pilih nasabah dari direktori lembaga Anda sendiri.",
        });
      } else {
        setAlertMessage({ type: "error", text: json.error?.message || "Gagal menyimpan pengajuan." });
      }
    } catch (err: any) {
      setAlertMessage({ type: "error", text: err.message || "Terjadi kesalahan jaringan." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredApplications = applications.filter((a) => {
    const matchesSearch =
      a.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customer?.cifNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.commodityOrAsset?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ijarah Engine (Leasing & IMBT Module)"
        description="Pengelolaan akad sewa-menyewa manfaat (Ijarah) dan Ijarah Muntahiyah Bittamlik (IMBT) dengan pemisahan klausul Wa'ad pengalihan hak milik."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Manajemen Akad", href: "/contracts" },
          { label: "Ijarah Engine" },
        ]}
        badge={
          <Badge variant="primary" dot>
            Fatwa DSN-MUI No. 09/2000 &amp; 27/2002
          </Badge>
        }
      />

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

      {/* TABS */}
      <div className="flex border-b border-[#E2E8F0] gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "list" ? "border-[#00549c] text-[#00549c] font-bold" : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Daftar Kontrak Sewa ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "create" ? "border-[#00549c] text-[#00549c] font-bold" : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Kalkulator &amp; Buat Pengajuan Ijarah</span>
        </button>

        <button
          onClick={() => setActiveTab("verification")}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "verification" ? "border-[#00549c] text-[#00549c] font-bold" : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Verifikasi Wa&apos;d &amp; Rukun Syariah ({complianceResult.status})</span>
        </button>
      </div>

      {/* TAB 1: LIST */}
      {activeTab === "list" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#172B4D]">Direktori Kontrak Sewa Ijarah Terdaftar</CardTitle>
                <CardDescription className="text-xs">Data riil aset yang disewakan dengan pemantauan masa berlaku dan status syariah.</CardDescription>
              </div>
              <Button onClick={() => setActiveTab("create")} variant="primary" size="sm" className="text-xs font-semibold">
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Tambah Kontrak Sewa Baru
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                <Input
                  placeholder="Cari nomor kontrak, penyewa, atau objek aset..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <select
                aria-label="Filter status kontrak sewa ijarah"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-[#E2E8F0] rounded-md px-3 py-2 bg-white text-[#172B4D] font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">DRAFT</option>
                <option value="COMPLIANCE_REVIEW">COMPLIANCE_REVIEW</option>
                <option value="DPS_REVIEW">DPS_REVIEW</option>
                <option value="ACTIVE">ACTIVE</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#00549c]" />
                <span>Memuat data dari database...</span>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">Tidak ada data kontrak sewa ijarah terdata.</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">No. Pengajuan</th>
                    <th className="px-4 py-3">Penyewa &amp; Objek Sewa</th>
                    <th className="px-4 py-3 text-right">Nilai Aset</th>
                    <th className="px-4 py-3 text-right">Ujrah Bulanan</th>
                    <th className="px-4 py-3 text-center">Tenor</th>
                    <th className="px-4 py-3 text-center">Status Alur</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-mono font-bold text-[#00549c]">{app.applicationNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#172B4D]">{app.customer?.name ?? app.customerName ?? "—"}</p>
                        {app.customer?.cifNumber && (
                          <p className="font-mono text-[10px] text-[#00549c]">CIF {app.customer.cifNumber}</p>
                        )}
                        <p className="text-[11px] text-[#64748B] truncate max-w-[200px]">{app.commodityOrAsset}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#172B4D]">{formatIDR(app.costPrice)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#00549c]">{formatIDR(app.monthlyInstallment)}</td>
                      <td className="px-4 py-3 text-center font-mono">{app.tenorMonths} Bln</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="primary" className="text-[10px]">{app.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)} className="text-[11px] h-7 px-2">
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

      {/* TAB 2: CREATE & CALCULATOR */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#00549c]" />
                <CardTitle className="text-sm font-bold text-[#172B4D]">Kalkulator Ujrah &amp; Konfigurasi Akad IMBT</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Perhitungan sewa manfaat dan klausul janji pengalihan hak milik (Wa&apos;d) terpisah. Tersimpan di database.
              </CardDescription>
            </CardHeader>

            {/* Tahap 3B.5: URL-direct access tetap diperiksa. */}
            {!sessionLoading && !canView && (
              <CardContent>
                <AccessDeniedPanel
                  permission="contracts:view"
                  message="Peran Anda tidak memiliki izin melihat modul akad Ijarah."
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
                description="Pilih penyewa terdaftar dari direktori Customer Management. Profil terisi otomatis dari data CIF."
              >
                <CustomerPicker value={selectedCustomer} onChange={setSelectedCustomer} />
              </SectionCard>

              {/* SECTION 2: DETAIL OBJEK PEMBIAYAAN */}
              <SectionCard
                step={2}
                title="Detail Objek Sewa"
                description="Aset yang disewa-kan manfaatnya kepada penyewa (mustajir)."
              >
                <FormField label="Objek Aset yang Disewakan" htmlFor="ijarah-asset" required>
                  <Input id="ijarah-asset" value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Contoh: 3 Unit Truk Isuzu Giga" />
                </FormField>

                <FormField label="Harga Perolehan Objek Aset (Rp)" htmlFor="ijarah-assetvalue" required>
                  <Input id="ijarah-assetvalue" type="number" value={assetValue} onChange={(e) => setAssetValue(Number(e.target.value))} />
                </FormField>
              </SectionCard>

              {/* SECTION 3: STRUKTUR PEMBIAYAAN */}
              <SectionCard
                step={3}
                title="Struktur Pembiayaan"
                description="Ujrah, masa sewa, dan klausul pengalihan kepemilikan (IMBT)."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Besaran Ujrah Sewa Bulanan (Rp)" htmlFor="ijarah-ujrah" required>
                    <Input id="ijarah-ujrah" type="number" value={rentalFeePerMonth} onChange={(e) => setRentalFeePerMonth(Number(e.target.value))} />
                  </FormField>
                  <FormField label="Durasi Periode Sewa (Bulan)" htmlFor="ijarah-period" required>
                    <Input id="ijarah-period" type="number" value={rentalPeriodMonths} onChange={(e) => setRentalPeriodMonths(Number(e.target.value))} />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Uang Jaminan Sewa / Hamish Jiddiyyah (Rp)"
                    htmlFor="ijarah-deposit"
                  >
                    <Input id="ijarah-deposit" type="number" value={advanceRentalDeposit} onChange={(e) => setAdvanceRentalDeposit(Number(e.target.value))} />
                  </FormField>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isImbt}
                      onChange={(e) => setIsImbt(e.target.checked)}
                      className="h-4 w-4 rounded text-[#00549c]"
                    />
                    <span className="font-bold text-[#172B4D]">Akad IMBT (Sewa Diakhiri Pengalihan Kepemilikan)</span>
                  </label>

                  {isImbt && (
                    <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                      <FormField label="Metode Pengalihan Kepemilikan pada Akhir Masa Sewa">
                        <select
                          aria-label="Metode pengalihan kepemilikan pada akhir masa sewa"
                          value={transferMethod}
                          onChange={(e) => setTransferMethod(e.target.value as any)}
                          className="w-full text-xs h-9 rounded-md border border-[#E2E8F0] px-3 bg-white text-[#172B4D]"
                        >
                          <option value="HIBAH">Hibah (Pemberian cuma-cuma setelah lunas)</option>
                          <option value="JUAL_NOMINAL">Jual Beli dengan Harga Nominal Disepakati</option>
                          <option value="JUAL_NILAI_WAJAR">Jual Beli dengan Nilai Wajar Pasar</option>
                        </select>
                      </FormField>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* FOOTER ACTION */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveApplication(false)}
                  className="w-full sm:w-1/2 font-semibold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Simpan Draft Ijarah
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveApplication(true)}
                  className="w-full sm:w-1/2 font-bold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Ajukan Permohonan Ijarah
                </Button>
              </div>
            </CardContent>
            )}
          </Card>

          <Card className="lg:col-span-5 border-[#E2E8F0] bg-[#F8FAFC]">
            <CardHeader className="border-b border-[#E2E8F0] pb-3">
              <CardTitle className="text-xs uppercase font-bold text-[#64748B]">Ringkasan Finansial Ijarah</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="p-4 bg-white rounded-lg border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Nilai Objek Aset:</span>
                  <span className="font-mono font-bold text-[#172B4D]">{formatIDR(calcResult.assetValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Ujrah Sewa Bulanan:</span>
                  <span className="font-mono font-bold text-[#00549c]">{formatIDR(calcResult.monthlyUjrah)}</span>
                </div>
                <div className="flex justify-between border-t border-[#E2E8F0] pt-2 font-bold">
                  <span>Total Penerimaan Ujrah ({calcResult.rentalPeriodMonths} Bulan):</span>
                  <span className="font-mono text-[#16A36A]">{formatIDR(calcResult.totalUjrah)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DETAIL DRAWER */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs border border-[#E2E8F0]">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-sm text-[#172B4D]">{selectedApp.applicationNumber}</h3>
              <button onClick={() => setSelectedApp(null)}><X className="h-4 w-4 text-[#64748B]" /></button>
            </div>
            <div className="space-y-2">
              <p><strong>Penyewa:</strong> {selectedApp.customer?.name ?? selectedApp.customerName ?? "—"}</p>
              {selectedApp.customer?.cifNumber && (
                <p className="font-mono text-[10px] text-[#00549c]">CIF {selectedApp.customer.cifNumber}</p>
              )}
              <p><strong>Objek Sewa:</strong> {selectedApp.commodityOrAsset}</p>
              <p><strong>Harga Perolehan:</strong> {formatIDR(selectedApp.costPrice)}</p>
              <p><strong>Ujrah Bulanan:</strong> {formatIDR(selectedApp.monthlyInstallment)} ({selectedApp.tenorMonths} Bulan)</p>
              <p><strong>Status:</strong> {selectedApp.status}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Link href={`/documents/generator?appId=${selectedApp.id}`}>
                <Button variant="primary" size="sm">Generate Draf Dokumen</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
