"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Building2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/utils";
import {
  AML_STATUS_LABELS,
  CustomerAmlStatus,
  CustomerKycStatus,
  CustomerRegistrationStatus,
  CustomerRiskRating,
  CustomerType,
  KYC_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  RISK_RATING_LABELS,
  identifierLabel,
  incomeLabel,
} from "@/types/customer";

/**
 * Shared customer form (Tahap 3A.2 & Onboarding Tracker) used by both
 * "Tambah Nasabah" (POST) and "Edit Nasabah" (PATCH). Field labels adapt to
 * the selected type: NIK (Individu) vs NPWP/NIB (Korporasi); Pendapatan vs Omzet.
 */

export interface CustomerFormValues {
  type: CustomerType;
  name: string;
  identifierNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  annualIncomeOrRevenue: string;
  registrationStatus: CustomerRegistrationStatus;
  kycStatus: CustomerKycStatus;
  riskRating: CustomerRiskRating;
  amlStatus: CustomerAmlStatus;
  isVerified: boolean;
}

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  type: "INDIVIDUAL",
  name: "",
  identifierNumber: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  annualIncomeOrRevenue: "",
  registrationStatus: "SUBMITTED",
  kycStatus: "PENDING",
  riskRating: "LOW",
  amlStatus: "NOT_SCREENED",
  isVerified: false,
};

export function valuesToPayload(
  values: CustomerFormValues
): Record<string, unknown> {
  const incomeRaw = values.annualIncomeOrRevenue.replace(/[^\d]/g, "");
  const income = incomeRaw ? Number(incomeRaw) : undefined;

  return {
    type: values.type,
    name: values.name.trim(),
    identifierNumber: values.identifierNumber.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    province: values.province.trim(),
    postalCode: values.postalCode.trim(),
    ...(income !== undefined && !Number.isNaN(income)
      ? { annualIncomeOrRevenue: income }
      : {}),
    registrationStatus: values.registrationStatus,
    kycStatus: values.kycStatus,
    riskRating: values.riskRating,
    amlStatus: values.amlStatus,
    isVerified: values.isVerified,
  };
}

const IDENTIFIER_REGEX = /^[A-Za-z0-9.\-/]+$/;

/** Mirrors the backend Zod contract so obvious mistakes fail fast client-side. */
export function validateCustomerForm(
  values: CustomerFormValues
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (values.name.trim().length < 2 || values.name.trim().length > 200) {
    errors.name = "Nama nasabah wajib diisi (2 - 200 karakter).";
  }

  const identifier = values.identifierNumber.trim();
  if (identifier.length < 5 || identifier.length > 50) {
    errors.identifierNumber = `${identifierLabel(values.type)} wajib diisi (5 - 50 karakter).`;
  } else if (!IDENTIFIER_REGEX.test(identifier)) {
    errors.identifierNumber =
      "Nomor identitas hanya boleh berisi huruf, angka, titik, garis miring, atau strip.";
  }

  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Format alamat email tidak valid.";
  }

  if (values.phone.trim().length > 25) {
    errors.phone = "Nomor telepon maksimal 25 karakter.";
  }

  if (values.postalCode.trim() && !/^\d+$/.test(values.postalCode.trim())) {
    errors.postalCode = "Kode pos hanya boleh berisi angka (maksimal 10 digit).";
  } else if (values.postalCode.trim().length > 10) {
    errors.postalCode = "Kode pos maksimal 10 digit.";
  }

  const incomeRaw = values.annualIncomeOrRevenue.replace(/[^\d]/g, "");
  if (incomeRaw && isNaN(Number(incomeRaw))) {
    errors.annualIncomeOrRevenue = `${incomeLabel(values.type)} harus berupa angka.`;
  } else if (incomeRaw && Number(incomeRaw) < 0) {
    errors.annualIncomeOrRevenue = `${incomeLabel(values.type)} tidak boleh negatif.`;
  }

  return errors;
}

export interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-[#172B4D]">
        {label}
        {required && <span className="text-[#DC3545]"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-[#64748B]">{hint}</p>}
      {error && (
        <p className="text-[11px] font-medium text-[#DC3545] flex items-start gap-1">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export interface CustomerFormProps {
  values: CustomerFormValues;
  onChange: (values: CustomerFormValues) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export function CustomerForm({ values, onChange, errors, disabled }: CustomerFormProps) {
  const set = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) =>
    onChange({ ...values, [key]: value });

  const incomeDisplay = values.annualIncomeOrRevenue
    ? Number(values.annualIncomeOrRevenue.replace(/[^\d]/g, "") || 0)
    : 0;

  const typeOptions: { value: CustomerType; label: string; description: string; icon: typeof UserRound }[] = [
    {
      value: "INDIVIDUAL",
      label: "Individu",
      description: "Nasabah perorangan — identitas NIK KTP",
      icon: UserRound,
    },
    {
      value: "CORPORATE",
      label: "Korporasi",
      description: "Badan usaha — identitas NPWP / NIB",
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Customer type selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Jenis Nasabah</CardTitle>
          <CardDescription>
            Menentukan jenis identitas dan label profil keuangan nasabah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              const active = values.type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => set("type", option.value)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-colors",
                    active
                      ? "border-[#00549c] bg-[#DCEAF5]/50 ring-1 ring-[#00549c]/30"
                      : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F5F8FC]",
                    disabled && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                      active ? "bg-[#00549c] text-white" : "bg-[#F5F8FC] text-[#64748B]"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={cn("text-xs font-bold", active ? "text-[#00549c]" : "text-[#172B4D]")}>
                      {option.label}
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-0.5 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Identitas Nasabah</CardTitle>
          <CardDescription>Data pokok identifikasi nasabah untuk pembukaan CIF.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Nama Lengkap / Badan Usaha"
            htmlFor="customer-name"
            required
            error={errors.name}
          >
            <Input
              id="customer-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={
                values.type === "CORPORATE" ? "PT Berkah Mandiri Sejahtera" : "Ahmad Fulan Bin Abdullah"
              }
              error={Boolean(errors.name)}
              disabled={disabled}
              maxLength={200}
            />
          </Field>

          <Field
            label={identifierLabel(values.type)}
            htmlFor="customer-identifier"
            required
            hint="Digunakan sebagai kunci unik nasabah dalam tenant lembaga Anda."
            error={errors.identifierNumber}
          >
            <Input
              id="customer-identifier"
              value={values.identifierNumber}
              onChange={(e) => set("identifierNumber", e.target.value)}
              placeholder={values.type === "CORPORATE" ? "01.234.567.8-901.000" : "3273012903880004"}
              error={Boolean(errors.identifierNumber)}
              disabled={disabled}
              maxLength={50}
              className="font-mono"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" htmlFor="customer-email" error={errors.email}>
              <Input
                id="customer-email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="nasabah@email.co.id"
                error={Boolean(errors.email)}
                disabled={disabled}
                maxLength={200}
              />
            </Field>

            <Field label="Nomor Telepon" htmlFor="customer-phone" error={errors.phone}>
              <Input
                id="customer-phone"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+62 812-3456-7890"
                error={Boolean(errors.phone)}
                disabled={disabled}
                maxLength={25}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* 3. Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Alamat</CardTitle>
          <CardDescription>Alamat domisili atau kedudukan badan usaha.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Alamat Lengkap" htmlFor="customer-address" error={errors.address}>
            <Textarea
              id="customer-address"
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Jl. Jend. Sudirman Kav. No. 21, RT 005/RW 003"
              error={Boolean(errors.address)}
              disabled={disabled}
              maxLength={500}
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Kota" htmlFor="customer-city" error={errors.city}>
              <Input
                id="customer-city"
                value={values.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Bandung"
                error={Boolean(errors.city)}
                disabled={disabled}
                maxLength={100}
              />
            </Field>

            <Field label="Provinsi" htmlFor="customer-province" error={errors.province}>
              <Input
                id="customer-province"
                value={values.province}
                onChange={(e) => set("province", e.target.value)}
                placeholder="Jawa Barat"
                error={Boolean(errors.province)}
                disabled={disabled}
                maxLength={100}
              />
            </Field>

            <Field label="Kode Pos" htmlFor="customer-postal-code" error={errors.postalCode}>
              <Input
                id="customer-postal-code"
                value={values.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
                placeholder="40115"
                error={Boolean(errors.postalCode)}
                disabled={disabled}
                maxLength={10}
                inputMode="numeric"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* 4. Financial & compliance profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Profil Keuangan &amp; Kepatuhan</CardTitle>
          <CardDescription>
            Klasifikasi risiko dan status AML/CFT mengikuti kerangka APU-PPT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={incomeLabel(values.type)}
              htmlFor="customer-income"
              hint={
                incomeDisplay > 0
                  ? `Terbilang: ${formatIDR(incomeDisplay)}`
                  : "Opsional — nilai dalam Rupiah tanpa titik/pemisah."
              }
              error={errors.annualIncomeOrRevenue}
            >
              <Input
                id="customer-income"
                value={values.annualIncomeOrRevenue}
                onChange={(e) => set("annualIncomeOrRevenue", e.target.value)}
                placeholder="85000000"
                error={Boolean(errors.annualIncomeOrRevenue)}
                disabled={disabled}
                inputMode="numeric"
                className="font-mono"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status Pengajuan Pendaftaran" htmlFor="customer-registration-status" required>
              <Select
                id="customer-registration-status"
                value={values.registrationStatus}
                onChange={(e) => {
                  const reg = e.target.value as CustomerRegistrationStatus;
                  set("registrationStatus", reg);
                  if (reg === "DRAFT") {
                    set("kycStatus", "NOT_STARTED");
                  } else if (values.kycStatus === "NOT_STARTED") {
                    set("kycStatus", "PENDING");
                  }
                }}
                disabled={disabled}
              >
                <option value="SUBMITTED">Kirim Pengajuan (Submitted - Siap Diperiksa)</option>
                <option value="DRAFT">Simpan Draf (Draft - Belum Dikirim)</option>
              </Select>
            </Field>

            <div className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Alur Pemeriksaan Kepatuhan
              </p>
              <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                Skrining AML/CFT, verifikasi KYC, dan penetapan Risk Rating dilakukan secara independen
                oleh <strong>Compliance Officer</strong> melalui Customer Verification Tracker.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-[#00549c]/20 bg-[#F5F8FC] flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-[#00549c] mt-0.5 shrink-0" />
            <div className="text-xs text-[#00549c]">
              <span className="font-bold">Standar Kepatuhan Lembaga:</span> Formulir baru tidak otomatis berstatus VERIFIED atau CLEARED. Setelah formulir dikirim, nasabah akan masuk ke antrean verifikasi berjenjang.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
