import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  errorDetails?: string;
}

export function ErrorState({
  title = "Terjadi Kendala Sistem",
  message,
  onRetry,
  errorDetails,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-[#DC3545]/30 bg-[#DC3545]/5 p-5 text-left">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[#DC3545] shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold text-[#172B4D]">{title}</h4>
          <p className="text-xs text-[#64748B] leading-relaxed">{message}</p>

          {errorDetails && (
            <div className="mt-2 rounded bg-white p-2 font-mono text-[11px] text-[#DC3545] border border-[#DC3545]/20 overflow-x-auto">
              {errorDetails}
            </div>
          )}

          {onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1.5 h-7 text-xs border-[#DC3545]/40 text-[#DC3545] hover:bg-[#DC3545]/10"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Coba Muat Ulang</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

