import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Info, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const tiers = [
    {
      name: "STARTER",
      target: "KSPPS, BMT & Koperasi Syariah",
      price: "Rp 1.490.000",
      period: "/bulan",
      illustrative: true,
      description: "Fondasi esensial untuk koperasi syariah dan BMT yang membutuhkan standardisasi akad dasar bebas riba.",
      contractQuota: "Hingga 50 akad / bulan",
      userSeats: "Maksimal 5 pengguna aktif",
      features: [
        "Basic dashboard pemantauan akad",
        "Modul dasar Murabahah dan Ijarah",
        "Pemeriksaan kepatuhan fiqh standar",
        "Basic smart contract generator (PDF)",
        "Penyimpanan dokumen cloud terenkripsi",
        "Dukungan teknis email & panduan mandiri",
      ],
      popular: false,
      ctaLabel: "Pilih Paket Starter",
      ctaHref: "/register",
    },
    {
      name: "PROFESSIONAL",
      target: "BPR Syariah (BPRS) & Fintech Syariah",
      price: "Rp 4.900.000",
      period: "/bulan",
      illustrative: true,
      description: "Solusi terlengkap untuk BPRS dan fintech yang membutuhkan validasi otomatis 4 akad dan otomasi alur DPS.",
      contractQuota: "Hingga 300 akad / bulan",
      userSeats: "Maksimal 25 pengguna aktif",
      features: [
        "Lengkap seluruh 4 modul akad (Murabahah, Ijarah, Musyarakah, Mudharabah)",
        "Sharia Rule Engine cerdas (Fatwa DSN-MUI & AAOIFI)",
        "Advanced validation & skor indeks kepatuhan instan",
        "Contract monitoring & lifecycle tracking",
        "Alur persetujuan berjenjang (Officer, DPS, Komite)",
        "Dashboard analitik & audit log siap OJK",
        "Prioritas dukungan SLA 4 jam kerja",
      ],
      popular: true,
      ctaLabel: "Mulai Uji Coba Professional",
      ctaHref: "/register",
    },
    {
      name: "INSTITUTIONAL",
      target: "Bank Umum Syariah (BUS) & Unit Usaha Syariah (UUS)",
      price: "Kustom / Sesuai Kebutuhan",
      period: "",
      illustrative: true,
      description: "Arsitektur enterprise kustom berskala nasional dengan integrasi Core Banking System dan SLA dedikasi penuh.",
      contractQuota: "Volume akad tanpa batas (Unlimited)",
      userSeats: "Pengguna tanpa batas (Unlimited)",
      features: [
        "Enterprise customization & klausul hukum spesifik bank",
        "Advanced REST API & Webhook Core Banking System (CBS)",
        "Custom approval workflows & multi-tier authorization",
        "Advanced audit reports & kepatuhan regulasi OJK / BI",
        "Single Sign-On (SAML 2.0 / Active Directory SSO)",
        "Dedicated Sharia Consultant & Account Manager 24/7",
        "Pilihan private cloud VPC atau on-premise deployment",
      ],
      popular: false,
      ctaLabel: "Hubungi Sales & Konsultan",
      ctaHref: "/request-demo",
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 bg-white space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="default">Skema Investasi Terbuka</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B4D]">
          Paket Berlangganan Sharia Contract Engine
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Pilih paket yang proporsional dengan skala portofolio pembiayaan institusi Anda. Seluruh paket mencakup isolasi keamanan multi-tenant tingkat perbankan.
        </p>

        {/* Illustrative Notice Pill */}
        <div className="inline-flex items-center gap-2 p-2 rounded-md bg-[#F5F8FC] border border-[#E2E8F0] text-[11px] text-[#64748B]">
          <Info className="h-3.5 w-3.5 text-[#00549c] shrink-0" />
          <span>Biaya yang ditampilkan merupakan harga estimasi ilustratif sebelum konfigurasi resmi disepakati.</span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`flex flex-col justify-between relative ${
              tier.popular ? "border-[#00549c] shadow-lg ring-1 ring-[#00549c]" : "border-[#E2E8F0]"
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#00549c] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Paling Banyak Dipilih
                </span>
              </div>
            )}

            <CardHeader className="pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-[#172B4D]">{tier.name}</CardTitle>
                <Badge variant={tier.popular ? "primary" : "secondary"} className="text-[10px]">
                  {tier.target.split("&")[0]}
                </Badge>
              </div>

              <CardDescription className="text-xs text-[#64748B] mt-2 leading-relaxed">
                {tier.description}
              </CardDescription>

              <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#172B4D] font-mono tabular-nums">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-xs text-[#64748B]">{tier.period}</span>
                  )}
                </div>
                {tier.illustrative && (
                  <p className="text-[10px] text-[#64748B] mt-0.5">*Estimasi paket ilustratif</p>
                )}
              </div>

              <div className="mt-3 p-2 bg-[#F5F8FC] rounded-md border border-[#E2E8F0] text-[11px] font-semibold text-[#00549c]">
                {tier.contractQuota} • {tier.userSeats}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Cakupan Fitur Modul:
              </h4>
              <ul className="space-y-2 text-xs text-[#172B4D]">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#16A36A] shrink-0 mt-0.5" />
                    <span className="leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-4 border-t border-[#E2E8F0]">
              <Link href={tier.ctaHref} className="w-full">
                <Button
                  className="w-full text-xs font-semibold"
                  variant={tier.popular ? "default" : "outline"}
                >
                  {tier.ctaLabel}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Comparison FAQ / Guarantee */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-8 space-y-4 max-w-4xl mx-auto">
        <h3 className="text-base font-bold text-[#172B4D]">Komitmen Implementasi Transparan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#64748B]">
          <div className="space-y-1 bg-white p-3.5 rounded border border-[#E2E8F0]">
            <strong className="text-[#172B4D]">Uji Coba 14 Hari Tanpa Risiko:</strong>
            <p>Akses penuh modul Professional selama 14 hari tanpa biaya komitmen awal.</p>
          </div>
          <div className="space-y-1 bg-white p-3.5 rounded border border-[#E2E8F0]">
            <strong className="text-[#172B4D]">Jaminan Kedaulatan Data:</strong>
            <p>Seluruh dokumen dan database tetap menjadi milik sah institusi Anda tanpa lock-in vendor.</p>
          </div>
          <div className="space-y-1 bg-white p-3.5 rounded border border-[#E2E8F0]">
            <strong className="text-[#172B4D]">Pendampingan Fatwa DSN:</strong>
            <p>Penyelarasan kustomisasi draf kontrak bersama dewan pengawas syariah institusi Anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
