"use client";

import * as React from "react";

const ROTATING_TEXTS = [
  "Akad Murabahah (Jual Beli)",
  "Akad Ijarah & IMBT (Sewa Manfaat)",
  "Akad Musyarakah (Kemitraan Modal)",
  "Akad Mudharabah (Investasi Amanah)",
  "Audit Syariah Otomatis DSN-MUI",
];

export function AnimatedHeroTitle() {
  const [index, setIndex] = React.useState(0);
  const [fade, setFade] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
        setFade(true);
      }, 350);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#111827] leading-[1.12]">
        Intelligent Islamic Financial <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-[#00549c] via-[#0284C7] to-[#0F766E] bg-clip-text text-transparent">
          Contract Management Platform
        </span>
      </h1>

      {/* DYNAMIC ROTATING TEXT BADGE */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#E2E8F0] shadow-sm backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-[#16A36A] animate-pulse" />
        <span className="text-xs font-semibold text-[#64748B]">Mendukung Penuh:</span>
        <span
          className={`text-xs font-black text-[#00549c] font-mono transition-opacity duration-300 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {ROTATING_TEXTS[index]}
        </span>
      </div>
    </div>
  );
}

