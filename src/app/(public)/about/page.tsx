import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Scale, Users, Target, HeartHandshake, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutUsPage() {
  const values = [
    {
      title: "Kepatuhan Syariah Murni",
      desc: "Menjadikan fiqh muamalah bukan sekadar formalitas kepatuhan, melainkan fondasi arsitektur dari setiap baris kode sistem.",
      icon: Scale,
    },
    {
      title: "Presisi & Transparansi Perbankan",
      desc: "Seluruh perhitungan marjin, bagi hasil, dan ujrah dihitung transparan tanpa klausul tersembunyi.",
      icon: Target,
    },
    {
      title: "Keberkahan Ekonomi Umat",
      desc: "Mendukung pertumbuhan lembaga keuangan mikro (BMT/KSPPS) hingga bank umum untuk memperluas inklusi finansial syariah.",
      icon: HeartHandshake,
    },
    {
      title: "Inovasi Teknologi Terdepan",
      desc: "Menggabungkan pemodelan data modern, AI recommendation, dan tanda tangan digital anti-tamper berstandar hukum nasional.",
      icon: Award,
    },
  ];

  return (
    <div className="space-y-16 py-12 container mx-auto max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="default">Tentang Kami</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B4D]">
          Membangun Fondasi Digital Keuangan Syariah yang Kokoh & Tepercaya
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          SHARIA CONTRACT ENGINE (SCE) lahir dari kebutuhan riil industri perbankan dan keuangan syariah Indonesia akan sebuah platform manajemen akad terpusat yang menggabungkan kepatuhan fiqh absolut dengan kecepatan operasional era modern.
        </p>
      </div>

      {/* Vision & Mission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#00549c]/20 bg-[#F5F8FC]">
          <CardContent className="p-8 space-y-3">
            <div className="h-10 w-10 rounded-md bg-[#00549c] text-white flex items-center justify-center font-bold">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[#172B4D]">Visi Kami</h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Menjadi motor penggerak digitalisasi kontrak keuangan syariah terdepan di Asia Tenggara, memastikan setiap transaksi pembiayaan terlaksana secara adil, transparan, dan terbebas dari segala bentuk cacat akad.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#00549c]/20 bg-[#F5F8FC]">
          <CardContent className="p-8 space-y-3">
            <div className="h-10 w-10 rounded-md bg-[#00549c] text-white flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[#172B4D]">Misi Kami</h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Menghubungkan fatwa otoritas syariah (DSN-MUI & AAOIFI) langsung ke dalam software bisnis, memangkas biaya operasional kepatuhan bagi perbankan dan koperasi, serta melindungi hak-hak nasabah.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Values */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-[#172B4D]">Nilai-Nilai Utama</h2>
          <p className="text-xs text-[#64748B] mt-1">Prinsip kerja yang memandu setiap pengembangan fitur dalam platform SCE.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map((val) => {
            const Icon = val.icon;
            return (
              <Card key={val.title}>
                <CardContent className="p-5 space-y-2.5">
                  <div className="h-8 w-8 rounded bg-[#DCEAF5] text-[#00549c] flex items-center justify-center font-bold">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#172B4D]">{val.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{val.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-8 text-center space-y-3 max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-[#172B4D]">Tertarik Berkolaborasi dengan SCE?</h3>
        <p className="text-xs text-[#64748B]">Hubungi tim konsultan syariah dan teknologi kami untuk mendiskusikan integrasi.</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/contact">
            <Button size="sm">Hubungi Kami</Button>
          </Link>
          <Link href="/request-demo">
            <Button size="sm" variant="outline">Minta Sesi Demo</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

