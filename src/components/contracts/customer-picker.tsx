"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { apiRequest, statusErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  AML_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
  Customer,
  CustomerAmlStatus,
  CustomerRiskRating,
  CustomerType,
  RISK_RATING_LABELS,
} from "@/types/customer";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CircleAlert,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  UserPlus,
  Users,
} from "lucide-react";

/**
 * Tahap 3B.4 — Customer Picker bersama untuk form pengajuan empat akad
 * (Murabahah, Ijarah, Musyarakah, Mudharabah).
 *
 * - Data diambil dari GET /api/v1/customers?search=... (tenant dari session,
 *   organizationId TIDAK PERNAH dikirim dari client).
 * - FLAGGED tidak dapat dipilih; PENDING / belum terverifikasi dapat dipilih
 *   dengan peringatan. Status AML/verifikasi tidak pernah diubah di sini —
 *   backend tetap menjadi otoritas validasi terakhir.
 * - Tanpa localStorage/sessionStorage.
 */

export interface SelectedCustomer {
  id: string;
  cifNumber: string;
  name: string;
  type: CustomerType;
  /** Nomor identitas sudah DIMASK pada response list — cukup untuk tampilan. */
  identifierNumber?: string;
  riskRating: CustomerRiskRating;
  amlStatus: CustomerAmlStatus;
  isVerified: boolean;
}

export interface CustomerPickerProps {
  value: SelectedCustomer | null;
  onChange: (customer: SelectedCustomer | null) => void;
  disabled?: boolean;
}

type PickerState = "idle" | "loading" | "error" | "empty" | "ready";

function typeBadge(type: CustomerType) {
  return type === "CORPORATE" ? (
    <Badge variant="default" className="text-[10px]">
      <Building2 className="h-3 w-3" />
      {CUSTOMER_TYPE_LABELS[type]}
    </Badge>
  ) : (
    <Badge variant="neutral" className="text-[10px]">
      <UserRound className="h-3 w-3" />
      {CUSTOMER_TYPE_LABELS[type]}
    </Badge>
  );
}

function amlBadge(amlStatus: CustomerAmlStatus) {
  const variant =
    amlStatus === "CLEARED" ? "success" : amlStatus === "PENDING" ? "warning" : "danger";
  return (
    <Badge variant={variant} className="text-[10px]">
      AML: {AML_STATUS_LABELS[amlStatus]}
    </Badge>
  );
}

function verifiedBadge(isVerified: boolean) {
  return isVerified ? (
    <Badge variant="success" className="text-[10px]">
      <BadgeCheck className="h-3 w-3" />
      Terverifikasi
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-[10px]">
      Belum Terverifikasi
    </Badge>
  );
}

function riskBadge(riskRating: CustomerRiskRating) {
  const variant =
    riskRating === "HIGH" ? "danger" : riskRating === "MEDIUM" ? "warning" : "secondary";
  return (
    <Badge variant={variant} className="text-[10px]">
      Risiko: {RISK_RATING_LABELS[riskRating]}
    </Badge>
  );
}

export function CustomerPicker({ value, onChange, disabled }: CustomerPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<SelectedCustomer[]>([]);
  const [state, setState] = React.useState<PickerState>("idle");
  const [errorText, setErrorText] = React.useState<string | null>(null);

  // Race-condition guard: setiap fetch diberi nomor urut; hanya respons
  // dari permintaan terbaru yang boleh mengubah daftar hasil.
  const requestSeqRef = React.useRef(0);

  const loadCustomers = React.useCallback(async (search: string) => {
    const seq = ++requestSeqRef.current;
    setState("loading");
    setErrorText(null);

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());

    const result = await apiRequest<Customer[]>(
      `/api/v1/customers${params.toString() ? `?${params.toString()}` : ""}`
    );

    if (seq !== requestSeqRef.current) return; // respons kedaluwarsa — abaikan

    if (!result.ok || !result.data) {
      if (result.status === 401) {
        setErrorText("Sesi Anda telah berakhir. Silakan login kembali.");
      } else if (result.status === 403) {
        setErrorText(
          "Akses ditolak: peran Anda tidak memiliki izin melihat direktori nasabah (customers:view)."
        );
      } else {
        setErrorText(
          result.error?.message ||
            (result.status === 0
              ? "Tidak dapat menghubungi server. Periksa koneksi jaringan Anda."
              : statusErrorMessage(result.status))
        );
      }
      setState("error");
      return;
    }

    const data = Array.isArray(result.data) ? result.data : [];
    setItems(data);
    setState(data.length === 0 ? "empty" : "ready");
  }, []);

  // Debounce 300 ms — hanya aktif selama dialog terbuka.
  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      loadCustomers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [open, query, loadCustomers]);

  const handleSelect = (customer: SelectedCustomer) => {
    onChange(customer);
    setOpen(false);
    setQuery("");
  };

  // ------------------------- READ-ONLY PROFILE CARD -------------------------
  if (value) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#DCEAF5] text-[#00549c]">
                {value.type === "CORPORATE" ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <UserRound className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Nasabah Terpilih
                </p>
                <p className="truncate text-sm font-bold text-[#172B4D]">{value.name}</p>
                <p className="font-mono text-[11px] text-[#00549c]">
                  CIF {value.cifNumber || "—"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setOpen(true)}
              >
                Ganti Nasabah
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange(null)}
              >
                Hapus Pilihan
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#E2E8F0] pt-3">
            {typeBadge(value.type)}
            {amlBadge(value.amlStatus)}
            {verifiedBadge(value.isVerified)}
            {riskBadge(value.riskRating)}
            {value.identifierNumber && (
              <span className="font-mono text-[10px] text-[#64748B]">
                Identitas: {value.identifierNumber}
              </span>
            )}
          </div>
        </div>

        {/* Peringatan kepatuhan — PENDING / belum terverifikasi */}
        {value.amlStatus === "PENDING" && (
          <div className="flex items-start gap-2 rounded-lg border border-[#E9A23B]/30 bg-[#E9A23B]/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B4690E]" />
            <p className="text-[11px] font-medium leading-relaxed text-[#B4690E]">
              Nasabah ini belum menyelesaikan skrining AML (PENDING). Pengajuan tetap dapat
              dibuat, namun akan berstatus <strong>AML PENDING</strong> dan memerlukan telaah
              Compliance Officer sebelum dieksekusi.
            </p>
          </div>
        )}
        {!value.isVerified && (
          <div className="flex items-start gap-2 rounded-lg border border-[#E9A23B]/30 bg-[#E9A23B]/10 p-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#B4690E]" />
            <p className="text-[11px] font-medium leading-relaxed text-[#B4690E]">
              Nasabah belum terverifikasi kelengkapan berkas identitas. Lengkapi verifikasi
              pada modul Customer Management sebelum tahap eksekusi akad.
            </p>
          </div>
        )}

        <CustomerPickerDialog
          open={open}
          onOpenChange={setOpen}
          query={query}
          onQueryChange={setQuery}
          items={items}
          state={state}
          errorText={errorText}
          onRetry={() => loadCustomers(query)}
          onSelect={handleSelect}
        />
      </div>
    );
  }

  // ------------------------------ TRIGGER BUTTON ----------------------------
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "h-auto w-full justify-start gap-3 border-dashed p-3.5",
          "border-[#CBD5E1] hover:border-[#00549c] hover:bg-[#F5F8FC]"
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F5F8FC] text-[#00549c]">
          <Users className="h-5 w-5" />
        </span>
        <span className="text-left">
          <span className="block text-xs font-bold text-[#172B4D]">Pilih Nasabah Terdaftar</span>
          <span className="block text-[11px] text-[#64748B]">
            Data profil otomatis terisi dari direktori nasabah — tidak perlu diisi manual
          </span>
        </span>
      </Button>

      <CustomerPickerDialog
        open={open}
        onOpenChange={setOpen}
        query={query}
        onQueryChange={setQuery}
        items={items}
        state={state}
        errorText={errorText}
        onRetry={() => loadCustomers(query)}
        onSelect={handleSelect}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialog: pencarian + daftar pilihan
// ---------------------------------------------------------------------------
interface PickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  items: SelectedCustomer[];
  state: PickerState;
  errorText: string | null;
  onRetry: () => void;
  onSelect: (customer: SelectedCustomer) => void;
}

function CustomerPickerDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  items,
  state,
  errorText,
  onRetry,
  onSelect,
}: PickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Pilih Nasabah Terdaftar"
        description="Data profil nasabah diambil dari direktori Customer Management lembaga Anda."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Cari nama, CIF, nomor identitas, atau telepon nasabah..."
              className="pl-9 text-xs"
              aria-label="Cari nasabah"
            />
          </div>

          <div className="max-h-[320px] min-h-[180px] space-y-2 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] p-2">
            {state === "loading" && (
              <div className="flex items-center justify-center gap-2 p-8 text-xs text-[#64748B]">
                <Loader2 className="h-4 w-4 animate-spin text-[#00549c]" />
                <span>Memuat direktori nasabah...</span>
              </div>
            )}

            {state === "error" && (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DC3545]/10 text-[#DC3545]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <p className="max-w-sm text-xs font-medium text-[#172B4D]">{errorText}</p>
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Coba Lagi
                </Button>
              </div>
            )}

            {state === "empty" && (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DCEAF5] text-[#00549c]">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#172B4D]">Belum Ada Nasabah Terdaftar</p>
                  <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-[#64748B]">
                    Pengajuan pembiayaan membutuhkan data nasabah yang terdaftar pada direktori
                    Customer Management. Daftarkan nasabah terlebih dahulu, lalu kembali ke form
                    ini untuk memilihnya.
                  </p>
                </div>
                <Link href="/customers/new">
                  <Button type="button" variant="primary" size="sm">
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Daftarkan Nasabah
                  </Button>
                </Link>
              </div>
            )}

            {state === "ready" &&
              items.map((customer) => {
                const flagged = customer.amlStatus === "FLAGGED";
                return (
                  <button
                    key={customer.id}
                    type="button"
                    disabled={flagged}
                    onClick={() => onSelect(customer)}
                    className={cn(
                      "w-full rounded-lg border bg-white p-3 text-left transition-colors",
                      flagged
                        ? "cursor-not-allowed border-[#DC3545]/20 opacity-60"
                        : "border-[#E2E8F0] hover:border-[#00549c] hover:bg-[#DCEAF5]/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#172B4D]">
                          {customer.name}
                        </p>
                        <p className="font-mono text-[10px] text-[#00549c]">
                          CIF {customer.cifNumber || "—"}
                        </p>
                      </div>
                      {flagged && (
                        <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#DC3545]">
                          <ShieldAlert className="h-3 w-3" />
                          Tidak Dapat Dipilih
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {typeBadge(customer.type)}
                      {amlBadge(customer.amlStatus)}
                      {verifiedBadge(customer.isVerified)}
                      {riskBadge(customer.riskRating)}
                    </div>
                  </button>
                );
              })}
          </div>

          <p className="text-[10px] leading-relaxed text-[#64748B]">
            Nasabah dengan status AML FLAGGED tidak dapat digunakan untuk pengajuan baru. Pemilihan
            nasabah PENDING atau belum terverifikasi tetap diizinkan dengan peringatan kepatuhan.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
