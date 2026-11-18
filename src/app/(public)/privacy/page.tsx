import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 container mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
      <Badge variant="default">Kebijakan Privasi</Badge>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D]">
        Kebijakan Privasi & Perlindungan Data Finansial
      </h1>
      <p className="text-xs text-[#64748B]">
        Berlaku efektif sejak 14 November 2026 • Versi 1.0 Enterprise
      </p>

      <Card>
        <CardContent className="p-6 text-xs text-[#172B4D] space-y-4 leading-relaxed">
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#00549c]">1. Komitmen Kedaulatan & Kerahasiaan Data</h2>
            <p className="text-[#64748B]">
              Sharia Contract Engine (SCE) berkomitmen melindungi kerahasiaan data perbankan dan transaksi nasabah sesuai Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022) serta Peraturan Otoritas Jasa Keuangan (POJK).
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#00549c]">2. Isolasi Multi-Tenant</h2>
            <p className="text-[#64748B]">
              Seluruh data kontrak, identitas nasabah, dan dokumen pendukung diisolasi secara logis dan fisik per institusi. Tidak ada pertukaran data antar tenant yang terdaftar pada platform.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#00549c]">3. Enkripsi dan Integritas Dokumen</h2>
            <p className="text-[#64748B]">
              Data dalam transit dilindungi protokol TLS 1.3 dan data tersimpan dienkripsi dengan standar AES-256. Setiap dokumen kontrak diberikan stempel hash SHA-256 anti-manipulasi.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

