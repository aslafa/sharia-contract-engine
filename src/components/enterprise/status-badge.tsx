import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { statusStyle, StatusStyle } from "@/lib/design-system";
import { cn } from "@/lib/utils";

/**
 * 3C.1 — StatusBadge: satu cara menampilkan status di seluruh aplikasi.
 * Label & warna diambil dari registry status (design-system.ts) sehingga
 * warna badge konsisten lintas halaman dan tidak arbitrer.
 */

export interface StatusBadgeProps {
  /** Nilai status mentah (mis. "ACTIVE", "FLAGGED"). */
  status?: string | null;
  /** Registry pemetaan status (CONTRACT_STATUS, AML_STATUS, dll). */
  registry: Record<string, StatusStyle>;
  /** Tampilkan titik indikator kecil. */
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ status, registry, dot, className }: StatusBadgeProps) {
  const style = statusStyle(registry, status);
  return (
    <Badge variant={style.variant} dot={dot} className={cn("whitespace-nowrap", className)}>
      {style.label}
    </Badge>
  );
}
