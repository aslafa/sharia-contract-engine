"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/enterprise/page-header";
import { MetricCard } from "@/components/enterprise/metric-card";
import { formatIDR } from "@/lib/utils";
import {
  Building2,
  Database,
  ShieldCheck,
  Activity,
  Users,
  CreditCard,
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface TenantItem {
  id: string;
  name: string;
  code: string;
  type: string;
  tier: "STARTER" | "PROFESSIONAL" | "INSTITUTIONAL";
  contractsCount: number;
  monthlyRevenue: number;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  joinedDate: string;
}

interface PendingOnboarding {
  id: string;
  institutionName: string;
  type: string;
  repName: string;
  email: string;
  requestedTier: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  submittedAt: string;
}

const INITIAL_TENANTS: TenantItem[] = [
  {
    id: "org-1",
    name: "BPRS Al-Barakah Mandiri",
    code: "BPRS-ALBARAKAH",
    type: "Bank Pembiayaan Rakyat Syariah (BPRS)",
    tier: "PROFESSIONAL",
    contractsCount: 142,
    monthlyRevenue: 4900000,
    status: "ACTIVE",
    joinedDate: "15 Jan 2026",
  },
  {
    id: "org-2",
    name: "KSPPS Baitul Maal Bintang Syariah",
    code: "KSPPS-BINTANG",
    type: "Koperasi Simpan Pinjam Syariah",
    tier: "STARTER",
    contractsCount: 38,
    monthlyRevenue: 1900000,
    status: "ACTIVE",
    joinedDate: "02 Feb 2026",
  },
  {
    id: "org-3",
    name: "PT Amanah Fintech Syariah",
    code: "FINTECH-AMANAH",
    type: "P2P Lending Syariah Terdaftar OJK",
    tier: "PROFESSIONAL",
    contractsCount: 512,
    monthlyRevenue: 4900000,
    status: "ACTIVE",
    joinedDate: "10 Feb 2026",
  },
  {
    id: "org-4",
    name: "Bank Syariah Nusantara Ventura (BUS)",
    code: "BUS-VENTURA",
    type: "Bank Umum Syariah",
    tier: "INSTITUTIONAL",
    contractsCount: 1840,
    monthlyRevenue: 12500000,
    status: "ACTIVE",
    joinedDate: "20 Jan 2026",
  },
];

const INITIAL_PENDING_REGISTRATIONS: PendingOnboarding[] = [
  {
    id: "reg-01",
    institutionName: "BPRS Hidayatullah Sejahtera",
    type: "BPRS",
    repName: "Drs. H. Syarifudin, M.M.",
    email: "syarifudin@bprshidayatullah.co.id",
    requestedTier: "PROFESSIONAL",
    status: "PENDING_REVIEW",
    submittedAt: "14 Nov 2026, 08:30 WIB",
  },
  {
    id: "reg-02",
    institutionName: "KSPPS Berkah Insan Mulia",
    type: "Koperasi Syariah",
    repName: "Ahmad Fauzan, S.E.",
    email: "fauzan@ksppsberkah.id",
    requestedTier: "STARTER",
    status: "PENDING_REVIEW",
    submittedAt: "13 Nov 2026, 16:45 WIB",
  },
];

export default function SuperAdminOverviewPage() {
  const [activeTab, setActiveTab] = React.useState<"tenants" | "onboarding" | "billing" | "system">("tenants");
  const [tenants, setTenants] = React.useState<TenantItem[]>(INITIAL_TENANTS);
  const [onboardings, setOnboardings] = React.useState<PendingOnboarding[]>(INITIAL_PENDING_REGISTRATIONS);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    try {
      const storedOnboard = localStorage.getItem("sce_admin_onboardings_v1");
      if (storedOnboard) setOnboardings(JSON.parse(storedOnboard));
      const storedTenants = localStorage.getItem("sce_admin_tenants_v1");
      if (storedTenants) setTenants(JSON.parse(storedTenants));
    } catch (e) {}
  }, []);

  const saveOnboardings = (next: PendingOnboarding[]) => {
    setOnboardings(next);
    try {
      localStorage.setItem("sce_admin_onboardings_v1", JSON.stringify(next));
    } catch (e) {}
  };

  // MRR & ARR calculation
  const totalMRR = tenants.reduce((acc, t) => acc + (t.status === "ACTIVE" ? t.monthlyRevenue : 0), 0);
  const totalARR = totalMRR * 12;

  const handleApproveRegistration = (id: string) => {
    const updated = onboardings.map((o) => (o.id === id ? { ...o, status: "APPROVED" as const } : o));
    saveOnboardings(updated);
  };

  const handleRejectRegistration = (id: string) => {
    const updated = onboardings.map((o) => (o.id === id ? { ...o, status: "REJECTED" as const } : o));
    saveOnboardings(updated);
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin SaaS Command Center"
        description="Pengawasan terpusat ekosistem multi-tenant SaaS, verifikasi registrasi institusi, metrik pendapatan berulang (MRR/ARR), dan kontrol global engine syariah."
        breadcrumbs={[
          { label: "Super Admin", href: "/admin" },
          { label: "Command Center" },
        ]}
        badge={
          <Badge variant="primary">
            Super Admin Restricted
          </Badge>
        }
      />

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Lembaga Terdaftar"
          value={`${tenants.length} Institusi`}
          subValue="BUS, BPRS, KSPPS & Fintech"
          icon={Building2}
        />
        <MetricCard
          title="Monthly Recurring Revenue (MRR)"
          value={formatIDR(totalMRR)}
          trend={{ value: "+12.8%", direction: "up", label: "vs Bulan Lalu" }}
          icon={CreditCard}
        />
        <MetricCard
          title="Annual Recurring Revenue (ARR)"
          value={formatIDR(totalARR)}
          trend={{ value: "Target Q4 Terpenuhi", direction: "up", label: "Sehat" }}
          icon={Activity}
        />
        <MetricCard
          title="Pengajuan Menunggu Verifikasi"
          value={`${onboardings.filter((o) => o.status === "PENDING_REVIEW").length} Lembaga`}
          subValue="Onboarding Review"
          icon={Clock}
        />
      </div>

      {/* TABS */}
      <div className="flex border-b border-[#E2E8F0] gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("tenants")}
          className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "tenants"
              ? "border-[#00549c] text-[#00549c] bg-[#F5F8FC]"
              : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Manajemen Institusi Tenant ({tenants.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("onboarding")}
          className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "onboarding"
              ? "border-[#00549c] text-[#00549c] bg-[#F5F8FC]"
              : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          Verifikasi Onboarding ({onboardings.filter((o) => o.status === "PENDING_REVIEW").length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "billing"
              ? "border-[#00549c] text-[#00549c] bg-[#F5F8FC]"
              : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Paket Langganan & Billing SaaS
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === "system"
              ? "border-[#00549c] text-[#00549c] bg-[#F5F8FC]"
              : "border-transparent text-[#64748B] hover:text-[#172B4D]"
          }`}
        >
          <Activity className="h-4 w-4" />
          Telemetri Sistem & Database
        </button>
      </div>

      {/* TAB 1: TENANT LIST */}
      {activeTab === "tenants" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#172B4D]">
                  Daftar Institusi Terdaftar (Active Tenants)
                </CardTitle>
                <CardDescription className="text-xs">
                  Semua institusi yang memiliki lisensi dan isolasi data aktif pada platform SCE.
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                <Input
                  placeholder="Cari institusi, kode, tipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nama Institusi</th>
                  <th className="px-4 py-3">Kode Tenant</th>
                  <th className="px-4 py-3">Jenis Lembaga</th>
                  <th className="px-4 py-3">Paket SaaS</th>
                  <th className="px-4 py-3 text-right">Volume Kontrak</th>
                  <th className="px-4 py-3 text-right">MRR (Rp/Bln)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 font-bold text-[#172B4D]">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-[#00549c]">{t.code}</td>
                    <td className="px-4 py-3 text-[#64748B]">{t.type}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#00549c] bg-[#DCEAF5] px-2 py-0.5 rounded text-[10px]">
                        {t.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[#172B4D] text-right">
                      {t.contractsCount} Akad
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-[#16A36A] text-right">
                      {formatIDR(t.monthlyRevenue)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="success" dot className="text-[10px]">
                        Aktif
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: ONBOARDING VERIFICATION */}
      {activeTab === "onboarding" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#172B4D]">
              Antrean Verifikasi Legalitas Pendaftaran Lembaga
            </CardTitle>
            <CardDescription className="text-xs">
              Verifikasi keabsahan izin OJK/Kemenkop dan dokumen perwakilan sebelum aktivasi tenant baru.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Lembaga Pendaftar</th>
                  <th className="px-4 py-3">Jenis & Paket</th>
                  <th className="px-4 py-3">Perwakilan Resmi</th>
                  <th className="px-4 py-3">Waktu Pengajuan</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {onboardings.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#172B4D]">{o.institutionName}</p>
                      <p className="text-[10px] text-[#64748B] font-mono">{o.email}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-[#172B4D]">{o.type}</p>
                      <Badge variant="secondary" className="text-[9px] mt-0.5">
                        {o.requestedTier}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 font-medium text-[#172B4D]">{o.repName}</td>

                    <td className="px-4 py-3 text-[#64748B] font-mono">{o.submittedAt}</td>

                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={o.status === "APPROVED" ? "success" : o.status === "REJECTED" ? "danger" : "warning"}
                        className="text-[10px]"
                      >
                        {o.status === "APPROVED" ? "Disetujui" : o.status === "REJECTED" ? "Ditolak" : "Menunggu Review"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {o.status === "PENDING_REVIEW" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-7 text-xs font-semibold"
                            onClick={() => handleApproveRegistration(o.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Setujui
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="h-7 text-xs font-semibold"
                            onClick={() => handleRejectRegistration(o.id)}
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Tolak
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#64748B]">Telah Diproses</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: BILLING OVERVIEW */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[#172B4D]">Paket STARTER</CardTitle>
              <CardDescription className="text-xs">Koperasi Syariah, BMT, KSPPS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-xl font-bold font-mono text-[#00549c]">Rp 1.900.000 <span className="text-xs font-normal text-[#64748B]">/ bln</span></p>
              <ul className="list-disc list-inside space-y-1 text-[#64748B]">
                <li>Maksimal 50 akad / bulan</li>
                <li>Modul Murabahah & Ijarah dasar</li>
                <li>10 Pengguna sistem</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-[#00549c] shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#00549c]">Paket PROFESSIONAL</CardTitle>
                <Badge variant="primary" className="text-[9px]">Paling Populer</Badge>
              </div>
              <CardDescription className="text-xs">BPRS & Fintech Syariah Terdaftar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-xl font-bold font-mono text-[#00549c]">Rp 4.900.000 <span className="text-xs font-normal text-[#64748B]">/ bln</span></p>
              <ul className="list-disc list-inside space-y-1 text-[#172B4D]">
                <li>Hingga 300 akad / bulan</li>
                <li>Lengkap 4 Mesin Akad (Murabahah, Ijarah, Musyarakah, Mudharabah)</li>
                <li>Dynamic Sharia Rule Engine & Diskresi DPS</li>
                <li>25 Pengguna sistem</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[#172B4D]">Paket INSTITUTIONAL</CardTitle>
              <CardDescription className="text-xs">Bank Umum Syariah (BUS/UUS)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-xl font-bold font-mono text-[#00549c]">Rp 12.500.000 <span className="text-xs font-normal text-[#64748B]">/ bln</span></p>
              <ul className="list-disc list-inside space-y-1 text-[#64748B]">
                <li>Akad tanpa batas (Unlimited)</li>
                <li>Konektivitas API Core Banking</li>
                <li>Dukungan Khusus 24/7 & SLA 99.9%</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: SYSTEM TELEMETRY */}
      {activeTab === "system" && (
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-[#172B4D]">
              Telemetri Infrastruktur & Kepatuhan Database
            </CardTitle>
            <CardDescription className="text-xs">
              Status isolasi tenant dan latensi query engine syariah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0]">
                <p className="font-bold text-[#172B4D]">Isolasi Multi-Tenant</p>
                <p className="text-[11px] text-[#16A36A] font-semibold mt-1">✓ 100% Query Terisolasi (OrgID Mandatory)</p>
              </div>
              <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0]">
                <p className="font-bold text-[#172B4D]">Database Cluster</p>
                <p className="text-[11px] text-[#00549c] font-semibold mt-1">PostgreSQL Enterprise Pool</p>
              </div>
              <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0]">
                <p className="font-bold text-[#172B4D]">Status Audit Syariah</p>
                <p className="text-[11px] text-[#16A36A] font-semibold mt-1">✓ Fatwa DSN-MUI Library Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
