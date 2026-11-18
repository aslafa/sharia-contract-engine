"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/enterprise/page-header";
import { AkadCategory } from "@/types/akad";
import { ShariaRuleEngine } from "@/lib/sharia/engine";
import { ContractValidationReport } from "@/types/sharia";
import { formatIDR } from "@/lib/utils";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Play,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Layers,
  Users,
  Briefcase,
  ArrowRight,
  Search,
  Filter,
  PlusCircle,
  Clock,
  ShieldCheck,
  FileText,
  GitBranch,
  FileCode2,
  Calendar,
  X,
  History,
  AlertCircle,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react";
import { ContractLifecycleProgressStage } from "@/lib/db/repository";

export type CentralContractStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "EXECUTED"
  | "ACTIVE"
  | "COMPLETED"
  | "EXPIRED"
  | "TERMINATED";

interface CentralContractItem {
  id: string;
  contractNumber: string;
  applicationId?: string;
  akad: AkadCategory;
  customerName: string;
  objectDescription: string;
  nominalValue: number;
  tenorMonths: number;
  status: CentralContractStatus;
  shariaStatus: "PASS" | "REVIEW" | "BLOCKED";
  startDate: string;
  endDate: string;
  nextPaymentDate: string;
  monthlyInstallment: number;
  outstandingBalance: number;
  stages?: ContractLifecycleProgressStage[];
  currentStageName?: string;
  currentProgressPercent?: number;
  approvalSteps?: any[];
  auditTrail: { action: string; actor: string; timestamp: string; details?: string }[];
}

const REGISTRY_CONTRACTS: CentralContractItem[] = [
  {
    id: "CT-001",
    contractNumber: "SCE/2026/MRB/00142",
    akad: "MURABAHAH",
    customerName: "PT Sumber Berkah Pangan",
    objectDescription: "1 Unit Cold Storage Industri 20 Ton",
    nominalValue: 517500000,
    tenorMonths: 36,
    status: "ACTIVE",
    shariaStatus: "PASS",
    startDate: "10 Feb 2026",
    endDate: "10 Feb 2029",
    nextPaymentDate: "10 Des 2026",
    monthlyInstallment: 12937500,
    outstandingBalance: 465750000,
    auditTrail: [
      { action: "Pencairan Akad Murabahah Selesai", actor: "Sistem Finansial", timestamp: "10 Feb 2026 14:00 WIB" },
      { action: "Pengesahan DPS & Direksi", actor: "K.H. Dr. Ahmad Mukhtar, M.A.", timestamp: "09 Feb 2026 16:30 WIB" },
      { action: "Verifikasi BAST Fisik", actor: "Petugas Lapangan BPRS", timestamp: "08 Feb 2026 11:20 WIB" },
    ],
  },
  {
    id: "CT-002",
    contractNumber: "SCE/2026/IJR/00143",
    akad: "IJARAH",
    customerName: "PT Presisi Logam Pratama",
    objectDescription: "Mesin Industri CNC Mazak VCN-530C (IMBT)",
    nominalValue: 650000000,
    tenorMonths: 36,
    status: "ACTIVE",
    shariaStatus: "PASS",
    startDate: "11 Feb 2026",
    endDate: "11 Feb 2029",
    nextPaymentDate: "11 Des 2026",
    monthlyInstallment: 16250000,
    outstandingBalance: 585000000,
    auditTrail: [
      { action: "Akad Sewa IMBT Ditandatangani", actor: "Direktur & Nasabah", timestamp: "11 Feb 2026 10:00 WIB" },
      { action: "Wa'ad Hibah Terpisah Terbit", actor: "Legal Officer", timestamp: "10 Feb 2026 15:00 WIB" },
    ],
  },
  {
    id: "CT-003",
    contractNumber: "SCE/2026/MSY/0011",
    akad: "MUSYARAKAH",
    customerName: "PT Graha Medika Husada",
    objectDescription: "Proyek Pembangunan RS Syariah Medika",
    nominalValue: 1200000000,
    tenorMonths: 48,
    status: "ACTIVE",
    shariaStatus: "PASS",
    startDate: "12 Feb 2026",
    endDate: "12 Feb 2030",
    nextPaymentDate: "12 Des 2026",
    monthlyInstallment: 38250000,
    outstandingBalance: 1100000000,
    auditTrail: [
      { action: "Setoran Modal Escrow Terverifikasi", actor: "Finance Manager", timestamp: "12 Feb 2026 09:15 WIB" },
    ],
  },
  {
    id: "CT-004",
    contractNumber: "SCE/2026/MDH/0001",
    akad: "MUDHARABAH",
    customerName: "H. Ahmad Fauzi",
    objectDescription: "Ekspor Kopi Arabika Gayo Organik (Muqayyadah)",
    nominalValue: 500000000,
    tenorMonths: 24,
    status: "EXECUTED",
    shariaStatus: "PASS",
    startDate: "13 Feb 2026",
    endDate: "13 Feb 2028",
    nextPaymentDate: "13 Des 2026",
    monthlyInstallment: 33600000,
    outstandingBalance: 500000000,
    auditTrail: [
      { action: "Akad Mudharabah Tereksekusi", actor: "Kepala Cabang BPRS", timestamp: "13 Feb 2026 16:00 WIB" },
    ],
  },
  {
    id: "CT-005",
    contractNumber: "SCE/2026/MRB/00143",
    akad: "MURABAHAH",
    customerName: "Klinik Medika Syariah",
    objectDescription: "1 Set Alat USG 4D General Electric",
    nominalValue: 368000000,
    tenorMonths: 24,
    status: "PENDING_APPROVAL",
    shariaStatus: "REVIEW",
    startDate: "-",
    endDate: "-",
    nextPaymentDate: "-",
    monthlyInstallment: 13800000,
    outstandingBalance: 368000000,
    auditTrail: [
      { action: "Menunggu Pengesahan DPS", actor: "Compliance Officer", timestamp: "14 Feb 2026 11:00 WIB" },
    ],
  },
  {
    id: "CT-006",
    contractNumber: "SCE/2026/MRB/00144",
    akad: "MURABAHAH",
    customerName: "Koperasi BMT Mandiri Berjamaah",
    objectDescription: "Pengadaan 50 Unit Laptop Operasional Kantor",
    nominalValue: 285000000,
    tenorMonths: 18,
    status: "UNDER_REVIEW",
    shariaStatus: "BLOCKED",
    startDate: "-",
    endDate: "-",
    nextPaymentDate: "-",
    monthlyInstallment: 14250000,
    outstandingBalance: 285000000,
    auditTrail: [
      { action: "Temuan Cacat Sequence Milkiyyah", actor: "Sharia Rule Engine", timestamp: "14 Feb 2026 13:45 WIB" },
    ],
  },
  {
    id: "CT-007",
    contractNumber: "SCE/2026/IJR/00130",
    akad: "IJARAH",
    customerName: "PT Logistik Amanah Cepat",
    objectDescription: "5 Unit Forklift Listrik 3 Ton",
    nominalValue: 420000000,
    tenorMonths: 12,
    status: "COMPLETED",
    shariaStatus: "PASS",
    startDate: "10 Feb 2025",
    endDate: "10 Feb 2026",
    nextPaymentDate: "Lunas",
    monthlyInstallment: 35000000,
    outstandingBalance: 0,
    auditTrail: [
      { action: "Akad Sewa Selesai & Berakhir Lunas", actor: "Sistem Administrasi", timestamp: "10 Feb 2026 17:00 WIB" },
    ],
  },
];

export default function ContractsManagementPage() {
  const [selectedAkadFilter, setSelectedAkadFilter] = React.useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [contractsList, setContractsList] = React.useState<CentralContractItem[]>(REGISTRY_CONTRACTS);
  const [isLoading, setIsLoading] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string>("FINANCING_OFFICER");
  const [userName, setUserName] = React.useState<string>("Petugas Institusi");

  // Selected Contract for Status Tracker Modal
  const [selectedContractForProgress, setSelectedContractForProgress] = React.useState<CentralContractItem | null>(null);
  // Selected Contract for Detail Drawer
  const [selectedContract, setSelectedContract] = React.useState<CentralContractItem | null>(null);

  // Action states for signing/activating
  const [signingNotes, setSigningNotes] = React.useState("");
  const [isSubmittingAction, setIsSubmittingAction] = React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load from API on mount
  const loadApiContracts = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/contracts");
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const mapped: CentralContractItem[] = json.data.map((c: any) => ({
          id: c.id,
          contractNumber: c.contractNumber,
          applicationId: c.applicationId,
          akad: c.akad,
          customerName: c.customerName,
          objectDescription: c.objectDescription,
          nominalValue: c.nominalValue,
          tenorMonths: c.tenorMonths,
          status: c.status || "ACTIVE",
          shariaStatus: c.shariaStatus || "PASS",
          startDate: c.startDate || "-",
          endDate: c.endDate || "-",
          nextPaymentDate: c.nextPaymentDate || "-",
          monthlyInstallment: c.monthlyInstallment || Math.round(c.nominalValue / (c.tenorMonths || 12)),
          outstandingBalance: c.outstandingBalance || c.nominalValue,
          stages: c.stages,
          currentStageName: c.currentStageName,
          currentProgressPercent: c.currentProgressPercent,
          approvalSteps: c.approvalSteps,
          auditTrail: c.auditTrail && c.auditTrail.length > 0
            ? c.auditTrail
            : [
                { action: "Pencatatan Master Kontrak", actor: "Sistem Administrasi", timestamp: "Tercatat di Repositori" },
              ],
        }));

        setContractsList(mapped);

        // Keep active progress tracker updated if open
        setSelectedContractForProgress((prev) => {
          if (!prev) return null;
          return mapped.find((m) => m.contractNumber === prev.contractNumber) || prev;
        });
      }
    } catch (err) {
      console.warn("API contracts fallback to registry:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setUserRole(json.data.user.role);
          setUserName(json.data.user.fullName);
        }
      })
      .catch(() => {});

    loadApiContracts();
  }, [loadApiContracts]);

  // Execute signing and activation of an APPROVED contract
  const handleSignAndActivate = async (contract: CentralContractItem) => {
    if (userRole === "AUDITOR") {
      setActionFeedback({
        type: "error",
        message: "Otorisasi ditolak: Auditor hanya memiliki akses pengawasan riwayat (Read-Only).",
      });
      return;
    }

    try {
      setIsSubmittingAction(true);
      setActionFeedback(null);
      const res = await fetch(`/api/v1/contracts/${contract.id || contract.contractNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIGN_AND_ACTIVATE",
          comments: signingNotes || "Akad dan jaminan telah resmi ditandatangani para pihak dan diaktifkan.",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionFeedback({
          type: "error",
          message: json.error?.message || "Gagal memproses penandatanganan akad.",
        });
        return;
      }

      setActionFeedback({
        type: "success",
        message: `✓ Berhasil: Akad ${contract.contractNumber} telah ditandatangani dan status kini AKTIF.`,
      });
      setSigningNotes("");
      await loadApiContracts();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err.message || "Terjadi kesalahan saat memproses penandatanganan akad.",
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Filtered
  const filteredContracts = contractsList.filter((c) => {
    const matchesSearch =
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.objectDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAkad = selectedAkadFilter === "ALL" || c.akad === selectedAkadFilter;
    const matchesStatus = selectedStatusFilter === "ALL" || c.status === selectedStatusFilter;
    return matchesSearch && matchesAkad && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pusat Manajemen Akad & Siklus Kontrak (Contract Lifecycle)"
        description="Direktori master seluruh siklus kontrak (Draft → Under Review → Pending Approval → Approved → Executed → Active → Completed → Expired → Terminated)."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Manajemen Akad" },
        ]}
        badge={
          <Badge variant="primary" dot>
            {contractsList.length} Kontrak Terdata
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/contracts/mapping">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                <GitBranch className="h-3.5 w-3.5 mr-1 text-[#00549c]" />
                Pemetaan Multi-Akad
              </Button>
            </Link>
            <Link href="/documents/generator">
              <Button variant="primary" size="sm" className="text-xs font-bold shadow-sm">
                <FileCode2 className="h-3.5 w-3.5 mr-1" />
                Contract Generator
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 AKAD ENGINE QUICK TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/contracts/murabahah">
          <Card className="border-[#E2E8F0] hover:border-[#00549c] transition-all hover:shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#00549c]/10 text-[#00549c]">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#172B4D]">Murabahah Engine</h4>
                  <p className="text-[10px] text-[#64748B]">Jual Beli Cost-Plus</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#64748B]" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/contracts/ijarah">
          <Card className="border-[#E2E8F0] hover:border-[#00549c] transition-all hover:shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#0F6FB5]/10 text-[#0F6FB5]">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#172B4D]">Ijarah &amp; IMBT</h4>
                  <p className="text-[10px] text-[#64748B]">Sewa &amp; Opsi Milik</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#64748B]" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/contracts/musyarakah">
          <Card className="border-[#E2E8F0] hover:border-[#00549c] transition-all hover:shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#16A36A]/10 text-[#16A36A]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#172B4D]">Musyarakah</h4>
                  <p className="text-[10px] text-[#64748B]">Kemitraan Modal</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#64748B]" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/contracts/mudharabah">
          <Card className="border-[#E2E8F0] hover:border-[#00549c] transition-all hover:shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#4E95D9]/10 text-[#00549c]">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#172B4D]">Mudharabah</h4>
                  <p className="text-[10px] text-[#64748B]">100% Modal Bank</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#64748B]" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* CENTRAL CONTRACT REGISTRY TABLE */}
      <Card className="border-[#E2E8F0]">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-[#172B4D]">
                Direktori Master Kontrak &amp; Pelacakan Siklus (Contract Registry)
              </CardTitle>
              <CardDescription className="text-xs">
                Monitoring progres 8 tahapan siklus akad dari inisiasi draf, legal, compliance, review DPS, hingga penandatanganan dan pelunasan.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/documents/generator">
                <Button variant="outline" size="sm" className="text-xs font-semibold">
                  <PlusCircle className="h-3.5 w-3.5 mr-1 text-[#00549c]" />
                  Draf Akad Baru
                </Button>
              </Link>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
              <Input
                placeholder="Cari nomor kontrak, nama nasabah, deskripsi objek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedAkadFilter}
                onChange={(e) => setSelectedAkadFilter(e.target.value)}
                className="text-xs h-9 rounded-md border border-[#E2E8F0] px-3 bg-white text-[#172B4D]"
              >
                <option value="ALL">Semua Jenis Akad</option>
                <option value="MURABAHAH">Murabahah</option>
                <option value="IJARAH">Ijarah &amp; IMBT</option>
                <option value="MUSYARAKAH">Musyarakah</option>
                <option value="MUDHARABAH">Mudharabah</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs h-9 rounded-md border border-[#E2E8F0] px-3 bg-white text-[#172B4D]"
              >
                <option value="ALL">Semua Status Siklus</option>
                <option value="DRAFT">DRAFT</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="APPROVED">APPROVED</option>
                <option value="EXECUTED">EXECUTED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">No. Kontrak</th>
                <th className="px-4 py-3">Akad</th>
                <th className="px-4 py-3">Nasabah &amp; Objek</th>
                <th className="px-4 py-3 text-right">Plafon / Nilai</th>
                <th className="px-4 py-3 text-center">Tenor</th>
                <th className="px-4 py-3 text-center">Kepatuhan Syariah</th>
                <th className="px-4 py-3 text-center">Status &amp; Tahap Berjalan</th>
                <th className="px-4 py-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredContracts.map((c) => (
                <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#00549c]">
                    {c.contractNumber}
                  </td>

                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {c.akad}
                    </Badge>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-bold text-[#172B4D]">{c.customerName}</p>
                    <p className="text-[11px] text-[#64748B] truncate max-w-xs">{c.objectDescription}</p>
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-bold text-[#172B4D]">
                    {formatIDR(c.nominalValue)}
                  </td>

                  <td className="px-4 py-3 text-center font-mono">
                    {c.tenorMonths} Bln
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={c.shariaStatus === "PASS" ? "success" : c.shariaStatus === "REVIEW" ? "warning" : "danger"}
                      className="text-[10px]"
                    >
                      {c.shariaStatus}
                    </Badge>
                  </td>

                  {/* Status Siklus & Tahap Berjalan */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge
                        variant={
                          c.status === "ACTIVE" || c.status === "COMPLETED"
                            ? "success"
                            : c.status === "PENDING_APPROVAL" || c.status === "UNDER_REVIEW"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px] font-mono font-bold"
                      >
                        {c.status}
                      </Badge>
                      {c.currentStageName && (
                        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                          {c.currentStageName}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tindakan: Tombol Lihat Progres & Detail */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedContractForProgress(c)}
                        className="h-7 text-xs font-bold gap-1 shadow-xs bg-[#00549c] hover:bg-[#004280]"
                        title="Lihat Progres Siklus Akad"
                      >
                        <Clock className="h-3 w-3" />
                        <span>Lihat Progres</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContract(c)}
                        className="h-7 text-xs text-slate-600 hover:text-slate-900 font-semibold"
                        title="Detail Akad"
                      >
                        Detail
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* =========================================================================
          1. CONTRACT STATUS TRACKER MODAL (8-STAGE VERTICAL TIMELINE)
          ========================================================================= */}
      {selectedContractForProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B4D]/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#00549c] bg-[#DCEAF5] px-2 py-0.5 rounded">
                    {selectedContractForProgress.contractNumber}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {selectedContractForProgress.akad}
                  </Badge>
                  <Badge
                    variant={
                      selectedContractForProgress.status === "ACTIVE" ||
                      selectedContractForProgress.status === "COMPLETED"
                        ? "success"
                        : selectedContractForProgress.status === "PENDING_APPROVAL" ||
                          selectedContractForProgress.status === "UNDER_REVIEW"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-[10px] font-mono font-bold"
                  >
                    {selectedContractForProgress.status}
                  </Badge>
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Pelacakan Siklus Progres Akad (Contract Status Tracker)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nasabah: <strong className="text-slate-800">{selectedContractForProgress.customerName}</strong> • Plafon: <strong className="text-[#00549c]">{formatIDR(selectedContractForProgress.nominalValue)}</strong> • Tenor: {selectedContractForProgress.tenorMonths} Bulan
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedContractForProgress(null);
                  setActionFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/50 transition-colors"
                title="Tutup Modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {/* Feedback Alert */}
              {actionFeedback && (
                <div
                  className={`p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                    actionFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {actionFeedback.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{actionFeedback.message}</span>
                  </div>
                  <button
                    onClick={() => setActionFeedback(null)}
                    className="text-xs hover:opacity-75"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Progress Summary Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-[#F5F8FC] border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Progres Keseluruhan Siklus Kontrak
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedContractForProgress.stages?.filter((s) => s.status === "COMPLETED").length || 0} dari 8 Tahap Selesai ({selectedContractForProgress.currentProgressPercent || 0}%)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide block">
                      Tahap Berjalan Saat Ini:
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00549c] text-white font-bold text-xs mt-0.5 shadow-xs">
                      <Clock className="h-3.5 w-3.5 text-sky-200" />
                      <span>{selectedContractForProgress.currentStageName || "Aktif"}</span>
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00549c] to-[#004280] transition-all duration-500 rounded-full"
                    style={{
                      width: `${selectedContractForProgress.currentProgressPercent || 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* 8-Stage Vertical Timeline */}
              <div className="space-y-1">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-[#00549c]" />
                    <span>Timeline Riwayat &amp; Alur Persetujuan Akad (8 Tahapan)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Terhubung langsung ke approval &amp; sce_database.json
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {(selectedContractForProgress.stages || []).map((stage, idx) => {
                    const isCompleted = stage.status === "COMPLETED";
                    const isCurrent = stage.status === "CURRENT";
                    const isRevision = stage.status === "REVISION_REQUESTED";
                    const isRejected = stage.status === "REJECTED";
                    const isSkipped = stage.status === "SKIPPED";

                    return (
                      <div key={idx} className="relative group">
                        {/* Timeline Icon / Dot */}
                        <div
                          className={`absolute -left-6 top-1 h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all shadow-xs ${
                            isCompleted
                              ? "bg-emerald-600 border-white text-white ring-2 ring-emerald-200"
                              : isCurrent
                              ? "bg-[#00549c] border-white text-white ring-4 ring-sky-100 animate-pulse"
                              : isRevision
                              ? "bg-amber-500 border-white text-white ring-2 ring-amber-200"
                              : isRejected
                              ? "bg-rose-600 border-white text-white ring-2 ring-rose-200"
                              : isSkipped
                              ? "bg-slate-400 border-white text-white"
                              : "bg-white border-slate-300 text-slate-400"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          ) : isCurrent ? (
                            <Clock className="h-3.5 w-3.5" />
                          ) : isRevision ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : isRejected ? (
                            <X className="h-3.5 w-3.5" />
                          ) : (
                            <span className="text-[10px] font-mono font-bold">{stage.stageNumber}</span>
                          )}
                        </div>

                        {/* Stage Card */}
                        <div
                          className={`p-4 rounded-xl border text-xs transition-all ${
                            isCurrent
                              ? "bg-sky-50/50 border-[#00549c]/40 shadow-xs ring-1 ring-[#00549c]/20"
                              : isCompleted
                              ? "bg-white border-slate-200 shadow-2xs hover:border-slate-300"
                              : isRevision
                              ? "bg-amber-50/40 border-amber-300 shadow-xs"
                              : isRejected
                              ? "bg-rose-50/40 border-rose-300 shadow-xs"
                              : "bg-slate-50/60 border-slate-200/80 opacity-80"
                          }`}
                        >
                          {/* Stage Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-500 text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded">
                                TAHAP {stage.stageNumber}
                              </span>
                              <h5 className="font-bold text-slate-900 text-sm">
                                {stage.stageName}
                              </h5>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isCurrent
                                  ? "bg-sky-50 text-[#00549c] border-sky-300 ring-1 ring-sky-200"
                                  : isRevision
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : isRejected
                                  ? "bg-rose-50 text-rose-800 border-rose-300"
                                  : isSkipped
                                  ? "bg-slate-100 text-slate-600 border-slate-200"
                                  : "bg-slate-100 text-slate-400 border-slate-200"
                              }`}
                            >
                              {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                              {isCurrent && <Clock className="h-3 w-3 text-[#00549c] animate-spin" />}
                              {isRevision && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                              {isRejected && <X className="h-3 w-3 text-rose-600" />}
                              <span>{stage.statusLabel}</span>
                            </span>
                          </div>

                          {/* Stage Info Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] py-2 border-y border-slate-200/60 bg-white/60 px-3 rounded-lg my-2">
                            <div>
                              <span className="text-slate-400">Petugas yang Menangani:</span>
                              <p className="font-semibold text-slate-800">
                                {stage.actorName} <span className="text-slate-500 font-normal">({stage.roleTitle})</span>
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-400">Tanggal &amp; Waktu:</span>
                              <p className="font-semibold text-slate-800 font-mono">
                                {stage.actionDate || "-"}
                              </p>
                            </div>
                          </div>

                          {/* Notes / Reason */}
                          <div className="space-y-1">
                            <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wide">
                              Catatan Keputusan / Keterangan:
                            </span>
                            <p className="text-slate-700 text-xs leading-relaxed italic bg-slate-50 p-2.5 rounded border border-slate-200/60">
                              &ldquo;{stage.comments || "Belum ada catatan."}&rdquo;
                            </p>
                          </div>

                          {/* Footer: Next Stage & SHA-256 */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                            <div>
                              <span className="font-semibold text-slate-600">Tahap Berikutnya:</span>{" "}
                              <span className="text-[#00549c] font-medium">{stage.nextStage || "Selesai"}</span>
                            </div>
                            {stage.sha256 && (
                              <div className="font-mono text-[9px] text-slate-400 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                <span>Hash: {stage.sha256.substring(0, 16)}...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTEGRATED ACTION PANEL: PENANDATANGANAN & AKTIVASI */}
              {selectedContractForProgress.status === "APPROVED" && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-xs text-amber-900">
                        Otorisasi Penandatanganan &amp; Aktivasi Akad (Siap Eksekusi)
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Persetujuan Komite Direksi telah terbit lengkap. Untuk mengubah status menjadi <strong className="font-mono">ACTIVE</strong>, para pihak (nasabah dan pimpinan institusi) wajib menandatangani naskah akad dan jaminan.
                      </p>
                    </div>
                  </div>

                  {userRole === "AUDITOR" ? (
                    <div className="p-2.5 rounded bg-white/80 border border-amber-200 text-amber-800 text-[11px] font-medium">
                      🔒 <strong>Mode Audit:</strong> Akses hanya-baca (Read-Only) untuk pengawasan kepatuhan syariah. Anda tidak berwenang menandatangani atau mengaktifkan akad.
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-amber-200/60">
                      <div>
                        <label className="text-[11px] font-bold text-amber-900 block mb-1">
                          Catatan Berkas Penandatanganan / Tanda Tangan Digital:
                        </label>
                        <Input
                          placeholder="Contoh: Ditandatangani basah di kantor cabang &amp; akta notaris terikat sah."
                          value={signingNotes}
                          onChange={(e) => setSigningNotes(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isSubmittingAction}
                          onClick={() => handleSignAndActivate(selectedContractForProgress)}
                          className="text-xs font-bold gap-1.5 shadow-sm bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                          {isSubmittingAction ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Memproses Aktivasi...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Tandatangani &amp; Aktifkan Akad</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedContract(selectedContractForProgress);
                  setSelectedContractForProgress(null);
                }}
                className="text-xs"
              >
                <FileText className="h-3.5 w-3.5 mr-1" /> Buka Detail Finansial
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedContractForProgress(null);
                  setActionFeedback(null);
                }}
              >
                Tutup Pelacakan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. CONTRACT DETAIL DRAWER MODAL
          ========================================================================= */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B4D]/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#00549c]">
                  {selectedContract.contractNumber}
                </span>
                <h3 className="font-bold text-[#172B4D] text-base mt-0.5">
                  Rincian Siklus Kontrak ({selectedContract.akad})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                className="text-[#64748B] hover:text-[#172B4D] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* PRIMARY DETAILS */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B]">Nasabah / Mitra:</span>
                  <p className="font-bold text-[#172B4D] text-sm">{selectedContract.customerName}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Plafon Pembiayaan:</span>
                  <p className="font-bold text-[#00549c] text-sm font-mono">{formatIDR(selectedContract.nominalValue)}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Objek Pembiayaan:</span>
                  <p className="text-[#172B4D]">{selectedContract.objectDescription}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Sisa Saldo Piutang:</span>
                  <p className="font-bold text-[#172B4D] font-mono">{formatIDR(selectedContract.outstandingBalance)}</p>
                </div>
              </div>

              {/* PAYMENT MONITORING */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#64748B]">
                  Jadwal Angsuran &amp; Peringatan Jatuh Tempo:
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded border border-[#E2E8F0] bg-white">
                    <p className="text-[10px] text-[#64748B]">Jatuh Tempo Berikutnya</p>
                    <p className="font-bold text-[#172B4D] mt-0.5">{selectedContract.nextPaymentDate}</p>
                  </div>
                  <div className="p-2.5 rounded border border-[#E2E8F0] bg-white">
                    <p className="text-[10px] text-[#64748B]">Angsuran Bulanan</p>
                    <p className="font-bold text-[#00549c] font-mono mt-0.5">{formatIDR(selectedContract.monthlyInstallment)}</p>
                  </div>
                  <div className="p-2.5 rounded border border-[#E2E8F0] bg-white">
                    <p className="text-[10px] text-[#64748B]">Masa Berakhir Kontrak</p>
                    <p className="font-bold text-[#172B4D] mt-0.5">{selectedContract.endDate}</p>
                  </div>
                </div>
              </div>

              {/* AUDIT TRAIL */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#64748B] flex items-center gap-1.5">
                  <History className="h-4 w-4 text-[#00549c]" />
                  <span>Audit Trail &amp; Rekam Jejak Kontrak:</span>
                </h4>
                <div className="space-y-1.5">
                  {selectedContract.auditTrail.map((at, idx) => (
                    <div key={idx} className="p-2.5 rounded border border-[#E2E8F0] bg-white flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#172B4D]">{at.action}</p>
                        <p className="text-[10px] text-[#64748B]">Oleh: {at.actor}</p>
                      </div>
                      <span className="text-[10px] text-[#64748B] font-mono">{at.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <Link href="/documents/generator">
                    <Button variant="outline" size="sm" className="text-xs">
                      <FileText className="h-3.5 w-3.5 mr-1" /> Buka Generator Draf
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContractForProgress(selectedContract);
                      setSelectedContract(null);
                    }}
                    className="text-xs text-[#00549c] font-bold border-[#00549c]/30 hover:bg-[#00549c]/10"
                  >
                    <Clock className="h-3.5 w-3.5 mr-1" /> Lihat Progres Siklus Akad
                  </Button>
                </div>
                <Button variant="primary" size="sm" onClick={() => setSelectedContract(null)}>
                  Tutup Drawer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
