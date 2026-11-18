"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingTracker, OnboardingStage } from "@/components/enterprise/onboarding-tracker";
import { ONBOARDING_STAGES } from "@/config/onboarding";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export default function OnboardingStatusPage() {
  const params = useParams();
  const router = useRouter();
  const registrationId = (params?.id as string) || "REG-2026-0001";

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [transitioning, setTransitioning] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/onboarding/registrations/${registrationId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [registrationId]);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleAdvanceStage = async (stageIndex: number) => {
    try {
      setTransitioning(true);
      setStatusMessage(null);

      // Determine matching status for the selected stage
      let targetStatus = "UNDER_REVIEW";
      if (stageIndex >= 10) targetStatus = "ACTIVE";
      else if (stageIndex >= 8) targetStatus = "PAYMENT_PENDING";
      else if (stageIndex >= 6) targetStatus = "CONTRACT_PENDING";
      else if (stageIndex >= 5) targetStatus = "DEMO_SCHEDULED";
      else if (stageIndex >= 4) targetStatus = "APPROVED";
      else if (stageIndex <= 1) targetStatus = "SUBMITTED";

      const res = await fetch("/api/v1/onboarding/status-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          status: targetStatus,
          currentStageIndex: stageIndex,
          reviewNotes: `Simulasi tahapan diperbarui ke Tahap ${stageIndex}.`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage(json.message);
        await fetchStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransitioning(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-[#00549c] mx-auto" />
        <p className="text-xs text-[#64748B]">Memuat status registrasi institusi...</p>
      </div>
    );
  }

  const reg = data?.registration;
  const stages: OnboardingStage[] = data?.stages?.length ? data.stages : ONBOARDING_STAGES;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="info">Nomor Registrasi: {reg?.registrationNumber || registrationId}</Badge>
            <Badge variant="neutral">{reg?.institutionType}</Badge>
          </div>
          <h1 className="text-lg font-bold text-[#172B4D]">{reg?.institutionName}</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Penanggung Jawab: {reg?.repFullName} ({reg?.repPosition}) • {reg?.officialEmail}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reg?.status === "ACTIVE" ? (
            <Button
              onClick={() => router.push("/dashboard")}
              className="gap-2 bg-[#16A36A] hover:bg-[#16A36A]/90 text-white text-xs"
            >
              <span>Buka Dashboard Institusi</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={fetchStatus}
              className="gap-1.5 text-xs border-[#E2E8F0]"
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Perbarui Status</span>
            </Button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-[#16A36A]/10 border border-[#16A36A]/20 rounded-md text-xs text-[#16A36A] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 10-Stage Lifecycle Stepper */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-6">
          <OnboardingTracker
            currentStageIndex={reg?.currentStageIndex || 1}
            status={reg?.status || "SUBMITTED"}
            stages={stages}
            onAdvanceStage={handleAdvanceStage}
            showControls={true}
          />
        </CardContent>
      </Card>

      {/* Detail Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Institutional Legal Profile */}
        <Card className="md:col-span-2 border-[#E2E8F0]">
          <CardHeader className="pb-3 border-b border-[#E2E8F0]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#172B4D] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#00549c]" />
              Data Lembaga & Verifikasi Legalitas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[#64748B]">Nomor Akta / AHU:</span>
                <p className="font-semibold text-[#172B4D] mt-0.5">{reg?.legalEntityNumber}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Izin Operasional OJK:</span>
                <p className="font-semibold text-[#172B4D] mt-0.5">{reg?.businessLicense}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Telepon Kantor:</span>
                <p className="font-semibold text-[#172B4D] mt-0.5">{reg?.phone}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Paket Langganan:</span>
                <p className="font-semibold text-[#172B4D] mt-0.5">{reg?.preferredSubscription}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0]">
              <span className="text-[#64748B]">Alamat Kantor Pusat:</span>
              <p className="font-medium text-[#172B4D] mt-0.5">{reg?.officeAddress}</p>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-2">Dokumen Pendukung Terunggah:</span>
              <div className="space-y-2">
                {reg?.documents?.map((doc: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 bg-[#F5F8FC] border border-[#E2E8F0] rounded flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-[#00549c]" />
                      <span className="font-medium text-[#172B4D]">{doc.fileName}</span>
                    </div>
                    <Badge variant="success">SHA-256 Valid</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviewer Notes & Action Box */}
        <div className="space-y-5">
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#172B4D] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#16A36A]" />
                Catatan Telaah Kepatuhan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <p className="text-[#64748B] leading-relaxed">
                {reg?.reviewNotes || "Dokumen registrasi telah masuk antrean penelaahan Tim Kepatuhan SCE."}
              </p>
              <div className="p-2.5 bg-[#DCEAF5]/30 border border-[#DCEAF5] rounded text-[11px] text-[#172B4D]">
                <strong>Status Saat Ini:</strong>{" "}
                {reg?.status === "ACTIVE"
                  ? "Tenant aktif. Seluruh akses modul akad dapat digunakan."
                  : "Menunggu penyelesaian verifikasi administrasi dan penjadwalan demo."}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                Layanan Bantuan Onboarding
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-xs">
              <p className="text-[#64748B]">Butuh bantuan terkait verifikasi atau demo khusus institusi?</p>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-[#172B4D]">
                  <Mail className="h-3.5 w-3.5 text-[#00549c]" />
                  <span>onboarding@sce-engine.id</span>
                </div>
                <div className="flex items-center gap-2 text-[#172B4D]">
                  <Phone className="h-3.5 w-3.5 text-[#00549c]" />
                  <span>+62 21 8062 8888</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

