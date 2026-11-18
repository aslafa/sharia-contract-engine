"use client";

import * as React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface DateFilterProps {
  currentFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export function DateFilter({
  currentFilter = "Bulan Ini",
  onFilterChange,
}: DateFilterProps) {
  const options = [
    "Hari Ini",
    "7 Hari Terakhir",
    "30 Hari Terakhir",
    "Bulan Ini",
    "Kuartal Ini (Q4)",
    "Tahun Ini (2026)",
    "Kustom Rentang Tanggal...",
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-medium">
          <Calendar className="h-3.5 w-3.5 text-[#00549c]" />
          <span>{currentFilter}</span>
          <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="right" className="w-48">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onClick={() => onFilterChange?.(opt)}
            className={currentFilter === opt ? "font-bold text-[#00549c] bg-[#F5F8FC]" : ""}
          >
            {opt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

