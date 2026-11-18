"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/enterprise/page-header";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Scale,
  ShieldCheck,
  FileText,
  Truck,
  Building,
  UserCheck,
  Info,
  Clock,
  Sparkles,
  GitBranch,
} from "lucide-react";

interface TransactionStage {
  id: string;
  order: number;
  name: string;
  akadOrDoc: string;
  party: string;
  description: string;
  shariaValidation: "PASS" | "REVIEW" | "PENDING";
  potentialRisk: string;
  isCompleted: boolean;
}

interface MultiAkadStructure {
  id: string;
  title: string;
  contractNumber: string;
  primaryAkad: string;
  secondaryAkad: string;
  customerName: string;
  nominal: string;
  stages: TransactionStage[];
  dpsReviewed: boolean;
  dpsNotes: string;
}

const DEMO_STRUCTURES: MultiAkadStructure[] = [
  {
    id: "str-1",
    title: "Skema Murabahah bil Wakalah (Pengadaan Mesin Industri)",
    contractNumber: "SCE/2026/MRB/00142",
    primaryAkad: "MURABAHAH",
    secondaryAkad: "WAKALAH",
    customerName: "PT Berkah Logistik Nusantara",
    nominal: "Rp 650.000.000",
    dpsReviewed: true,
    dpsNotes: "Urutan akad telah terverifikasi: Wakalah selesai dan BAST terbit sebelum pengikatan akad Murabahah. Bebas risiko Bai al-Inah.",
    stages: [
      {
        id: "stg-1",
        order: 1,
        name: "Akad Wakalah (Pemberian Kuasa)",
        akadOrDoc: "Akad Wakalah No. WKL/2026/089",
        party: "LKS (Muwakkil) → Nasabah (Wakil)",
        description: "Bank memberi kuasa kepada nasabah untuk memesan & membeli mesin dari pemasok atas nama bank.",
        shariaValidation: "PASS",
        potentialRisk: "Risiko dua akad digabung (Shafqatain fi Shafqah) jika Murabahah diteken sebelum barang dibeli.",
        isCompleted: true,
      },
      {
        id: "stg-2",
        order: 2,
        name: "Pembelian & Serah Terima Barang (BAST)",
        akadOrDoc: "Faktur Supplier & BAST Fisik No. BAST/041",
        party: "Pemasok Mesin → LKS (melalui Wakil)",
        description: "Barang dibeli dari vendor dan diterima secara fisik oleh wakil bank. Hak milik sah beralih ke LKS (Milkiyyah).",
        shariaValidation: "PASS",
        potentialRisk: "Risiko menjual barang yang belum dimiliki (Nahi 'an Bai' ma Laisa 'indak).",
        isCompleted: true,
      },
      {
        id: "stg-3",
        order: 3,
        name: "Eksekusi Akad Murabahah",
        akadOrDoc: "Perjanjian Murabahah No. SCE/2026/MRB/00142",
        party: "LKS (Penjual) → Nasabah (Pembeli)",
        description: "LKS menjual barang kepada nasabah dengan pengungkapan harga beli riil dan marjin disepakati.",
        shariaValidation: "PASS",
        potentialRisk: "Perubahan sepihak marjin atau pengenaan bunga mengambang dilarang.",
        isCompleted: true,
      },
      {
        id: "stg-4",
        order: 4,
        name: "Pelunasan Angsuran Piutang",
        akadOrDoc: "Jadwal Amortisasi 36 Bulan",
        party: "Nasabah → LKS",
        description: "Nasabah membayar angsuran tetap bulanan hingga lunas sesuai akad.",
        shariaValidation: "PASS",
        potentialRisk: "Denda keterlambatan hanya boleh sebagai dana sosial (Qardhul Hasan), bukan laba LKS.",
        isCompleted: false,
      },
    ],
  },
  {
    id: "str-2",
    title: "Skema IMBT (Sewa Diakhiri Pengalihan Hak Milik)",
    contractNumber: "SCE/2026/IJR/00143",
    primaryAkad: "IJARAH",
    secondaryAkad: "WA'AD HIBAH",
    customerName: "CV Amanah Mitra Logistik",
    nominal: "Rp 1.058.000.000",
    dpsReviewed: false,
    dpsNotes: "Menunggu penelaahan DPS atas klausul pemeliharaan struktural dan dokumen Wa'ad hibah terpisah.",
    stages: [
      {
        id: "stg-21",
        order: 1,
        name: "Pengadaan Objek Sewa",
        akadOrDoc: "Bukti BPKB & Kontrak Beli LKS",
        party: "Dealer Otomotif → LKS",
        description: "LKS membeli 2 unit truk dan mencatatnya sebagai aset sah LKS.",
        shariaValidation: "PASS",
        potentialRisk: "Aset harus bebas sengketa hukum dan layak beroperasi.",
        isCompleted: true,
      },
      {
        id: "stg-22",
        order: 2,
        name: "Akad Sewa Menyewa (Ijarah Murni)",
        akadOrDoc: "Perjanjian Sewa No. SCE/2026/IJR/00143",
        party: "LKS (Mu'jir) → Nasabah (Musta'jir)",
        description: "Nasabah menyewa manfaat kendaraan dengan ujrah Rp 18,7 Juta/bulan selama 48 bulan.",
        shariaValidation: "PASS",
        potentialRisk: "Pembebanan pemeliharaan berat kepada penyewa melanggar fatwa DSN-MUI.",
        isCompleted: true,
      },
      {
        id: "stg-23",
        order: 3,
        name: "Penerbitan Surat Janji Hibah (Wa'ad)",
        akadOrDoc: "Surat Janji Hibah No. WAD/2026/012",
        party: "LKS → Nasabah",
        description: "Janji sepihak (Wa'ad Mulzim) bahwa LKS akan menghibahkan kendaraan bila seluruh ujrah lunas.",
        shariaValidation: "PASS",
        potentialRisk: "Wa'ad tidak boleh dituangkan sebagai klausul menyatu dalam akad sewa.",
        isCompleted: true,
      },
      {
        id: "stg-24",
        order: 4,
        name: "Pengalihan Hak Milik Akhir Tenor",
        akadOrDoc: "Akad Hibah / Akta Pelepasan Hak",
        party: "LKS → Nasabah",
        description: "Setelah masa sewa 48 bulan selesai dan seluruh ujrah lunas, hak milik dialihkan secara resmi.",
        shariaValidation: "PENDING",
        potentialRisk: "Pengalihan otomatis tanpa akad baru di akhir tenor cacat secara fiqh.",
        isCompleted: false,
      },
    ],
  },
];

export default function MultiAkadMappingPage() {
  const [structures, setStructures] = React.useState<MultiAkadStructure[]>(DEMO_STRUCTURES);
  const [selectedId, setSelectedId] = React.useState<string>("str-1");

  const currentStructure = structures.find((s) => s.id === selectedId) || structures[0];

  const handleToggleDPSReview = () => {
    const updated = structures.map((s) => {
      if (s.id === currentStructure.id) {
        return {
          ...s,
          dpsReviewed: !s.dpsReviewed,
          dpsNotes: !s.dpsReviewed
            ? "Telah diverifikasi oleh Dewan Pengawas Syariah: Urutan transaksi dan mitigasi risiko syariah valid."
            : "Menunggu penelaahan ulang dewan syariah.",
        };
      }
      return s;
    });
    setStructures(updated);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visualisasi Pemetaan Multi-Akad & Urutan Transaksi (Sequence Mapping)"
        description="Pemetaan visual keterkaitan antar-akad, urutan transisi kepemilikan aset, kepatuhan sekuens hukum Islam, dan mitigasi risiko cacat akad gabungan (Shafqatain fi Shafqah)."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Manajemen Akad", href: "/contracts" },
          { label: "Pemetaan Multi-Akad" },
        ]}
        badge={
          <Badge variant="primary" dot>
            Sharia Sequence Verified
          </Badge>
        }
      />

      {/* SELECTOR TABS */}
      <div className="flex border-b border-[#E2E8F0] gap-2 overflow-x-auto pb-1">
        {structures.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedId(s.id)}
            className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              selectedId === s.id
                ? "border-[#00549c] text-[#00549c] bg-[#F5F8FC]"
                : "border-transparent text-[#64748B] hover:text-[#172B4D]"
            }`}
          >
            <GitBranch className="h-4 w-4" />
            {s.title}
          </button>
        ))}
      </div>

      {/* STRUCTURE HEADER CARD */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#00549c] bg-[#DCEAF5] px-2 py-0.5 rounded">
                {currentStructure.contractNumber}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {currentStructure.primaryAkad} + {currentStructure.secondaryAkad}
              </Badge>
              <Badge variant={currentStructure.dpsReviewed ? "success" : "warning"} dot className="text-[10px]">
                {currentStructure.dpsReviewed ? "Disahkan DPS" : "Menunggu Verifikasi DPS"}
              </Badge>
            </div>
            <h3 className="font-bold text-[#172B4D] text-base">{currentStructure.title}</h3>
            <p className="text-xs text-[#64748B]">
              Nasabah: <strong>{currentStructure.customerName}</strong> • Nilai: <strong className="font-mono text-[#172B4D]">{currentStructure.nominal}</strong>
            </p>
          </div>

          <Button
            variant={currentStructure.dpsReviewed ? "outline" : "primary"}
            size="sm"
            onClick={handleToggleDPSReview}
            className="font-bold shrink-0 text-xs"
          >
            <ShieldCheck className="h-4 w-4 mr-1.5 text-[#16A36A]" />
            {currentStructure.dpsReviewed ? "Batalkan Pengesahan DPS" : "Sahkan Struktur Transaksi (DPS)"}
          </Button>
        </CardContent>
      </Card>

      {/* VISUAL FLOWCHART: HORIZONTAL TRANSACTION SEQUENCE */}
      <div className="space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B]">
          Urutan Kronologis Eksekusi Akad & Perpindahan Milkiyyah:
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {currentStructure.stages.map((stg, idx) => (
            <Card
              key={stg.id}
              className={`border-t-4 relative shadow-sm flex flex-col justify-between ${
                stg.isCompleted
                  ? "border-t-[#16A36A] border-[#E2E8F0]"
                  : "border-t-[#00549c] border-[#E2E8F0] bg-[#F8FAFC]"
              }`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#64748B] font-mono">Tahap 0{stg.order}</span>
                  <Badge variant={stg.isCompleted ? "success" : "secondary"} className="text-[9px]">
                    {stg.isCompleted ? "Tereksekusi" : "Masa Berjalan"}
                  </Badge>
                </div>

                <CardTitle className="text-xs font-bold text-[#172B4D] mt-2 leading-snug">
                  {stg.name}
                </CardTitle>
                <p className="text-[10px] font-mono font-semibold text-[#00549c]">
                  {stg.akadOrDoc}
                </p>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-3 text-xs">
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  {stg.description}
                </p>

                <div className="p-2 rounded bg-white border border-[#E2E8F0] text-[10px] space-y-1">
                  <p className="font-bold text-[#172B4D]">Para Pihak:</p>
                  <p className="text-[#64748B]">{stg.party}</p>
                </div>

                <div className="p-2 rounded bg-[#E9A23B]/10 border border-[#E9A23B]/30 text-[10px] text-[#B4690E] space-y-0.5">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>Mitigasi Risiko Fiqh:</span>
                  </p>
                  <p>{stg.potentialRisk}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* DPS REVIEW AUDIT NOTICE */}
      <Card className="border-[#00549c]/30 bg-[#F5F8FC]">
        <CardContent className="p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#00549c]">
            <Scale className="h-4 w-4" />
            <span>Keterangan Penelaahan Dewan Pengawas Syariah (DPS Review):</span>
          </div>
          <p className="text-[#172B4D] leading-relaxed">
            {currentStructure.dpsNotes}
          </p>
          <p className="text-[10px] text-[#64748B] font-mono pt-1 border-t border-[#E2E8F0]">
            Audit Landmark: Fatwa DSN-MUI No. 04/2000, No. 09/2000 & Standar Syariah AAOIFI No. 8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

