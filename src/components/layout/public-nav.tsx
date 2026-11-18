"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SCELogo } from "@/components/brand/sce-logo";
import {
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Shield,
  Workflow,
  Info,
  Phone,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  name: string;
  href: string;
}

const PRIMARY_LINKS: NavLinkItem[] = [
  { name: "Beranda", href: "/" },
  { name: "Produk", href: "/products" },
  { name: "Akad Syariah", href: "/sharia-contracts" },
  { name: "Solusi", href: "/solutions" },
  { name: "Harga", href: "/pricing" },
];

const MORE_LINKS = [
  {
    name: "Cara Kerja",
    href: "/how-it-works",
    description: "Alur 6 tahap dari input transaksi hingga monitoring akad.",
    icon: Workflow,
  },
  {
    name: "Keamanan",
    href: "/security",
    description: "Enkripsi AES-256, isolasi tenant & kesiapan audit OJK/BI.",
    icon: Shield,
  },
  {
    name: "Tentang Kami",
    href: "/about",
    description: "Visi transformasi digital kontrak syariah terpercaya.",
    icon: Info,
  },
  {
    name: "Kontak",
    href: "/contact",
    description: "Konsultasi implementasi & integrasi Core Banking System.",
    icon: Phone,
  },
];

export function PublicNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  const isMoreActive = MORE_LINKS.some((item) => pathname === item.href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Official Logo */}
        <div className="flex items-center">
          <SCELogo href="/" size="sm" />
        </div>

        {/* Desktop Simplified Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-xs font-semibold text-[#64748B]">
          {PRIMARY_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-colors",
                  isActive
                    ? "text-[#00549c] font-bold bg-[#DCEAF5]/50"
                    : "hover:text-[#00549c] hover:bg-[#F5F8FC]"
                )}
              >
                {link.name}
              </Link>
            );
          })}

          {/* "Lainnya" Accessible Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors",
                dropdownOpen || isMoreActive
                  ? "text-[#00549c] font-bold bg-[#DCEAF5]/50"
                  : "hover:text-[#00549c] hover:bg-[#F5F8FC]"
              )}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <span>Lainnya</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  dropdownOpen && "rotate-180 text-[#00549c]"
                )}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-[#E2E8F0] shadow-lg p-2.5 space-y-1 animate-in fade-in-50 zoom-in-95 z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] border-b border-[#F1F5F9] mb-1">
                  Eksplorasi Platform
                </div>
                {MORE_LINKS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDropdownOpen(false)}
                      className={cn(
                        "flex items-start gap-3 p-2 rounded-lg text-left transition-colors",
                        isActive
                          ? "bg-[#DCEAF5] text-[#00549c]"
                          : "hover:bg-[#F5F8FC] text-[#172B4D]"
                      )}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-md shrink-0 mt-0.5",
                          isActive ? "bg-[#00549c] text-white" : "bg-[#DCEAF5] text-[#00549c]"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">{item.name}</div>
                        <p className="text-[11px] text-[#64748B] leading-snug line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Action CTAs */}
        <div className="hidden sm:flex items-center space-x-2">
          <Link href="/request-demo">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 text-xs font-semibold border-[#00549c]/25 text-[#00549c] hover:bg-[#DCEAF5]/30 hover:border-[#00549c]"
            >
              Request a Demo
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-xs font-semibold text-[#172B4D] hover:text-[#00549c] hover:bg-[#F5F8FC]"
            >
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="h-9 px-3.5 text-xs font-bold gap-1.5 bg-[#00549c] hover:bg-[#00427c] text-white shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#00549c]/20"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E2E8F0] bg-white px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Main Links */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Menu Utama
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "p-2.5 rounded-lg text-xs font-semibold transition-colors",
                    pathname === link.href
                      ? "bg-[#DCEAF5] text-[#00549c] font-bold"
                      : "text-[#172B4D] hover:bg-[#F5F8FC]"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Lainnya Section */}
          <div className="space-y-1 pt-2 border-t border-[#F1F5F9]">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Lainnya
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {MORE_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#F5F8FC] text-xs font-medium text-[#172B4D]"
                  >
                    <Icon className="h-4 w-4 text-[#00549c]" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Action CTAs */}
          <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button className="w-full text-xs font-bold gap-1.5 bg-[#00549c] text-white">
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/request-demo" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full text-xs font-semibold">
                  Request a Demo
                </Button>
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-xs font-semibold">
                  Masuk
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
