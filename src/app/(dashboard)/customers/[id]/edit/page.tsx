"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/enterprise/page-header";
import { ErrorState } from "@/components/enterprise/error-state";
import { ConfirmationDialog } from "@/components/enterprise/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CustomerForm,
  CustomerFormValues,
  EMPTY_CUSTOMER_FORM,
  valuesToPayload,
  validateCustomerForm,
} from "@/components/customers/customer-form";
import { useSession } from "@/lib/hooks/use-session";
import { apiRequest, statusErrorMessage } from "@/lib/api/client";
import {
  Customer,
  CustomerDetailResponse,
  identifierLabel,
} from "@/types/customer";
import { ArrowLeft, CircleCheck, Info, RotateCcw } from "lucide-react";

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = params?.id;
  const { user, loading: sessionLoading, can } = useSession();

  const [initial, setInitial] = React.useState<CustomerFormValues | null>(null);
  const [values, setValues] = React.useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<{ message: string; status: number } | null>(null);

  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [apiError, setApiError] = React.useState<{ title: string; message: string } | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const canView = can("customers:view");
  const canEdit = can("customers:edit");

  const loadCustomer = React.useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setLoadError(null);

    const result = await apiRequest<Customer>(
      `/api/v1/customers/${customerId}`
    );

    if (result.ok && result.data) {
      const c: any = (result.data as any).data || result.data;
      const prefilled: CustomerFormValues = {
        type: c.type,
        name: c.name,
        identifierNumber: c.identifierNumber,
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        city: c.city || "",
        province: c.province || "",
        postalCode: c.postalCode || "",
        annualIncomeOrRevenue:
          c.annualIncomeOrRevenue !== undefined && c.annualIncomeOrRevenue !== null
            ? String(c.annualIncomeOrRevenue)
            : "",
        registrationStatus: c.registrationStatus || "SUBMITTED",
        kycStatus: c.kycStatus || "PENDING",
        riskRating: c.riskRating,
        amlStatus: c.amlStatus,
        isVerified: c.isVerified,
      };
      setInitial(prefilled);
      setValues(prefilled);
    } else {
      setLoadError({
        message: result.error?.message || statusErrorMessage(result.status),
        status: result.status,
      });
    }
    setLoading(false);
  }, [customerId]);

  React.useEffect(() => {
    if (!sessionLoading && canView) {
      loadCustomer();
    } else if (!sessionLoading && !canView) {
      setLoading(false);
    }
  }, [sessionLoading, canView, loadCustomer]);

  /** Count fields changed relative to the loaded snapshot for the confirmation dialog. */
  const changedFields = React.useMemo(() => {
    if (!initial) return [] as string[];
    return Object.keys(initial).filter(
      (key) =>
        initial[key as keyof CustomerFormValues] !==
        values[key as keyof CustomerFormValues]
    );
  }, [initial, values]);

  const handleSubmitConfirm = async () => {
    setSubmitting(true);
    setApiError(null);

    const result = await apiRequest<CustomerDetailResponse>(
      `/api/v1/customers/${customerId}`,
      {
        method: "PATCH",
        body: JSON.stringify(valuesToPayload(values)),
      }
    );

    if (result.ok) {
      setConfirmOpen(false);
      setSubmitting(false);
      setSuccessMessage(
        result.message || "Data customer berhasil diperbarui."
      );
      // Refresh the prefill snapshot so further edits compare correctly.
      setInitial({ ...values });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setConfirmOpen(false);
    setSubmitting(false);

    if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
      setValidationErrors(result.fieldErrors);
    }

    const title =
      result.status === 401
        ? "Sesi Berakhir"
        : result.status === 403
        ? "Akses Ditolak"
        : result.status === 404
        ? "Nasabah Tidak Ditemukan"
        : result.status === 409
        ? "Nomor Identitas Duplikat"
        : result.status === 400
        ? "Data Belum Valid"
        : "Gagal Memperbarui Nasabah";

    setApiError({
      title,
      message:
        result.error?.message ||
        result.message ||
        statusErrorMessage(result.status),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    const errors = validateCustomerForm(values);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setApiError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setApiError(null);
    setSuccessMessage(null);
    setConfirmOpen(true);
  };

  if (!sessionLoading && !user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Nasabah"
          breadcrumbs={[
            { label: "Data Nasabah", href: "/customers" },
            { label: "Edit" },
          ]}
        />
        <ErrorState
          title="Sesi Berakhir"
          message="Sesi Anda tidak valid atau telah berakhir. Silakan login kembali untuk mengedit data nasabah."
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
          title="Edit Nasabah"
          breadcrumbs={[
            { label: "Data Nasabah", href: "/customers" },
            { label: "Edit" },
          ]}
        />
        <ErrorState
          title="Akses Ditolak"
          message="Peran Anda saat ini tidak memiliki izin 'customers:view' untuk membuka profil nasabah."
        />
      </div>
    );
  }

  if (!sessionLoading && canView && !canEdit) {    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Nasabah"
          breadcrumbs={[
            { label: "Data Nasabah", href: "/customers" },
            { label: "Edit" },
          ]}
        />
        <ErrorState
          title="Akses Ditolak"
          message="Peran Anda memiliki akses baca (read-only) terhadap data nasabah dan tidak memiliki izin 'customers:edit' untuk mengubah data."
        />
        <div className="text-right">
          <Link href={customerId ? `/customers/${customerId}` : "/customers"}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Lihat Detail Nasabah
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Data Nasabah"
        description="Perbarui informasi nasabah melalui operasi PATCH ke API Customer Management. Perubahan dikirim setelah konfirmasi."
        breadcrumbs={[
          { label: "Data Nasabah", href: "/customers" },
          { label: "Edit" },
        ]}
        actions={
          <Link href={customerId ? `/customers/${customerId}` : "/customers"}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Detail
            </Button>
          </Link>
        }
      />

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}

      {/* Load errors */}
      {!loading && loadError && (
        <div className="space-y-3">
          <ErrorState
            title={
              loadError.status === 401
                ? "Sesi Berakhir"
                : loadError.status === 403
                ? "Akses Ditolak"
                : loadError.status === 404
                ? "Nasabah Tidak Ditemukan"
                : "Gagal Memuat Profil"
            }
            message={loadError.message}
            onRetry={loadCustomer}
          />
          <div className="text-right">
            <Link href="/customers">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke Direktori Nasabah
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Form */}
      {!loading && !loadError && initial && (
        <>
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-[#16A36A] text-white text-xs font-bold shadow-sm flex items-center justify-between">
              <span className="inline-flex items-center gap-2">
                <CircleCheck className="h-4 w-4" />
                {successMessage}
              </span>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-white/80 hover:text-white"
                aria-label="Tutup notifikasi"
              >
                Tutup
              </button>
            </div>
          )}

          {apiError && (
            <ErrorState title={apiError.title} message={apiError.message} />
          )}

          <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-[#DCEAF5] bg-[#DCEAF5]/40">
            <Info className="h-4 w-4 text-[#00549c] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#00549c] leading-relaxed font-medium">
              Formulir telah terisi data nasabah saat ini. {identifierLabel(values.type)}{" "}
              yang diubah akan divalidasi ulang keunikannya di seluruh tenant lembaga
              (penolakan kode 409 bila sudah digunakan nasabah lain).
            </p>
          </div>

          <CustomerForm
            values={values}
            onChange={(next) => setValues(next)}
            errors={validationErrors}
            disabled={submitting}
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={submitting || changedFields.length === 0}
              onClick={() => {
                setValues(initial);
                setValidationErrors({});
              }}
              className="gap-1.5 w-full sm:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Batalkan Perubahan
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || changedFields.length === 0}
              className="w-full sm:w-auto"
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>

          {/* Confirmation dialog before PATCH */}
          <ConfirmationDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Konfirmasi Simpan Perubahan"
            description={
              changedFields.length > 0
                ? `Terdapat ${changedFields.length} bidang yang diubah (${changedFields
                    .slice(0, 5)
                    .join(", ")}${changedFields.length > 5 ? ", ..." : ""}). Perubahan akan disimpan permanen ke data nasabah.`
                : "Tidak ada perubahan yang terdeteksi."
            }
            confirmLabel="Ya, Simpan Perubahan"
            loading={submitting}
            onConfirm={handleSubmitConfirm}
          />
        </>
      )}
    </div>
  );
}
