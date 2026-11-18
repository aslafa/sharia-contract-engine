"use client";

import * as React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PHRASES = [
  "Smart Islamic Financing",
  "Automated Sharia Validation",
  "Intelligent Contract Generation",
  "End-to-End Contract Monitoring",
];

export function TypingHeroTitle({ className }: { className?: string }) {
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const [displayedText, setDisplayedText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  // Check for reduced motion preference
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Typing effect loop
  React.useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(PHRASES[phraseIndex]);
      return;
    }

    const currentPhrase = PHRASES[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (isPaused) {
      // Pause at full word before deleting
      timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2200);
    } else if (isDeleting) {
      // Deleting character by character
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentPhrase.substring(0, displayedText.length - 1));
        }, 35);
      } else {
        // Finished deleting, move to next phrase
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
        timeout = setTimeout(() => {}, 350);
      }
    } else {
      // Typing character by character
      if (displayedText.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentPhrase.substring(0, displayedText.length + 1));
        }, 65);
      } else {
        // Reached end of current phrase, pause
        setIsPaused(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, isPaused, phraseIndex, prefersReducedMotion]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top Pre-title Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm text-xs text-white/90">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38BDF8]" />
        </span>
        <span className="font-semibold tracking-wide">Enterprise B2B SaaS Syariah</span>
        <span className="text-white/40">•</span>
        <span className="text-[#FDE68A] font-medium flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 inline" />
          DSN-MUI & AAOIFI
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
        Intelligent Sharia Contract <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-[#FFFFFF] via-[#E0F2FE] to-[#BAE6FD] bg-clip-text text-transparent">
          Management Platform
        </span>
      </h1>

      {/* Typing Subtitle Animation */}
      <div className="flex items-center gap-2 text-lg sm:text-2xl font-bold text-[#E0F2FE] min-h-[36px]">
        <span className="text-[#93C5FD] font-mono select-none">›</span>
        <span className="font-mono tracking-tight text-[#FFFFFF] drop-shadow-sm">
          {displayedText}
        </span>
        <span
          className="inline-block w-2 sm:w-2.5 h-6 sm:h-7 bg-[#38BDF8] ml-0.5 rounded-sm animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
export default TypingHeroTitle;

