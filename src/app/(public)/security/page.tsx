import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck, FileCheck2, Database, KeyRound, Scale, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SecurityPage() {
  const securityPillars = [
    {
      title: "Isolasi Multi-Tenant Ketat (Database & Backend Layer)",
      desc: "Setiap institusi memiliki ID organisasi unik dan terisolasi. Seluruh query database dibatasi oleh skop tenant Prisma untuk memastikan tidak ada kebocoran data antar bank atau koperasi.",
      icon: Database,
    },
    {
      title: "Integritas Dokumen Anti-Tamper (SHA-256 Cryptographic Checksum)",
      desc: "Setiap draf dan kontrak final dihitung hash SHA-256 saat diterbitkan. Perubahan sekecil apa pun pada teks atau angka akan membatalkan tanda tangan digital, menjamin keabsahan hukum.",
      icon: FileCheck2,
    },
    {
      title: "Enkripsi Berlapis (In-Transit & At-Rest)",
      desc: "Seluruh pertukaran data dilindungi protokol TLS 1.3 dengan enkripsi simetris AES-256 pada media penyimpanan database dan arsip dokumen di cloud.",
      icon: Lock,
    },
    {
      title: "Role-Based Access Control (RBAC) & Pemisahan Peran",
      desc: "Hak akses terbagi secara ketat: Financing Officer tidak dapat mengesahkan fatwa, Dewan Pengawas Syariah (DPS) memiliki hak verifikasi independen, dan Super Admin terpisah dari isi kontrak.",
      icon: KeyRound,
    },
    {
      title: "Immutable Audit Trail Siap Inspeksi Regulator",
      desc: "Setiap tindakan (pembuatan draf, validasi syariah, penolakan klausul, persetujuan, dan pengunduhan dokumen) dicatat dengan stempel waktu, IP address, dan identitas pengguna secara permanen.",
      icon: Scale,
    },
    {
      title: "Kepatuhan Regulasi Perbankan OJK & DSN-MUI",
      desc: "Arsitektur sistem mematuhi Peraturan OJK tentang Manajemen Risiko Teknologi Informasi serta standar tata kelola syariah AAOIFI dan fatwa DSN-MUI.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-16 py-12 container mx-auto max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="default">Keamanan & Tata Kelola</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B4D]">
          Standar Keamanan, Kepatuhan & Privasi Data Perbankan
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Dirancang dengan prinsip Zero-Trust Security untuk melindungi integritas transaksi pembiayaan, kerahasiaan data nasabah, dan kepatuhan syariah jangka panjang.
        </p>
      </div>

      {/* Security Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {securityPillars.map((sp) => {
          const Icon = sp.icon;
          return (
            <Card key={sp.title} className="hover:border-[#00549c]/40 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="h-10 w-10 rounded-md bg-[#DCEAF5] text-[#00549c] flex items-center justify-center font-bold">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-[#172B4D] leading-snug">{sp.title}</h2>
                <p className="text-xs text-[#64748B] leading-relaxed">{sp.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compliance Architecture Whitepaper Box */}
      <Card className="border-[#00549c]/20 bg-[#F5F8FC]">
        <CardContent className="p-8 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#00549c]" />
            <h3 className="text-base font-bold text-[#172B4D]">
              Kebijakan Tata Kelola Data Multi-Tenant SCE
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#172B4D]">
            <div className="space-y-1.5 p-3 rounded bg-white border border-[#E2E8F0]">
              <span className="font-bold text-[#00549c]">Isolasi Logis Terjamin:</span>
              <p className="text-[#64748B]">
                Tidak ada data kontrak atau dokumen nasabah dari satu tenant yang dapat diakses oleh tenant lain, divalidasi pada level query ORM dan filter API.
              </p>
            </div>
            <div className="space-y-1.5 p-3 rounded bg-white border border-[#E2E8F0]">
              <span className="font-bold text-[#00549c]">Kedaulatan Data Domestik:</span>
              <p className="text-[#64748B]">
                Penyimpanan database dapat diarahkan ke data center lokal di Indonesia sesuai kepatuhan PP No. 71/2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Bottom */}
      <div className="rounded-xl border border-[#00549c]/20 bg-[#F5F8FC] p-8 text-center space-y-3 max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-[#172B4D]">Memerlukan Tinjauan Kepatuhan dari Tim Keamanan Anda?</h3>
        <p className="text-xs text-[#64748B]">Tim keamanan informasi dan konsultan hukum syariah kami siap mengisi kuesioner vendor assessment institusi Anda.</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/contact">
            <Button size="sm">Kontak Tim Keamanan</Button>
          </Link>
          <Link href="/request-demo">
            <Button size="sm" variant="outline">Minta Sesi Presentasi</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

