import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.shortName} — ${siteConfig.name}`,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.tagline,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/sce-favicon.png", type: "image/png" },
      { url: "/sce-symbol.png", type: "image/png" },
      { url: "/sce-favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/sce-favicon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full scroll-smooth">
      <body className="h-full flex flex-col font-sans antialiased bg-white text-[#172B4D] selection:bg-[#DCEAF5] selection:text-[#00549c]">
        {children}
      </body>
    </html>
  );
}
