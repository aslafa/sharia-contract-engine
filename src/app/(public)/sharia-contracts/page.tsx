import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AKAD_REGISTRY } from "@/config/akad";
import { Scale, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ShariaContractsPage() {
  const akads = Object.values(AKAD_REGISTRY);

  return (
    <div className="space-y-16 py-12 container mx-auto max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="default">Kompilasi Hukum Fiqh Muamalah</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B4D]">
          Standar & Rujukan Fatwa 4 Akad Utama
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Kompilasi rukun, syarat sah, dan landasan fatwa Dewan Syari&apos;ah Nasional - Majelis Ulama Indonesia (DSN-MUI) yang diintegrasikan langsung ke dalam Sharia Contract Engine.
        </p>
      </div>

      {/* Akad Sections */}
      <div className="space-y-12">
        {akads.map((akad) => (
          <div
            key={akad.code}
            id={akad.code.toLowerCase()}
            className="scroll-mt-24 rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
          >
            {/* Title & Arabic name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-4 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="font-mono text-xs">
                    {akad.code}
                  </Badge>
                  <h2 className="text-xl font-bold text-[#172B4D]">{akad.name}</h2>
                </div>
                <p className="text-xs text-[#00549c] font-semibold mt-1">{akad.tagline}</p>
              </div>
              <span className="text-2xl font-serif text-[#64748B]" dir="rtl">
                {akad.arabicName}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#172B4D] leading-relaxed">
              {akad.description}
            </p>

            {/* Rukun vs Syarat Sah Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-[#00549c]" />
                  <span>Rukun Akad (Pillars):</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-[#64748B]">
                  {akad.pillars.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono font-bold text-[#00549c]">{i + 1}.</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#16A36A]" />
                  <span>Syarat Sah Menurut Fiqh:</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-[#64748B]">
                  {akad.conditions.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#16A36A] font-bold">✓</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rujukan Fatwa & Primary Use Cases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#E2E8F0]">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#00549c]" />
                  <span>Rujukan Fatwa DSN-MUI:</span>
                </h4>
                <ul className="space-y-1 text-xs text-[#172B4D]">
                  {akad.fatwaDsnMui.map((f, i) => (
                    <li key={i} className="font-medium">• {f}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Penggunaan Produk Utama:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {akad.primaryUseCases.map((uc, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-[#F5F8FC] border border-[#E2E8F0] text-[11px] text-[#172B4D] font-medium"
                    >
                      {uc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Simulator CTA */}
      <div className="rounded-xl border border-[#00549c]/20 bg-[#F5F8FC] p-8 text-center space-y-3">
        <h3 className="text-lg font-bold text-[#172B4D]">Uji Interaktif Parameter Akad Ini di Dashboard</h3>
        <p className="text-xs text-[#64748B]">Buka simulator Sharia Rule Engine untuk melihat bagaimana sistem mendeteksi potensi cacat akad secara real-time.</p>
        <div className="pt-2">
          <Link href="/contracts">
            <Button size="sm" className="gap-1.5">
              <span>Buka Simulator Akad & Aturan Syariah</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

