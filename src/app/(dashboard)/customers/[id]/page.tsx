"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/enterprise/page-header";
import { EmptyState } from "@/components/enterprise/empty-state";
import { ErrorState } from "@/components/enterprise/error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useSession } from "@/lib/hooks/use-session";
import { apiRequest, statusErrorMessage } from "@/lib/api/client";
import { formatIDR, formatDateID, cn } from "@/lib/utils";
import {
  AML_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
  Customer,
  CustomerAmlStatus,
  CustomerKycStatus,
  CustomerRegistrationStatus,
  CustomerRiskRating,
  CustomerVerificationStep,
  KYC_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  RISK_RATING_LABELS,
  identifierLabel,
  incomeLabel,
} from "@/types/customer";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Circle,
  CircleCheck,
  ClipboardCheck,
  Clock,
  Contact as FileContact,
  FileText,
  Home,
  Info,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  UserCheck,
  UserRound,
  UserX,
  Wallet,
  XCircle,
} from "lucide-react";

function DetailItem({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
        {label}
      </p>
      <p
        className={`mt-1 text-xs font-semibold text-[#172B4D] break-words ${mono ? "font-mono" : ""
          }`}
      >
        {value === undefined || value === null || value === "" ? (
          <span className="text-[#94A3B8] font-normal">Tidak diisi</span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function RiskBadge({ rating }: { rating: CustomerRiskRating }) {
  const variant = rating === "HIGH" ? "danger" : rating === "MEDIUM" ? "warning" : "success";
  return (
    <Badge variant={variant} dot className="text-xs px-3 py-1">
      {RISK_RATING_LABELS[rating]}
    </Badge>
  );
}

function RegistrationStatusBadge({ status }: { status: CustomerRegistrationStatus }) {
  const variant =
    status === "APPROVED"
      ? "success"
      : status === "REJECTED"
        ? "danger"
        : status === "UNDER_REVIEW"
          ? "info"
          : "neutral";
  const Icon =
    status === "APPROVED"
      ? CheckCircle2
      : status === "REJECTED"
        ? XCircle
        : status === "UNDER_REVIEW"
          ? Clock
          : status === "SUBMITTED"
            ? Send
            : FileText;

  return (
    <Badge variant={variant} className="text-xs px-2.5 py-1 font-medium whitespace-nowrap">
      <Icon className="h-3 w-3 mr-1" />
      {REGISTRATION_STATUS_LABELS[status] || status}
    </Badge>
  );
}

function KycStatusBadge({ status }: { status: CustomerKycStatus }) {
  const variant =
    status === "VERIFIED"
      ? "success"
      : status === "REJECTED"
        ? "danger"
        : status === "REVISION_REQUIRED"
          ? "warning"
          : "neutral";
  const Icon =
    status === "VERIFIED"
      ? CheckCircle2
      : status === "REJECTED"
        ? XCircle
        : status === "REVISION_REQUIRED"
          ? AlertTriangle
          : Clock;

  return (
    <Badge variant={variant} className="text-xs px-2.5 py-1 font-medium whitespace-nowrap">
      <Icon className="h-3 w-3 mr-1" />
      {KYC_STATUS_LABELS[status] || status}
    </Badge>
  );
}

function AmlStatusBadge({ status }: { status: CustomerAmlStatus }) {
  const variant =
    status === "FLAGGED"
      ? "danger"
      : status === "PENDING"
        ? "warning"
        : status === "CLEARED"
          ? "success"
          : "neutral";
  const Icon =
    status === "FLAGGED"
      ? ShieldAlert
      : status === "PENDING"
        ? ShieldQuestion
        : status === "CLEARED"
          ? ShieldCheck
          : ShieldQuestion;

  return (
    <Badge variant={variant} className="text-xs px-2.5 py-1 font-medium whitespace-nowrap">
      <Icon className="h-3 w-3 mr-1" />
      {AML_STATUS_LABELS[status] || status}
    </Badge>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = params?.id;
  const { user, loading: sessionLoading, can } = useSession();

  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ message: string; status: number } | null>(null);
  const [justCreated, setJustCreated] = React.useState(false);

  // Verification action state
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Dialog / Modal state
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean;
    action: string;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "primary" | "danger" | "warning";
    requiresComments: boolean;
    riskRatingInput?: CustomerRiskRating;
  }>({
    isOpen: false,
    action: "",
    title: "",
    description: "",
    confirmLabel: "",
    variant: "primary",
    requiresComments: false,
  });
  const [commentInput, setCommentInput] = React.useState("");
  const [riskInput, setRiskInput] = React.useState<CustomerRiskRating>("LOW");

  const canView = can("customers:view");
  const canEdit = can("customers:edit");

  const isComplianceOrAdmin =
    user?.role === "COMPLIANCE_OFFICER" ||
    user?.role === "INSTITUTION_ADMIN" ||
    Boolean(user?.isSuperAdmin);

  const isFinancingOfficer = user?.role === "FINANCING_OFFICER";

  const loadCustomer = React.useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);

    const result = await apiRequest<Customer>(
      `/api/v1/customers/${customerId}`
    );

    if (result.ok && result.data) {
      setCustomer(result.data);
      if (result.data.riskRating) {
        setRiskInput(result.data.riskRating);
      }
    } else {
      setCustomer(null);
      setError({
        message: result.error?.message || statusErrorMessage(result.status),
        status: result.status,
      });
    }
    setLoading(false);
  }, [customerId]);

  React.useEffect(() => {
    setJustCreated(
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("created") === "1"
    );
  }, [customerId]);

  React.useEffect(() => {
    if (!sessionLoading && canView) {
      loadCustomer();
    } else if (!sessionLoading && !canView) {
      setLoading(false);
    }
  }, [sessionLoading, canView, loadCustomer]);

  const handleOpenActionDialog = (
    action: string,
    title: string,
    description: string,
    confirmLabel: string,
    variant: "primary" | "danger" | "warning" = "primary",
    requiresComments = false
  ) => {
    setCommentInput("");
    setActionError(null);
    setActionSuccess(null);
    setDialogState({
      isOpen: true,
      action,
      title,
      description,
      confirmLabel,
      variant,
      requiresComments,
    });
  };

  const handleExecuteAction = async () => {
    if (!customerId) return;
    if (dialogState.requiresComments && !commentInput.trim()) {
      setActionError("Catatan / alasan wajib diisi untuk tindakan ini.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    const payload: Record<string, unknown> = {
      action: dialogState.action,
      comments: commentInput.trim() || undefined,
    };

    if (dialogState.action === "SET_RISK_RATING") {
      payload.riskRating = riskInput;
    }

    const res = await apiRequest<Customer>(`/api/v1/customers/${customerId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setActionLoading(false);

    if (res.ok && res.data) {
      setCustomer(res.data);
      setActionSuccess(`Aksi verifikasi berhasil diproses.`);
      setDialogState((prev) => ({ ...prev, isOpen: false }));
    } else {
      setActionError(res.error?.message || res.message || "Gagal memproses aksi verifikasi.");
    }
  };

  if (!sessionLoading && !user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detail Nasabah"
          breadcrumbs={[
            { label: "Data Nasabah", href: "/customers" },
            { label: "Detail" },
          ]}
        />
        <ErrorState
          title="Sesi Berakhir"
          message="Sesi Anda tidak valid atau telah berakhir. Silakan login kembali untuk mengakses profil nasabah."
        />
        <div className="text-right">
          <Link href="/login">
            <Button size="sm" variant="outline">
              Menu Halaman Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!sessionLoading && !canView) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detail Nasabah"
          breadcrumbs={[
            { label: "Data Nasabah", href: "/customers" },
            { label: "Detail" },
          ]}
        />
        <ErrorState
          title="Akses Ditolak"
          message="Peran Anda saat ini tidak memiliki izin 'customers:view' untuk membuka profil nasabah."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {justCreated && customer && !loading && !error && (
        <div className="p-3.5 rounded-xl bg-[#16A36A] text-white text-xs font-bold shadow-sm flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CircleCheck className="h-4 w-4" />
            Nasabah berhasil didaftarkan dengan CIF {customer.cifNumber}. Menunggu pemeriksaan kepatuhan berjenjang.
          </span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-[#16A36A] text-white text-xs font-bold shadow-sm flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CircleCheck className="h-4 w-4" />
            {actionSuccess}
          </span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-white hover:text-slate-200 text-xs font-bold underline"
          >
            Tutup
          </button>
        </div>
      )}

      <PageHeader
        title={loading ? "Memuat Profil Nasabah..." : customer ? customer.name : "Detail Nasabah"}
        description="Profil lengkap nasabah: identitas CIF, kontak, klasifikasi risiko, serta riwayat dan progres verifikasi."
        breadcrumbs={[
          { label: "Data Nasabah", href: "/customers" },
          { label: customer?.cifNumber || "Detail" },
        ]}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => router.push("/customers")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali
            </Button>
            {customer && canEdit && (
              <Link href={`/customers/${customer.id}/edit`}>
                <Button size="sm" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Data
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-40 rounded-xl" />
        </div>
      )}

      {/* Error states */}
      {!loading && error && (
        <div className="space-y-3">
          <ErrorState
            title={
              error.status === 401
                ? "Sesi Berakhir"
                : error.status === 403
                  ? "Akses Ditolak"
                  : error.status === 404
                    ? "Nasabah Tidak Ditemukan"
                    : "Gagal Memuat Profil"
            }
            message={error.message}
            onRetry={loadCustomer}
          />
          {error.status === 404 && (
            <div className="text-right">
              <Link href="/customers">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Kembali ke Direktori Nasabah
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Detail content */}
      {!loading && !error && customer && (
        <>
          {/* Identity header card */}
          <Card className="rounded-xl overflow-hidden shadow-sm border-slate-200">
            <div className="p-5 bg-[#00549c] text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 border border-white/20 shrink-0">
                    <UserRound className="h-6 w-6 text-sky-200" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold">{customer.name}</h2>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold border border-white/15">
                        {CUSTOMER_TYPE_LABELS[customer.type]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200/90 font-mono mt-0.5">
                      CIF {customer.cifNumber}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RegistrationStatusBadge status={customer.registrationStatus} />
                  <KycStatusBadge status={customer.kycStatus} />
                  <AmlStatusBadge status={customer.amlStatus} />
                  <RiskBadge rating={customer.riskRating} />
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Identity & CIF */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileContact className="h-4 w-4 text-[#00549c]" />
                  <CardTitle className="text-sm">Identitas &amp; CIF</CardTitle>
                </div>
                <CardDescription>Dokumen identifikasi resmi nasabah.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <DetailItem label="Nomor CIF" value={customer.cifNumber} mono />
                <DetailItem
                  label="Jenis Nasabah"
                  value={CUSTOMER_TYPE_LABELS[customer.type]}
                />
                <DetailItem
                  label={identifierLabel(customer.type)}
                  value={customer.identifierNumber}
                  mono
                />
                <DetailItem
                  label="Status Verifikasi Akhir"
                  value={
                    <Badge variant={customer.isVerified ? "success" : "neutral"} dot>
                      {customer.isVerified ? "Terverifikasi (KYC Sah)" : "Belum Terverifikasi"}
                    </Badge>
                  }
                />
                <DetailItem
                  label="Tanggal Pendaftaran"
                  value={formatDateID(customer.createdAt)}
                />
                <DetailItem
                  label="Terakhir Diperbarui"
                  value={formatDateID(customer.updatedAt)}
                />
              </CardContent>
            </Card>

            {/* Contact & address */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#00549c]" />
                  <CardTitle className="text-sm">Kontak &amp; Alamat</CardTitle>
                </div>
                <CardDescription>
                  Kanal komunikasi dan domisili/kedudukan nasabah.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <DetailItem
                  label="Email"
                  value={
                    customer.email ? (
                      <a
                        href={`mailto:${customer.email}`}
                        className="inline-flex items-center gap-1.5 text-[#00549c] hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </a>
                    ) : undefined
                  }
                />
                <DetailItem
                  label="Nomor Telepon"
                  value={
                    customer.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-[#64748B]" />
                        {customer.phone}
                      </span>
                    ) : undefined
                  }
                />
                <DetailItem
                  label="Alamat"
                  value={
                    customer.address ? (
                      <span className="inline-flex items-start gap-1.5">
                        <Home className="h-3 w-3 text-[#64748B] mt-0.5 shrink-0" />
                        {customer.address}
                      </span>
                    ) : undefined
                  }
                  className="sm:col-span-2"
                />
                <DetailItem
                  label="Kota"
                  value={
                    customer.city ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-[#64748B]" />
                        {customer.city}
                      </span>
                    ) : undefined
                  }
                />
                <DetailItem label="Provinsi" value={customer.province} />
                <DetailItem label="Kode Pos" value={customer.postalCode} mono />
              </CardContent>
            </Card>
          </div>

          {/* ============================================================== */}
          {/* CUSTOMER ONBOARDING & VERIFICATION TRACKER (TIMELINE)           */}
          {/* ============================================================== */}
          <Card className="rounded-xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-[#00549c]" />
                    <CardTitle className="text-sm">Riwayat &amp; Progres Verifikasi Nasabah</CardTitle>
                  </div>
                  <CardDescription>
                    Pelacakan 5 tahapan onboarding: Pendaftaran $\rightarrow$ Verifikasi KYC $\rightarrow$ Skrining APU-PPT $\rightarrow$ Penilaian Risiko $\rightarrow$ Keputusan Akhir.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Progres:</span>
                  <Badge variant={customer.isVerified ? "success" : "info"}>
                    {customer.isVerified
                      ? "100% Selesai (Terverifikasi)"
                      : customer.registrationStatus === "REJECTED"
                        ? "Ditolak"
                        : "Sedang Berjalan"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {(customer.verificationSteps || []).map((step: CustomerVerificationStep, idx: number) => {
                  const isDone = step.status === "COMPLETED";
                  const isCurrent = step.status === "CURRENT";
                  const isRevision = step.status === "REVISION_REQUIRED";
                  const isRejected = step.status === "REJECTED";

                  return (
                    <div key={step.stepKey} className="relative">
                      {/* Step Circle Indicator */}
                      <div
                        className={cn(
                          "absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                          isDone
                            ? "bg-[#16A36A] text-white shadow-sm ring-4 ring-emerald-50"
                            : isCurrent
                              ? "bg-[#00549c] text-white ring-4 ring-sky-100 animate-pulse"
                              : isRevision
                                ? "bg-[#E9A23B] text-white ring-4 ring-amber-100"
                                : isRejected
                                  ? "bg-[#DC2626] text-white ring-4 ring-rose-100"
                                  : "bg-slate-100 text-slate-400 border border-slate-300"
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isRejected ? (
                          <XCircle className="h-4 w-4" />
                        ) : isRevision ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          step.stepNumber
                        )}
                      </div>

                      {/* Step Content Box */}
                      <div
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          isCurrent
                            ? "border-[#00549c]/40 bg-[#F5F8FC]/80 shadow-xs"
                            : isRevision
                              ? "border-[#E9A23B]/40 bg-[#FFFBEB]"
                              : isRejected
                                ? "border-[#DC2626]/30 bg-[#FEF2F2]"
                                : "border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#172B4D]">
                              Tahap {step.stepNumber}: {step.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded">
                              {step.roleTitle}
                            </span>
                          </div>
                          <Badge
                            variant={
                              isDone
                                ? "success"
                                : isCurrent
                                  ? "info"
                                  : isRevision
                                    ? "warning"
                                    : isRejected
                                      ? "danger"
                                      : "neutral"
                            }
                            className="w-fit"
                          >
                            {step.statusLabel}
                          </Badge>
                        </div>

                        {/* Officer & Timestamp */}
                        {(step.officerName || step.actionDate) && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                            {step.officerName && (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                                {step.officerName}
                              </span>
                            )}
                            {step.actionDate && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {formatDateID(step.actionDate)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Decision / Inspection Comments */}
                        {step.comments && (
                          <p className="mt-2 text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                            {step.comments}
                          </p>
                        )}

                        {/* Inspected Documents */}
                        {step.documentsInspected && step.documentsInspected.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="text-slate-400 font-medium">Dokumen:</span>
                            {step.documentsInspected.map((doc, docIdx) => (
                              <span
                                key={docIdx}
                                className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium border border-slate-200"
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Next Action */}
                        {step.nextAction && !isDone && !isRejected && (
                          <div className="mt-2.5 text-[11px] font-medium text-[#00549c] flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 text-[#00549c] shrink-0" />
                            <span>Tindakan selanjutnya: {step.nextAction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ============================================================== */}
          {/* VERIFICATION ACTIONS PANEL (ROLE-GATED)                        */}
          {/* ============================================================== */}
          <Card className="rounded-xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00549c]" />
                <CardTitle className="text-sm">Panel Tindakan Verifikasi Kepatuhan</CardTitle>
              </div>
              <CardDescription>
                Tindakan pemeriksaan identitas nasabah, skrining APU-PPT, dan penetapan persetujuan pendaftaran.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {actionError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* COMPLIANCE OFFICER & INSTITUTION ADMIN ACTIONS */}
              {isComplianceOrAdmin && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Action 1: KYC Verification */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">1. Verifikasi Dokumen KYC</span>
                        <KycStatusBadge status={customer.kycStatus} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Periksa keabsahan identitas (NIK/NPWP/NIB) dan kelengkapan dokumen nasabah.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 text-xs"
                          onClick={() =>
                            handleOpenActionDialog(
                              "VERIFY_KYC",
                              "Verifikasi Dokumen KYC Sah",
                              "Konfirmasi bahwa identitas dan dokumen KYC nasabah telah diperiksa dan dinyatakan sah serta sesuai.",
                              "Verifikasi Sah",
                              "primary"
                            )
                          }
                          disabled={actionLoading || customer.kycStatus === "VERIFIED"}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          Verifikasi Sah
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 text-xs"
                          onClick={() =>
                            handleOpenActionDialog(
                              "REQUEST_REVISION_KYC",
                              "Minta Perbaikan Dokumen KYC",
                              "Berikan catatan perbaikan dokumen yang wajib dilengkapi oleh Financing Officer.",
                              "Kirim Permintaan Revisi",
                              "warning",
                              true
                            )
                          }
                          disabled={actionLoading}
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600" />
                          Minta Revisi
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 text-xs"
                          onClick={() =>
                            handleOpenActionDialog(
                              "REJECT_KYC",
                              "Tolak Dokumen KYC",
                              "Tolak verifikasi identitas nasabah karena dokumen palsu atau tidak memenuhi syarat.",
                              "Tolak KYC",
                              "danger",
                              true
                            )
                          }
                          disabled={actionLoading || customer.kycStatus === "REJECTED"}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600" />
                          Tolak KYC
                        </Button>
                      </div>
                    </div>

                    {/* Action 2: AML/CFT Screening */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">2. Skrining AML/CFT (APU-PPT)</span>
                        <AmlStatusBadge status={customer.amlStatus} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Pemeriksaan database DTTOT, pendanaan terorisme, PEP, dan daftar sanksi.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 text-xs"
                          onClick={() =>
                            handleOpenActionDialog(
                              "SET_AML_CLEARED",
                              "Tandai Cleared APU-PPT",
                              "Konfirmasi bahwa hasil skrining APU-PPT nasabah bersih (tidak terdaftar pada DTTOT atau sanksi).",
                              "Tandai Cleared",
                              "primary"
                            )
                          }
                          disabled={actionLoading || customer.amlStatus === "CLEARED"}
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          Tandai Cleared
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 text-xs"
                          onClick={() =>
                            handleOpenActionDialog(
                              "SET_AML_FLAGGED",
                              "Tandai Flagged AML/CFT",
                              "Tandai nasabah sebagai FLAGGED karena indikasi DTTOT/PEP/Sanksi. Pengajuan nasabah akan diblokir otomatis.",
                              "Tandai Flagged",
                              "danger",
                              true
                            )
                          }
                          disabled={actionLoading || customer.amlStatus === "FLAGGED"}
                        >
                          <ShieldAlert className="h-3.5 w-3.5 mr-1 text-rose-600" />
                          Tandai Flagged
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Action 3: Risk Assessment */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">3. Penilaian Profil Risiko</span>
                        <RiskBadge rating={customer.riskRating} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Tetapkan tingkat risiko nasabah berdasarkan profil omzet, domisili, dan kepatuhan.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Select
                          value={riskInput}
                          onChange={(e) => setRiskInput(e.target.value as CustomerRiskRating)}
                          className="w-auto text-xs font-medium"
                          disabled={actionLoading}
                        >
                          <option value="LOW">Rendah (Low Risk)</option>
                          <option value="MEDIUM">Menengah (Medium Risk)</option>
                          <option value="HIGH">Tinggi (High Risk)</option>
                        </Select>

                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            handleOpenActionDialog(
                              "SET_RISK_RATING",
                              `Tetapkan Tingkat Risiko: ${riskInput}`,
                              `Konfirmasi penetapan klasifikasi risiko nasabah menjadi ${riskInput}.`,
                              "Simpan Rating",
                              "primary"
                            )
                          }
                          disabled={actionLoading || customer.riskRating === riskInput}
                        >
                          Simpan Rating
                        </Button>
                      </div>
                    </div>

                    {/* Action 4: Final Approval / Rejection */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">4. Keputusan Akhir Pendaftaran</span>
                        <RegistrationStatusBadge status={customer.registrationStatus} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Persetujuan resmi nasabah. Syarat wajib: KYC berstatus Sah dan AML berstatus Cleared.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="bg-[#16A36A] hover:bg-[#138656] text-white text-xs gap-1"
                          onClick={() =>
                            handleOpenActionDialog(
                              "FINAL_APPROVE",
                              "Persetujuan Akhir Nasabah",
                              "Nasabah akan disetujui resmi, terverifikasi, dan siap diajukan untuk transaksi akad pembiayaan.",
                              "Setujui Nasabah",
                              "primary"
                            )
                          }
                          disabled={
                            actionLoading ||
                            customer.isVerified ||
                            customer.kycStatus !== "VERIFIED" ||
                            customer.amlStatus !== "CLEARED"
                          }
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Setujui Nasabah
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          className="text-xs gap-1"
                          onClick={() =>
                            handleOpenActionDialog(
                              "FINAL_REJECT",
                              "Tolak Pendaftaran Nasabah",
                              "Pendaftaran nasabah akan ditolak secara permanen.",
                              "Tolak Pendaftaran",
                              "danger",
                              true
                            )
                          }
                          disabled={actionLoading || customer.registrationStatus === "REJECTED"}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Tolak Nasabah
                        </Button>
                      </div>
                      {(!customer.isVerified && (customer.kycStatus !== "VERIFIED" || customer.amlStatus !== "CLEARED")) && (
                        <p className="text-[10px] text-amber-600 font-medium">
                          * Tombol Setujui Nasabah aktif setelah KYC = Sah dan AML = Cleared.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FINANCING OFFICER ACTIONS */}
              {isFinancingOfficer && !isComplianceOrAdmin && (
                <div className="space-y-3">
                  {customer.kycStatus === "REVISION_REQUIRED" ? (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        Pemberitahuan: Compliance Officer Meminta Perbaikan Dokumen
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Catatan revisi: <em>{customer.revisionNotes || "Silakan periksa dan perbarui data nasabah."}</em>
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <Link href={`/customers/${customer.id}/edit`}>
                          <Button size="sm" className="text-xs gap-1">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit &amp; Perbarui Berkas
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-amber-400 text-amber-800"
                          onClick={() =>
                            handleOpenActionDialog(
                              "SUBMIT_REVISED_DATA",
                              "Kirim Ulang Data Perbaikan",
                              "Konfirmasi bahwa berkas dan data nasabah telah diperbaiki dan siap diperiksa kembali oleh Compliance Officer.",
                              "Kirim Perbaikan",
                              "primary"
                            )
                          }
                          disabled={actionLoading}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Kirim Ulang ke Compliance
                        </Button>
                      </div>
                    </div>
                  ) : customer.registrationStatus === "DRAFT" ? (
                    <div className="p-4 rounded-xl border border-sky-200 bg-sky-50 space-y-2">
                      <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
                        <FileText className="h-4 w-4" />
                        Status Nasabah: Draf Formulir
                      </div>
                      <p className="text-xs text-sky-700 leading-relaxed">
                        Formulir nasabah saat ini berstatus draf. Kirimkan pengajuan ini untuk memulai proses verifikasi kepatuhan.
                      </p>
                      <Button
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() =>
                          handleOpenActionDialog(
                            "SUBMIT",
                            "Kirim Pengajuan Pendaftaran",
                            "Kirim draf nasabah ke antrean verifikasi Compliance Officer.",
                            "Kirim Pengajuan",
                            "primary"
                          )
                        }
                        disabled={actionLoading}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Kirim Pengajuan Pendaftaran
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                      <Info className="h-4 w-4 text-[#00549c] mt-0.5 shrink-0" />
                      <div className="text-xs text-slate-600 leading-relaxed">
                        Anda login sebagai <strong>Financing Officer (AO/FO)</strong>. Proses verifikasi dokumen identitas (KYC), skrining AML/CFT, dan persetujuan pendaftaran dilakukan secara independen oleh <strong>Compliance Officer</strong>.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* READ-ONLY NOTICE FOR OTHER ROLES */}
              {!isComplianceOrAdmin && !isFinancingOfficer && (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                  <LockKeyhole className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <strong>Mode Peninjauan (Read-Only):</strong> Peran Anda ({user?.role}) memiliki akses peninjauan terhadap seluruh jejak riwayat verifikasi dan kepatuhan nasabah. Keputusan verifikasi dilakukan oleh Compliance Officer.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {customer.amlStatus === "FLAGGED" && (
            <ErrorState
              title="Perhatian Ketat: Nasabah Terkena Flag AML"
              message="Nasabah tercatat dengan status AML FLAGGED. Sistem memblokir otomatis pembuatan pengajuan pembiayaan baru atas nama nasabah ini sesuai kepatuhan regulasi APU-PPT."
            />
          )}
        </>
      )}

      {/* CONFIRMATION / ACTION MODAL */}
      {dialogState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{dialogState.title}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{dialogState.description}</p>
            </div>

            {dialogState.requiresComments && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">
                  Catatan / Alasan Pemeriksaan <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Tuliskan catatan pemeriksaan atau instruksi perbaikan..."
                  className="text-xs"
                  rows={3}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant={dialogState.variant === "danger" ? "danger" : "default"}
                onClick={handleExecuteAction}
                disabled={actionLoading}
              >
                {actionLoading ? "Memproses..." : dialogState.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
