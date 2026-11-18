import Link from "next/link";
import { SCELogo } from "@/components/brand/sce-logo";
import { siteConfig } from "@/config/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-[#F5F8FC]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <SCELogo href="/" size="md" variant="horizontal" className="justify-center" />
        <p className="mt-1.5 text-xs text-[#64748B]">
          &quot;{siteConfig.tagline}&quot;
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
        <div className="bg-white py-8 px-5 sm:px-8 shadow-sm border border-[#E2E8F0] rounded-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
