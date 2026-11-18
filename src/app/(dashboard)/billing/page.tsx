"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/enterprise/page-header";
import { useSession } from "@/lib/hooks/use-session";
import { AccessDeniedPanel, ReadOnlyPanel } from "@/components/enterprise/access-notice";
import { formatIDR } from "@/lib/utils";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  Lock,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  period: string;
  amount: number;
  dueDate: string;
  status: "PAID" | "UNPAID" | "OVERDUE";
  paymentMethod: string;
  paidAt?: string;
}

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: "inv-01",
    invoiceNumber: "INV/SCE/2026/11/0089",
    period: "14 Nov 2026 – 14 Des 2026",
    amount: 4900000,
    dueDate: "21 Nov 2026",
    status: "PAID",
    paymentMethod: "Bank Syariah Indonesia (BSI) VA",
    paidAt: "14 Nov 2026, 11:20 WIB",
  },
  {
    id: "inv-02",
    invoiceNumber: "INV/SCE/2026/10/0074",
    period: "14 Okt 2026 – 14 Nov 2026",
    amount: 4900000,
    dueDate: "21 Okt 2026",
    status: "PAID",
    paymentMethod: "Bank Syariah Indonesia (BSI) VA",
    paidAt: "14 Okt 2026, 09:15 WIB",
  },
  {
    id: "inv-03",
    invoiceNumber: "INV/SCE/2026/09/0061",
    period: "14 Sep 2026 – 14 Okt 2026",
    amount: 4900000,
    dueDate: "21 Sep 2026",
    status: "PAID",
    paymentMethod: "Transfer Bank Muamalat",
    paidAt: "15 Sep 2026, 14:00 WIB",
  },
];

export default function TenantBillingPage() {
  // Tahap 3B.5 — billing:view untuk membuka halaman; billing:manage untuk
  // upgrade paket / faktur (hanya Administrator Institusi & Super Admin).
  const { loading: sessionLoading, can } = useSession();
  const canBillingView = can("billing:view");
  const canBillingManage = can("billing:manage");

  const [invoices, setInvoices] = React.useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [selectedPlan, setSelectedPlan] = React.useState<"STARTER" | "PROFESSIONAL" | "INSTITUTIONAL">("PROFESSIONAL");
  const [billingCycle, setBillingCycle] = React.useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
  const [pendingConfirmation, setPendingConfirmation] = React.useState(false);

  const plans = [
    {
      id: "STARTER" as const,
      name: "Starter Tier",
      target: "KSPPS, BMT & Koperasi Syariah",
      monthlyPrice: 1900000,
      annualPrice: 18240000, // 20% discount
      contractQuota: 50,
      features: [
        "Maksimal 50 akad / bulan",
        "Modul Murabahah & Ijarah dasar",
        "10 Pengguna sistem",
        "Draf kontrak standar PDF",
      ],
    },
    {
      id: "PROFESSIONAL" as const,
      name: "Professional Tier",
      target: "BPRS & Fintech Syariah Terdaftar",
      monthlyPrice: 4900000,
      annualPrice: 47040000,
      contractQuota: 300,
      isCurrent: true,
      features: [
        "Hingga 300 akad / bulan",
        "Lengkap 4 Mesin Akad (Murabahah, Ijarah, Musyarakah, Mudharabah)",
        "Dynamic Sharia Rule Engine & Diskresi DPS",
        "Multi-stage Approval Workflow (6 tahapan)",
        "25 Pengguna sistem",
      ],
    },
    {
      id: "INSTITUTIONAL" as const,
      name: "Institutional Tier",
      target: "Bank Umum Syariah (BUS/UUS)",
      monthlyPrice: 12500000,
      annualPrice: 120000000,
      contractQuota: 9999,
      features: [
        "Volume akad tanpa batas (Unlimited)",
        "Konektivitas API Core Banking",
        "Brankas dokumen tak terbatas",
        "Dukungan teknis prioritas 24/7 & SLA 99.9%",
        "Jumlah pengguna tanpa batas",
      ],
    },
  ];

  const handleCreateNewInvoice = () => {
    const newInv: InvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV/SCE/2026/12/0${Math.floor(100 + Math.random() * 900)}`,
      period: "14 Des 2026 – 14 Jan 2027",
      amount: selectedPlan === "PROFESSIONAL" ? 4900000 : selectedPlan === "STARTER" ? 1900000 : 12500000,
      dueDate: "21 Des 2026",
      status: "UNPAID",
      paymentMethod: "BSI Virtual Account (9880 2026 0043 1009)",
    };
    setInvoices([newInv, ...invoices]);
    setPendingConfirmation(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Langganan & Faktur Tagihan Institusi (Subscription & Billing)"
        description="Pengelolaan paket SaaS perbankan syariah, pemantauan kuota penggunaan akad bulanan, dan riwayat faktur institusi."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Langganan & Billing" },
        ]}
        badge={
          <Badge variant="success" dot>
            Paket Aktif: Professional
          </Badge>
        }
      />

      {/* Tahap 3B.5 — URL-direct access: billing:view wajib untuk membuka halaman */}
      {!sessionLoading && !canBillingView && (
        <AccessDeniedPanel
          permission="billing:view"
          message="Peran Anda tidak memiliki izin melihat modul Langganan & Billing. Modul ini tersedia untuk Administrator Institusi, Manajemen, Auditor, dan Super Admin."
        />
      )}

      {!sessionLoading && canBillingView && (
      <>
      {/* TOP ACTIVE PLAN CARD & USAGE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[#00549c] shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00549c] bg-[#DCEAF5] px-2 py-0.5 rounded border border-[#00549c]/20">
                Paket Aktif Lembaga
              </span>
              <Badge variant="success" dot className="text-[10px]">
                Status: Aktif Berlangganan
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-[#172B4D] mt-2">
              Professional Tier (BPRS & Fintech)
            </CardTitle>
            <CardDescription className="text-xs">
              Masa tagihan berikutnya: 14 Desember 2026 • Rp 4.900.000 / bulan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {/* USAGE METRIC BARS */}
            <div className="space-y-2">
              <div className="flex justify-between text-[#64748B] font-medium">
                <span>Penggunaan Kuota Akad:</span>
                <span className="font-mono font-bold text-[#172B4D]">
                  142 dari 300 Akad / bulan (47.3%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                <div className="h-full bg-[#00549c]" style={{ width: "47.3%" }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] space-y-0.5">
                <p className="text-[#64748B]">Kursi Pengguna Aktif</p>
                <p className="font-bold text-[#172B4D] font-mono">12 dari 25 Pengguna (48%)</p>
              </div>
              <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] space-y-0.5">
                <p className="text-[#64748B]">Kapasitas Brankas Dokumen</p>
                <p className="font-bold text-[#172B4D] font-mono">3.8 GB dari 50 GB (7.6%)</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#64748B] text-[11px]">
                Tagihan otomatis jatuh tempo setiap tanggal 14 setiap bulan.
              </span>
              {canBillingManage ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUpgradeModalOpen(true)}
                  className="text-xs font-semibold"
                >
                  Ubah / Upgrade Paket
                </Button>
              ) : (
                <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Hanya Administrator (billing:manage)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PAYMENT METHOD & DEMO NOTICE */}
        <Card className="border-[#E2E8F0] flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase font-bold text-[#64748B]">
              Instruksi Pembayaran SaaS
            </CardTitle>
            <CardDescription className="text-xs">
              Virtual Account Bank Syariah Indonesia (BSI)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0] space-y-1">
              <p className="font-bold text-[#172B4D]">BSI Virtual Account</p>
              <p className="text-xs font-mono font-bold text-[#00549c]">9880 2026 0043 1009</p>
              <p className="text-[10px] text-[#64748B]">a.n. PT Sharia Contract Engine</p>
            </div>

            <div className="p-2.5 rounded bg-[#E9A23B]/10 border border-[#E9A23B]/30 text-[11px] text-[#B4690E] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Info className="h-3 w-3" /> DEMO BILLING NOTICE
              </p>
              <p>
                Modul ini menggunakan simulasi demo data tagihan. Tidak mensimulasikan respons payment gateway eksternal riil.
              </p>
            </div>

            {canBillingManage ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNewInvoice}
                className="w-full text-xs font-bold"
              >
                Simulasi Generate Faktur Baru
              </Button>
            ) : (
              <ReadOnlyPanel message="Pembuatan faktur baru memerlukan izin 'billing:manage' (Administrator Institusi / Super Admin)." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* INVOICES TABLE */}
      <Card className="border-[#E2E8F0]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[#172B4D]">
            Riwayat Faktur & Bukti Pembayaran (Invoice History)
          </CardTitle>
          <CardDescription className="text-xs">
            Arsip faktur resmi langganan SaaS institusi untuk kepatuhan pembukuan akuntansi.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Nomor Faktur</th>
                <th className="px-4 py-3">Periode Layanan</th>
                <th className="px-4 py-3 text-right">Nominal Tagihan</th>
                <th className="px-4 py-3">Metode Bayar</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Unduh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 font-mono font-bold text-[#00549c]">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-[#172B4D]">{inv.period}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#172B4D]">
                    {formatIDR(inv.amount)}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">{inv.paymentMethod}</td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">{inv.dueDate}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={inv.status === "PAID" ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {inv.status === "PAID" ? "Lunas" : "Belum Bayar"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-[#00549c]">
                      <Download className="h-3 w-3 mr-1" /> PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* UPGRADE MODAL */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B4D]/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-[#E2E8F0] overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#172B4D] text-sm">
                  Pilih Paket Langganan Sharia Contract Engine
                </h3>
                <p className="text-xs text-[#64748B]">Tingkatkan kuota akad dan fitur kecerdasan syariah.</p>
              </div>
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(false)}
                className="text-[#64748B] hover:text-[#172B4D] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-lg border flex flex-col justify-between space-y-3 ${
                    p.id === selectedPlan
                      ? "border-[#00549c] bg-[#F5F8FC] ring-2 ring-[#00549c]"
                      : "border-[#E2E8F0]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#172B4D]">{p.name}</span>
                      {p.isCurrent && (
                        <Badge variant="primary" className="text-[9px]">Paket Anda</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[#64748B]">{p.target}</p>
                    <p className="text-base font-black font-mono text-[#00549c] pt-2">
                      {formatIDR(p.monthlyPrice)} <span className="text-xs font-normal text-[#64748B]">/ bln</span>
                    </p>
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-[#64748B]">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#16A36A] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={p.id === selectedPlan ? "primary" : "outline"}
                    size="sm"
                    className="w-full text-xs font-bold"
                    onClick={() => {
                      setSelectedPlan(p.id);
                      setUpgradeModalOpen(false);
                    }}
                  >
                    {p.id === selectedPlan ? "Tetap di Paket Ini" : "Pilih Paket Ini"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
