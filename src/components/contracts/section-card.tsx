"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tahap 3B.4 — Section card bersama untuk form pengajuan empat akad.
 * Memecah form panjang menjadi bagian bernomor dengan judul dan deskripsi
 * singkat, sesuai arah desain enterprise Islamic Banking SaaS.
 */
export interface SectionCardProps {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ step, title, description, children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[#E2E8F0] bg-white",
        className
      )}
    >
      <div className="flex items-start gap-3 border-b border-[#E2E8F0] px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#00549c] text-[11px] font-bold text-white">
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#172B4D]">{title}</h3>
          {description && <p className="mt-0.5 text-[11px] text-[#64748B]">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

/** Field kecil bergaya konsisten untuk input di dalam SectionCard. */
export interface PickerFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, required, hint, children }: PickerFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-[#172B4D]">
        {label}
        {required && <span className="text-[#DC3545]"> *</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[#64748B]">{hint}</p>}
    </div>
  );
}
