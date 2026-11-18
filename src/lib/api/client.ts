/**
 * Shared fetch helper for Customer Management UI (Tahap 3A.2).
 * The UI never touches the JSON repository directly — all access goes
 * through the versioned REST API. This helper normalizes response
 * parsing and error extraction (401 / 403 / 404 / 409 / 400 field errors).
 */

export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
  error?: ApiErrorPayload;
  /** Field-level validation errors (from Zod `details`) keyed by field name. */
  fieldErrors?: Record<string, string>;
}

/**
 * Zod `error.format()` produces `{ field: { _errors: string[] } }` entries.
 * Flatten one level so forms can highlight the offending input directly.
 */
export function extractFieldErrors(details: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!details || typeof details !== "object") return fieldErrors;

  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (value && typeof value === "object") {
      const entry = value as { _errors?: unknown[] };
      if (Array.isArray(entry._errors) && entry._errors.length > 0) {
        fieldErrors[key] = String(entry._errors[0]);
      }
    }
  }
  return fieldErrors;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  let status = 0;
  let payload: unknown = null;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    status = res.status;
    payload = await res.json().catch(() => null);
  } catch {
    return {
      ok: false,
      status: 0,
      error: {
        code: "NETWORK_ERROR",
        message: "Tidak dapat menghubungi server. Periksa koneksi jaringan Anda.",
      },
    };
  }

  const body = (payload || {}) as {
    success?: boolean;
    message?: string;
    data?: T;
    error?: ApiErrorPayload;
  };

  const fieldErrors = body.error?.details
    ? extractFieldErrors(body.error.details)
    : undefined;

  return {
    ok: status >= 200 && status < 300 && body.success !== false,
    status,
    data: body.data,
    message: body.message,
    error: body.error,
    fieldErrors,
  };
}

/** Human-readable fallback message per HTTP status. */
export function statusErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return "Sesi Anda telah berakhir atau belum terotentikasi. Silakan login kembali.";
    case 403:
      return "Akses ditolak: peran Anda tidak memiliki izin untuk operasi ini.";
    case 404:
      return "Data yang diminta tidak ditemukan.";
    case 409:
      return "Data konflik: nomor identitas tersebut sudah terdaftar.";
    default:
      return "Terjadi kesalahan pada server. Silakan coba lagi.";
  }
}
