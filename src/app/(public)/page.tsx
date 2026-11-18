import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ShieldCheck,
  ArrowRight,
  Cpu,
  Lock,
  Workflow,
  Scale,
  Building2,
  CheckCircle2,
  Sparkles,
  FileText,
  FileCheck2,
  TrendingUp,
  Clock,
  Layers,
  ChevronRight,
  Users,
  Database,
  CalendarCheck,
  Award,
  Zap,
} from "lucide-react";

import { TypingHeroTitle } from "@/components/ui/typing-hero-title";

export default function HomePage() {
  const workflowSteps = [
    {
      step: "01",
      title: "Transaction Input",
      desc: "Input data pembiayaan, profil nasabah, dan kebutuhan aset atau modal kerja.",
      icon: FileText,
    },
    {
      step: "02",
      title: "AI Recommendation",
      desc: "Rekomendasi jenis akad paling tepat (Murabahah, Ijarah, Musyarakah, Mudharabah).",
      icon: Sparkles,
    },
    {
      step: "03",
      title: "Sharia Validation",
      desc: "Pemeriksaan otomatis ratusan fatwa DSN-MUI & AAOIFI (Zero Riba, Milkiyyah, Nisbah).",
      icon: Scale,
    },
    {
      step: "04",
      title: "Contract Generation",
      desc: "Penerbitan draf akad hukum formal terstandarisasi dengan klausul baku dan e-Meterai.",
      icon: FileCheck2,
    },
    {
      step: "05",
      title: "Approval Workflow",
      desc: "Persetujuan berjenjang: Financing Officer, DPS, hingga Komite Pembiayaan.",
      icon: CheckCircle2,
    },
    {
      step: "06",
      title: "Lifecycle Monitoring",
      desc: "Pemantauan realisasi angsuran, bagi hasil berkala, audit log, dan kepatuhan berkala.",
      icon: TrendingUp,
    },
  ];

  const fourAkads = [
    {
      id: "murabahah",
      code: "MURABAHAH",
      name: "Murabahah Engine",
      tag: "Jual Beli Cost-Plus",
      fatwa: "Fatwa DSN-MUI No. 04 & 111",
      desc: "Akad jual beli barang dengan penegasan harga perolehan pokok dan marjin keuntungan yang disepakati secara transparan.",
      capabilities: [
        "Kalkulasi marjin & jadwal angsuran transparan",
        "Validasi penerimaan & penguasaan barang (Milkiyyah)",
        "Aturan sah uang muka (Urbun) DSN-MUI No. 13",
        "Pemisahan klausul denda ke dana kebajikan (Qardh)",
      ],
      href: "/sharia-contracts#murabahah",
      icon: FileText,
    },
    {
      id: "ijarah",
      code: "IJARAH",
      name: "Ijarah & IMBT Engine",
      tag: "Sewa & Sewa Beli",
      fatwa: "Fatwa DSN-MUI No. 09 & 27",
      desc: "Akad pemindahan hak guna manfaat barang atau jasa dengan imbalan ujrah, atau diakhiri janji pemindahan kepemilikan aset (IMBT).",
      capabilities: [
        "Pemisahan janji Wa'd dari akad pokok sewa",
        "Klausul baku pemeliharaan struktural pemberi sewa",
        "Opsi pemindahan kepemilikan (Hibah atau Jual)",
        "Perhitungan amortisasi ujrah per periode",
      ],
      href: "/sharia-contracts#ijarah",
      icon: Layers,
    },
    {
      id: "musyarakah",
      code: "MUSYARAKAH",
      name: "Musyarakah Engine",
      tag: "Kemitraan Modal & Bagi Hasil",
      fatwa: "Fatwa DSN-MUI No. 08 & 114",
      desc: "Akad kemitraan usaha dengan kontribusi modal dari masing-masing pihak. Keuntungan dibagi berdasarkan nisbah, rugi berdasarkan porsi modal.",
      capabilities: [
        "Verifikasi kontribusi modal riil para pihak (> 0)",
        "Validasi total rasio nisbah genap 100%",
        "Penegakan hukum Al-Ghurmu bil Ghunmi (rugi proporsional)",
        "Dukungan skema Musyarakah Mutanaqisah (MMQ)",
      ],
      href: "/sharia-contracts#musyarakah",
      icon: Users,
    },
    {
      id: "mudharabah",
      code: "MUDHARABAH",
      name: "Mudharabah Engine",
      tag: "Investasi Kepercayaan",
      fatwa: "Fatwa DSN-MUI No. 07 & 115",
      desc: "Akad investasi 100% modal dari lembaga (Shahibul Mal) kepada nasabah pengelola usaha (Mudharib) dengan pembagian hasil berkeadilan.",
      capabilities: [
        "100% penyediaan modal oleh Shahibul Mal",
        "Penetapan nisbah persentase murni tanpa bunga tetap",
        "Klausul larangan garansi modal sepihak dari Mudharib",
        "Pelaporan realisasi kinerja usaha secara periodik",
      ],
      href: "/sharia-contracts#mudharabah",
      icon: TrendingUp,
    },
  ];

  const institutionSolutions = [
    {
      title: "Bank Umum Syariah (BUS) & UUS",
      desc: "Standardisasi ribuan akad pembiayaan konsumer, komersial, dan sindikasi dengan integrasi Core Banking System dan single sign-on enterprise.",
      tag: "Skala Nasional",
      badge: "Enterprise",
      href: "/solutions#perbankan",
    },
    {
      title: "Bank Perekonomian Rakyat Syariah (BPRS)",
      desc: "Otomasi draf pembiayaan UMKM dan agunan, mempercepat SLA persetujuan dari 5 hari menjadi hitungan menit dengan kepatuhan DPS terjamin.",
      tag: "Regional & UMKM",
      badge: "Pertumbuhan Tinggi",
      href: "/solutions#bprs",
    },
    {
      title: "KSPPS & Baitul Maal wat Tamwil (BMT)",
      desc: "Solusi SaaS siap pakai tanpa infrastruktur server mahal. Memastikan akad mikro dan simpan-pinjam syariah bebas dari unsur riba dan gharar.",
      tag: "Koperasi Syariah",
      badge: "Efisien & Mudah",
      href: "/solutions#kspps-bmt",
    },
    {
      title: "Fintech P2P Lending Syariah",
      desc: "API-driven contract generator untuk platform pendanaan peer-to-peer dan securities crowdfunding syariah dengan validasi real-time.",
      tag: "Digital Lending",
      badge: "API-First",
      href: "/solutions#fintech",
    },
  ];

  return (
    <div className="space-y-0 bg-[#F5F8FC]">
      {/* 1. HERO SECTION (DEEP NAVY ENTERPRISE ACCENT) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#071D36] via-[#00386b] to-[#00549c] pt-20 pb-24 lg:pt-28 lg:pb-32 text-white border-b border-[#0F6FB5]/30">
        {/* Subtle Geometric Background Overlay */}
        <div
          className="absolute inset-0 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"
          aria-hidden="true"
        />
        {/* Soft Ambient Radial Lights */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#38BDF8]/15 blur-[120px] rounded-full pointer-events-none"
          aria-hidden="true"
        />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <TypingHeroTitle />
          </div>

          <p className="mt-6 text-sm sm:text-lg text-[#DCEAF5] max-w-3xl mx-auto leading-relaxed font-normal">
            Transform Islamic financial contract management through AI-powered akad recommendations, automated compliance validation, and intelligent contract lifecycle monitoring.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-7 gap-2 bg-white text-[#00549c] hover:bg-[#F0F7FF] font-bold shadow-lg shadow-black/20 text-sm transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/request-demo">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 px-7 text-sm font-semibold text-white border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
              >
                Request a Demo
              </Button>
            </Link>
          </div>

          {/* Social Proof / Institutions Supported */}
          <div className="mt-16 pt-8 border-t border-white/15 max-w-4xl mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#BAE6FD] mb-4">
              Dirancang & Teruji untuk Ekosistem Keuangan Syariah Indonesia
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-2.5 text-xs font-semibold">
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white backdrop-blur-sm">
                Bank Umum Syariah (BUS)
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white backdrop-blur-sm">
                Unit Usaha Syariah (UUS)
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white backdrop-blur-sm">
                BPR Syariah (BPRS)
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white backdrop-blur-sm">
                KSPPS & Koperasi Syariah
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white backdrop-blur-sm">
                Baitul Maal wat Tamwil (BMT)
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white backdrop-blur-sm">
                Fintech P2P Syariah
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST AND PLATFORM STATISTICS (SOFT LIGHT-BLUE CONTRAST) */}
      <section className="py-16 bg-[#F5F8FC] border-b border-[#E2E8F0]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCEAF5] border border-[#00549c]/20 text-[#00549c] text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5 text-[#0F6FB5]" />
                <span>Platform Overview & Telemetri</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172B4D]">
                Mengakhiri Risiko Cacat Akad Sebelum Kontrak Ditandatangani
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Dalam perbankan syariah, kekeliruan klausul atau ketidakabsahan urutan transaksi dapat membatalkan keabsahan pendapatan (*non-halal income risk*). SCE bertindak sebagai benteng preventif berbasis standar fatwa DSN-MUI dan AAOIFI yang terintegrasi langsung ke operasional pembiayaan Anda.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
                  <p className="text-2xl sm:text-3xl font-black font-mono text-[#00549c]">99.8%</p>
                  <p className="text-xs font-bold text-[#172B4D] mt-1">Akurasi Fatwa DSN</p>
                  <p className="text-[11px] text-[#64748B]">Otomasi kepatuhan fiqh</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
                  <p className="text-2xl sm:text-3xl font-black font-mono text-[#00549c]">&lt; 3 Menit</p>
                  <p className="text-xs font-bold text-[#172B4D] mt-1">Penerbitan Kontrak</p>
                  <p className="text-[11px] text-[#64748B]">Dari 5 hari kerja manual</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <Card className="border-[#00549c]/25 shadow-md bg-white overflow-hidden">
                <CardHeader className="bg-[#DCEAF5]/40 border-b border-[#E2E8F0] py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#00549c]" />
                      <CardTitle className="text-xs uppercase font-bold text-[#172B4D] tracking-wide">
                        Live Sharia Telemetry Engine
                      </CardTitle>
                    </div>
                    <Badge variant="success" dot>Aktif & Siap Audit</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] flex items-center justify-between">
                    <span className="font-semibold text-[#172B4D]">Pemeriksaan Larangan Riba</span>
                    <span className="text-[#16A36A] font-bold">✓ Zero Interest Passed</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] flex items-center justify-between">
                    <span className="font-semibold text-[#172B4D]">Kepemilikan Objek (Milkiyyah)</span>
                    <span className="text-[#16A36A] font-bold">✓ BAST Tervalidasi</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] flex items-center justify-between">
                    <span className="font-semibold text-[#172B4D]">Keseimbangan Nisbah Bagi Hasil</span>
                    <span className="text-[#16A36A] font-bold">✓ Total 100.00%</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] flex items-center justify-between">
                    <span className="font-semibold text-[#172B4D]">Integritas Dokumen & e-Meterai</span>
                    <span className="text-[#00549c] font-bold font-mono">SHA-256 Verified</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR AKAD ENGINE CARDS (SOFT TINTED BLUE BACKGROUND) */}
      <section id="akad-modules" className="py-20 bg-[#EBF3FA] border-b border-[#E2E8F0]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#00549c]/20 text-[#00549c] text-xs font-bold mb-3 shadow-sm">
              <Layers className="h-3.5 w-3.5 text-[#0F6FB5]" />
              <span>4 Modul Akad Pokok Perbankan Syariah</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172B4D]">
              Spesialisasi Engine Akad Fiqh Muamalah
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B]">
              Setiap akad dilengkapi kalkulator finansial presisi desimal, validator rukun dan syarat sah DSN-MUI, serta draf klausul hukum baku.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fourAkads.map((akad) => {
              const Icon = akad.icon;
              return (
                <Card
                  key={akad.id}
                  className="bg-white border-[#E2E8F0] hover:border-[#00549c] hover:shadow-lg transition-all duration-300 flex flex-col justify-between rounded-xl overflow-hidden"
                >
                  <div>
                    <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0] pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[#DCEAF5] border border-[#00549c]/20 flex items-center justify-center text-[#00549c] shadow-sm">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold text-[#172B4D]">{akad.name}</CardTitle>
                            <span className="text-[11px] font-bold text-[#00549c] uppercase">
                              {akad.tag}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-mono text-[10px] bg-[#DCEAF5] text-[#00549c] border-[#00549c]/20">
                          {akad.code}
                        </Badge>
                      </div>
                      <div className="pt-2 text-[10px] text-[#64748B] flex items-center gap-1 font-medium">
                        <Award className="h-3 w-3 text-[#E9A23B]" />
                        <span>Rujukan: {akad.fatwa}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-5 space-y-4">
                      <p className="text-xs text-[#172B4D] leading-relaxed">
                        {akad.desc}
                      </p>

                      <div className="space-y-2 pt-1">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                          Kemampuan Utama Engine:
                        </h4>
                        <ul className="space-y-1.5 text-xs text-[#64748B]">
                          {akad.capabilities.map((cap, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#16A36A] shrink-0 mt-0.5" />
                              <span className="leading-snug">{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-5 pt-0">
                    <Link href={akad.href}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between text-xs text-[#00549c] border-[#00549c]/25 hover:bg-[#DCEAF5]/30 hover:border-[#00549c]"
                      >
                        <span>Pelajari Selengkapnya</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. HOW SCE WORKS (CLEAN WHITE BACKGROUND WITH HORIZONTAL PROCESS) */}
      <section className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCEAF5] border border-[#00549c]/20 text-[#00549c] text-xs font-bold mb-3 shadow-sm">
              <Workflow className="h-3.5 w-3.5 text-[#0F6FB5]" />
              <span>Workflow Otomasi Terintegrasi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172B4D]">
              Alur Kerja Pemrosesan Kontrak Terstruktur
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B]">
              Enam tahapan transparan dari inisiasi transaksi, telaah fatwa, penerbitan kontrak, hingga monitoring portofolio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            {workflowSteps.map((wf, idx) => {
              const Icon = wf.icon;
              return (
                <div
                  key={wf.step}
                  className="bg-[#F5F8FC] p-4.5 rounded-xl border border-[#E2E8F0] flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#00549c]/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-black text-[#00549c] bg-[#DCEAF5] px-2 py-0.5 rounded-md border border-[#00549c]/20">
                        {wf.step}
                      </span>
                      <Icon className="h-4 w-4 text-[#0F6FB5]" />
                    </div>
                    <h3 className="font-bold text-xs text-[#172B4D] mb-1 leading-snug">
                      {wf.title}
                    </h3>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      {wf.desc}
                    </p>
                  </div>
                  {idx < workflowSteps.length - 1 && (
                    <div className="hidden lg:block text-right pt-2 text-[#94A3B8] font-bold">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link href="/how-it-works">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs text-[#00549c] border-[#00549c]/30">
                <span>Lihat Panduan Lengkap Alur Kerja 6 Tahap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. SHARIA COMPLIANCE CAPABILITIES (SOFT LIGHT-BLUE BACKGROUND) */}
      <section className="py-20 bg-[#F5F8FC] border-b border-[#E2E8F0]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCEAF5] border border-[#00549c]/20 text-[#00549c] text-xs font-bold mb-3 shadow-sm">
              <Scale className="h-3.5 w-3.5 text-[#0F6FB5]" />
              <span>Kepatuhan Fatwa Teruji</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172B4D]">
              Kemampuan Sharia Rule Engine
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B]">
              Pustaka aturan kepatuhan digital yang memverifikasi setiap klausul transaksi secara otomatis sebelum draf disahkan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="h-8 w-8 rounded-lg bg-[#DCEAF5] flex items-center justify-center text-[#00549c] mb-2 font-bold">
                  01
                </div>
                <CardTitle className="text-xs uppercase font-bold text-[#00549c]">
                  Zero-Riba & Non-Bunga
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#64748B] space-y-2.5">
                <p className="leading-relaxed">
                  Menolak seluruh formula persentase bunga tersembunyi. Keuntungan wajib murni berupa marjin jual beli yang ditegaskan atau nisbah bagi hasil usaha riil.
                </p>
                <div className="pt-2 border-t border-[#F1F5F9] font-medium text-[#172B4D]">
                  ✓ Fatwa DSN-MUI No. 04 & AAOIFI Standard No. 8
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="h-8 w-8 rounded-lg bg-[#DCEAF5] flex items-center justify-center text-[#00549c] mb-2 font-bold">
                  02
                </div>
                <CardTitle className="text-xs uppercase font-bold text-[#00549c]">
                  Anti-Gharar & Kejelasan Objek
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#64748B] space-y-2.5">
                <p className="leading-relaxed">
                  Memastikan spesifikasi objek jual beli (*mabi&apos;*) atau sewa (*ma&apos;jur*) terdeskripsikan secara detail, ada wujudnya, dan halal menurut syariat.
                </p>
                <div className="pt-2 border-t border-[#F1F5F9] font-medium text-[#172B4D]">
                  ✓ Fatwa DSN-MUI No. 09 & 111
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="h-8 w-8 rounded-lg bg-[#DCEAF5] flex items-center justify-center text-[#00549c] mb-2 font-bold">
                  03
                </div>
                <CardTitle className="text-xs uppercase font-bold text-[#00549c]">
                  Al-Ghurmu bil Ghunmi (Keadilan Risiko)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#64748B] space-y-2.5">
                <p className="leading-relaxed">
                  Menolak klausul pembebanan kerugian sepihak pada akad syirkah. Kerugian finansial wajib ditanggung bersama secara proporsional sesuai porsi modal riil.
                </p>
                <div className="pt-2 border-t border-[#F1F5F9] font-medium text-[#172B4D]">
                  ✓ Fatwa DSN-MUI No. 08 & 114
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. SOLUTIONS BY INSTITUTION TYPE (CLEAN WHITE BACKGROUND) */}
      <section className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCEAF5] border border-[#00549c]/20 text-[#00549c] text-xs font-bold mb-3 shadow-sm">
              <Building2 className="h-3.5 w-3.5 text-[#0F6FB5]" />
              <span>Solusi Institusional Terarah</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172B4D]">
              Disesuaikan dengan Karakteristik Lembaga Anda
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B]">
              Dari bank umum syariah skala nasional hingga koperasi simpan pinjam syariah di tingkat komunitas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {institutionSolutions.map((sol) => (
              <Card
                key={sol.title}
                className="bg-[#F5F8FC] border-[#E2E8F0] hover:border-[#00549c] hover:shadow-md transition-all flex flex-col justify-between rounded-xl"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] bg-white border-[#E2E8F0]">
                      {sol.badge}
                    </Badge>
                    <span className="text-[10px] text-[#64748B] font-semibold">{sol.tag}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172B4D] leading-snug">{sol.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{sol.desc}</p>
                </CardContent>
                <div className="p-5 pt-0">
                  <Link href={sol.href}>
                    <Button variant="outline" size="sm" className="w-full text-xs text-[#00549c] border-[#00549c]/20 hover:bg-white">
                      Pelajari Solusi
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SECURITY & GOVERNANCE (DARK NAVY CONTAINER CARD) */}
      <section className="py-20 bg-[#F5F8FC] border-b border-[#E2E8F0]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#0F6FB5]/30 bg-gradient-to-br from-[#071D36] via-[#0A2540] to-[#00386b] p-8 sm:p-14 text-white shadow-xl relative overflow-hidden">
            {/* Subtle background glow */}
            <div
              className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#38BDF8] text-xs font-bold">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Standar Keamanan Tingkat Perbankan</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Tata Kelola & Kesiapan Audit OJK / BI
                </h2>
                <p className="text-xs sm:text-sm text-[#DCEAF5] leading-relaxed">
                  Kami memahami bahwa kerahasiaan data nasabah dan catatan akad adalah aset paling berharga institusi finansial. SCE menerapkan isolasi ketat antar tenant (Row-Level Security), enkripsi AES-256 saat diam dan transit, serta sertifikat checksum SHA-256 pada setiap dokumen kontrak.
                </p>
                <div className="pt-2">
                  <Link href="/security">
                    <Button
                      size="sm"
                      className="gap-2 text-xs font-bold bg-[#38BDF8] text-[#071D36] hover:bg-white shadow-sm"
                    >
                      <span>Baca Whitepaper Keamanan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
                  <Lock className="h-5 w-5 text-[#38BDF8] mb-2" />
                  <h4 className="font-bold text-xs text-white">Tenant Data Isolation</h4>
                  <p className="text-[11px] text-[#BAE6FD] mt-1">Isolasi basis data tingkat record</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
                  <FileCheck2 className="h-5 w-5 text-[#38BDF8] mb-2" />
                  <h4 className="font-bold text-xs text-white">SHA-256 Checksum</h4>
                  <p className="text-[11px] text-[#BAE6FD] mt-1">Dokumen anti-manipulasi hukum</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
                  <Building2 className="h-5 w-5 text-[#38BDF8] mb-2" />
                  <h4 className="font-bold text-xs text-white">Role-Based IAM</h4>
                  <p className="text-[11px] text-[#BAE6FD] mt-1">Otoritas terpisah DPS & Officer</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
                  <Scale className="h-5 w-5 text-[#38BDF8] mb-2" />
                  <h4 className="font-bold text-xs text-white">OJK Compliance</h4>
                  <p className="text-[11px] text-[#BAE6FD] mt-1">Audit log terstandarisasi regulasi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING PREVIEW SECTION (LIGHT-BLUE CONTRAST) */}
      <section className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCEAF5] border border-[#00549c]/20 text-[#00549c] text-xs font-bold mb-3 shadow-sm">
              <Zap className="h-3.5 w-3.5 text-[#0F6FB5]" />
              <span>Paket Langganan B2B Transparan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172B4D]">
              Investasi Terjangkau Sesuai Skala Bisnis
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B]">
              Mulai dari paket starter untuk koperasi hingga lisensi institutional untuk bank nasional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#F8FAFC] border-[#E2E8F0] flex flex-col justify-between rounded-xl">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-[#172B4D]">STARTER</CardTitle>
                <CardDescription className="text-xs">KSPPS, BMT & Koperasi Syariah</CardDescription>
                <div className="mt-3">
                  <span className="text-2xl font-black font-mono text-[#172B4D]">Rp 1.490.000</span>
                  <span className="text-xs text-[#64748B]">/bln</span>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-[#64748B]">
                <p>• Basic dashboard monitoring</p>
                <p>• Modul dasar Murabahah & Ijarah</p>
                <p>• Kuota 50 kontrak / bulan</p>
                <p>• Basic contract generator & print</p>
              </CardContent>
              <div className="p-5 pt-0">
                <Link href="/register">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Mulai Starter
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="bg-white border-[#00549c] shadow-lg ring-2 ring-[#00549c]/30 flex flex-col justify-between relative rounded-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#00549c] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Paling Diminati
                </span>
              </div>
              <CardHeader className="pt-6">
                <CardTitle className="text-sm font-bold text-[#00549c]">PROFESSIONAL</CardTitle>
                <CardDescription className="text-xs">BPRS & Fintech Syariah</CardDescription>
                <div className="mt-3">
                  <span className="text-2xl font-black font-mono text-[#00549c]">Rp 4.900.000</span>
                  <span className="text-xs text-[#64748B]">/bln</span>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-[#172B4D]">
                <p className="font-semibold text-[#00549c]">• Seluruh 4 modul akad pokok</p>
                <p>• Full Sharia Rule Engine & DSN check</p>
                <p>• 6-Stage approval workflow</p>
                <p>• Kuota 300 kontrak / bulan</p>
                <p>• Analytics, mapping & audit log</p>
              </CardContent>
              <div className="p-5 pt-0">
                <Link href="/register">
                  <Button size="sm" className="w-full text-xs font-bold bg-[#00549c] text-white shadow-sm">
                    Pilih Professional
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="bg-[#F8FAFC] border-[#E2E8F0] flex flex-col justify-between rounded-xl">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-[#172B4D]">INSTITUTIONAL</CardTitle>
                <CardDescription className="text-xs">Bank Umum Syariah (BUS) & UUS</CardDescription>
                <div className="mt-3">
                  <span className="text-2xl font-black font-mono text-[#172B4D]">Kustom</span>
                  <span className="text-xs text-[#64748B]"> Kontak Penjualan</span>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-[#64748B]">
                <p>• Enterprise customization & CBS API</p>
                <p>• Custom approval workflows & roles</p>
                <p>• Unlimited contract volume</p>
                <p>• Dedicated Sharia consultant & SLA 99.9%</p>
                <p>• On-premise / Private VPC deployment</p>
              </CardContent>
              <div className="p-5 pt-0">
                <Link href="/request-demo">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Hubungi Sales / Demo
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION (DEEP BLUE GRADIENT BANNER) */}
      <section className="py-20 bg-[#F5F8FC]">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-[#00386b] via-[#00549c] to-[#0F6FB5] p-10 sm:p-14 text-white shadow-xl space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[#BAE6FD] text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5 text-[#FDE68A]" />
              <span>Mulai Transformasi Digital Syariah</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Jadikan Setiap Kontrak Pembiayaan Andal & Terbebas dari Cacat Akad
            </h2>
            <p className="text-xs sm:text-base text-[#DCEAF5] max-w-2xl mx-auto leading-relaxed">
              Bergabunglah dengan ekosistem perbankan syariah modern. Konsultasikan kebutuhan institusi Anda atau mulai pendaftaran tenant institusi hari ini.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-7 gap-2 bg-white text-[#00549c] hover:bg-[#F0F7FF] font-bold shadow-lg shadow-black/20 text-sm"
                >
                  <span>Daftarkan Lembaga (Get Started)</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/request-demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-7 text-sm font-semibold text-white border-white/30 bg-white/10 hover:bg-white/20"
                >
                  Jadwalkan Demo Bersama Tim Ahli
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
