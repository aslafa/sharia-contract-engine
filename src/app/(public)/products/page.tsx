import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Layers,
  Users,
  TrendingUp,
  Cpu,
  FileCheck2,
  Workflow,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const products = [
    {
      id: "murabahah",
      name: "Murabahah Engine",
      subtitle: "Jual Beli dengan Penegasan Harga Pokok & Marjin Keuntungan",
      icon: FileText,
      desc: "Dirancang untuk pembiayaan konsumer (KPR Syariah, kendaraan) dan modal kerja pengadaan barang. Mengotomasi kalkulasi harga perolehan, marjin, jadwal angsuran, serta syarat penguasaan objek mabi'.",
      features: [
        "Verifikasi kepemilikan sah objek jual beli sebelum akad (Milkiyyah)",
        "Transparansi harga pokok dan persentase marjin yang disepakati",
        "Perhitungan uang muka (Urbun) sesuai Fatwa DSN-MUI No. 13",
        "Pemberian diskon pelunasan lebih awal tanpa janji di muka (Fatwa No. 16)",
      ],
      href: "/sharia-contracts#murabahah",
    },
    {
      id: "ijarah",
      name: "Ijarah & IMBT Engine",
      subtitle: "Sewa-Menyewa Manfaat & Sewa Beli Berakhir Pemindahan Kepemilikan",
      icon: Layers,
      desc: "Otomasi pembiayaan sewa aset produktif (alat berat, mesin) serta IMBT (Ijarah Muntahiya Bittamlik) properti. Memastikan pemisahan dokumen akad sewa dan janji Wa'd.",
      features: [
        "Pemisahan janji pengalihan kepemilikan (Wa'd) dari akad sewa pokok",
        "Klausul baku pemeliharaan pokok menjadi beban pemilik aset (Mu'jir)",
        "Opsi hibah atau jual beli nominal pada akhir masa sewa",
        "Kalkulasi ujrah periodik dan penyesuaian tarif sewa bertahap",
      ],
      href: "/sharia-contracts#ijarah",
    },
    {
      id: "musyarakah",
      name: "Musyarakah & MMQ Engine",
      subtitle: "Kemitraan Modal Usaha dengan Bagi Hasil & Risiko Adil",
      icon: Users,
      desc: "Solusi pembiayaan proyek konstruksi, supply chain financing, dan Musyarakah Mutanaqisah (MMQ). Menjamin pembagian rugi sesuai porsi modal riil.",
      features: [
        "Validasi kontribusi modal finansial nyata dari semua pihak mitra",
        "Keseimbangan total nisbah bagi hasil genap 100%",
        "Penegakan hukum Al-Ghurmu bil Ghunmi (rugi proporsional modal)",
        "Dukungan skema pelunasan bertahap kepemilikan modal (MMQ)",
      ],
      href: "/sharia-contracts#musyarakah",
    },
    {
      id: "mudharabah",
      name: "Mudharabah Engine",
      subtitle: "Investasi Usaha Kepercayaan (100% Modal Lembaga Keuangan)",
      icon: TrendingUp,
      desc: "Model pembiayaan usaha produktif berbasis kepercayaan penuh di mana lembaga bertindak sebagai Shahibul Mal dan nasabah sebagai Mudharib.",
      features: [
        "Penyediaan 100% modal usaha dari lembaga tanpa setoran modal nasabah",
        "Bagi hasil keuntungan murni berdasarkan nisbah (bukan bunga nominal pasti)",
        "Kerugian finansial wajar ditanggung Shahibul Mal kecuali kelalaian/tafrith",
        "Modul pelaporan realisasi pendapatan dan monitoring arus kas berkala",
      ],
      href: "/sharia-contracts#mudharabah",
    },
  ];

  return (
    <div className="space-y-16 py-12 container mx-auto max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="default">Solusi Modul Produk</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B4D]">
          Arsitektur 4 Engine Kontrak & Modul Kepatuhan
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Setiap modul akad dalam Sharia Contract Engine (SCE) dibangun mandiri dengan logika validasi syariah, kalkulator amortisasi khusus, dan template hukum terverifikasi dewan syariah.
        </p>
      </div>

      {/* 4 Products Deep Dive */}
      <div className="space-y-6">
        {products.map((prod) => {
          const Icon = prod.icon;
          return (
            <Card key={prod.id} className="border-[#E2E8F0] overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-4 p-6 bg-[#F5F8FC] border-b lg:border-b-0 lg:border-r border-[#E2E8F0] flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-md bg-white border border-[#E2E8F0] text-[#00549c] flex items-center justify-center font-bold shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-[#172B4D]">{prod.name}</h2>
                    <p className="text-xs text-[#00549c] font-semibold">{prod.subtitle}</p>
                    <p className="text-xs text-[#64748B] leading-relaxed pt-1">{prod.desc}</p>
                  </div>
                  <div>
                    <Link href={prod.href}>
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                        <span>Detail Parameter Fiqh</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-8 p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Fitur & Aturan Kepatuhan Utama:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prod.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#172B4D] p-3 rounded-md bg-white border border-[#E2E8F0]">
                        <CheckCircle2 className="h-4 w-4 text-[#16A36A] shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-[#64748B] border-t border-[#E2E8F0]">
                    <span>Kesiapan Integrasi: API Core Banking & Webhook</span>
                    <span className="font-semibold text-[#00549c]">Format Ekspor: PDF Legal & Markdown</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Auxiliary Engines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <Card>
          <CardHeader>
            <div className="h-8 w-8 rounded bg-[#DCEAF5] text-[#00549c] flex items-center justify-center font-bold mb-2">
              <Cpu className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-[#172B4D]">Sharia Rule Engine</CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Evaluator ratusan aturan fiqh otomatis secara real-time dengan indeks kepatuhan instan.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-8 w-8 rounded bg-[#DCEAF5] text-[#00549c] flex items-center justify-center font-bold mb-2">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-[#172B4D]">Legal Contract Generator</CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Generator draf kontrak otomatis dengan klausul baku, identitas para pihak, dan e-meterai.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-8 w-8 rounded bg-[#DCEAF5] text-[#00549c] flex items-center justify-center font-bold mb-2">
              <Workflow className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-[#172B4D]">Multi-Tier Approval Workflow</CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Alur persetujuan berjenjang aman dengan verifikasi DPS dan catatan audit permanen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* CTA Bar */}
      <div className="rounded-xl border border-[#00549c]/20 bg-[#DCEAF5]/40 p-8 text-center space-y-3">
        <h3 className="text-xl font-bold text-[#172B4D]">Ingin Menguji Kemampuan Engine Secara Langsung?</h3>
        <p className="text-xs text-[#64748B]">Buka simulator interaktif di portal institusi atau minta sesi presentasi teknis bersama tim arsitek kami.</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
          <Link href="/request-demo">
            <Button size="sm" variant="outline">Request a Demo</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

