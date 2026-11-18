"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface SCELogoProps {
  variant?: "horizontal" | "symbol" | "stacked";
  theme?: "light" | "dark" | "monochrome";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  href?: string;
  className?: string;
}

const HEIGHT_CONFIGS = {
  xs: { horizontal: 28, symbol: 26 },
  sm: { horizontal: 36, symbol: 32 },
  md: { horizontal: 44, symbol: 40 },
  lg: { horizontal: 56, symbol: 50 },
  xl: { horizontal: 72, symbol: 64 },
};

export function SCESymbol({
  size = 40,
  theme = "light",
  className,
}: {
  size?: number;
  theme?: "light" | "dark" | "monochrome";
  className?: string;
}) {
  const isDark = theme === "dark" || theme === "monochrome";
  const src = isDark ? "/sce-symbol-white.png" : "/sce-symbol.png";
  // Symbol aspect ratio is 748 / 316 ~= 2.367
  const width = Math.round(size * (748 / 316));

  return (
    <div
      className={cn("inline-flex items-center justify-center shrink-0 select-none relative", className)}
      style={{ height: size, width: width }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="SCE Symbol"
        style={{ height: size, width: "auto", objectFit: "contain" }}
        className="block max-h-full"
      />
    </div>
  );
}

export function SCELogo({
  variant = "horizontal",
  theme = "light",
  size = "md",
  showTagline = false,
  href,
  className,
}: SCELogoProps) {
  const isDark = theme === "dark" || theme === "monochrome";
  const heightConfig = HEIGHT_CONFIGS[size] || HEIGHT_CONFIGS.md;

  let content: React.ReactNode;

  if (variant === "symbol") {
    content = <SCESymbol size={heightConfig.symbol} theme={theme} className={className} />;
  } else {
    // Horizontal / Stacked: renders official full logo (Emblem + SHARIA CONTRACT ENGINE wordmark)
    const logoSrc = isDark ? "/sce-logo-white.png" : "/sce-logo.png";
    const height = heightConfig.horizontal;
    // Full logo aspect ratio is 748 / 358 ~= 2.089
    const width = Math.round(height * (748 / 358));

    content = (
      <div className={cn("inline-flex items-center gap-2 select-none shrink-0", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="SHARIA CONTRACT ENGINE"
          style={{ height: height, width: "auto", objectFit: "contain" }}
          className="block max-h-full"
        />
        {showTagline && (
          <span
            className={cn(
              "hidden sm:inline-block border-l pl-2 text-[10px] tracking-wider uppercase font-medium",
              isDark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-500"
            )}
          >
            DSN-MUI Compliant
          </span>
        )}
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4E95D9] rounded">
        {content}
      </Link>
    );
  }

  return <>{content}</>;
}

export default SCELogo;
