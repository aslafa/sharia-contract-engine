import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Sparkles,
  Scale,
  FileCheck2,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
} from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      title: "Transaction Input (Entri Parameter Pembiayaan)",
      icon: FileText,
      desc: "Financing Officer atau sistem eksternal (via API) memasukkan profil nasabah, nilai pembiayaan yang diajukan, tenor, tujuan penggunaan dana, dan spesifikasi aset/usaha.",
      details: [
        "Identitas para pihak (LKS dan Nasabah / Mitra)",
        "Spesifikasi komoditas atau aset yang dibiayai",
        "Plafon pembiayaan dan struktur permodalan",
      ],
    },
    {
      number: "02",
      title: "AI & Rule-Based Akad Recommendation",
      icon: Sparkles,
      desc: "Sistem menganalisis karakteristik transaksi dan memberikan rekomendasi akad syariah paling tepat (Murabahah, Ijarah, Musyarakah, atau Mudharabah) guna mencegah salah penempatan akad.",
      details: [
        "Analisis sifat transaksi (jual beli, sewa, atau kemitraan usaha)",
        "Pencocokan profil risiko dan preferensi pengembalian modal",
        "Rekomendasi klausul khusus yang relevan sesuai fatwa",
      ],
    },
    {
      number: "03",
      title: "Automated Sharia Validation (Evaluasi Fiqh)",
      icon: Scale,
      desc: "Sharia Rule Engine mengevaluasi ratusan parameter fiqh muamalah secara real-time. Memeriksa ketiadaan unsur Riba, Gharar, Maysir, kepemilikan objek (Milkiyyah), dan batas uang muka (Urbun).",
      details: [
        "Deteksi otomatis pelanggaran kritis (Critical Violations)",
        "Pemberian skor Indeks Kepatuhan Syariah (0 - 100)",
        "Rekomendasi perbaikan seketika (Remediation Guidance) jika ada anomali",
      ],
    },
    {
      number: "04",
      title: "Smart Legal Contract Generation (Penerbitan Akad)",
      icon: FileCheck2,
      desc: "Draf kontrak hukum lengkap diterbitkan secara otomatis dengan format formal perbankan (Basmalah, identitas komparisi, pasal-pasal hak & kewajiban, ketentuan cidera janji, dan tanda tangan).",
      details: [
        "Template terstandarisasi DSN-MUI yang siap pakai",
        "Format PDF siap cetak atau penandatanganan elektronik",
        "Pemberian hash cryptographic SHA-256 untuk bukti integritas dokumen",
      ],
    },
    {
      number: "05",
      title: "Multi-Tier Approval Workflow (Alur Persetujuan)",
      icon: CheckCircle2,
      desc: "Draf akad dialirkan ke pejabat berwenang: Verifikator Kepatuhan, Anggota Dewan Pengawas Syariah (DPS) untuk persetujuan fatwa, dan Pimpinan Cabang / Direksi untuk pengesahan final.",
      details: [
        "Pemisahan peran tegas (Separation of Duties)",
        "Catatan review dan permintaan revisi klausul terpusat",
        "Otorisasi digital dengan audit trail waktu dan identitas lengkap",
      ],
    },
    {
      number: "06",
      title: "Lifecycle Monitoring & Audit Trail (Pemantauan)",
      icon: TrendingUp,
      desc: "Setelah akad aktif, sistem memantau jadwal realisasi pembayaran, pembagian bagi hasil periodik, kepatuhan paska-akad, serta menyediakan pelaporan audit komprehensif bagi OJK.",
      details: [
        "Tracking status angsuran dan penyelesaian akad",
        "Monitoring berkala kesesuaian bagi hasil dengan laporan riil",
        "Laporan kepatuhan syariah berkala untuk audit eksternal",
      ],
    },
  ];

  return (
    <div className="space-y-16 py-12 container mx-auto max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="default">Alur Proses Otomasi</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B4D]">
          Cara Kerja Sharia Contract Engine
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Enam tahapan terintegrasi yang menjembatani kebutuhan bisnis perbankan dengan ketepatan hukum fiqh muamalah dari hulu hingga hilir.
        </p>
      </div>

      {/* Steps Vertical Timeline */}
      <div className="space-y-6 max-w-4xl mx-auto">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <Card key={st.number} className="border-[#E2E8F0] hover:border-[#00549c]/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#DCEAF5] text-[#00549c] font-mono text-base font-extrabold shadow-sm">
                    {st.number}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[#00549c]" />
                      <h2 className="text-base font-bold text-[#172B4D]">{st.title}</h2>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">{st.desc}</p>

                    <div className="pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {st.details.map((d, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded bg-[#F5F8FC] border border-[#E2E8F0] text-[11px] text-[#172B4D] font-medium"
                          >
                            ✓ {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-[#00549c]/20 bg-[#DCEAF5]/40 p-8 text-center space-y-3 max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-[#172B4D]">Ingin Menyaksikan Demonstrasi Langsung?</h3>
        <p className="text-xs text-[#64748B]">Jadwalkan sesi demonstrasi privat selama 30 menit bersama Sharia Solution Architect kami.</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/request-demo">
            <Button size="sm">Jadwalkan Demo Privat</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" variant="outline">Coba 14 Hari Gratis</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

