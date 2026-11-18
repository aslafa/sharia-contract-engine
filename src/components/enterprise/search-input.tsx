"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcut?: string;
}

export function SearchInput({
  className,
  value,
  onChange,
  onClear,
  shortcut = "⌘K",
  placeholder = "Cari data, nomor kontrak, nasabah...",
  ...props
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative flex items-center w-full max-w-sm", className)}>
      <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#94A3B8] pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-[#E2E8F0] bg-white pl-8 pr-12 text-xs text-[#172B4D] placeholder:text-[#94A3B8] transition-colors focus:border-[#00549c] focus:outline-none focus:ring-1 focus:ring-[#00549c]"
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onClear?.();
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="absolute right-2 p-0.5 text-[#94A3B8] hover:text-[#172B4D]"
        >
          <X className="h-3 w-3" />
        </button>
      ) : shortcut ? (
        <span className="pointer-events-none absolute right-2 text-[10px] font-medium text-[#94A3B8] bg-[#F5F8FC] border border-[#E2E8F0] px-1.5 py-0.5 rounded">
          {shortcut}
        </span>
      ) : null}
    </div>
  );
}

