"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/enterprise/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/hooks/use-session";
import { AccessDeniedPanel } from "@/components/enterprise/access-notice";
import { formatIDR } from "@/lib/utils";
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  Calculator,
  FileText,
  GitBranch,
} from "lucide-react";

// ─── Local types (mirror engine output tanpa server import) ──────────────────

type AkadCategory = "MURABAHAH" | "IJARAH" | "MUSYARAKAH" | "MUDHARABAH";
type FinancingPurpose =
  | "ASSET_PURCHASE" | "ASSET_LEASE" | "BUSINESS_PARTNERSHIP" | "BUSINESS_CAPITAL"
  | "PROPERTY" | "VEHICLE" | "EDUCATION" | "WORKING_CAPITAL" | "OTHER";
type CustomerType = "INDIVIDUAL" | "MICRO_BUSINESS" | "SME" | "CORPORATE";
type RiskProfile = "CONSERVATIVE" | "MODERATE" | "GROWTH";

interface AkadScore {
  akad: AkadCategory;
  score: number;
  reasons: string[];
  cautions: string[];
  requiredFields: string[];
}

interface AkadRecommendationResult {
  recommendedAkad: AkadCategory;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  scores: AkadScore[];
  reasoning: string;
  alternatives: AkadCategory[];
  shariaPayloadHint: Record<string, unknown>;
  evaluatedAt: string;
}

interface ValidationResult {
  status: string;
  overallScore: number;
  criticalViolations: number;
  warnings: number;
  results: Array<{
    ruleCode: string;
    title: string;
    severity: string;
    isCompliant: boolean;
    message: string;
    suggestedCorrection?: string;
    dsnMuiRef?: string;
  }>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AKAD_LABELS: Record<
  AkadCategory,
  { name: string; arabicName: string; icon: React.ComponentType<{ className?: string }> }
> = {
  MURABAHAH: { name: "Murabahah", arabicName: "المرابحة", icon: Calculator },
  IJARAH: { name: "Ijarah & IMBT", arabicName: "الإجارة", icon: FileText },
  MUSYARAKAH: { name: "Musyarakah", arabicName: "المشاركة", icon: GitBranch },
  MUDHARABAH: { name: "Mudharabah", arabicName: "المضاربة", icon: TrendingUp },
};

const PURPOSE_OPTIONS: { value: FinancingPurpose; label: string; hint: string }[] = [
  { value: "ASSET_PURCHASE", label: "Pembelian Aset / Barang", hint: "Mesin, peralatan, inventaris" },
  { value: "PROPERTY", label: "Pembiayaan Properti (KPR)", hint: "Rumah, ruko, bangunan" },
  { value: "VEHICLE", label: "Pembiayaan Kendaraan", hint: "Mobil, motor, truk" },
  { value: "ASSET_LEASE", label: "Sewa Aset / Alat Berat", hint: "Tanpa transfer kepemilikan" },
  { value: "EDUCATION", label: "Pembiayaan Pendidikan / Jasa", hint: "Ijarah multijasa" },
  { value: "BUSINESS_PARTNERSHIP", label: "Kemitraan Usaha", hint: "Joint venture, proyek" },
  { value: "BUSINESS_CAPITAL", label: "Investasi Modal Usaha", hint: "Produktif, trust-based" },
  { value: "WORKING_CAPITAL", label: "Modal Kerja Dagang", hint: "Perdagangan, persediaan" },
  { value: "OTHER", label: "Lainnya", hint: "Kebutuhan khusus" },
];

const CUSTOMER_TYPE_OPTIONS: { value: CustomerType; label: string }[] = [
  { value: "INDIVIDUAL", label: "Perorangan" },
  { value: "MICRO_BUSINESS", label: "Usaha Mikro (UMKM)" },
  { value: "SME", label: "UKM / Usaha Kecil Menengah" },
  { value: "CORPORATE", label: "Korporasi / Perusahaan" },
];

const RISK_OPTIONS: { value: RiskProfile; label: string; desc: string }[] = [
  { value: "CONSERVATIVE", label: "Konservatif", desc: "Preferensi aset pasti, margin tetap" },
  { value: "MODERATE", label: "Moderat", desc: "Campuran, terbuka pada bagi hasil" },
  { value: "GROWTH", label: "Growth-Oriented", desc: "Siap berbagi risiko, bagi hasil" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function confidenceBadge(c: string) {
  if (c === "HIGH") return <Badge variant="success">Keyakinan Tinggi</Badge>;
  if (c === "MEDIUM") return <Badge variant="warning">Keyakinan Sedang</Badge>;
  return <Badge variant="secondary">Keyakinan Rendah — Perlu Verifikasi Manual</Badge>;
}

function validationStatusBadge(status: string) {
  if (status === "COMPLIANT") return <Badge variant="success">Lolos Validasi Syariah</Badge>;
  if (status === "WARNING") return <Badge variant="warning">Peringatan Syariah</Badge>;
  if (status === "NON_COMPLIANT") return <Badge variant="danger">Tidak Lolos Syariah</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function ScoreBar({ score, akad }: { score: number; akad: AkadCategory }) {
  const color =
    score >= 70 ? "bg-[#00549c]" :
    score >= 50 ? "bg-[#0284C7]" :
    "bg-slate-300";
  const info = AKAD_LABELS[akad];
  const Icon = info.icon;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#172B4D] flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-[#00549c]" />
          <span>{info.name}</span>
          <span className="font-normal text-[#64748B] text-[10px]">({info.arabicName})</span>
        </span>
        <span className="font-mono font-bold text-[#172B4D]">{score}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AkadRecommendationPage() {
  const { user, loading: sessionLoading, can } = useSession();
  const router = useRouter();

  // Access gate: hanya role dengan contracts:create (FO, INSTITUTION_ADMIN, SUPER_ADMIN)
  const canAccess = can("contracts:create");

  // ── Form state
  const [financingPurpose, setFinancingPurpose] = React.useState<FinancingPurpose>("ASSET_PURCHASE");
  const [transactionObject, setTransactionObject] = React.useState("");
  const [financingAmount, setFinancingAmount] = React.useState("");
  const [tenorMonths, setTenorMonths] = React.useState("24");
  const [customerType, setCustomerType] = React.useState<CustomerType>("SME");
  const [riskProfile, setRiskProfile] = React.useState<RiskProfile>("MODERATE");
  const [wantsOwnershipTransfer, setWantsOwnershipTransfer] = React.useState<boolean | undefined>(undefined);
  const [hasCollateral, setHasCollateral] = React.useState(true);
  const [businessHasTrackRecord, setBusinessHasTrackRecord] = React.useState(true);
  const [capitalContributionPercent, setCapitalContributionPercent] = React.useState("");
  const [includeValidation, setIncludeValidation] = React.useState(true);
  const [additionalNotes, setAdditionalNotes] = React.useState("");

  // ── Result state
  const [result, setResult] = React.useState<AkadRecommendationResult | null>(null);
  const [validation, setValidation] = React.useState<ValidationResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-[#64748B]">
        <Loader2 className="h-6 w-6 animate-spin text-[#00549c]" />
        <span className="text-sm">Memeriksa sesi…</span>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <AccessDeniedPanel
        permission="contracts:create"
        message="Halaman Rekomendasi AI Akad hanya dapat diakses oleh Petugas Pembiayaan (FO) dan Administrator Institusi."
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setValidation(null);

    const amount = parseFloat(financingAmount.replace(/[^0-9.]/g, ""));
    const tenor = parseInt(tenorMonths, 10);

    if (!amount || amount < 1_000_000) {
      setError("Nilai pembiayaan minimal Rp 1.000.000.");
      setLoading(false);
      return;
    }
    if (!tenor || tenor < 1) {
      setError("Tenor minimal 1 bulan.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        financingPurpose,
        transactionObject: transactionObject.trim() || undefined,
        financingAmount: amount,
        tenorMonths: tenor,
        customerType,
        riskProfile,
        wantsOwnershipTransfer,
        hasCollateral,
        businessHasTrackRecord,
        capitalContributionPercent: capitalContributionPercent
          ? parseFloat(capitalContributionPercent)
          : undefined,
        includeValidation,
        additionalNotes: additionalNotes.trim() || undefined,
      };

      const res = await fetch("/api/v1/akad-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Gagal mendapatkan rekomendasi");
      }

      setResult(json.data.recommendation);
      setValidation(json.data.validation ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToApplication = () => {
    if (!result) return;
    const akad = result.recommendedAkad.toLowerCase();
    router.push(`/contracts/${akad}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekomendasi AI Akad Syariah"
        description="Engine analitik berbasis aturan syariah yang membantu Petugas Pembiayaan memilih akad yang paling sesuai. Rekomendasi bersifat advisory — keputusan akhir tetap pada DPS dan Manajemen."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Rekomendasi Akad AI" },
        ]}
        badge={
          <Badge variant="warning" dot>
            AI Advisory — Bukan Fatwa
          </Badge>
        }
      />

      {/* Disclaimer banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          <strong>Penting:</strong> Sistem ini hanya memberikan <strong>rekomendasi berbasis analisis aturan syariah</strong>.
          AI tidak memiliki otoritas fatwa. Validasi syariah final dan persetujuan akad tetap merupakan kewenangan
          eksklusif <strong>Dewan Pengawas Syariah (DPS)</strong> dan Manajemen Institusi.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── LEFT: Input Form ──────────────────────────────────────────────── */}
        <div className="xl:col-span-2">
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#00549c]" />
                <CardTitle className="text-sm font-bold text-[#172B4D]">
                  Parameter Pembiayaan
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Isi data karakteristik transaksi untuk mendapatkan rekomendasi akad terbaik.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">

                {/* Tujuan pembiayaan */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#172B4D]">Tujuan Pembiayaan *</label>
                  <select
                    value={financingPurpose}
                    onChange={(e) => setFinancingPurpose(e.target.value as FinancingPurpose)}
                    className="w-full rounded-md border border-[#E2E8F0] p-2 text-xs text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#00549c]"
                    required
                  >
                    {PURPOSE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label} — {o.hint}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Objek transaksi */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#172B4D]">Objek Transaksi</label>
                  <input
                    type="text"
                    value={transactionObject}
                    onChange={(e) => setTransactionObject(e.target.value)}
                    placeholder="Contoh: Mesin konveksi 2 unit, Toyota Avanza 2024, Rumah KPR type 45…"
                    className="w-full rounded-md border border-[#E2E8F0] p-2 text-xs text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#00549c]"
                  />
                </div>

                {/* Nilai pembiayaan */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#172B4D]">Nilai Pembiayaan (Rp) *</label>
                  <input
                    type="text"
                    value={financingAmount}
                    onChange={(e) => setFinancingAmount(e.target.value)}
                    placeholder="Contoh: 500000000"
                    className="w-full rounded-md border border-[#E2E8F0] p-2 text-xs font-mono text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#00549c]"
                    required
                  />
                  {financingAmount && !isNaN(parseFloat(financingAmount.replace(/[^0-9.]/g, ""))) && (
                    <p className="text-[10px] text-[#64748B] font-mono">
                      = {formatIDR(parseFloat(financingAmount.replace(/[^0-9.]/g, "")))}
                    </p>
                  )}
                </div>

                {/* Tenor */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#172B4D]">Tenor (bulan) *</label>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={tenorMonths}
                    onChange={(e) => setTenorMonths(e.target.value)}
                    className="w-full rounded-md border border-[#E2E8F0] p-2 text-xs font-mono text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#00549c]"
                    required
                  />
                </div>

                {/* Tipe nasabah */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#172B4D]">Tipe Nasabah *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CUSTOMER_TYPE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setCustomerType(o.value)}
                        className={`px-3 py-2 rounded-md border text-[11px] font-semibold transition-all ${
                          customerType === o.value
                            ? "border-[#00549c] bg-[#EBF4FF] text-[#00549c]"
                            : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profil risiko */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#172B4D]">Profil Risiko Nasabah *</label>
                  <div className="space-y-1.5">
                    {RISK_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setRiskProfile(o.value)}
                        className={`w-full text-left px-3 py-2 rounded-md border text-[11px] transition-all ${
                          riskProfile === o.value
                            ? "border-[#00549c] bg-[#EBF4FF] text-[#00549c]"
                            : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <span className="font-semibold">{o.label}</span>
                        <span className="text-[10px] ml-1 opacity-70">— {o.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle options */}
                <div className="space-y-2 pt-1">
                  <label className="font-semibold text-[#172B4D] block">Informasi Tambahan</label>

                  {[
                    { label: "Ingin kepemilikan aset di akhir", value: wantsOwnershipTransfer, setter: setWantsOwnershipTransfer as (v: boolean) => void },
                    { label: "Tersedia agunan / jaminan", value: hasCollateral, setter: setHasCollateral },
                    { label: "Usaha sudah berjalan / ada rekam jejak", value: businessHasTrackRecord, setter: setBusinessHasTrackRecord },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#172B4D]">{item.label}</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => item.setter(true)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all ${
                            item.value === true
                              ? "bg-green-600 text-white border-green-600"
                              : "border-[#E2E8F0] text-[#64748B]"
                          }`}
                        >Ya</button>
                        <button
                          type="button"
                          onClick={() => item.setter(false)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all ${
                            item.value === false
                              ? "bg-slate-600 text-white border-slate-600"
                              : "border-[#E2E8F0] text-[#64748B]"
                          }`}
                        >Tidak</button>
                      </div>
                    </div>
                  ))}

                  {/* Kontribusi modal */}
                  <div className="pt-1">
                    <label className="text-[11px] text-[#172B4D] font-semibold">
                      Kontribusi Modal Nasabah (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={capitalContributionPercent}
                      onChange={(e) => setCapitalContributionPercent(e.target.value)}
                      placeholder="0–100 (opsional, untuk Musyarakah/Mudharabah)"
                      className="w-full mt-1 rounded-md border border-[#E2E8F0] p-2 text-xs font-mono text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#00549c]"
                    />
                  </div>
                </div>

                {/* Include validation */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="includeValidation"
                    checked={includeValidation}
                    onChange={(e) => setIncludeValidation(e.target.checked)}
                    className="accent-[#00549c]"
                  />
                  <label htmlFor="includeValidation" className="text-[11px] text-[#172B4D] cursor-pointer">
                    Jalankan validasi Sharia Rule Engine setelah rekomendasi
                  </label>
                </div>

                {/* Catatan tambahan */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#172B4D]">Catatan Tambahan FO</label>
                  <textarea
                    rows={2}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Informasi kontekstual yang relevan…"
                    className="w-full rounded-md border border-[#E2E8F0] p-2 text-xs text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#00549c]"
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                  className="w-full text-xs font-bold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Menganalisis…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Dapatkan Rekomendasi Akad
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Results ───────────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">
          {!result && !loading && (
            <Card className="border-[#E2E8F0] border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-[#94A3B8]">
                <Sparkles className="h-12 w-12 text-[#CBD5E1]" />
                <div className="text-center space-y-1">
                  <p className="font-semibold text-sm text-[#64748B]">
                    Isi parameter pembiayaan untuk memulai analisis
                  </p>
                  <p className="text-xs max-w-xs">
                    Engine akan menganalisis karakteristik transaksi dan memberikan
                    rekomendasi akad syariah yang paling sesuai.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="border-[#E2E8F0]">
              <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-[#64748B]">
                <Loader2 className="h-10 w-10 animate-spin text-[#00549c]" />
                <p className="text-sm font-medium">Menganalisis karakteristik transaksi…</p>
                <p className="text-xs text-[#94A3B8]">
                  Mengevaluasi 4 jenis akad berdasarkan aturan syariah DSN-MUI
                </p>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <>
              {/* Recommended Akad */}
              <Card className="border-[#00549c] shadow-xs bg-white rounded-xl overflow-hidden">
                <CardHeader className="py-4 px-5 border-b border-[#E2E8F0] bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#DCEAF5] text-[#00549c] flex items-center justify-center shrink-0">
                        {React.createElement(AKAD_LABELS[result.recommendedAkad].icon, { className: "h-5 w-5" })}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold text-[#00549c]">
                            {AKAD_LABELS[result.recommendedAkad].name}
                          </CardTitle>
                          {confidenceBadge(result.confidence)}
                        </div>
                        <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                          {AKAD_LABELS[result.recommendedAkad].arabicName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-[#00549c]">
                        {result.scores[0]?.score}
                      </div>
                      <div className="text-[10px] text-[#64748B] font-semibold uppercase">Skor Kelayakan / 100</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs">
                  {/* Reasoning */}
                  <div className="p-3.5 rounded-lg bg-[#F5F8FC] border border-[#CBD5E1]/60">
                    <p className="text-[#172B4D] leading-relaxed font-medium">{result.reasoning}</p>
                  </div>

                  {/* Score bars */}
                  <div className="space-y-3 pt-1">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B]">
                      Perbandingan Skor Semua Akad:
                    </h4>
                    {result.scores.map((s) => (
                      <ScoreBar key={s.akad} score={s.score} akad={s.akad} />
                    ))}
                  </div>

                  {/* Alasan positif */}
                  {result.scores[0]?.reasons.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <h4 className="font-bold uppercase tracking-wider text-[#64748B]">
                        Mengapa Akad Ini Sesuai:
                      </h4>
                      <ul className="space-y-1.5">
                        {result.scores[0].reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-[#172B4D]">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-600" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cautions */}
                  {result.scores[0]?.cautions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <h4 className="font-bold uppercase tracking-wider text-[#64748B]">
                        Hal yang Perlu Diperhatikan:
                      </h4>
                      <ul className="space-y-1.5">
                        {result.scores[0].cautions.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Required fields hint */}
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="font-semibold text-[#172B4D] mb-1.5">
                      Parameter yang Wajib Dilengkapi Saat Pengajuan:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.scores[0]?.requiredFields.map((f) => (
                        <span key={f} className="px-2 py-0.5 rounded bg-white text-[#00549c] font-mono text-[10px] border border-[#CBD5E1]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Alternatives */}
                  {result.alternatives.length > 0 && (
                    <div className="pt-1">
                      <h4 className="font-bold uppercase tracking-wider text-[#64748B] mb-2">
                        Alternatif Akad Layak (Skor ≥ 60):
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {result.alternatives.map((alt) => {
                          const AltIcon = AKAD_LABELS[alt].icon;
                          return (
                            <div key={alt} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[11px]">
                              <AltIcon className="h-3.5 w-3.5 text-[#00549c]" />
                              <span className="font-semibold text-[#172B4D]">{AKAD_LABELS[alt].name}</span>
                              <span className="text-[#64748B] font-mono">
                                ({result.scores.find((s) => s.akad === alt)?.score}/100)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-[#E2E8F0]">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleProceedToApplication}
                      className="text-xs font-bold"
                    >
                      <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      Lanjut ke Permohonan {AKAD_LABELS[result.recommendedAkad].name}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setResult(null); setValidation(null); }}
                      className="text-xs font-semibold"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Uji Parameter Lain
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sharia Validation Result */}
              {validation && (
                <Card className="border-[#E2E8F0]">
                  <CardHeader className="pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#00549c]" />
                        <CardTitle className="text-sm font-bold text-[#172B4D]">
                          Hasil Validasi Sharia Rule Engine
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {validationStatusBadge(validation.status)}
                        <span className="font-mono text-xs font-bold text-[#172B4D]">
                          {validation.overallScore}/100
                        </span>
                      </div>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      Validasi otomatis payload hint terhadap {validation.results?.length ?? 0} aturan syariah aktif.
                      Validasi ini bersifat awal — DPS tetap melakukan telaah manual.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 text-xs space-y-3">
                    {/* Summary row */}
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-[#172B4D]">{validation.criticalViolations} Pelanggaran Kritis</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-[#172B4D]">{validation.warnings} Peringatan</span>
                      </div>
                    </div>

                    {/* Rule results */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {(validation.results ?? []).map((r) => (
                        <div
                          key={r.ruleCode}
                          className={`p-2.5 rounded-lg border ${
                            r.isCompliant
                              ? "bg-green-50 border-green-200"
                              : r.severity === "CRITICAL"
                              ? "bg-red-50 border-red-200"
                              : "bg-amber-50 border-amber-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#172B4D]">{r.title}</span>
                            {r.isCompliant ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-[#64748B] mt-0.5">{r.message}</p>
                          {r.suggestedCorrection && (
                            <p className="text-[10px] text-[#00549c] mt-0.5">
                              <span className="font-semibold text-slate-700">Remediasi Fiqh:</span> {r.suggestedCorrection}
                            </p>
                          )}
                          {r.dsnMuiRef && (
                            <p className="text-[10px] text-[#94A3B8] mt-0.5">{r.dsnMuiRef}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
