"use client";

import * as React from "react";
import { Check, Clock, AlertCircle, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface OnboardingStage {
  index: number;
  key: string;
  title: string;
  description: string;
}

interface OnboardingTrackerProps {
  currentStageIndex: number;
  status: string;
  stages: OnboardingStage[];
  onAdvanceStage?: (newIndex: number) => void;
  showControls?: boolean;
}

export function OnboardingTracker({
  currentStageIndex,
  status,
  stages,
  onAdvanceStage,
  showControls = false,
}: OnboardingTrackerProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Tenant Aktif (10/10)</Badge>;
      case "APPROVED":
        return <Badge variant="success">Disetujui</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="warning">Sedang Ditelaah</Badge>;
      case "NEED_REVISION":
        return <Badge variant="warning">Perlu Revisi Dokumen</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Ditolak</Badge>;
      case "DEMO_SCHEDULED":
        return <Badge variant="info">Demo Terjadwal</Badge>;
      case "CONTRACT_PENDING":
        return <Badge variant="warning">PKS Tertunda</Badge>;
      case "PAYMENT_PENDING":
        return <Badge variant="warning">Menunggu Pembayaran</Badge>;
      default:
        return <Badge variant="neutral">Pengajuan Diterima</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div>
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Alur Kerja Onboarding Institusi
          </span>
          <h3 className="text-base font-bold text-[#172B4D] mt-0.5">
            Tahap {currentStageIndex} dari {stages.length}: {stages[currentStageIndex - 1]?.title || "Proses Berjalan"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-xs text-[#64748B]">
            {Math.round((currentStageIndex / stages.length) * 100)}% Selesai
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#00549c] h-full transition-all duration-500 rounded-full"
          style={{ width: `${(currentStageIndex / stages.length) * 100}%` }}
        />
      </div>

      {/* Horizontal / Grid Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const isCompleted = stage.index < currentStageIndex || status === "ACTIVE";
          const isCurrent = stage.index === currentStageIndex && status !== "ACTIVE";
          const isUpcoming = stage.index > currentStageIndex && status !== "ACTIVE";

          return (
            <div
              key={stage.key}
              className={`p-3 rounded-lg border text-left transition-all ${
                isCurrent
                  ? "bg-[#DCEAF5]/40 border-[#00549c] shadow-sm"
                  : isCompleted
                  ? "bg-[#F5F8FC] border-[#16A36A]/30"
                  : "bg-white border-[#E2E8F0] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    isCompleted
                      ? "bg-[#16A36A] text-white"
                      : isCurrent
                      ? "bg-[#00549c] text-white"
                      : "bg-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : stage.index}
                </span>
                {isCurrent && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00549c] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00549c]"></span>
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-[#172B4D] truncate">{stage.title}</h4>
              <p className="text-[10px] text-[#64748B] line-clamp-2 mt-0.5">{stage.description}</p>
            </div>
          );
        })}
      </div>

      {/* Live Stage Controls for Testing / Demo */}
      {showControls && onAdvanceStage && (
        <div className="p-3 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#172B4D]">
            <ShieldCheck className="h-4 w-4 text-[#00549c]" />
            <span className="font-semibold">Simulasi Reviewer Tahapan Onboarding:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {stages.map((st) => (
              <button
                key={st.index}
                type="button"
                onClick={() => onAdvanceStage(st.index)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                  st.index === currentStageIndex
                    ? "bg-[#00549c] text-white border-[#00549c]"
                    : "bg-white text-[#172B4D] border-[#E2E8F0] hover:bg-[#DCEAF5]/30"
                }`}
              >
                T{st.index}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

