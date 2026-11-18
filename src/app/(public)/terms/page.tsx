import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="py-12 container mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
      <Badge variant="default">Syarat & Ketentuan</Badge>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
        Syarat & Ketentuan Layanan B2B SaaS
      </h1>
      <p className="text-xs text-[#64748B]">
        Berlaku untuk seluruh Lembaga Keuangan Syariah terdaftar • Versi 1.0 Enterprise
      </p>

      <Card>
        <CardContent className="p-6 text-xs text-[#172B4D] space-y-4 leading-relaxed">
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#00549c]">1. Ketentuan Kepatuhan Syariah</h2>
            <p className="text-[#64748B]">
              Layanan SHARIA CONTRACT ENGINE disediakan untuk memfasilitasi otomasi dan standardisasi draf kontrak berdasarkan Fatwa Dewan Syari&apos;ah Nasional (DSN-MUI). Setiap penyesuaian klausul khusus institusi tetap tunduk pada persetujuan Dewan Pengawas Syariah (DPS) masing-masing lembaga.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#00549c]">2. Tanggung Jawab Penggunaan Sistem</h2>
            <p className="text-[#64748B]">
              Institusi bertanggung jawab penuh atas kebenaran data nasabah, keabsahan tanda tangan pejabat berwenang, dan eksekusi riil dari setiap akad pembiayaan yang diterbitkan.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#00549c]">3. Ketersediaan Layanan (SLA)</h2>
            <p className="text-[#64748B]">
              SCE menjamin ketersediaan sistem 99.9% uptime untuk paket Professional dan Institutional dengan perlindungan cadangan berkala.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

