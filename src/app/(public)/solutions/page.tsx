import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Landmark, Users, Cpu, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SolutionsPage() {
  const solutions = [
    {
      id: "perbankan",
      name: "Bank Umum Syariah (BUS) & Unit Usaha Syariah (UUS)",
      icon: Landmark,
      scale: "Skala Enterprise Nasional",
      challenge: "Tingginya volume pembiayaan dari ratusan kantor cabang yang membutuhkan standardisasi draf kontrak hukum, integrasi Core Banking System (CBS), serta mitigasi risiko ketidakpatuhan syariah pada portofolio korporasi dan sindikasi.",
      solution: "Penyebaran multi-tenant dedicated atau on-premise VPC dengan integrasi single sign-on (SSO), REST API CBS, generator batch draf kontrak, serta dashboard khusus Dewan Pengawas Syariah (DPS) untuk monitoring kepatuhan level portofolio.",
      benefits: [
        "Penyelarasan template akad di seluruh jaringan kantor cabang",
        "Integrasi real-time dengan Core Banking System melalui REST API & Webhook",
        "Pencatatan jejak audit (audit log) lengkap untuk pengawasan berkala OJK",
        "Kustomisasi klausul hukum internal tanpa merusak validasi fiqh DSN-MUI",
      ],
    },
    {
      id: "bprs",
      name: "Bank Perekonomian Rakyat Syariah (BPRS)",
      icon: Building2,
      scale: "Skala Regional & Pembiayaan UMKM",
      challenge: "Keterbatasan tim legal dan komite syariah yang menyebabkan SLA persetujuan akad memakan waktu berhari-hari, serta tingginya beban biaya konsultasi fatwa berulang untuk pembiayaan modal kerja mikro.",
      solution: "Sharia Contract Engine Professional Tier yang menyediakan automasi end-to-end dari kalkulasi angsuran, verifikasi rukun syarat sah, hingga penerbitan kontrak siap cetak atau tanda tangan digital.",
      benefits: [
        "Pemangkasan waktu penerbitan akad dari 5 hari menjadi hitungan menit",
        "Verifikasi otomatis status kepemilikan barang (Milkiyyah) pada Murabahah",
        "Pengurangan risiko human error pada perhitungan bagi hasil Musyarakah/Mudharabah",
        "Format dokumen terstandarisasi yang siap diaudit oleh DPS",
      ],
    },
    {
      id: "kspps-bmt",
      name: "KSPPS & Baitul Maal wat Tamwil (BMT)",
      icon: Users,
      scale: "Koperasi Syariah & Keuangan Mikro Komunitas",
      challenge: "Ketiadaan anggaran untuk membangun sistem IT rumit dan minimnya dokumentasi baku fiqh muamalah, berisiko membuat akad koperasi terjebak dalam praktik penamaan syariah yang tidak sesuai esensi.",
      solution: "SCE Starter SaaS berbasis cloud yang dapat diakses langsung via browser tanpa instalasi server, dengan biaya langganan bulanan terjangkau dan panduan langkah demi langkah penyusunan akad syariah.",
      benefits: [
        "Biaya berlangganan terjangkau tanpa beban server lokal",
        "Antarmuka berbahasa Indonesia yang mudah digunakan pengurus koperasi",
        "Jaminan kesesuaian fatwa DSN-MUI untuk menjaga amanah anggota",
        "Penyimpanan arsip digital aman terhindar dari risiko kehilangan fisik",
      ],
    },
    {
      id: "fintech",
      name: "Fintech P2P Lending & Crowdfunding Syariah",
      icon: Cpu,
      scale: "Platform Digital & API-First Lending",
      challenge: "Kebutuhan penerbitan ratusan hingga ribuan kontrak mikro secara otomatis setiap detik via API (high-throughput), dengan penandatanganan elektronik dan validasi kepatuhan instan.",
      solution: "SCE Headless API & Webhook yang memungkinkan platform fintech mengevaluasi kepatuhan syariah dan menerbitkan e-contract dengan e-Meterai secara programmatic tanpa intervensi manual.",
      benefits: [
        "API headless dengan latensi rendah (< 30ms)",
        "Otomasi validasi nisbah dan distribusi imbal hasil pendana (lender)",
        "Dukungan tanda tangan digital bersertifikasi dan checksum SHA-256",
        "Laporan kepatuhan terstruktur untuk pelaporan triwulanan ke regulator",
      ],
    },
  ];

  return (
    <div className="space-y-16 py-12 container mx-auto max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="default">Solusi Berdasarkan Industri</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B4D]">
          Solusi Terintegrasi untuk Ekosistem Keuangan Syariah
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Dirancang untuk melayani berbagai skala lembaga keuangan, mulai dari bank umum skala nasional hingga koperasi simpan pinjam syariah dan fintech digital.
        </p>
      </div>

      {/* Solutions List */}
      <div className="space-y-8">
        {solutions.map((sol) => {
          const Icon = sol.icon;
          return (
            <Card key={sol.id} id={sol.id} className="scroll-mt-24 border-[#E2E8F0]">
              <CardHeader className="bg-[#F5F8FC] border-b border-[#E2E8F0] pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-[#00549c] text-white flex items-center justify-center font-bold">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-[#172B4D]">{sol.name}</CardTitle>
                      <CardDescription className="text-xs text-[#00549c] font-semibold">
                        {sol.scale}
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/request-demo">
                    <Button size="sm" variant="outline" className="text-xs">
                      Konsultasikan Solusi
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-md bg-white border border-[#E2E8F0] space-y-1.5">
                    <h4 className="font-bold text-[#DC3545]">Tantangan yang Dihadapi:</h4>
                    <p className="text-[#64748B] leading-relaxed">{sol.challenge}</p>
                  </div>

                  <div className="p-4 rounded-md bg-white border border-[#00549c]/20 space-y-1.5">
                    <h4 className="font-bold text-[#00549c]">Solusi Sharia Contract Engine:</h4>
                    <p className="text-[#172B4D] leading-relaxed">{sol.solution}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">
                    Manfaat Utama untuk Institusi:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sol.benefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#172B4D]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#16A36A] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA Bottom */}
      <div className="rounded-xl border border-[#00549c]/20 bg-[#F5F8FC] p-8 text-center space-y-3">
        <h3 className="text-xl font-bold text-[#172B4D]">Lembaga Anda Memiliki Kebutuhan Khusus?</h3>
        <p className="text-xs text-[#64748B]">Tim solusi kami siap membantu menganalisis arsitektur pembiayaan syariah Anda.</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/contact">
            <Button size="sm">Hubungi Tim Solusi</Button>
          </Link>
          <Link href="/pricing">
            <Button size="sm" variant="outline">Lihat Paket Langganan</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

