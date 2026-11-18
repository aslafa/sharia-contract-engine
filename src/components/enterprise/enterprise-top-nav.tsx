"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Menu,
  Shield,
  Search,
  ExternalLink,
  ChevronDown,
  User,
  LogOut,
  Building2,
  Check,
  Sparkles,
  Users2,
} from "lucide-react";
import { SearchInput } from "./search-input";
import { NotificationPanel } from "./notification-panel";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SystemRole } from "@/types";

export interface EnterpriseTopNavProps {
  onOpenMobileSidebar: () => void;
}

const ROLES_LIST: { role: SystemRole; title: string; subtitle: string; badge: string }[] = [
  { role: "FINANCING_OFFICER", title: "Financing Officer (FO)", subtitle: "Inisiasi & Draf Akad", badge: "Operasional" },
  { role: "LEGAL_OFFICER", title: "Legal Officer", subtitle: "Telaah Klausul & Agunan", badge: "Legal" },
  { role: "COMPLIANCE_OFFICER", title: "Compliance Officer", subtitle: "Regulasi OJK & BMPD", badge: "Kepatuhan" },
  { role: "SHARIA_REVIEWER", title: "Dewan Pengawas Syariah (DPS)", subtitle: "Validasi Fatwa DSN-MUI", badge: "DPS" },
  { role: "MANAGEMENT", title: "Direksi / Komite Pembiayaan", subtitle: "Persetujuan Portofolio", badge: "Eksekutif" },
  { role: "AUDITOR", title: "Auditor Syariah (Read-Only)", subtitle: "Jejak Audit & SHA-256", badge: "Audit" },
  { role: "INSTITUTION_ADMIN", title: "Admin Institusi", subtitle: "Staf, Cabang & Billing", badge: "Admin" },
  { role: "SUPER_ADMIN", title: "Super Admin Platform", subtitle: "Master SaaS Multi-Tenant", badge: "Central" },
];

export function EnterpriseTopNav({ onOpenMobileSidebar }: EnterpriseTopNavProps) {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notificationRef = React.useRef<HTMLDivElement>(null);
  const [session, setSession] = React.useState<any>(null);
  const [switchingRole, setSwitchingRole] = React.useState(false);

  const fetchSession = React.useCallback(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setSession(json.data.user);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleRoleSwitch = async (role: SystemRole) => {
    try {
      setSwitchingRole(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleOverride: role }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Gagal mengganti peran:", err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  // Close notification popover on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentRole = session?.role as SystemRole | undefined;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#E2E8F0] bg-white px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 rounded-md text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D]"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="w-full">
          <SearchInput />
        </div>
      </div>

      {/* Right: Actions, Role Switcher, Tenant Selector, Notifications & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* QUICK ROLE SWITCHER FOR DEMO / REVIEW */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors focus:outline-none shadow-xs"
              title="Ganti Peran Pengguna untuk Menguji Tampilan Berbeda"
            >
              <span className="h-2 w-2 rounded-full bg-[#00549c] shrink-0" />
              <span className="font-semibold truncate max-w-[130px] sm:max-w-[180px]">
                {session?.roleName || "Pilih Peran"}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="right" className="w-72 max-h-96 overflow-y-auto">
            <div className="px-3 py-2 border-b border-[#F1F5F9] bg-[#F8FAFC]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Ganti Peran Pengguna (Uji Tampilan Role)
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Setiap peran memiliki meja kerja, KPI, antrean, dan izin akses yang berbeda.
              </p>
            </div>
            {ROLES_LIST.map((r) => {
              const isCurrent = currentRole === r.role;
              return (
                <DropdownMenuItem
                  key={r.role}
                  onClick={() => handleRoleSwitch(r.role)}
                  className={`flex items-start justify-between p-2.5 cursor-pointer ${
                    isCurrent ? "bg-[#DCEAF5] text-[#00549c] font-bold" : ""
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs leading-tight font-semibold">{r.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/70 border border-[#CBD5E1] text-[#475569] font-medium">
                        {r.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B] truncate mt-0.5">{r.subtitle}</p>
                  </div>
                  {isCurrent && <Check className="h-4 w-4 text-[#00549c] shrink-0 mt-0.5" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tenant Organization Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden md:flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs">
              <Building2 className="h-3.5 w-3.5 text-[#00549c]" />
              <span className="font-semibold truncate max-w-[140px]">
                {session?.organizationName || "BPRS Al-Barakah Mandiri"}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="right" className="w-56">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Tenant Institusi Terpilih
            </div>
            <DropdownMenuItem className="font-bold text-[#00549c] bg-[#F5F8FC] justify-between">
              <span>BPRS Al-Barakah Mandiri</span>
              <Check className="h-3.5 w-3.5 text-[#00549c]" />
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>KSPPS Bintang Syariah</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>PT Amanah Fintech Syariah</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Popover */}
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D] transition-colors"
            aria-label="Pusat Notifikasi"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#00549c]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 z-50">
              <NotificationPanel onClose={() => setShowNotifications(false)} />
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-[#E2E8F0] hidden sm:block" />

        {/* Public Website Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden lg:flex items-center gap-1 text-xs text-[#64748B] hover:text-[#00549c] font-medium"
        >
          <span>Website</span>
          <ExternalLink className="h-3 w-3" />
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none">
              <div className="h-8 w-8 rounded-full bg-[#00549c] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {session?.fullName ? session.fullName.slice(0, 2).toUpperCase() : "US"}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="right" className="w-56">
            <div className="px-2.5 py-2">
              <p className="text-xs font-bold text-[#172B4D] truncate">{session?.fullName || "Pengguna Portal"}</p>
              <p className="text-[10px] text-[#64748B] truncate">{session?.email || "user@bprs.id"}</p>
              <div className="mt-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#DCEAF5] text-[#00549c]">
                  {session?.roleName || "Institution Admin"}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-3.5 w-3.5 mr-2 text-[#64748B]" />
              <span>Profil Pengguna</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="h-3.5 w-3.5 mr-2 text-[#64748B]" />
              <span>Izin Akses ({session?.permissions?.length || 0})</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5 mr-2" />
              <span>Keluar Sesi</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
export default EnterpriseTopNav;
