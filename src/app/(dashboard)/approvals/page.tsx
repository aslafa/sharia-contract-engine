"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/enterprise/page-header";
import { useSession } from "@/lib/hooks/use-session";
import { ReadOnlyPanel } from "@/components/enterprise/access-notice";
import { formatIDR } from "@/lib/utils";
import {
  Check,
  Clock,
  AlertTriangle,
  RotateCcw,
  XCircle,
  MessageSquare,
  FileText,
  RefreshCw,
  Loader2,
  ShieldAlert,
  InboxIcon,
} from "lucide-react";

// ─── Local type definitions (mirror backend shapes without server-side imports) ─

interface DBApplication {
  id: string;
  applicationNumber: string;
  title: string;
  customerName: string;
  costPrice: number;
  akad: string;
  status: string;
  statusLabel: string;
  currentStage: string;
  createdByName: string;
  submittedAt?: string;
  shariaStatus: string;
  organizationId: string;
}

interface DBApprovalStep {
  id: string;
  applicationId: string;
  role: string;
  roleCode: string;
  name: string;
  status: string;          // "COMPLETED" | "CURRENT" | "PENDING" | "SKIPPED"
  actionDate?: string;
  comments?: string;
}

// ─── Stage ↔ RoleCode mapping (must match backend) ──────────────────────────

const STAGE_TO_ROLECODE: Record<string, string> = {
  LEGAL: "LEGAL_OFFICER",
  COMPLIANCE: "COMPLIANCE_OFFICER",
  DPS: "SHARIA_REVIEWER",
  MANAGEMENT: "MANAGEMENT",
};

// ─── Status badge helpers ────────────────────────────────────────────────────

function appStatusVariant(status: string): "success" | "danger" | "warning" | "secondary" {
  if (["APPROVED", "ACTIVE"].includes(status)) return "success";
  if (["REJECTED"].includes(status)) return "danger";
  if (["REVISION_REQUESTED"].includes(status)) return "warning";
  return "secondary";
}

function appStatusLabel(app: DBApplication): string {
  if (app.statusLabel) return app.statusLabel;
  return app.status.replace(/_/g, " ");
}

function stepStatusVariant(status: string): "success" | "warning" | "secondary" | "danger" {
  if (status === "COMPLETED") return "success";
  if (status === "CURRENT") return "warning";
  if (status === "SKIPPED") return "secondary";
  return "secondary";
}

function stepStatusLabel(status: string): string {
  if (status === "COMPLETED") return "Telah Disetujui";
  if (status === "CURRENT") return "Sedang Ditinjau";
  if (status === "SKIPPED") return "Dilewati";
  return "Menunggu";
}

// ─── Loading / empty / error components ─────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#64748B]">
      <Loader2 className="h-8 w-8 animate-spin text-[#00549c]" />
      <span className="text-sm font-medium">Memuat data pengajuan…</span>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-[#64748B]">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-[#172B4D]">Gagal memuat data</p>
        <p className="text-xs">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5 mr-1" />
        Coba Lagi
      </Button>
    </div>
  );
}

function EmptyStatePanel({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#64748B]">
      <InboxIcon className="h-10 w-10 text-[#CBD5E1]" />
      <p className="text-sm font-medium text-center max-w-xs">{message}</p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ApprovalsWorkflowPage() {
  const { user, loading: sessionLoading, can } = useSession();
  const canApprove = can("approvals:approve");
  const canRevise = can("approvals:revise");

  // ── data state
  const [applications, setApplications] = React.useState<DBApplication[]>([]);
  const [stepsMap, setStepsMap] = React.useState<Record<string, DBApprovalStep[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // ── selection & action state
  const [selectedAppId, setSelectedAppId] = React.useState<string | null>(null);
  const [actionComment, setActionComment] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // ── Fetch application list ─────────────────────────────────────────────────
  const fetchApplications = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/applications");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Gagal memuat data pengajuan");

      const apps: DBApplication[] = (json.data || []).filter(
        (a: DBApplication) => a.status !== "DRAFT"
      );
      setApplications(apps);

      // Auto-select first item if none selected or previous selection gone
      if (apps.length > 0) {
        setSelectedAppId((prev) =>
          prev && apps.some((a) => a.id === prev) ? prev : apps[0].id
        );
      } else {
        setSelectedAppId(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan tidak diketahui");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ── Fetch approval steps for selected application ──────────────────────────
  React.useEffect(() => {
    if (!selectedAppId) return;
    // If already loaded, skip re-fetch (will refresh after action)
    if (stepsMap[selectedAppId]) return;

    fetch(`/api/v1/applications/${selectedAppId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.steps) {
          setStepsMap((prev) => ({
            ...prev,
            [selectedAppId]: json.data.steps as DBApprovalStep[],
          }));
        }
      })
      .catch(() => {}); // silent — steps are non-critical for list view
  }, [selectedAppId, stepsMap]);

  // ── Approval action ────────────────────────────────────────────────────────
  const handleAction = async (action: "APPROVE" | "REJECT" | "REQUEST_REVISION") => {
    if (!selectedAppId || !user) return;

    if ((action === "REJECT" || action === "REQUEST_REVISION") && !actionComment.trim()) {
      setActionError("Catatan wajib disertakan untuk aksi Tolak atau Minta Revisi.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/v1/applications/${selectedAppId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleCode: user.role,
          actorName: user.fullName,
          action,
          comments: actionComment.trim() || "Disetujui tanpa catatan khusus.",
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Aksi gagal diproses oleh server");
      }

      setActionSuccess(
        action === "APPROVE"
          ? "Pengajuan berhasil disetujui dan dilanjutkan ke tahap berikutnya."
          : action === "REQUEST_REVISION"
          ? "Permintaan revisi telah dikirimkan ke pemrakarsa."
          : "Pengajuan telah ditolak."
      );
      setActionComment("");

      // Invalidate steps cache for this app so they re-fetch
      setStepsMap((prev) => {
        const next = { ...prev };
        delete next[selectedAppId];
        return next;
      });

      // Refresh application list
      await fetchApplications();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Terjadi kesalahan saat memproses aksi");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const selectedApp = applications.find((a) => a.id === selectedAppId) ?? null;
  const selectedSteps: DBApprovalStep[] = selectedAppId ? (stepsMap[selectedAppId] ?? []) : [];

  // User can act only when it's their stage AND they have permission
  const isMyStage =
    selectedApp != null &&
    user != null &&
    STAGE_TO_ROLECODE[selectedApp.currentStage] === user.role;

  const isShariaBlocked = selectedApp?.shariaStatus === "BLOCKED";
  const isTerminal = ["APPROVED", "REJECTED", "ACTIVE", "EXECUTED"].includes(
    selectedApp?.status ?? ""
  );

  const canActOnSelectedApp =
    isMyStage && !isTerminal && !isShariaBlocked && (canApprove || canRevise);

  const pendingCount = applications.filter(
    (a) => !["APPROVED", "REJECTED", "ACTIVE", "EXECUTED"].includes(a.status)
  ).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading || sessionLoading) return <LoadingSpinner />;
  if (error) return <ErrorPanel message={error} onRetry={fetchApplications} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alur Persetujuan Kontrak (Multi-Stage Approval Workflow)"
        description="Alur peninjauan berjenjang: Financing Officer → Legal Officer → Compliance Officer → Sharia Reviewer (DPS) → Authorized Approver → Penandatanganan Para Pihak."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Alur Persetujuan" },
        ]}
        badge={
          <Badge variant="warning" dot>
            {pendingCount} Berkas Menunggu Tinjauan
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplications}
            disabled={loading}
            className="text-xs font-semibold"
            title="Muat ulang daftar pengajuan"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Muat Ulang
          </Button>
        }
      />

      {applications.length === 0 ? (
        <EmptyStatePanel message="Tidak ada pengajuan yang memerlukan tindakan Anda saat ini." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT: Application list ─────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#64748B]">
              Daftar Berkas Pengajuan Persetujuan:
            </h3>

            {applications.map((app) => {
              const isSelected = app.id === selectedAppId;
              const myTurn =
                user != null && STAGE_TO_ROLECODE[app.currentStage] === user.role;
              return (
                <Card
                  key={app.id}
                  onClick={() => {
                    setSelectedAppId(app.id);
                    setActionError(null);
                    setActionSuccess(null);
                  }}
                  className={`cursor-pointer transition-all border-[#E2E8F0] ${
                    isSelected
                      ? "border-[#00549c] shadow-md ring-1 ring-[#00549c]"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#00549c]">
                        {app.applicationNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        {myTurn && !isTerminal && (
                          <Badge variant="warning" className="text-[9px]" dot>
                            Giliran Anda
                          </Badge>
                        )}
                        <Badge
                          variant={appStatusVariant(app.status)}
                          className="text-[10px]"
                        >
                          {appStatusLabel(app)}
                        </Badge>
                      </div>
                    </div>

                    <CardTitle className="text-xs font-bold text-[#172B4D] mt-1.5">
                      {app.title}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-[#64748B]">
                      Nasabah: <strong>{app.customerName}</strong>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 text-xs">
                    <div className="flex justify-between items-center text-[11px] text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                      <span>
                        Plafon:{" "}
                        <strong className="font-mono text-[#172B4D]">
                          {formatIDR(app.costPrice)}
                        </strong>
                      </span>
                      <span>
                        Akad:{" "}
                        <strong className="font-mono text-[#00549c] uppercase">
                          {app.akad}
                        </strong>
                      </span>
                    </div>
                    {app.shariaStatus === "BLOCKED" && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                        <ShieldAlert className="h-3 w-3" />
                        Terblokir — tidak lolos validasi syariah
                      </div>
                    )}
                    {app.shariaStatus === "REVIEW" && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-700 font-semibold">
                        <AlertTriangle className="h-3 w-3" />
                        Perlu pemeriksaan DPS
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── RIGHT: Workflow detail & action form ───────────────────────── */}
          <div className="lg:col-span-7">
            {selectedApp ? (
              <Card className="border-[#E2E8F0]">
                <CardHeader className="border-b border-[#E2E8F0] pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#00549c]">
                        {selectedApp.applicationNumber}
                      </span>
                      <CardTitle className="text-sm font-bold text-[#172B4D] mt-1">
                        {selectedApp.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Diajukan oleh {selectedApp.createdByName}
                        {selectedApp.submittedAt
                          ? ` pada ${new Date(selectedApp.submittedAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}`
                          : ""}
                      </CardDescription>
                    </div>

                    <Link href="/documents/generator">
                      <Button variant="outline" size="sm" className="text-xs font-semibold h-8">
                        <FileText className="h-3.5 w-3.5 mr-1 text-[#00549c]" />
                        Lihat Naskah Kontrak
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6 text-xs">
                  {/* Workflow steps visualizer */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B]">
                      Tahapan Peninjauan &amp; Rekam Persetujuan:
                    </h4>

                    {selectedSteps.length === 0 ? (
                      <p className="text-[11px] text-[#64748B] italic">
                        Memuat riwayat tahapan…
                      </p>
                    ) : (
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
                        {selectedSteps.map((step, idx) => (
                          <div key={step.id ?? idx} className="relative">
                            {/* Status Icon */}
                            <div
                              className={`absolute -left-6 top-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                step.status === "COMPLETED"
                                  ? "bg-[#16A36A] text-white ring-4 ring-[#16A36A]/10"
                                  : step.status === "CURRENT"
                                  ? "bg-[#00549c] text-white ring-4 ring-[#00549c]/20 animate-pulse"
                                  : "bg-[#E2E8F0] text-[#64748B]"
                              }`}
                            >
                              {step.status === "COMPLETED" ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                idx + 1
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#172B4D]">
                                  {step.role}:{" "}
                                  <span className="font-normal text-[#64748B]">
                                    {step.name}
                                  </span>
                                </span>
                                <Badge
                                  variant={stepStatusVariant(step.status)}
                                  className="text-[9px]"
                                >
                                  {stepStatusLabel(step.status)}
                                </Badge>
                              </div>

                              {step.actionDate && (
                                <p className="text-[10px] text-[#64748B] font-mono">
                                  {new Date(step.actionDate).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  WIB
                                </p>
                              )}

                              {step.comments && (
                                <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#172B4D] italic mt-1">
                                  &ldquo;{step.comments}&rdquo;
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sharia blocked notice */}
                  {isShariaBlocked && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                      <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />
                      <div>
                        <p className="font-bold">Pengajuan Diblokir — Tidak Lolos Validasi Syariah</p>
                        <p className="mt-0.5 text-red-700">
                          Sistem Engine Syariah mendeteksi ketidaksesuaian fatal. Tidak ada tindakan approval yang dapat dilakukan. Silakan hubungi DPS atau pemrakarsa untuk perbaikan mendasar.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Console — gated by permission + stage match */}
                  {!isTerminal && !isShariaBlocked && (
                    sessionLoading ? null :
                    !canApprove && !canRevise ? (
                      <ReadOnlyPanel
                        message="Peran Anda tidak memiliki izin approvals:approve / approvals:revise, sehingga konsol keputusan tidak tersedia. Halaman ini ditampilkan sebagai mode baca saja untuk memantau progres peninjauan berjenjang."
                        hint="Tahap peninjauan dapat dijalankan oleh: Legal Officer, Compliance Officer, Dewan Pengawas Syariah (DPS), dan Komite Pembiayaan (Manajemen) — masing-masing pada tahapnya, diverifikasi ulang oleh backend."
                      />
                    ) : !isMyStage ? (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
                        <Clock className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#94A3B8]" />
                        <div>
                          <p className="font-semibold text-[#172B4D]">Bukan Tahap Anda</p>
                          <p className="mt-0.5">
                            Pengajuan ini saat ini berada di tahap{" "}
                            <strong>{selectedApp.currentStage}</strong>. Anda dapat memantau
                            progres, namun tidak dapat mengambil tindakan pada tahap ini.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] space-y-3 pt-4">
                        <div className="flex items-center gap-1.5 font-bold text-[#172B4D]">
                          <MessageSquare className="h-4 w-4 text-[#00549c]" />
                          <span>Catatan Penelaah / Fatwa Dewan Pengawas Syariah:</span>
                        </div>

                        <textarea
                          rows={3}
                          value={actionComment}
                          onChange={(e) => setActionComment(e.target.value)}
                          disabled={actionLoading}
                          placeholder="Tuliskan catatan kelayakan hukum syariah, klausul tambahan, atau rekomendasi komite…"
                          className="w-full rounded-md border border-[#E2E8F0] p-2 text-xs text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#00549c] disabled:opacity-50"
                        />

                        {/* Feedback messages */}
                        {actionError && (
                          <div className="flex items-center gap-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded p-2">
                            <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                            {actionError}
                          </div>
                        )}
                        {actionSuccess && (
                          <div className="flex items-center gap-2 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded p-2">
                            <Check className="h-3.5 w-3.5 flex-shrink-0" />
                            {actionSuccess}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                          {canRevise && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction("REQUEST_REVISION")}
                              disabled={actionLoading}
                              className="text-xs font-semibold text-[#B4690E]"
                            >
                              {actionLoading ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              )}
                              Minta Revisi Klausul
                            </Button>
                          )}

                          {canRevise && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction("REJECT")}
                              disabled={actionLoading}
                              className="text-xs font-semibold text-red-700 border-red-200 hover:bg-red-50"
                            >
                              {actionLoading ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                              )}
                              Tolak
                            </Button>
                          )}

                          {canApprove && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAction("APPROVE")}
                              disabled={actionLoading}
                              className="text-xs font-bold"
                            >
                              {actionLoading ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5 mr-1" />
                              )}
                              Setujui &amp; Lanjutkan ke Tahap Berikutnya
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            ) : (
              <EmptyStatePanel message="Pilih pengajuan di sebelah kiri untuk melihat detail dan mengambil tindakan." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
