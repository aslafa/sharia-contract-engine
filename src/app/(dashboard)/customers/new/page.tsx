"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/enterprise/page-header";
import { ErrorState } from "@/components/enterprise/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ConfirmationDialog,
} from "@/components/enterprise/confirmation-dialog";
import {
  CustomerForm,
  EMPTY_CUSTOMER_FORM,
  valuesToPayload,
  validateCustomerForm,
  CustomerFormValues,
} from "@/components/customers/customer-form";
import { useSession } from "@/lib/hooks/use-session";
import { apiRequest, statusErrorMessage } from "@/lib/api/client";
import { formatIDR } from "@/lib/utils";
import { Customer, identifierLabel } from "@/types/customer";
import { ArrowLeft, CircleCheck, Info } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const { loading: sessionLoading, can } = useSession();

  const [values, setValues] = React.useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [apiError, setApiError] = React.useState<{ title: string; message: string } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const canCreate = can("customers:create");

  const incomeRaw = values.annualIncomeOrRevenue.replace(/[^\d]/g, "");
  const incomePreview = incomeRaw ? formatIDR(Number(incomeRaw)) : null;

  const handleSubmitConfirm = async () => {
    setSubmitting(true);
    setApiError(null);

    const result = await apiRequest<Customer>("/api/v1/customers", {
      method: "POST",
      body: JSON.stringify(valuesToPayload(values)),
    });

    if (result.ok && result.data) {
      router.push(`/customers/${result.data.id}?created=1`);
      return;
    }

    // Surface API errors clearly, including per-field Zod validation (400),
    // duplicate identifier (409), permission (403), and session (401).
    const fieldErrors = result.fieldErrors && Object.keys(result.fieldErrors).length > 0
      ? result.fieldErrors
      : undefined;
    if (fieldErrors) setValidationErrors(fieldErrors);

    const title =
      result.status === 401
        ? "Sesi Berakhir"
        : result.status === 403
        ? "Akses Ditolak"
        : result.status === 409
        ? "Nomor Identitas Duplikat"
        : result.status === 400
        ? "Data Belum Valid"
        : "Gagal Mendaftarkan Nasabah";

    setApiError({
      title,
      message:
        result.error?.message ||
        result.message ||
        statusErrorMessage(result.status),
    });
    setSubmitting(false);
  };

  const handleSubmit = () => {
    const errors = validateCustomerForm(values);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setApiError(null);
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Nasabah"
        description="Daftarkan nasabah individu atau korporasi baru ke dalam direktori lembaga. Pembentukan nomor CIF dilakukan otomatis oleh sistem."
        breadcrumbs={[
          { label: "Data Nasabah", href: "/customers" },
          { label: "Tambah Nasabah" },
        ]}
        actions={
          <Link href="/customers">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Direktori
            </Button>
          </Link>
        }
      />

      {!sessionLoading && !canCreate && (
        <ErrorState
          title="Akses Ditolak"
          message="Peran Anda saat ini tidak memiliki izin 'customers:create'. Hubungi Administrator Institusi untuk meminta hak pendaftaran nasabah."
        />
      )}

      {canCreate && (
        <>
          {apiError && (
            <ErrorState title={apiError.title} message={apiError.message} />
          )}

          <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-[#DCEAF5] bg-[#DCEAF5]/40">
            <Info className="h-4 w-4 text-[#00549c] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#00549c] leading-relaxed font-medium">
              Bidang bertanda <span className="text-[#DC3545]">*</span> wajib diisi.{" "}
              {identifierLabel(values.type)} menjadi kunci unik nasabah dalam tenant lembaga
              Anda — sistem akan menolak pendaftaran dengan nomor identitas yang sudah
              terdaftar (kode 409).
            </p>
          </div>

          <CustomerForm
            values={values}
            onChange={(next) => setValues(next)}
            errors={validationErrors}
            disabled={submitting}
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Link href="/customers">
              <Button variant="ghost" size="sm" disabled={submitting} className="w-full sm:w-auto">
                Batal
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Menyimpan..." : "Daftarkan Nasabah"}
            </Button>
          </div>

          {/* Confirmation before submitting to the API */}
          <ConfirmationDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Konfirmasi Pendaftaran Nasabah"
            description={`Pendaftaran "${values.name.trim()}" dengan ${identifierLabel(values.type)} ${values.identifierNumber.trim()} akan dikirim ke sistem. Pastikan data identitas dan kontak sudah benar.`}
            confirmLabel="Ya, Daftarkan"
            loading={submitting}
            onConfirm={handleSubmitConfirm}
          />

          {/* Preview chip */}
          {incomePreview && !validationErrors.annualIncomeOrRevenue && (
            <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
              <Badge variant="info">
                <CircleCheck className="h-3 w-3" />
                Nilai Tercatat
              </Badge>
              Nilai pendapatan/omzet tahunan: {incomePreview}
            </div>
          )}
        </>
      )}
    </div>
  );
}
