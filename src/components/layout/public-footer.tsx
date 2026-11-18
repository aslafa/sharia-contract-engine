import Link from "next/link";
import { SCELogo } from "@/components/brand/sce-logo";
import { siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <SCELogo href="/" size="sm" showTagline={false} />
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm">
              &quot;{siteConfig.tagline}&quot;
            </p>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm">
              Infrastruktur otomasi kepatuhan syariah dan generator kontrak pintar untuk Bank Umum Syariah, Unit Usaha Syariah, BPRS, KSPPS, BMT, dan Fintech Syariah.
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-[#00549c] bg-[#DCEAF5] px-2.5 py-1 rounded border border-[#00549c]/20">
                ✓ Standar Fatwa DSN-MUI & AAOIFI
              </span>
            </div>
          </div>

          {/* Column 1: Produk & Akad */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] mb-3">
              Produk & Akad
            </h4>
            <ul className="space-y-2 text-xs text-[#64748B]">
              <li>
                <Link href="/products" className="hover:text-[#00549c] transition-colors">
                  Ringkasan 4 Engine
                </Link>
              </li>
              <li>
                <Link href="/sharia-contracts#murabahah" className="hover:text-[#00549c] transition-colors">
                  Murabahah Engine
                </Link>
              </li>
              <li>
                <Link href="/sharia-contracts#ijarah" className="hover:text-[#00549c] transition-colors">
                  Ijarah & IMBT Engine
                </Link>
              </li>
              <li>
                <Link href="/sharia-contracts#musyarakah" className="hover:text-[#00549c] transition-colors">
                  Musyarakah Engine
                </Link>
              </li>
              <li>
                <Link href="/sharia-contracts#mudharabah" className="hover:text-[#00549c] transition-colors">
                  Mudharabah Engine
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-[#00549c] transition-colors">
                  Alur Proses 6 Tahap
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solusi & Keamanan */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] mb-3">
              Solusi & Keamanan
            </h4>
            <ul className="space-y-2 text-xs text-[#64748B]">
              <li>
                <Link href="/solutions#perbankan" className="hover:text-[#00549c] transition-colors">
                  Bank Umum Syariah & UUS
                </Link>
              </li>
              <li>
                <Link href="/solutions#bprs" className="hover:text-[#00549c] transition-colors">
                  BPRS (BPR Syariah)
                </Link>
              </li>
              <li>
                <Link href="/solutions#kspps-bmt" className="hover:text-[#00549c] transition-colors">
                  KSPPS & BMT
                </Link>
              </li>
              <li>
                <Link href="/solutions#fintech" className="hover:text-[#00549c] transition-colors">
                  Fintech P2P Syariah
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-[#00549c] transition-colors">
                  Isolasi Multi-Tenant
                </Link>
              </li>
              <li>
                <Link href="/security#governance" className="hover:text-[#00549c] transition-colors">
                  Tata Kelola & Audit OJK
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Lembaga & Layanan */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] mb-3">
              Lembaga & Dukungan
            </h4>
            <ul className="space-y-2 text-xs text-[#64748B]">
              <li>
                <Link href="/pricing" className="hover:text-[#00549c] transition-colors">
                  Paket & Biaya Langganan
                </Link>
              </li>
              <li>
                <Link href="/request-demo" className="hover:text-[#00549c] transition-colors">
                  Jadwalkan Demo Privat
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#00549c] transition-colors">
                  Registrasi Tenant Baru
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#00549c] transition-colors">
                  Tentang Sharia Contract Engine
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#00549c] transition-colors">
                  Hubungi Tim Konsultan
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#00549c] transition-colors">
                  Portal Masuk Institusi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B]">
          <p>© {new Date().getFullYear()} SHARIA CONTRACT ENGINE (SCE). Hak cipta dilindungi undang-undang.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="/privacy" className="hover:text-[#172B4D] transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-[#172B4D] transition-colors">
              Syarat & Ketentuan
            </Link>
            <Link href="/security" className="hover:text-[#172B4D] transition-colors">
              Pernyataan Keamanan
            </Link>
            <Link href="/contact" className="hover:text-[#172B4D] transition-colors">
              Bantuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
