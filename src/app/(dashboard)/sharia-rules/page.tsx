"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/enterprise/page-header";
import { useSession } from "@/lib/hooks/use-session";
import { AccessDeniedPanel, ReadOnlyPanel } from "@/components/enterprise/access-notice";
import { SHARIA_RULES_REGISTRY } from "@/lib/sharia/rules-registry";
import { ShariaRuleEngine } from "@/lib/sharia/engine";
import { ShariaRuleDefinition, ContractValidationReport, RuleSeverity } from "@/types/sharia";
import { AkadCategory } from "@/types/akad";
import { formatIDR } from "@/lib/utils";
import {
  Scale,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
  FileCheck2,
  Lock,
  UserCheck,
  History,
  FileText,
  HelpCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface HumanOverrideRecord {
  id: string;
  ruleCode: string;
  contractNumber: string;
  dpsReviewerName: string;
  overrideReason: string;
  conditionalNotes: string;
  timestamp: string;
  status: "APPROVED_CONDITIONAL" | "REJECTED";
}

const INITIAL_OVERRIDES: HumanOverrideRecord[] = [
  {
    id: "OVR-2026-001",
    ruleCode: "RULE-MRB-02",
    contractNumber: "SCE/MRB/2026/0043",
    dpsReviewerName: "K.H. Dr. Ahmad Mukhtar, M.A. (DPS)",
    overrideReason: "Barang medis impor masih berada di bea cukai Tanjung Priok, namun Bill of Lading (B/L) sah dan polis asuransi maritim atas nama LKS telah diserahkan dan diverifikasi.",
    conditionalNotes: "Pencairan dana tahap akhir wajib ditahan hingga fisik alat USG tiba di klinik nasabah dengan BAST resmi.",
    timestamp: "2026-02-14 14:30 WIB",
    status: "APPROVED_CONDITIONAL",
  },
];

export default function ShariaRuleEngineRegistryPage() {
  // Tahap 3B.5 — diskresi DPS (override) hanya untuk pemegang izin
  // sharia_rules:manage / sharia:override (DPS + Super Admin); server tetap
  // otoritas akhir pada setiap aksi.
  const { loading: sessionLoading, can } = useSession();
  const canViewRules = can("sharia_rules:view");
  const canManageRules = can("sharia_rules:manage") || can("sharia:override");

  const [activeTab, setActiveTab] = React.useState<"rules" | "simulator" | "overrides">("rules");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [akadFilter, setAkadFilter] = React.useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");

  // Selected Rule for Detail Drawer
  const [selectedRule, setSelectedRule] = React.useState<ShariaRuleDefinition | null>(
    SHARIA_RULES_REGISTRY[0] || null
  );

  // Human Override State
  const [overrides, setOverrides] = React.useState<HumanOverrideRecord[]>(INITIAL_OVERRIDES);
  const [overrideModalOpen, setOverrideModalOpen] = React.useState(false);
  const [overrideContractNumber, setOverrideContractNumber] = React.useState("SCE/SIM/2026/089");
  const [overrideReviewer, setOverrideReviewer] = React.useState("K.H. Dr. Ahmad Mukhtar, M.A. (Anggota DPS)");
  const [overrideReason, setOverrideReason] = React.useState("");
  const [overrideCondition, setOverrideCondition] = React.useState("");

  // Simulator State
  const [simulatorAkad, setSimulatorAkad] = React.useState<AkadCategory>("MURABAHAH");
  const [simCostPrice, setSimCostPrice] = React.useState(150000000);
  const [simProfitMargin, setSimProfitMargin] = React.useState(22500000);
  const [simIsGoodsReceived, setSimIsGoodsReceived] = React.useState(true);
  const [simDownPayment, setSimDownPayment] = React.useState(15000000);
  const [simReport, setSimReport] = React.useState<ContractValidationReport | null>(null);

  React.useEffect(() => {
    runSimulator();
  }, [simulatorAkad, simCostPrice, simProfitMargin, simIsGoodsReceived, simDownPayment]);

  const runSimulator = () => {
    let payload: Record<string, unknown> = {};

    if (simulatorAkad === "MURABAHAH") {
      payload = {
        costPrice: simCostPrice,
        profitMargin: simProfitMargin,
        sellingPrice: simCostPrice + simProfitMargin,
        downPaymentUrbun: simDownPayment,
        isGoodsReceived: simIsGoodsReceived,
      };
    } else if (simulatorAkad === "IJARAH") {
      payload = {
        assetDescription: "1 Unit Mesin CNC Industri",
        assetValue: 350000000,
        rentalFeePerMonth: 8500000,
        isImbt: true,
        waadPromiseRef: "WAAD-IMBT-2026-009",
      };
    } else if (simulatorAkad === "MUSYARAKAH") {
      payload = {
        businessScope: "Konstruksi Fasilitas Publik",
        institutionCapital: 300000000,
        partnerCapital: 200000000,
        institutionNisbah: 60,
        partnerNisbah: 40,
        lossSharingFormula: "CAPITAL_RATIO",
      };
    } else if (simulatorAkad === "MUDHARABAH") {
      payload = {
        businessField: "Perdagangan Ekspor Hasil Bumi",
        capitalShahibulMal: 250000000,
        mudharibName: "H. Ridwan Effendi",
        shahibulMalNisbah: 70,
        mudharibNisbah: 30,
        lossTerms: "FINANCIAL_LOSS_BY_SHAHIBUL_MAL_UNLESS_NEGLIGENCE",
      };
    }

    const report = ShariaRuleEngine.evaluate(simulatorAkad, payload, {
      contractNumber: `SCE/SIM/${simulatorAkad.slice(0, 3)}/LIVE`,
    });
    setSimReport(report);
  };

  const handleCreateOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;

    const newRecord: HumanOverrideRecord = {
      id: `OVR-2026-00${overrides.length + 1}`,
      ruleCode: selectedRule ? selectedRule.ruleCode : "RULE-GEN-01",
      contractNumber: overrideContractNumber,
      dpsReviewerName: overrideReviewer,
      overrideReason: overrideReason.trim(),
      conditionalNotes: overrideCondition.trim() || "Penyelesaian berkas pendukung dalam 14 hari kalender.",
      timestamp: new Date().toLocaleString("id-ID"),
      status: "APPROVED_CONDITIONAL",
    };

    setOverrides([newRecord, ...overrides]);
    setOverrideReason("");
    setOverrideCondition("");
    setOverrideModalOpen(false);
  };

  // Filtered Rules
  const filteredRules = SHARIA_RULES_REGISTRY.filter((rule) => {
    const matchesSearch =
      rule.ruleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAkad = akadFilter === "ALL" || rule.akadCategory === akadFilter;
    const matchesSeverity = severityFilter === "ALL" || rule.severity === severityFilter;
    return matchesSearch && matchesAkad && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dynamic Sharia Rule Engine"
        description="Mesin inferensi aturan kepatuhan syariah otomatis berlandaskan Fatwa DSN-MUI & standar AAOIFI, dilengkapi workflow peninjauan fatwa oleh Dewan Pengawas Syariah (DPS)."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sharia Rule Engine" },
        ]}
        badge={
          <Badge variant="primary" dot>
            {SHARIA_RULES_REGISTRY.length} Aturan Fiqh Aktif
          </Badge>
        }
      />

      {/* Tahap 3B.5 — URL-direct access: halaman & diskresi DPS mengikuti izin sesi */}
      {!sessionLoading && !canViewRules && (
        <AccessDeniedPanel
          permission="sharia_rules:view"
          message="Peran Anda tidak memiliki izin melihat Pustaka Aturan Syariah (Sharia Rule Engine)."
        />
      )}

      {!sessionLoading && canViewRules && (
      <>
      {/* METRIC OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase text-[#64748B]">Total Aturan Fiqh DSN-MUI</p>
            <p className="text-xl font-black text-[#172B4D] font-mono">{SHARIA_RULES_REGISTRY.length} Aturan</p>
            <p className="text-[10px] text-[#16A36A] font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> 100% Terverifikasi Dewan Syariah
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase text-[#64748B]">Aturan Kritis (Bloker Akad)</p>
            <p className="text-xl font-black text-[#DC3545] font-mono">
              {SHARIA_RULES_REGISTRY.filter((r) => r.severity === "CRITICAL").length} Aturan Kritis
            </p>
            <p className="text-[10px] text-[#64748B]">Mencegah Riba, Gharar & Maysir</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase text-[#64748B]">Diskresi Khusus DPS (Override)</p>
            <p className="text-xl font-black text-[#00549c] font-mono">{overrides.length} Persetujuan</p>
            <p className="text-[10px] text-[#64748B]">Didukung Berita Acara & Alasan Fiqh</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase text-[#64748B]">Metode Validasi Syariah</p>
            <p className="text-xl font-black text-[#00549c] font-mono">Rule-Based</p>
            <p className="text-[10px] text-[#16A36A] font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Deterministik Bebas Halusinasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <div className="flex border-b border-[#E2E8F0] gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "rules"
              ? "border-[#00549c] text-[#00549c] bg-[#F5F8FC]"
              : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Katalog Aturan Syariah & Landasan Fatwa
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("simulator")}
          className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "simulator"
              ? "border-[#00549c] text-[#00549c] bg-[#F5F8FC]"
              : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <Scale className="h-4 w-4" />
          Simulator Validasi Real-time (Testbed)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("overrides")}
          className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "overrides"
              ? "border-[#00549c] text-[#00549c] bg-[#F5F8FC]"
              : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Log Peninjauan & Diskresi DPS ({overrides.length})
        </button>
      </div>

      {/* TAB 1: RULES REGISTRY */}
      {activeTab === "rules" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT LIST */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-[#E2E8F0]">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                    <Input
                      placeholder="Cari kode aturan, rujukan fatwa, kata kunci fiqh..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 text-xs h-9"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={akadFilter}
                      onChange={(e) => setAkadFilter(e.target.value)}
                      className="text-xs h-9 rounded-md border border-[#E2E8F0] px-3 bg-white text-[#172B4D]"
                    >
                      <option value="ALL">Semua Akad</option>
                      <option value="MURABAHAH">Murabahah</option>
                      <option value="IJARAH">Ijarah & IMBT</option>
                      <option value="MUSYARAKAH">Musyarakah</option>
                      <option value="MUDHARABAH">Mudharabah</option>
                      <option value="GLOBAL">Aturan Global</option>
                    </select>

                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="text-xs h-9 rounded-md border border-[#E2E8F0] px-3 bg-white text-[#172B4D]"
                    >
                      <option value="ALL">Semua Tingkat</option>
                      <option value="CRITICAL">Critical (Bloker)</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 divide-y divide-[#E2E8F0] max-h-[600px] overflow-y-auto">
                {filteredRules.map((rule) => {
                  const isSelected = selectedRule?.ruleCode === rule.ruleCode;
                  return (
                    <div
                      key={rule.ruleCode}
                      onClick={() => setSelectedRule(rule)}
                      className={`p-4 cursor-pointer transition-colors text-xs ${
                        isSelected ? "bg-[#DCEAF5]/40 border-l-4 border-l-[#00549c]" : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#00549c] bg-[#DCEAF5] px-2 py-0.5 rounded text-[10px]">
                            {rule.ruleCode}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {rule.akadCategory}
                          </Badge>
                        </div>

                        <Badge
                          variant={rule.severity === "CRITICAL" ? "danger" : "warning"}
                          className="text-[10px]"
                          dot
                        >
                          {rule.severity}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-[#172B4D] text-xs mt-2">{rule.title}</h4>
                      <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">{rule.description}</p>

                      {rule.dsnMuiRef && (
                        <p className="text-[10px] text-[#0F6FB5] font-mono mt-1.5 truncate">
                          📚 {rule.dsnMuiRef}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT DETAIL INSPECTOR */}
          <div className="lg:col-span-5">
            {selectedRule ? (
              <Card className="border-[#E2E8F0] sticky top-6">
                <CardHeader className="border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#00549c] bg-[#DCEAF5] px-2 py-0.5 rounded">
                      {selectedRule.ruleCode}
                    </span>
                    <Badge variant={selectedRule.severity === "CRITICAL" ? "danger" : "warning"} dot>
                      Tingkat Kritis: {selectedRule.severity}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-[#172B4D] mt-2">
                    {selectedRule.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  <div>
                    <h5 className="font-bold text-[#172B4D] uppercase text-[10px] tracking-wider text-[#64748B]">
                      Deskripsi Fiqh & Ketentuan Akad:
                    </h5>
                    <p className="mt-1 text-[#172B4D] leading-relaxed">
                      {selectedRule.description}
                    </p>
                  </div>

                  {selectedRule.dsnMuiRef && (
                    <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#00549c]">
                        <BookOpen className="h-4 w-4 shrink-0" />
                        <span>Rujukan Fatwa DSN-MUI Resmi:</span>
                      </div>
                      <p className="text-[11px] text-[#172B4D] font-mono">
                        {selectedRule.dsnMuiRef}
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-[#16A36A]/5 rounded-lg border border-[#16A36A]/20 space-y-1">
                    <h5 className="font-bold text-[#16A36A] uppercase text-[10px]">
                      Panduan Remediasi Kepatuhan:
                    </h5>
                    <p className="text-[11px] text-[#172B4D]">
                      {selectedRule.remediationGuidance}
                    </p>
                  </div>

                  {/* HUMAN OVERRIDE ACTION — hanya pemegang izin diskresi DPS */}
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    {canManageRules ? (
                      <Button
                        variant="outline"
                        className="w-full text-xs font-semibold"
                        onClick={() => setOverrideModalOpen(true)}
                      >
                        <UserCheck className="h-4 w-4 mr-1.5 text-[#00549c]" />
                        Buka Form Diskresi DPS (Human Override)
                      </Button>
                    ) : (
                      <ReadOnlyPanel
                        message="Diskresi (override) fatwa hanya dapat dibuka oleh Dewan Pengawas Syariah (sharia_rules:manage / sharia:override)."
                      />
                    )}
                    <p className="text-[10px] text-[#64748B] text-center mt-1">
                      Hanya dapat disahkan oleh anggota Dewan Pengawas Syariah terdaftar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="p-8 text-center text-[#64748B] border border-dashed rounded-lg">
                Pilih aturan untuk melihat rincian rujukan fatwa.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#172B4D]">
                  Parameter Kontrak Uji Coba
                </CardTitle>
                <Badge variant="primary" className="font-mono text-[10px]">
                  {simulatorAkad}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Ubah parameter secara dinamis untuk menguji respons inferensi mesin aturan syariah.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Pilih Jenis Akad Pembiayaan:</label>
                <select
                  value={simulatorAkad}
                  onChange={(e) => setSimulatorAkad(e.target.value as any)}
                  className="w-full text-xs h-9 rounded-md border border-[#E2E8F0] px-3 bg-white text-[#172B4D]"
                >
                  <option value="MURABAHAH">Murabahah (Jual Beli Cost-Plus)</option>
                  <option value="IJARAH">Ijarah & IMBT (Sewa Manfaat)</option>
                  <option value="MUSYARAKAH">Musyarakah (Kemitraan Bagi Hasil)</option>
                  <option value="MUDHARABAH">Mudharabah (Kepercayaan 100% Modal Bank)</option>
                </select>
              </div>

              {simulatorAkad === "MURABAHAH" && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172B4D]">Harga Pokok Perolehan (Rp)</label>
                    <Input
                      type="number"
                      value={simCostPrice}
                      onChange={(e) => setSimCostPrice(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#172B4D]">Marjin Keuntungan Disepakati (Rp)</label>
                    <Input
                      type="number"
                      value={simProfitMargin}
                      onChange={(e) => setSimProfitMargin(Number(e.target.value))}
                    />
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#172B4D]">Status Kepemilikan Barang (Milkiyyah)</p>
                      <p className="text-[10px] text-[#64748B]">Apakah barang sudah diterima fisik oleh bank?</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={simIsGoodsReceived}
                      onChange={(e) => setSimIsGoodsReceived(e.target.checked)}
                      className="h-4 w-4 rounded text-[#00549c]"
                    />
                  </div>
                </>
              )}

              {simulatorAkad !== "MURABAHAH" && (
                <div className="p-4 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] text-[#64748B] space-y-1 text-xs">
                  <p className="font-bold text-[#172B4D]">Payload Standar {simulatorAkad} Dimuat:</p>
                  <p>Seluruh parameter rukun dan fatwa DSN-MUI dievaluasi otomatis.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SIMULATOR DIAGNOSTIC RESULTS */}
          <Card className="lg:col-span-7 border-[#E2E8F0]">
            <CardHeader className="border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#00549c]" />
                    <span>Laporan Diagnosa Mesin Syariah</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Evaluasi terhadap seluruh aturan fiqh yang relevan
                  </CardDescription>
                </div>

                <Badge
                  variant={
                    simReport?.status === "COMPLIANT"
                      ? "success"
                      : simReport?.status === "WARNING"
                      ? "warning"
                      : "danger"
                  }
                  dot
                >
                  {simReport?.status === "COMPLIANT"
                    ? "COMPLIANT (Sesuai Syariah)"
                    : simReport?.status === "WARNING"
                    ? "NEEDS_MANUAL_REVIEW (Perlu Telaah DPS)"
                    : "NON_COMPLIANT (Cacat Akad Terdeteksi)"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#64748B] uppercase text-[10px]">Indeks Kepatuhan</p>
                  <p className="text-2xl font-black font-mono text-[#172B4D]">{simReport?.overallScore} / 100</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#DC3545]">{simReport?.criticalViolations} Pelanggaran Kritis</p>
                  <p className="text-[#64748B] text-[11px]">{simReport?.totalRulesChecked} Aturan Dievaluasi</p>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {simReport?.results.map((res) => (
                  <div
                    key={res.ruleCode}
                    className={`p-3 rounded-lg border text-xs ${
                      res.isCompliant
                        ? "bg-white border-[#E2E8F0] text-[#172B4D]"
                        : "bg-[#DC3545]/5 border-[#DC3545]/20 text-[#DC3545]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        {res.isCompliant ? (
                          <CheckCircle2 className="h-4 w-4 text-[#16A36A] shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-[#DC3545] shrink-0" />
                        )}
                        <span>[{res.ruleCode}] {res.title}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono">
                        {res.severity}
                      </Badge>
                    </div>

                    <p className="mt-1 text-[11px] text-[#64748B] pl-5">{res.message}</p>

                    {res.suggestedCorrection && (
                      <div className="mt-2 ml-5 p-2 rounded bg-[#E9A23B]/10 border border-[#E9A23B]/30 text-[11px] text-[#B4690E] font-medium flex items-start gap-1.5">
                        <Scale className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#B4690E]" />
                        <span><strong>Rekomendasi Perbaikan DPS:</strong> {res.suggestedCorrection}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: OVERRIDES */}
      {activeTab === "overrides" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#172B4D]">
                  Log Peninjauan & Diskresi Fiqh Dewan Pengawas Syariah (DPS)
                </CardTitle>
                <CardDescription className="text-xs">
                  Rekam jejak persetujuan bersyarat dengan landasan fatwa tertulis dan klausul mitigasi risiko.
                </CardDescription>
              </div>

              {canManageRules && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setOverrideModalOpen(true)}
                  className="text-xs font-bold"
                >
                  <UserCheck className="h-4 w-4 mr-1.5" />
                  Catat Diskresi Fiqh DPS Baru
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">ID / Tanggal</th>
                  <th className="px-4 py-3">No. Kontrak & Aturan</th>
                  <th className="px-4 py-3">Anggota DPS Penelaah</th>
                  <th className="px-4 py-3">Alasan Diskresi Fiqh (Ijtihad)</th>
                  <th className="px-4 py-3">Syarat & Klausul Mitigasi</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {overrides.map((ovr) => (
                  <tr key={ovr.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 font-mono">
                      <p className="font-bold text-[#00549c]">{ovr.id}</p>
                      <p className="text-[10px] text-[#64748B]">{ovr.timestamp}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-[#172B4D] font-mono">{ovr.contractNumber}</p>
                      <span className="text-[10px] font-mono font-semibold text-[#00549c] bg-[#DCEAF5] px-1.5 py-0.2 rounded">
                        {ovr.ruleCode}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-bold text-[#172B4D]">
                      {ovr.dpsReviewerName}
                    </td>

                    <td className="px-4 py-3 max-w-xs text-[#172B4D]">
                      {ovr.overrideReason}
                    </td>

                    <td className="px-4 py-3 max-w-xs text-[#B4690E] font-medium">
                      ⚠️ {ovr.conditionalNotes}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <Badge variant="success" className="text-[10px]">
                        Disetujui Bersyarat
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* OVERRIDE MODAL DIALOG */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B4D]/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#00549c]" />
                <h3 className="font-bold text-[#172B4D] text-sm">
                  Formulir Pengesahan Diskresi Fiqh DPS (Human Override)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="text-[#64748B] hover:text-[#172B4D] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOverride} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nomor Kontrak Pembiayaan</label>
                <Input
                  value={overrideContractNumber}
                  onChange={(e) => setOverrideContractNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nama Anggota DPS Penelaah</label>
                <Input
                  value={overrideReviewer}
                  onChange={(e) => setOverrideReviewer(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">
                  Alasan Syariah & Landasan Fiqh (Wajib Diisi)*
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Uraikan alasan fiqh muamalah, status darurat/hajat, atau bukti pendukung sah..."
                  required
                  className="w-full rounded-md border border-[#E2E8F0] p-2 text-xs focus:ring-1 focus:ring-[#00549c] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">
                  Syarat & Ketentuan Tambahan (Mitigasi Risiko)
                </label>
                <Input
                  value={overrideCondition}
                  onChange={(e) => setOverrideCondition(e.target.value)}
                  placeholder="Contoh: Dokumen BAST wajib diserahkan maks. 7 hari kerja"
                />
              </div>

              <div className="p-3 bg-[#E9A23B]/10 rounded-lg text-[11px] text-[#B4690E] border border-[#E9A23B]/30">
                Persetujuan ini akan dicatat secara permanen di audit log lembaga dan dilaporkan kepada Otoritas Jasa Keuangan (OJK).
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOverrideModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" className="font-bold">
                  Sahkan Diskresi DPS
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
