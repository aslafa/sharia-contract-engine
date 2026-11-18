"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/enterprise/page-header";
import { SearchInput } from "@/components/enterprise/search-input";
import { Pagination } from "@/components/enterprise/pagination";
import { EmptyState } from "@/components/enterprise/empty-state";
import { ErrorState } from "@/components/enterprise/error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/hooks/use-session";
import { apiRequest, statusErrorMessage } from "@/lib/api/client";
import { formatDateID, cn } from "@/lib/utils";
import {
  AML_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
  Customer,
  CustomerAmlStatus,
  CustomerKycStatus,
  CustomerRegistrationStatus,
  CustomerRiskRating,
  CustomerType,
  KYC_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  RISK_RATING_LABELS,
} from "@/types/customer";
import {
  AlertTriangle,
  BookUser,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  LockKeyhole,
  Pencil,
  Plus,
  SearchX,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  UsersRound,
  XCircle,
} from "lucide-react";

const PAGE_SIZE = 10;

function RiskRatingBadge({ rating }: { rating: CustomerRiskRating }) {
  const variant = rating === "HIGH" ? "danger" : rating === "MEDIUM" ? "warning" : "success";
  return (
    <Badge variant={variant} dot>
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
    <Badge variant={variant} className="font-medium whitespace-nowrap">
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
    <Badge variant={variant} className="font-medium whitespace-nowrap">
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
  const label =
    status === "FLAGGED"
      ? "FLAGGED (DTTOT/Sanksi)"
      : status === "PENDING"
      ? "Menunggu Skrining"
      : status === "CLEARED"
      ? "CLEARED (Bersih)"
      : "Belum Diskukrining";
  return (
    <Badge variant={variant} className="font-medium whitespace-nowrap">
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

export default function CustomerListPage() {
  const { user, loading: sessionLoading, can } = useSession();
  const router = useRouter();

  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ message: string; status: number } | null>(null);

  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<"" | CustomerType>("");
  const [amlStatus, setAmlStatus] = React.useState<"" | CustomerAmlStatus>("");
  const [riskRating, setRiskRating] = React.useState<"" | CustomerRiskRating>("");
  const [registrationStatus, setRegistrationStatus] = React.useState<"" | CustomerRegistrationStatus>("");
  const [kycStatus, setKycStatus] = React.useState<"" | CustomerKycStatus>("");
  const [page, setPage] = React.useState(1);

  const canView = can("customers:view");
  const canCreate = can("customers:create");
  const canEdit = can("customers:edit");

  const loadCustomers = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type) params.set("type", type);
    if (amlStatus) params.set("amlStatus", amlStatus);
    if (riskRating) params.set("riskRating", riskRating);
    if (registrationStatus) params.set("registrationStatus", registrationStatus);
    if (kycStatus) params.set("kycStatus", kycStatus);

    const result = await apiRequest<Customer[]>(
      `/api/v1/customers${params.toString() ? `?${params.toString()}` : ""}`
    );

    if (result.ok && result.data) {
      setCustomers(result.data);
    } else {
      setCustomers([]);
      setError({
        message: result.error?.message || statusErrorMessage(result.status),
        status: result.status,
      });
    }
    setLoading(false);
  }, [search, type, amlStatus, riskRating, registrationStatus, kycStatus]);

  React.useEffect(() => {
    if (!sessionLoading && canView) {
      loadCustomers();
    } else if (!sessionLoading && !canView) {
      setLoading(false);
    }
  }, [sessionLoading, canView, loadCustomers]);

  // Reset to first page whenever filters change.
  React.useEffect(() => {
    setPage(1);
  }, [search, type, amlStatus, riskRating, registrationStatus, kycStatus]);

  const hasActiveFilters = Boolean(
    search.trim() || type || amlStatus || riskRating || registrationStatus || kycStatus
  );

  // UI-side pagination — the API contract returns the full tenant-scoped list.
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedCustomers = customers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleResetFilters = () => {
    setSearch("");
    setType("");
    setAmlStatus("");
    setRiskRating("");
    setRegistrationStatus("");
    setKycStatus("");
  };

  const breadcrumbItems = [
    { label: "Data Nasabah", href: "/customers" },
    { label: "Direktori Nasabah" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Direktori Nasabah"
        description="Pusat data nasabah (CIF) lembaga: identitas, kontak, klasifikasi risiko, dan status kepatuhan AML/CFT sesuai kerangka APU-PPT."
        breadcrumbs={breadcrumbItems}
        badge={
          !sessionLoading && canView ? (
            <Badge variant="info">{customers.length} Nasabah</Badge>
          ) : undefined
        }
        actions={
          canCreate ? (
            <Link href="/customers/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Tambah Nasabah
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Session / permission notice */}
      {!sessionLoading && !user && (
        <>
          <ErrorState
            title="Sesi Berakhir"
            message="Sesi Anda tidak valid atau telah berakhir. Silakan login kembali untuk mengakses data nasabah."
          />
          <div className="text-right">
            <Link href="/login">
              <Button size="sm" variant="outline">
                Menu Halaman Login
              </Button>
            </Link>
          </div>
        </>
      )}

      {!sessionLoading && user && !canView && (
        <ErrorState
          title="Akses Ditolak"
          message="Peran Anda saat ini tidak memiliki izin 'customers:view'. Hubungi Administrator Institusi untuk meminta akses baca data nasabah."
        />
      )}

      {canView && (
        <Card className="rounded-xl overflow-hidden">
          <CardHeader className="py-4 px-5 border-b border-[#E2E8F0] bg-slate-50/70">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookUser className="h-4 w-4 text-[#00549c]" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Daftar Nasabah Terdaftar
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Nomor identitas ditampilkan termask demi keamanan data. Klik detail untuk
                  melihat identitas lengkap.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Search & filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 px-5 py-4 border-b border-[#E2E8F0]">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Cari nama, CIF, identitas, telepon..."
              shortcut=""
              aria-label="Cari nasabah"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as "" | CustomerType)}
                aria-label="Filter jenis nasabah"
                className="w-auto min-w-[130px]"
              >
                <option value="">Semua Jenis</option>
                <option value="INDIVIDUAL">Individu</option>
                <option value="CORPORATE">Korporasi</option>
              </Select>

              <Select
                value={registrationStatus}
                onChange={(e) => setRegistrationStatus(e.target.value as "" | CustomerRegistrationStatus)}
                aria-label="Filter status registrasi"
                className="w-auto min-w-[150px]"
              >
                <option value="">Status Registrasi</option>
                <option value="APPROVED">Disetujui</option>
                <option value="UNDER_REVIEW">Dalam Pemeriksaan</option>
                <option value="SUBMITTED">Terkirim</option>
                <option value="DRAFT">Draf</option>
                <option value="REJECTED">Ditolak</option>
              </Select>

              <Select
                value={kycStatus}
                onChange={(e) => setKycStatus(e.target.value as "" | CustomerKycStatus)}
                aria-label="Filter status KYC"
                className="w-auto min-w-[140px]"
              >
                <option value="">Status KYC</option>
                <option value="VERIFIED">Sah (Verified)</option>
                <option value="PENDING">Menunggu</option>
                <option value="REVISION_REQUIRED">Perlu Revisi</option>
                <option value="REJECTED">Ditolak</option>
                <option value="NOT_STARTED">Belum Dimulai</option>
              </Select>

              <Select
                value={amlStatus}
                onChange={(e) => setAmlStatus(e.target.value as "" | CustomerAmlStatus)}
                aria-label="Filter status AML"
                className="w-auto min-w-[150px]"
              >
                <option value="">Status AML</option>
                <option value="CLEARED">Cleared (Bersih)</option>
                <option value="PENDING">Menunggu Skrining</option>
                <option value="FLAGGED">Terkena Flag</option>
                <option value="NOT_SCREENED">Belum Diskukrining</option>
              </Select>

              <Select
                value={riskRating}
                onChange={(e) => setRiskRating(e.target.value as "" | CustomerRiskRating)}
                aria-label="Filter risk rating"
                className="w-auto min-w-[130px]"
              >
                <option value="">Semua Risiko</option>
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Menengah</option>
                <option value="HIGH">Tinggi</option>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Reset Filter
                </Button>
              )}
            </div>
          </div>

          <CardContent className="p-0">
            {/* Loading state */}
            {loading && (
              <div className="divide-y divide-[#E2E8F0]">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-20 hidden sm:block" />
                    <Skeleton className="h-4 w-36 hidden md:block" />
                    <Skeleton className="h-4 w-24 hidden lg:block" />
                    <Skeleton className="h-6 w-20 ml-auto" />
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="p-5">
                <ErrorState
                  title={error.status === 401 ? "Sesi Berakhir" : error.status === 403 ? "Akses Ditolak" : "Gagal Memuat Data Nasabah"}
                  message={error.message}
                  onRetry={loadCustomers}
                />
                {error.status === 401 && (
                  <div className="mt-3 text-right">
                    <Link href="/login">
                      <Button size="sm" variant="outline">
                        Menu Halaman Login
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Empty states */}
            {!loading && !error && pagedCustomers.length === 0 && (
              <div className="p-5">
                {hasActiveFilters ? (
                  <EmptyState
                    icon={SearchX}
                    title="Tidak Ada Hasil yang Cocok"
                    description="Tidak ada nasabah yang memenuhi kombinasi filter aktif. Sesuaikan kata kunci atau reset filter."
                    actionLabel="Reset Filter"
                    onAction={handleResetFilters}
                  />
                ) : (
                  <EmptyState
                    icon={UsersRound}
                    title="Belum Ada Nasabah Terdaftar"
                    description="Direktori nasabah lembaga masih kosong. Daftarkan nasabah pertama untuk memulai pembentukan CIF."
                    actionLabel={canCreate ? "Tambah Nasabah" : undefined}
                    onAction={canCreate ? () => router.push("/customers/new") : undefined}
                  />
                )}
              </div>
            )}

            {/* Data table */}
            {!loading && !error && pagedCustomers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-5">CIF / Nama Nasabah</th>
                      <th className="p-3.5">Jenis</th>
                      <th className="p-3.5">No. Identitas</th>
                      <th className="p-3.5">Registrasi</th>
                      <th className="p-3.5">Status KYC</th>
                      <th className="p-3.5 hidden lg:table-cell">Status AML</th>
                      <th className="p-3.5">Risk Rating</th>
                      <th className="p-3.5 pr-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pagedCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-5">
                          <span className="font-mono font-bold text-[#00549c]">
                            {customer.cifNumber}
                          </span>
                          <Link
                            href={`/customers/${customer.id}`}
                            className="block font-semibold text-[#172B4D] hover:text-[#00549c] mt-0.5"
                          >
                            {customer.name}
                          </Link>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Dibuat {formatDateID(customer.createdAt)}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <Badge variant={customer.type === "CORPORATE" ? "primary" : "outline"}>
                            {CUSTOMER_TYPE_LABELS[customer.type]}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <LockKeyhole className="h-3 w-3 text-[#94A3B8]" />
                            {customer.identifierNumber}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <RegistrationStatusBadge status={customer.registrationStatus} />
                        </td>
                        <td className="p-3.5">
                          <KycStatusBadge status={customer.kycStatus} />
                        </td>
                        <td className="p-3.5 hidden lg:table-cell">
                          <AmlStatusBadge status={customer.amlStatus} />
                        </td>
                        <td className="p-3.5">
                          <RiskRatingBadge rating={customer.riskRating} />
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <div className={cn("flex items-center justify-end gap-1.5")}>
                            <Link href={`/customers/${customer.id}`}>
                              <Button size="sm" variant="outline" className="gap-1 text-[#00549c] border-[#00549c]/30">
                                <Eye className="h-3 w-3" />
                                Detail
                              </Button>
                            </Link>
                            {canEdit && (
                              <Link href={`/customers/${customer.id}/edit`}>
                                <Button size="sm" variant="ghost" className="gap-1 text-[#64748B]" aria-label={`Edit ${customer.name}`}>
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination (client-side) */}
            {!loading && !error && customers.length > PAGE_SIZE && (
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={customers.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer note for read-only roles */}
      {!sessionLoading && canView && !canEdit && (
        <p className="text-[11px] text-[#64748B] flex items-center gap-1.5">
          <LockKeyhole className="h-3 w-3" />
          Peran Anda memiliki akses baca (read-only) terhadap data nasabah.
        </p>
      )}
    </div>
  );
}
