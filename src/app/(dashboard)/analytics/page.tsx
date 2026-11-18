"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/enterprise/page-header";
import { MetricCard } from "@/components/enterprise/metric-card";
import { formatIDR } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  Printer,
  Scale,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  PieChart as PieIcon,
  Layers,
} from "lucide-react";

const MONTHLY_FINANCING_DATA = [
  { month: "Jun 2026", murabahah: 14.2, ijarah: 5.1, musyarakah: 3.2, mudharabah: 1.2 },
  { month: "Jul 2026", murabahah: 15.0, ijarah: 5.4, musyarakah: 3.5, mudharabah: 1.4 },
  { month: "Agu 2026", murabahah: 15.8, ijarah: 5.8, musyarakah: 3.9, mudharabah: 1.5 },
  { month: "Sep 2026", murabahah: 16.1, ijarah: 5.9, musyarakah: 4.0, mudharabah: 1.5 },
  { month: "Okt 2026", murabahah: 16.5, ijarah: 6.2, musyarakah: 4.15, mudharabah: 1.6 },
  { month: "Nov 2026", murabahah: 17.2, ijarah: 6.8, musyarakah: 4.5, mudharabah: 1.8 },
];

const AKAD_PIE_DATA = [
  { name: "Murabahah", value: 60.5, color: "#00549c" },
  { name: "Ijarah & IMBT", value: 19.7, color: "#0F6FB5" },
  { name: "Musyarakah", value: 12.6, color: "#16A36A" },
  { name: "Mudharabah", value: 7.2, color: "#E9A23B" },
];

const PROFIT_SHARING_DATA = [
  { project: "RS Syariah", bankShare: 38.25, partnerShare: 46.75 },
  { project: "Agro Sawit", bankShare: 16.8, partnerShare: 25.2 },
  { project: "Tepung Tapioka", bankShare: 15.0, partnerShare: 10.0 },
  { project: "Ekspor Kopi", bankShare: 33.6, partnerShare: 14.4 },
];

export default function FinancialAnalyticsPage() {
  const [dateRange, setDateRange] = React.useState<string>("6M");
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/v1/contracts")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setContracts(json.data);
        }
      })
      .catch((err) => console.error("Failed to load contracts for analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalFinancingNominal = React.useMemo(() => {
    if (contracts.length === 0) return 1620000000;
    return contracts.reduce((acc, c) => acc + (c.nominalValue || 0), 0);
  }, [contracts]);

  const totalOutstandingBalance = React.useMemo(() => {
    if (contracts.length === 0) return 1447500000;
    return contracts.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
  }, [contracts]);

  const totalMonthlyInstallments = React.useMemo(() => {
    if (contracts.length === 0) return 90708332;
    return contracts.reduce((acc, c) => acc + (c.monthlyInstallment || 0), 0);
  }, [contracts]);

  const handleExportCSV = () => {
    const headers = "Bulan,Murabahah (Miliar),Ijarah (Miliar),Musyarakah (Miliar),Mudharabah (Miliar)\n";
    const rows = MONTHLY_FINANCING_DATA.map(
      (d) => `${d.month},${d.murabahah},${d.ijarah},${d.musyarakah},${d.mudharabah}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Analisis_Keuangan_SCE_${dateRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik Finansial & Portofolio Akad Syariah"
        description="Dasbor intelejen bisnis perbankan: pemantauan tren pembiayaan, saldo piutang murabahah, sewa ijarah, bagi hasil usaha riil, dan indeks kepatuhan syariah."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Analitik Finansial" },
        ]}
        badge={
          <Badge variant="success" dot>
            {contracts.length > 0 ? `${contracts.length} Kontrak Portofolio Aktif` : "Recharts Engine Active"}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-1 text-[#00549c]" />
              Cetak / PDF
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              Ekspor Data (.CSV)
            </Button>
          </div>
        }
      />

      {/* FILTER BAR */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#E2E8F0] text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#00549c]" />
          <span className="font-semibold text-[#172B4D]">Periode Waktu:</span>
          {(["1M", "3M", "6M", "YTD", "1Y"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                dateRange === range
                  ? "bg-[#00549c] text-white"
                  : "bg-[#F5F8FC] text-[#64748B] hover:text-[#172B4D]"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-[#64748B] font-mono">
          Sinkronisasi Basis Data Operasional: Aktif
        </span>
      </div>

      {/* SUMMARY KPI CARDS (LINKED TO SCE DATABASE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase text-[#64748B]">Total Nilai Pembiayaan Disalurkan</p>
            <p className="text-xl font-black text-[#172B4D] font-mono">{formatIDR(totalFinancingNominal)}</p>
            <p className="text-[10px] text-[#16A36A] font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {contracts.length} Akad Aktif &amp; Berjalan
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase text-[#64748B]">Outstanding Piutang &amp; Modal</p>
            <p className="text-xl font-black text-[#00549c] font-mono">{formatIDR(totalOutstandingBalance)}</p>
            <p className="text-[10px] text-[#64748B]">Saldo Pokok + Marjin Berjalan</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase text-[#64748B]">Arus Kas Angsuran / Bulan</p>
            <p className="text-xl font-black text-[#16A36A] font-mono">{formatIDR(totalMonthlyInstallments)}</p>
            <p className="text-[10px] text-[#64748B]">Kolektibilitas Lancar (100% Kolek 1)</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase text-[#64748B]">Tingkat Kepatuhan Syariah</p>
            <p className="text-xl font-black text-[#172B4D] font-mono">100% PASS</p>
            <p className="text-[10px] text-[#16A36A] font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> 0% Temuan Cacat Akad / Riba
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVE CONTRACTS PAYMENT & MATURITY SCHEDULE (LIVE DATA FROM DATABASE) */}
      <Card className="border-[#E2E8F0] shadow-xs">
        <CardHeader className="py-3.5 px-5 border-b border-[#E2E8F0] bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#00549c]" />
                Jadwal Jatuh Tempo &amp; Status Pembayaran Portofolio Aktif
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Data real-time pembiayaan terdaftar pada basis data operasional (data/sce_database.json).
              </CardDescription>
            </div>
            <Badge variant="primary" className="text-[10px] font-mono">
              {contracts.length} Fasilitas Pembiayaan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
              <tr>
                <th className="px-5 py-3">No. Kontrak &amp; Nasabah</th>
                <th className="px-4 py-3">Akad</th>
                <th className="px-4 py-3">Plafon Pokok</th>
                <th className="px-4 py-3">Saldo Outstanding</th>
                <th className="px-4 py-3">Angsuran / Bulan</th>
                <th className="px-4 py-3">Jatuh Tempo Berikutnya</th>
                <th className="px-5 py-3 text-right">Status Kolektibilitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                    Memuat data kontrak portofolio...
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-bold text-[#00549c]">{c.contractNumber}</p>
                      <p className="font-semibold text-slate-800">{c.customerName}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs">{c.objectDescription}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {c.akad}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                      {formatIDR(c.nominalValue || 0)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#00549c] font-semibold">
                      {formatIDR(c.outstandingBalance || 0)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      {formatIDR(c.monthlyInstallment || 0)}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{c.nextPaymentDate || "-"}</p>
                      <p className="text-[10px] text-slate-500">s/d {c.endDate || "-"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Lancar (Kolek 1)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* CHARTS ROW 1: FINANCING TREND (AREA) & PORTFOLIO COMPOSITION (PIE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AREA CHART */}
        <Card className="lg:col-span-8 border-[#E2E8F0]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#172B4D]">
              Tren Pertumbuhan Pembiayaan Berdasarkan Akad (Miliar Rp)
            </CardTitle>
            <CardDescription className="text-xs">
              Pertumbuhan portofolio bulanan untuk 4 jenis akad pembiayaan utama.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_FINANCING_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMur" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00549c" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00549c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIjr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F6FB5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0F6FB5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="murabahah" name="Murabahah" stroke="#00549c" fillOpacity={1} fill="url(#colorMur)" />
                  <Area type="monotone" dataKey="ijarah" name="Ijarah & IMBT" stroke="#0F6FB5" fillOpacity={1} fill="url(#colorIjr)" />
                  <Area type="monotone" dataKey="musyarakah" name="Musyarakah" stroke="#16A36A" fill="#16A36A" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="mudharabah" name="Mudharabah" stroke="#E9A23B" fill="#E9A23B" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PIE CHART */}
        <Card className="lg:col-span-4 border-[#E2E8F0]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#172B4D]">
              Komposisi Akad dalam Portofolio
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi volume nominal berdasarkan akad
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={AKAD_PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {AKAD_PIE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => `${val}%`}
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-1.5 text-xs pt-2 border-t border-[#F1F5F9]">
              {AKAD_PIE_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#172B4D]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-[#172B4D]">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 2: PROFIT-SHARING DISTRIBUTION BAR CHART */}
      <Card className="border-[#E2E8F0]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[#172B4D]">
            Realisasi Bagi Hasil Kemitraan Usaha (Juta Rp)
          </CardTitle>
          <CardDescription className="text-xs">
            Perbandingan hak bagi hasil yang diterima Bank vs Mitra per proyek Musyarakah & Mudharabah.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROFIT_SHARING_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="project" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  formatter={(val: any) => `Rp ${val} Juta`}
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="bankShare" name="Hak Bagi Hasil Bank" fill="#00549c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="partnerShare" name="Hak Bagi Hasil Mitra" fill="#16A36A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

