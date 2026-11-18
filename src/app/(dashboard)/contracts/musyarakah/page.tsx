"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/enterprise/page-header";
import {
  calculateMusyarakahDistribution,
  validateMusyarakahCompliance,
  MusyarakahDistributionResult,
  MusyarakahShariaChecklist,
} from "@/lib/akad/musyarakah";
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
  Users,
  PieChart,
  TrendingUp,
  Briefcase,
  AlertCircle,
  Info,
  Loader2,
  X,
  FileText,
} from "lucide-react";

export default function MusyarakahEnginePage() {
  // Tahap 3B.5 — permission gating dari sesi aktif (server tetap otoritas).
  const { loading: sessionLoading, can } = useSession();
  const canView = can("contracts:view");
  const canCreate = can("contracts:create");

  const [activeTab, setActiveTab] = React.useState<"list" | "calculator" | "verification">("list");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const [applications, setApplications] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedApp, setSelectedApp] = React.useState<any | null>(null);

  // Form State
  // Tahap 3B.4 — mitra musyarakah dipilih dari direktori via CustomerPicker.
  const [selectedCustomer, setSelectedCustomer] = React.useState<SelectedCustomer | null>(null);
  const [projectName, setProjectName] = React.useState("Pembiayaan Modal Kerja Proyek RS Syariah");
  const [institutionCapital, setInstitutionCapital] = React.useState<number>(1200000000);
  const [partnerCapital, setPartnerCapital] = React.useState<number>(800000000);
  const [institutionNisbah, setInstitutionNisbah] = React.useState<number>(40);
  const [partnerNisbah, setPartnerNisbah] = React.useState<number>(60);
  const [tenorMonths, setTenorMonths] = React.useState<number>(36);
  const [realizedGrossRevenue, setRealizedGrossRevenue] = React.useState<number>(350000000);
  const [realizedOperatingExpense, setRealizedOperatingExpense] = React.useState<number>(120000000);

  const [checklist, setChecklist] = React.useState<MusyarakahShariaChecklist>({
    isBusinessHalal: true,
    isCapitalVerifiable: true,
    isNisbahAgreedUpfront: true,
    isLossSharingProportional: true,
    hasNoGuaranteedReturn: true,
    isPeriodicReportAudited: true,
  });

  const fetchApplications = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/applications?akad=MUSYARAKAH");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setApplications(json.data);
      }
    } catch (err) {
      console.error("Gagal load musyarakah:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const calcResult: MusyarakahDistributionResult = React.useMemo(() => {
    return calculateMusyarakahDistribution({
      institutionCapital: institutionCapital || 0,
      partnerCapital: partnerCapital || 0,
      institutionNisbah: institutionNisbah || 0,
      partnerNisbah: partnerNisbah || 0,
      realizedGrossRevenue: realizedGrossRevenue || 0,
      realizedOperatingExpense: realizedOperatingExpense || 0,
    });
  }, [institutionCapital, partnerCapital, institutionNisbah, partnerNisbah, realizedGrossRevenue, realizedOperatingExpense]);

  const complianceResult = React.useMemo(() => {
    return validateMusyarakahCompliance(checklist);
  }, [checklist]);

  const handleSaveApplication = async (submitImmediately: boolean) => {
    if (!selectedCustomer) {
      setAlertMessage({
        type: "error",
        text: "Pilih mitra nasabah terdaftar terlebih dahulu — setiap pengajuan wajib terhubung ke direktori Customer Management.",
      });
      return;
    }
    if (!projectName.trim() || institutionCapital <= 0) {
      setAlertMessage({ type: "error", text: "Lengkapi proyek usaha dan modal bank." });
      return;
    }

    try {
      setIsSubmitting(true);
      setAlertMessage(null);
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          akad: "MUSYARAKAH",
          title: `Kemitraan Musyarakah - ${projectName}`,
          customerId: selectedCustomer.id,
          commodityOrAsset: projectName,
          costPrice: institutionCapital,
          marginOrNisbah: institutionNisbah,
          sellingPrice: calcResult.totalCapital,
          downPayment: partnerCapital,
          tenorMonths,
          submitImmediately,
          notes: `Akad Syirkah Musyarakah modal bersama. Porsi Bank: ${calcResult.institutionCapitalPercentage}%, Mitra: ${calcResult.partnerCapitalPercentage}%. Nisbah laba: ${institutionNisbah}% : ${partnerNisbah}%.`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAlertMessage({
          type: "success",
          text: `Aplikasi Musyarakah ${json.data.applicationNumber} berhasil ${submitImmediately ? "diajukan ke Legal Officer" : "disimpan sebagai draf"}!`,
        });
        await fetchApplications();
        setActiveTab("list");
      } else if (json?.error?.code === "CUSTOMER_AML_BLOCKED") {
        setAlertMessage({
          type: "error",
          text: "Mitra terpilih berstatus AML FLAGGED dan tidak dapat digunakan untuk pengajuan baru. Silakan pilih mitra lain.",
        });
      } else if (json?.error?.code === "CUSTOMER_NOT_FOUND") {
        setAlertMessage({
          type: "error",
          text: "Mitra yang dipilih tidak lagi tersedia pada direktori. Silakan pilih ulang mitra.",
        });
      } else if (json?.error?.code === "CUSTOMER_CROSS_TENANT_ACCESS") {
        setAlertMessage({
          type: "error",
          text: "Mitra yang dipilih bukan milik tenant lembaga Anda. Pilih mitra dari direktori lembaga Anda sendiri.",
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
        title="Musyarakah Engine (Partnership & Joint Venture)"
        description="Pengelolaan akad kemitraan musyarakah modal bersama, pembagian nisbah keuntungan riil, dan mitigasi bagi rugi proporsional."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Manajemen Akad", href: "/contracts" },
          { label: "Musyarakah Engine" },
        ]}
        badge={
          <Badge variant="primary" dot>
            Fatwa DSN-MUI No. 08/2000
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
          <button onClick={() => setAlertMessage(null)}><X className="h-4 w-4" /></button>
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
          <Users className="h-4 w-4" />
          <span>Daftar Portofolio Kemitraan ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("calculator")}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "calculator" ? "border-[#00549c] text-[#00549c] font-bold" : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Simulasi Nisbah &amp; Buat Pengajuan</span>
        </button>

        <button
          onClick={() => setActiveTab("verification")}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "verification" ? "border-[#00549c] text-[#00549c] font-bold" : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Verifikasi Rukun Syirkah ({complianceResult.status})</span>
        </button>
      </div>

      {/* TAB 1: LIST */}
      {activeTab === "list" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#172B4D]">Direktori Kemitraan Musyarakah Terdaftar</CardTitle>
                <CardDescription className="text-xs">Data riil proyek kemitraan usaha bersama dengan pemantauan nisbah bagi hasil.</CardDescription>
              </div>
              <Button onClick={() => setActiveTab("calculator")} variant="primary" size="sm" className="text-xs font-semibold">
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Tambah Kemitraan Baru
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                <Input
                  placeholder="Cari nomor kontrak, mitra, atau nama proyek..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <select
                aria-label="Filter status kemitraan musyarakah"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-[#E2E8F0] rounded-md px-3 py-2 bg-white text-[#172B4D] font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">DRAFT</option>
                <option value="LEGAL_REVIEW">LEGAL_REVIEW</option>
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
              <div className="p-8 text-center text-xs text-[#64748B]">Tidak ada data kemitraan musyarakah terdata.</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">No. Pengajuan</th>
                    <th className="px-4 py-3">Mitra &amp; Proyek Usaha</th>
                    <th className="px-4 py-3 text-right">Modal Bank</th>
                    <th className="px-4 py-3 text-center">Nisbah Bank</th>
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
                      <td className="px-4 py-3 text-center font-mono font-bold text-[#16A36A]">{app.marginOrNisbah}%</td>
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

      {/* TAB 2: CALCULATOR & CREATE */}
      {activeTab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#00549c]" />
                <CardTitle className="text-sm font-bold text-[#172B4D]">Formulir Kemitraan Musyarakah</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Kalkulasi proporsi modal dan nisbah bagi hasil usaha. Data tersimpan ke database.
              </CardDescription>
            </CardHeader>

            {/* Tahap 3B.5: URL-direct access tetap diperiksa. */}
            {!sessionLoading && !canView && (
              <CardContent>
                <AccessDeniedPanel
                  permission="contracts:view"
                  message="Peran Anda tidak memiliki izin melihat modul akad Musyarakah."
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
                title="Data Mitra Nasabah"
                description="Pilih mitra musyarakah dari direktori Customer Management. Profil terisi otomatis dari data CIF."
              >
                <CustomerPicker value={selectedCustomer} onChange={setSelectedCustomer} />
              </SectionCard>

              {/* SECTION 2: DETAIL PROYEK USHA BERSAMA */}
              <SectionCard
                step={2}
                title="Detail Proyek Usaha Bersama"
                description="Bidang usaha syirkah yang dikelola bersama antara bank dan mitra."
              >
                <FormField label="Deskripsi Proyek Usaha Bersama" htmlFor="musyarakah-project" required>
                  <Input id="musyarakah-project" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Proyek Konstruksi / Perdagangan" />
                </FormField>
              </SectionCard>

              {/* SECTION 3: STRUKTUR MODAL & NISBAH */}
              <SectionCard
                step={3}
                title="Struktur Modal &amp; Nisbah"
                description="Penyertaan modal kedua pihak dan pembagian nisbah laba (total 100%)."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Penyertaan Modal Bank (Rp)" htmlFor="musyarakah-bankcapital" required>
                    <Input id="musyarakah-bankcapital" type="number" value={institutionCapital} onChange={(e) => setInstitutionCapital(Number(e.target.value))} />
                  </FormField>
                  <FormField label="Penyertaan Modal Mitra (Rp)" htmlFor="musyarakah-partnercapital" required>
                    <Input id="musyarakah-partnercapital" type="number" value={partnerCapital} onChange={(e) => setPartnerCapital(Number(e.target.value))} />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Nisbah Laba Bank (%)" htmlFor="musyarakah-banknisbah" required>
                    <Input
                      id="musyarakah-banknisbah"
                      type="number"
                      value={institutionNisbah}
                      min={1}
                      max={99}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setInstitutionNisbah(v);
                        setPartnerNisbah(100 - v);
                      }}
                    />
                  </FormField>
                  <FormField label="Nisbah Laba Mitra (%)" htmlFor="musyarakah-partnernisbah" required>
                    <Input
                      id="musyarakah-partnernisbah"
                      type="number"
                      value={partnerNisbah}
                      min={1}
                      max={99}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setPartnerNisbah(v);
                        setInstitutionNisbah(100 - v);
                      }}
                    />
                  </FormField>
                </div>

                <FormField label="Jangka Waktu Proyek (Bulan)" htmlFor="musyarakah-tenor" required>
                  <Input id="musyarakah-tenor" type="number" value={tenorMonths} onChange={(e) => setTenorMonths(Number(e.target.value))} />
                </FormField>
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
                  Simpan Draft Musyarakah
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveApplication(true)}
                  className="w-full sm:w-1/2 font-bold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Ajukan Kemitraan Musyarakah
                </Button>
              </div>
            </CardContent>
            )}
          </Card>

          <Card className="lg:col-span-5 border-[#E2E8F0] bg-[#F8FAFC]">
            <CardHeader className="border-b border-[#E2E8F0] pb-3">
              <CardTitle className="text-xs uppercase font-bold text-[#64748B]">Struktur Modal &amp; Nisbah</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-4 bg-white rounded-lg border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Total Modal Bersama:</span>
                  <span className="font-mono font-bold text-[#172B4D]">{formatIDR(calcResult.totalCapital)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Porsi Modal Bank:</span>
                  <span className="font-mono font-bold text-[#00549c]">{calcResult.institutionCapitalPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Porsi Modal Mitra:</span>
                  <span className="font-mono font-bold text-[#172B4D]">{calcResult.partnerCapitalPercentage}%</span>
                </div>
                <div className="border-t border-[#E2E8F0] pt-2 flex justify-between font-bold">
                  <span>Nisbah Laba Disepakati:</span>
                  <span className="font-mono text-[#16A36A]">{institutionNisbah}% : {partnerNisbah}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs border border-[#E2E8F0]">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-sm text-[#172B4D]">{selectedApp.applicationNumber}</h3>
              <button onClick={() => setSelectedApp(null)}><X className="h-4 w-4 text-[#64748B]" /></button>
            </div>
            <div className="space-y-2">
              <p><strong>Mitra:</strong> {selectedApp.customer?.name ?? selectedApp.customerName ?? "—"}</p>
              {selectedApp.customer?.cifNumber && (
                <p className="font-mono text-[10px] text-[#00549c]">CIF {selectedApp.customer.cifNumber}</p>
              )}
              <p><strong>Proyek Usaha:</strong> {selectedApp.commodityOrAsset}</p>
              <p><strong>Modal Bank:</strong> {formatIDR(selectedApp.costPrice)}</p>
              <p><strong>Nisbah Bank:</strong> {selectedApp.marginOrNisbah}%</p>
              <p><strong>Status:</strong> {selectedApp.status}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Link href={`/documents/generator?appId=${selectedApp.id}`}>
                <Button variant="primary" size="sm">Generate Draf Akad</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
