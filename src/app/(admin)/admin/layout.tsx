import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SCESymbol } from "@/components/brand/sce-logo";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8FC] text-[#172B4D]">
      <header className="h-16 border-b border-[#E2E8F0] bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SCESymbol size={36} />
          <div>
            <h1 className="text-xs font-extrabold text-[#172B4D] tracking-tight flex items-center gap-1.5">
              <span>SHARIA CONTRACT ENGINE</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#DC3545]/10 text-[#DC3545] font-black uppercase">
                SUPER ADMIN
              </span>
            </h1>
            <p className="text-[10px] text-[#00549c] font-semibold">
              Global Central SaaS Platform Telemetry & Multi-Tenant Orchestrator
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-[#64748B] hover:text-[#00549c] flex items-center gap-1.5 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Portal Institusi</span>
        </Link>
      </header>

      <main className="flex-1 p-6 lg:p-8 container mx-auto max-w-7xl">{children}</main>
    </div>
  );
}
