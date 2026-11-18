"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Scale,
  CheckCircle2,
  FolderLock,
  CreditCard,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  Palette,
  TrendingUp,
  GitBranch,
  FileCode2,
  Calculator,
  UserCheck,
  ShieldAlert,
  ClipboardList,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SCELogo, SCESymbol } from "@/components/brand/sce-logo";
import { SystemRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  section?: string;
}

export function getNavItemsForRole(role?: SystemRole): NavItem[] {
  switch (role) {
    case "FINANCING_OFFICER":
      return [
        { label: "Meja Kerja FO", href: "/dashboard", icon: LayoutDashboard, section: "Navigasi Utama" },
        { label: "Rekomendasi AI Akad", href: "/akad-recommendation", icon: Sparkles, badge: "AI", section: "6 Solusi Inti Syariah" },
        { label: "Intelligent Akad Matching", href: "/contracts/mapping", icon: GitBranch, section: "6 Solusi Inti Syariah" },
        { label: "Validasi Syariah Otomatis", href: "/sharia-rules", icon: Scale, section: "6 Solusi Inti Syariah" },
        { label: "Contract Generator", href: "/documents/generator", icon: FileCode2, section: "6 Solusi Inti Syariah" },
        { label: "Monitoring Akad", href: "/contracts", icon: FileText, badge: "Inisiasi", section: "6 Solusi Inti Syariah" },
        { label: "Akad Murabahah", href: "/contracts/murabahah", icon: Calculator, section: "Portofolio Akad" },
        { label: "Akad Ijarah & IMBT", href: "/contracts/ijarah", icon: FileText, section: "Portofolio Akad" },
        { label: "Akad Musyarakah", href: "/contracts/musyarakah", icon: GitBranch, section: "Portofolio Akad" },
        { label: "Akad Mudharabah", href: "/contracts/mudharabah", icon: TrendingUp, section: "Portofolio Akad" },
        { label: "Data Nasabah (CIF)", href: "/customers", icon: Users, section: "Operasional" },
        { label: "Brankas Dokumen", href: "/documents", icon: FolderLock, section: "Operasional" },
      ];

    case "LEGAL_OFFICER":
      return [
        { label: "Meja Kerja Legal", href: "/dashboard", icon: LayoutDashboard, section: "Navigasi Utama" },
        { label: "Persetujuan Digital (Legal)", href: "/approvals", icon: CheckCircle2, badge: "Review", section: "6 Solusi Inti Syariah" },
        { label: "Monitoring & Telaah Kontrak", href: "/contracts", icon: FileText, section: "6 Solusi Inti Syariah" },
        { label: "Intelligent Akad Matching", href: "/contracts/mapping", icon: GitBranch, section: "6 Solusi Inti Syariah" },
        { label: "Contract Generator & Editor", href: "/documents/generator", icon: FileCode2, badge: "Editor", section: "6 Solusi Inti Syariah" },
        { label: "Kaidah Syariah DSN-MUI", href: "/sharia-rules", icon: Scale, section: "6 Solusi Inti Syariah" },
        { label: "Brankas Dokumen Hukum", href: "/documents", icon: FolderLock, section: "Operasional" },
        { label: "Data Nasabah (Legalitas)", href: "/customers", icon: Users, section: "Operasional" },
      ];

    case "COMPLIANCE_OFFICER":
      return [
        { label: "Meja Kerja Kepatuhan", href: "/dashboard", icon: LayoutDashboard, section: "Navigasi Utama" },
        { label: "Persetujuan Kepatuhan OJK", href: "/approvals", icon: CheckCircle2, badge: "OJK", section: "6 Solusi Inti Syariah" },
        { label: "Validasi Syariah & Fatwa", href: "/sharia-rules", icon: Scale, badge: "DSN", section: "6 Solusi Inti Syariah" },
        { label: "Monitoring Kepatuhan Akad", href: "/contracts", icon: FileText, section: "6 Solusi Inti Syariah" },
        { label: "Intelligent Akad Matching", href: "/contracts/mapping", icon: GitBranch, section: "6 Solusi Inti Syariah" },
        { label: "Analitik Risiko & BMPD", href: "/analytics", icon: TrendingUp, section: "Operasional" },
        { label: "Data Nasabah (AML/CFT)", href: "/customers", icon: Users, section: "Operasional" },
        { label: "Dokumen & Bukti Kepatuhan", href: "/documents", icon: FolderLock, section: "Operasional" },
      ];

    case "SHARIA_REVIEWER":
      return [
        { label: "Meja Kerja DPS", href: "/dashboard", icon: LayoutDashboard, section: "Navigasi Utama" },
        { label: "Review & Sertifikasi Fatwa", href: "/approvals", icon: CheckCircle2, badge: "DPS", section: "6 Solusi Inti Syariah" },
        { label: "Sharia Rule Engine & Override", href: "/sharia-rules", icon: Scale, badge: "Fatwa", section: "6 Solusi Inti Syariah" },
        { label: "Struktur Multi-Akad", href: "/contracts/mapping", icon: GitBranch, section: "6 Solusi Inti Syariah" },
        { label: "Pengawasan Akad Syariah", href: "/contracts", icon: FileText, section: "6 Solusi Inti Syariah" },
        { label: "Verifikasi Rekomendasi AI", href: "/akad-recommendation", icon: Sparkles, badge: "AI", section: "6 Solusi Inti Syariah" },
        { label: "Brankas Akad & Dokumen", href: "/documents", icon: FolderLock, section: "Operasional" },
        { label: "Data Nasabah (Karakter)", href: "/customers", icon: Users, section: "Operasional" },
      ];

    case "MANAGEMENT":
      return [
        { label: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "Navigasi Utama" },
        { label: "Persetujuan Komite Direksi", href: "/approvals", icon: CheckCircle2, badge: "Komite", section: "6 Solusi Inti Syariah" },
        { label: "Portofolio Kontrak Total", href: "/contracts", icon: FileText, section: "6 Solusi Inti Syariah" },
        { label: "Analitik Kinerja & Yield", href: "/analytics", icon: TrendingUp, badge: "KPI", section: "Operasional" },
        { label: "Data Nasabah Lembaga", href: "/customers", icon: Users, section: "Operasional" },
        { label: "Arsip Dokumen Eksekutif", href: "/documents", icon: FolderLock, section: "Operasional" },
        { label: "Tagihan & Billing SaaS", href: "/billing", icon: CreditCard, section: "Tata Kelola" },
      ];

    case "AUDITOR":
      return [
        { label: "Portal Pengawasan Audit", href: "/dashboard", icon: LayoutDashboard, section: "Navigasi Utama" },
        { label: "Arsip Seluruh Kontrak", href: "/contracts", icon: FileText, section: "6 Solusi Inti Syariah" },
        { label: "Audit Log Approval", href: "/approvals", icon: CheckCircle2, section: "6 Solusi Inti Syariah" },
        { label: "Pustaka Kaidah Syariah", href: "/sharia-rules", icon: Scale, section: "6 Solusi Inti Syariah" },
        { label: "Riwayat & Jejak Audit", href: "/analytics", icon: TrendingUp, badge: "Audit", section: "Audit & Bukti" },
        { label: "Verifikasi Berkas SHA-256", href: "/documents", icon: FolderLock, section: "Audit & Bukti" },
        { label: "Data Nasabah (Read-Only)", href: "/customers", icon: Users, section: "Audit & Bukti" },
      ];

    case "SUPER_ADMIN":
      return [
        { label: "Super Admin Platform", href: "/admin", icon: ShieldCheck, badge: "Master", section: "Navigasi Utama" },
        { label: "Meja Kerja Institusi", href: "/dashboard", icon: LayoutDashboard, section: "Navigasi Utama" },
        { label: "Semua Pengajuan Akad", href: "/contracts", icon: FileText, section: "6 Solusi Inti Syariah" },
        { label: "Sharia Rule Engine Global", href: "/sharia-rules", icon: Scale, section: "6 Solusi Inti Syariah" },
        { label: "Analitik Platform Global", href: "/analytics", icon: TrendingUp, section: "Operasional" },
        { label: "Basis Data Nasabah", href: "/customers", icon: Users, section: "Operasional" },
        { label: "Manajemen Penyewa & Tenant", href: "/settings", icon: Settings, section: "Tata Kelola" },
      ];

    case "INSTITUTION_ADMIN":
    default:
      return [
        { label: "Ringkasan Eksekutif", href: "/dashboard", icon: LayoutDashboard, section: "Navigasi Utama" },
        { label: "Rekomendasi AI Akad", href: "/akad-recommendation", icon: Sparkles, badge: "AI", section: "6 Solusi Inti Syariah" },
        { label: "Intelligent Akad Matching", href: "/contracts/mapping", icon: GitBranch, section: "6 Solusi Inti Syariah" },
        { label: "Validasi Syariah Otomatis", href: "/sharia-rules", icon: Scale, section: "6 Solusi Inti Syariah" },
        { label: "Contract Generator", href: "/documents/generator", icon: FileCode2, section: "6 Solusi Inti Syariah" },
        { label: "Alur Persetujuan Digital", href: "/approvals", icon: CheckCircle2, badge: "Workflow", section: "6 Solusi Inti Syariah" },
        { label: "Manajemen & Monitoring Kontrak", href: "/contracts", icon: FileText, badge: "4 Akad", section: "6 Solusi Inti Syariah" },
        { label: "Data Nasabah (CIF)", href: "/customers", icon: Users, section: "Operasional" },
        { label: "Analitik Finansial", href: "/analytics", icon: TrendingUp, section: "Operasional" },
        { label: "Brankas Dokumen", href: "/documents", icon: FolderLock, section: "Operasional" },
        { label: "Langganan & Billing", href: "/billing", icon: CreditCard, section: "Tata Kelola" },
        { label: "Pengaturan Institusi", href: "/settings", icon: Settings, section: "Tata Kelola" },
      ];
  }
}

export function EnterpriseSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setSession(json.data.user);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = getNavItemsForRole(session?.role as SystemRole | undefined);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#172B4D]/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-[#E2E8F0] bg-white transition-all duration-200 lg:static",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0]">
          {collapsed ? (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <SCESymbol size={32} />
            </Link>
          ) : (
            <SCELogo href="/dashboard" size="xs" showTagline={true} />
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D]"
            aria-label={collapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Tenant & Active Role Indicator */}
        {!collapsed && (
          <div className="p-3 mx-3 mt-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Peran Aktif
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-700 font-bold border border-slate-300/40">
                {session?.organizationCode || "BPRS-ALBARAKAH"}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate mt-1">
              {session?.fullName || "Pengguna Portal"}
            </p>
            <p className="text-[11px] font-semibold text-[#00549c] truncate mt-0.5">
              {session?.roleName || "Institution Admin"}
            </p>
          </div>
        )}

        {/* Dynamic Navigation Items Per Role */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const prevItem = index > 0 ? navItems[index - 1] : null;
            const showSectionHeading = !collapsed && item.section && item.section !== prevItem?.section;
            // Sub-routes (e.g. /customers/[id]) keep the parent item highlighted.
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <React.Fragment key={item.href}>
                {showSectionHeading && (
                  <div className="pt-3.5 pb-1 px-2.5 first:pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                      {item.section}
                    </p>
                  </div>
                )}
                {collapsed && showSectionHeading && (
                  <div className="my-1.5 border-t border-slate-100" />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all group",
                    isActive
                      ? "bg-[#00549c]/10 text-[#00549c] font-semibold border-l-2 border-[#00549c] shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-[#00549c]" : "text-slate-500 group-hover:text-slate-700")} />
                  {!collapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold",
                        isActive
                          ? "bg-[#00549c] text-white"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Footer / User Badge */}
        <div className="p-3 border-t border-[#E2E8F0]">
          {collapsed ? (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-lg bg-[#003366] text-white flex items-center justify-center text-xs font-bold">
                {session?.fullName ? session.fullName.slice(0, 2).toUpperCase() : "US"}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/70 hover:bg-slate-100/80 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-[#003366] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {session?.fullName ? session.fullName.slice(0, 2).toUpperCase() : "US"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{session?.fullName || "Petugas Institusi"}</p>
                <p className="text-[10px] text-slate-500 truncate">{session?.email || "user@bprs.id"}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
export default EnterpriseSidebar;
