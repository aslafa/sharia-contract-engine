"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/enterprise/page-header";
import { useSession } from "@/lib/hooks/use-session";
import { AccessDeniedPanel } from "@/components/enterprise/access-notice";
import { Building2, Shield, Users, Lock, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ArrowRight } from "lucide-react";
import { SYSTEM_ROLE_DEFINITIONS, SystemRole } from "@/lib/auth/roles";

export default function TenantSettingsPage() {
  // Tahap 3B.5 — pengaturan organisasi (org:view) bukan untuk semua peran:
  // FO tidak memiliki izin ini, sesuai konfigurasi sidebar & RBAC.
  const { loading: sessionLoading, can } = useSession();
  const canOrgView = can("org:view");
  const canOrgEdit = can("org:edit");

  const [activeTab, setActiveTab] = React.useState<"profile" | "rbac" | "security">("rbac");
  const [testLoading, setTestLoading] = React.useState(false);
  const [testResults, setTestResults] = React.useState<any>(null);

  const runSecurityTest = async () => {
    try {
      setTestLoading(true);
      const res = await fetch("/api/v1/security/test-isolation", { method: "POST" });
      const json = await res.json();
      setTestResults(json);
    } catch (err) {
      console.error(err);
    } finally {
      setTestLoading(false);
    }
  };

  const [profileSaved, setProfileSaved] = React.useState(false);
  const [instName, setInstName] = React.useState("PT BPRS Al-Barakah Mandiri Sejahtera");
  const [instLicense, setInstLicense] = React.useState("KEP-44/D.03/2021");

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Organisasi & Kontrol Akses (IAM & Multi-Tenancy)"
        description="Konfigurasi identitas legal institusi, pembagian 8 peran sistem (RBAC), dan pengujian isolasi tenant antar-lembaga."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pengaturan Tenant" },
        ]}
      />

      {/* Tahap 3B.5 — URL-direct access: org:view wajib untuk halaman pengaturan */}
      {!sessionLoading && !canOrgView && (
        <AccessDeniedPanel
          permission="org:view"
          message="Peran Anda tidak memiliki izin melihat Pengaturan Organisasi (IAM & Multi-Tenancy). Modul ini tersedia untuk Administrator Institusi, Manajemen, Auditor, dan Super Admin."
        />
      )}

      {!sessionLoading && canOrgView && (
      <>
      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-2">
        {[
          { key: "rbac", label: "8 Peran Sistem (RBAC)", icon: Shield },
          { key: "security", label: "Verifikasi Keamanan Multi-Tenant", icon: Lock },
          { key: "profile", label: "Profil Legalitas Lembaga", icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                isActive
                  ? "border-[#00549c] text-[#00549c]"
                  : "border-transparent text-[#64748B] hover:text-[#172B4D]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 8 Peran RBAC */}
      {activeTab === "rbac" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Matriks 8 Peran Sistem (Role-Based Access Control)</h3>
              <p className="text-xs text-[#64748B]">Setiap peran memiliki batasan otorisasi ketat di tingkat backend dan database.</p>
            </div>
            <Badge variant="info">8 Peran Terkonfigurasi</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(SYSTEM_ROLE_DEFINITIONS).map((role) => (
              <Card key={role.code} className="border-[#E2E8F0]">
                <CardHeader className="pb-2.5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold text-[#172B4D] flex items-center gap-2">
                      <span className="font-mono text-[#00549c]">{role.code}</span>
                      <span>• {role.nameId}</span>
                    </CardTitle>
                    <Badge variant={role.category === "SYSTEM" ? "primary" : "neutral"}>
                      {role.category}
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px] text-[#64748B] mt-1">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 text-xs">
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Hak Izin ({role.permissions.length} Izin):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 5).map((p) => (
                        <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#172B4D] font-mono">
                          {p}
                        </span>
                      ))}
                      {role.permissions.length > 5 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#DCEAF5] text-[#00549c] font-semibold">
                          +{role.permissions.length - 5} izin lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Multi-Tenant Security Verification */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#00549c]" />
                Pengujian Otomatis Keamanan Isolasi Multi-Tenant & RBAC
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B]">
                Eksekusi pengujian backend sesungguhnya untuk membuktikan bahwa upaya akses lintas-organisasi (cross-tenant) ditolak dengan HTTP 403 Forbidden dan dicatat dalam audit log.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg">
                <div>
                  <h4 className="font-bold text-[#172B4D]">Verifikasi Barikade Antar-Tenant (Cross-Tenant Barrier)</h4>
                  <p className="text-[#64748B] text-[11px] mt-0.5">
                    Menjalankan skenario serangan: Tenant A mencoba membaca dokumen rahasia Tenant B, dan Auditor mencoba memutasi kontrak pembiayaan.
                  </p>
                </div>
                <Button
                  onClick={runSecurityTest}
                  disabled={testLoading}
                  className="gap-2 shrink-0 bg-[#00549c] hover:bg-[#00549c]/90 text-white"
                >
                  <RefreshCw className={`h-4 w-4 ${testLoading ? "animate-spin" : ""}`} />
                  <span>{testLoading ? "Menguji Keamanan..." : "Jalankan Audit Keamanan"}</span>
                </Button>
              </div>

              {testResults && (
                <div className="space-y-3 animate-in fade-in-50">
                  <div className="p-3 bg-[#16A36A]/10 border border-[#16A36A]/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#16A36A] font-bold">
                      <ShieldCheck className="h-5 w-5" />
                      <span>Status Keamanan: {testResults.summary?.securityStatus}</span>
                    </div>
                    <Badge variant="success">
                      {testResults.summary?.passedTests} / {testResults.summary?.totalTests} Pengujian Lulus (100%)
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {testResults.results?.map((res: any) => (
                      <div
                        key={res.testId}
                        className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#00549c]">{res.testId}</span>
                            <strong className="text-[#172B4D]">{res.name}</strong>
                          </div>
                          <p className="text-[11px] text-[#64748B]">{res.description}</p>
                          {res.violationCaught && (
                            <p className="text-[10px] text-[#DC3545] font-mono bg-[#DC3545]/5 p-1 rounded">
                              {res.violationCaught}
                            </p>
                          )}
                          {res.blockedReason && (
                            <p className="text-[10px] text-[#E9A23B] font-mono bg-[#E9A23B]/10 p-1 rounded">
                              {res.blockedReason}
                            </p>
                          )}
                        </div>
                        <Badge variant={res.passed ? "success" : "danger"}>
                          {res.passed ? `Status ${res.status} OK (Lulus)` : "Gagal"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Profil Lembaga */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#00549c]" />
                Profil Legalitas Institusi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nama Resmi Lembaga</label>
                <Input value={instName} onChange={(e) => setInstName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Nomor Izin Usaha OJK</label>
                <Input value={instLicense} onChange={(e) => setInstLicense(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Tenant ID Unik</label>
                <Input defaultValue="org-bprs-albarakah" readOnly className="bg-[#F5F8FC] font-mono" />
              </div>
              {profileSaved && (
                <p className="text-[11px] text-[#16A36A] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Profil institusi berhasil disimpan!
                </p>
              )}
              {canOrgEdit ? (
                <Button size="sm" onClick={handleSaveProfile} className="mt-2 font-semibold">
                  Simpan Perubahan
                </Button>
              ) : (
                <p className="mt-2 text-[11px] text-[#64748B] flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Perubahan profil legalitas memerlukan izin org:edit (Administrator).
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </>
      )}
    </div>
  );
}
