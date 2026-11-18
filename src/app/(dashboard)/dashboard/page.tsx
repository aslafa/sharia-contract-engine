"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/enterprise/metric-card";
import { formatIDR } from "@/lib/utils";
import { SystemRole } from "@/types";
import {
  loadStoredData,
  saveStoredData,
  WorkflowItem,
  AuditLogEntry,
  StaffEntry,
  TenantEntry,
} from "@/lib/store/workflow-store";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  Scale,
  Sparkles,
  GitBranch,
  FileCode2,
  CheckCheck,
  Layers,
  Calculator,
  UserCheck,
  ShieldAlert,
  ClipboardList,
  Building2,
  Lock,
  Database,
  Users2,
  ChevronRight,
  AlertTriangle,
  FileCheck2,
  CreditCard,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Info,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [session, setSession] = React.useState<any>(null);
  const [storeData, setStoreData] = React.useState<{
    items: WorkflowItem[];
    auditLogs: AuditLogEntry[];
    staff: StaffEntry[];
    tenants: TenantEntry[];
  }>({ items: [], auditLogs: [], staff: [], tenants: [] });

  const [activeModal, setActiveModal] = React.useState<{
    type: "FO_SUBMIT" | "LEGAL_REVIEW" | "COMPLIANCE_CHECK" | "DPS_OPINION" | "MGMT_APPROVE" | "AUDIT_VERIFY" | "ADD_STAFF" | "VERIFY_TENANT" | null;
    item?: WorkflowItem;
    tenant?: TenantEntry;
  }>({ type: null });

  const [notification, setNotification] = React.useState<string | null>(null);

  // Form states for modals
  const [formNotes, setFormNotes] = React.useState("");
  const [formChecked, setFormChecked] = React.useState(true);
  const [newStaff, setNewStaff] = React.useState({ name: "", email: "", role: "Financing Officer", roleCode: "FINANCING_OFFICER" });

  React.useEffect(() => {
    // 1. Fetch Session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setSession(json.data.user);
        }
      })
      .catch(() => {});

    // 2. Load persistent workflow data
    const data = loadStoredData();
    setStoreData(data);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const role: SystemRole = (session?.role as SystemRole) || "FINANCING_OFFICER";
  const orgName = session?.organizationName || "PT BPRS Al-Barakah Mandiri";
  const fullName = session?.fullName || "Petugas Institusi";
  const roleName = session?.roleName || "Petugas Pembiayaan (FO)";

  // Filter items relevant for each role's queue
  const roleItems = React.useMemo(() => {
    switch (role) {
      case "FINANCING_OFFICER":
        return storeData.items.filter((i) => i.currentStage === "FO" || i.status === "DRAFT" || i.status === "REVISION");
      case "LEGAL_OFFICER":
        return storeData.items.filter((i) => i.currentStage === "LEGAL" || i.status === "LEGAL_REVIEW");
      case "COMPLIANCE_OFFICER":
        return storeData.items.filter((i) => i.currentStage === "COMPLIANCE" || i.status === "COMPLIANCE_REVIEW");
      case "SHARIA_REVIEWER":
        return storeData.items.filter((i) => i.currentStage === "DPS" || i.status === "DPS_REVIEW");
      case "MANAGEMENT":
        return storeData.items.filter((i) => i.currentStage === "MANAGEMENT" || i.status === "MANAGEMENT_REVIEW");
      case "AUDITOR":
        return storeData.items; // Auditor sees all items
      case "SUPER_ADMIN":
        return storeData.items;
      case "INSTITUTION_ADMIN":
      default:
        return storeData.items;
    }
  }, [role, storeData.items]);

  // Check if a stage in the 6-stage lifecycle is within the active role's responsibilities
  const isStageResponsible = React.useCallback(
    (stageNum: number): boolean => {
      switch (role) {
        case "FINANCING_OFFICER":
          return [1, 2, 3, 4, 6].includes(stageNum);
        case "LEGAL_OFFICER":
          return [2, 3, 4, 5, 6].includes(stageNum);
        case "COMPLIANCE_OFFICER":
          return [2, 3, 5, 6].includes(stageNum);
        case "SHARIA_REVIEWER":
          return [1, 2, 3, 5, 6].includes(stageNum);
        case "MANAGEMENT":
          return [5, 6].includes(stageNum);
        case "AUDITOR":
          return [3, 5, 6].includes(stageNum);
        case "SUPER_ADMIN":
        case "INSTITUTION_ADMIN":
        default:
          return true;
      }
    },
    [role]
  );

  // Role-specific workspace cards (shows only permitted and relevant modules)
  const roleWorkspaceCards = React.useMemo(() => {
    switch (role) {
      case "FINANCING_OFFICER":
        return [
          {
            href: "/akad-recommendation",
            stage: "TAHAP 1",
            title: "AI Akad Recommendation",
            desc: "Analisis kebutuhan nasabah & rekomendasi akad syariah paling tepat secara otomatis.",
            action: "Mulai Rekomendasi",
            icon: Sparkles,
          },
          {
            href: "/contracts/mapping",
            stage: "TAHAP 2",
            title: "Intelligent Akad Matching",
            desc: "Pencocokan parameter pembiayaan nasabah & validasi skema multi-akad.",
            action: "Petakan Akad",
            icon: GitBranch,
          },
          {
            href: "/sharia-rules",
            stage: "TAHAP 3",
            title: "Automated Sharia Validation",
            desc: "Pemeriksaan awal 25+ kaidah rukun & syarat syariah sebelum berkas diajukan.",
            action: "Uji Parameter",
            icon: Scale,
          },
          {
            href: "/documents/generator",
            stage: "TAHAP 4",
            title: "Automated Contract Generation",
            desc: "Penyusunan naskah hukum perjanjian akad, lampiran BAST, dan jadwal angsuran.",
            action: "Buat Draf Naskah",
            icon: FileCode2,
          },
          {
            href: "/contracts",
            stage: "TAHAP 6",
            title: "Centralized Contract Monitoring",
            desc: "Pemantauan status pengajuan berjalan, kelengkapan berkas, dan histori akad nasabah.",
            action: "Monitor Akad",
            icon: TrendingUp,
          },
          {
            href: "/customers",
            stage: "OPERASIONAL",
            title: "Data Nasabah & Skrining AML",
            desc: "Registrasi profil nasabah baru dan verifikasi kelayakan awal APU-PPT.",
            action: "Kelola Nasabah",
            icon: Users2,
          },
        ];

      case "LEGAL_OFFICER":
        return [
          {
            href: "/approvals",
            stage: "TAHAP 5",
            title: "Persetujuan Dokumen Legal",
            desc: "Verifikasi keabsahan hukum, legalitas pihak berakad, dan keabsahan pengikatan agunan.",
            action: "Telaah Berkas",
            icon: CheckCheck,
          },
          {
            href: "/documents/generator",
            stage: "TAHAP 4",
            title: "Contract Generator & Editor",
            desc: "Penyempurnaan klausul perjanjian standar, klausul wa'd IMBT, dan adendum hukum.",
            action: "Buka Editor Klausul",
            icon: FileCode2,
          },
          {
            href: "/contracts/mapping",
            stage: "TAHAP 2",
            title: "Intelligent Akad Matching",
            desc: "Pemeriksaan klausul hukum pembiayaan bertahap & yurisdiksi penyelesaian Basyarnas.",
            action: "Periksa Struktur",
            icon: GitBranch,
          },
          {
            href: "/sharia-rules",
            stage: "TAHAP 3",
            title: "Automated Sharia Validation",
            desc: "Kesesuaian klausul kontrak terhadap rukun & syarat syariah yang berkekuatan hukum.",
            action: "Validasi Kaidah",
            icon: Scale,
          },
          {
            href: "/contracts",
            stage: "TAHAP 6",
            title: "Centralized Contract Monitoring",
            desc: "Pengawasan kontrak pembiayaan yang telah disahkan dan berkekuatan hukum mengikat.",
            action: "Monitor Kontrak",
            icon: TrendingUp,
          },
          {
            href: "/documents",
            stage: "OPERASIONAL",
            title: "Brankas Dokumen Legal",
            desc: "Akses salinan naskah hukum, akta notariil, BAST fisik, dan sertifikat jaminan.",
            action: "Buka Brankas",
            icon: FileText,
          },
        ];

      case "COMPLIANCE_OFFICER":
        return [
          {
            href: "/approvals",
            stage: "TAHAP 5",
            title: "Persetujuan Kepatuhan Regulasi",
            desc: "Verifikasi kepatuhan POJK, regulasi Bank Indonesia, dan batas BMPD pihak terkait.",
            action: "Tinjau Kepatuhan",
            icon: CheckCheck,
          },
          {
            href: "/sharia-rules",
            stage: "TAHAP 3",
            title: "Automated Sharia Validation",
            desc: "Pengawasan otomatis aturan kepatuhan regulasi dan rukun syariah institusional.",
            action: "Inspeksi Regulasi",
            icon: Scale,
          },
          {
            href: "/contracts/mapping",
            stage: "TAHAP 2",
            title: "Intelligent Akad Matching",
            desc: "Pencegahan risiko percampuran akad (ta'alluq / hilah) pada skema multi-akad.",
            action: "Validasi Struktur",
            icon: GitBranch,
          },
          {
            href: "/contracts",
            stage: "TAHAP 6",
            title: "Centralized Contract Monitoring",
            desc: "Pengawasan status kepatuhan seluruh portofolio pembiayaan lembaga secara terpadu.",
            action: "Monitor Portofolio",
            icon: TrendingUp,
          },
          {
            href: "/analytics",
            stage: "RISK & BMPD",
            title: "Analitik Risiko & Batas BMPD",
            desc: "Pemantauan rasio pembiayaan, konsentrasi sektor, dan limit eksposur BMPD.",
            action: "Buka Analitik",
            icon: Calculator,
          },
          {
            href: "/customers",
            stage: "AML / CFT",
            title: "Skrining Nasabah & AML/CFT",
            desc: "Audit latar belakang nasabah, status CLEARED, PENDING, dan FLAGGED APU-PPT.",
            action: "Periksa Skrining",
            icon: UserCheck,
          },
        ];

      case "SHARIA_REVIEWER":
        return [
          {
            href: "/approvals",
            stage: "TAHAP 5",
            title: "Opini & Verifikasi Syariah DPS",
            desc: "Pemberian telaah kesesuaian syariah, penerbitan fatwa persetujuan, atau catatan fiqh.",
            action: "Telaah Syariah",
            icon: CheckCheck,
          },
          {
            href: "/sharia-rules",
            stage: "TAHAP 3",
            title: "Rule Engine & Otorisasi Fatwa",
            desc: "Pustaka 25+ kaidah fatwa DSN-MUI, parameter rukun & syarat, serta kewenangan override.",
            action: "Kelola Kaidah",
            icon: Scale,
          },
          {
            href: "/contracts/mapping",
            stage: "TAHAP 2",
            title: "Intelligent Akad Matching",
            desc: "Penelaahan kesesuaian fiqh muamalah pada skema pembiayaan bertahap & multi-akad.",
            action: "Telaah Multi-Akad",
            icon: GitBranch,
          },
          {
            href: "/akad-recommendation",
            stage: "TAHAP 1",
            title: "Audit Rekomendasi AI",
            desc: "Supervisi model kecerdasan buatan dalam mencocokkan kebutuhan dengan akad syariah.",
            action: "Audit Model AI",
            icon: Sparkles,
          },
          {
            href: "/contracts",
            stage: "TAHAP 6",
            title: "Centralized Contract Monitoring",
            desc: "Pengawasan berkelanjutan implementasi pembiayaan syariah agar terhindar dari riba.",
            action: "Pengawasan Kontrak",
            icon: TrendingUp,
          },
          {
            href: "/documents",
            stage: "OPERASIONAL",
            title: "Brankas Dokumen & Fatwa",
            desc: "Pemeriksaan naskah perjanjian akad dan dokumen pendukung kesesuaian syariah.",
            action: "Lihat Berkas",
            icon: FileCheck2,
          },
        ];

      case "MANAGEMENT":
        return [
          {
            href: "/approvals",
            stage: "TAHAP 5",
            title: "Persetujuan Komite Pembiayaan",
            desc: "Pengesahan limit pembiayaan nominal besar (> Rp 500 Jt) oleh Dewan Direksi.",
            action: "Sidang Komite",
            icon: CheckCheck,
          },
          {
            href: "/contracts",
            stage: "TAHAP 6",
            title: "Centralized Contract Monitoring",
            desc: "Sentralisasi pemantauan portofolio pembiayaan, realisasi akad, dan status operasional.",
            action: "Lihat Portofolio",
            icon: TrendingUp,
          },
          {
            href: "/analytics",
            stage: "EKSEKUTIF",
            title: "Analitik Kinerja & Imbal Hasil",
            desc: "Metrik yield margin, rasio NPF, tren volume pembiayaan, dan performa per cabang.",
            action: "Buka Dashboard",
            icon: Calculator,
          },
          {
            href: "/customers",
            stage: "OPERASIONAL",
            title: "Direktori Nasabah Institusi",
            desc: "Ringkasan portofolio nasabah utama, eksposur plafon, dan track record pembayaran.",
            action: "Data Nasabah",
            icon: Users2,
          },
          {
            href: "/documents",
            stage: "OPERASIONAL",
            title: "Arsip Dokumen Eksekutif",
            desc: "Akses salinan resmi perjanjian pembiayaan yang telah disahkan dan mengikat.",
            action: "Arsip Naskah",
            icon: FileText,
          },
          {
            href: "/billing",
            stage: "LANGGANAN",
            title: "Langganan & Kuota SaaS SCE",
            desc: "Informasi paket enterprise, penggunaan kuota transaksi bulanan, dan faktur billing.",
            action: "Kelola Paket",
            icon: CreditCard,
          },
        ];

      case "AUDITOR":
        return [
          {
            href: "/contracts",
            stage: "TAHAP 6",
            title: "Audit Portofolio Kontrak",
            desc: "Pemeriksaan independen seluruh kontrak secara read-only tanpa hak mengubah data.",
            action: "Audit Kontrak",
            icon: TrendingUp,
          },
          {
            href: "/approvals",
            stage: "TAHAP 5",
            title: "Audit Log & Jejak Persetujuan",
            desc: "Pemeriksaan riwayat persetujuan 5 jenjang, timestamp, dan catatan otorisasi komite.",
            action: "Periksa Log",
            icon: ClipboardList,
          },
          {
            href: "/sharia-rules",
            stage: "TAHAP 3",
            title: "Pustaka & Audit Kaidah Syariah",
            desc: "Pemeriksaan konsistensi aturan fatwa DSN-MUI dan telaah catatan override syariah.",
            action: "Inspeksi Kaidah",
            icon: Scale,
          },
          {
            href: "/analytics",
            stage: "AUDIT TRAIL",
            title: "Rekonsiliasi & Jejak Finansial",
            desc: "Verifikasi agregasi portofolio pembiayaan, rasio risiko, dan limit pembiayaan.",
            action: "Analisis Jejak",
            icon: Calculator,
          },
          {
            href: "/documents",
            stage: "INTEGRITAS",
            title: "Verifikasi Dokumen SHA-256",
            desc: "Uji integritas kriptografi naskah digital untuk memastikan bebas dari manipulasi.",
            action: "Uji Hash SHA-256",
            icon: Lock,
          },
          {
            href: "/customers",
            stage: "AUDIT DATA",
            title: "Audit Profil Nasabah",
            desc: "Verifikasi kepatuhan data nasabah, riwayat KYC, dan status evaluasi APU-PPT.",
            action: "Audit Nasabah",
            icon: Users2,
          },
        ];

      case "SUPER_ADMIN":
        return [
          {
            href: "/admin",
            stage: "SAAS HQ",
            title: "Pusat Kendali Master Platform",
            desc: "Manajemen tenant perbankan syariah, lisensi lembaga, dan metrik sistem global.",
            action: "Buka Master HQ",
            icon: Building2,
          },
          {
            href: "/contracts",
            stage: "TAHAP 6",
            title: "Pengawasan Kontrak Global",
            desc: "Monitoring seluruh portofolio akad aktif di seluruh tenant ekosistem SCE.",
            action: "Monitor Global",
            icon: TrendingUp,
          },
          {
            href: "/sharia-rules",
            stage: "TAHAP 3",
            title: "Kaidah Syariah Terpusat",
            desc: "Registri master aturan fatwa DSN-MUI dan standardisasi pustaka syariah global.",
            action: "Kelola Master Fatwa",
            icon: Scale,
          },
          {
            href: "/analytics",
            stage: "GLOBAL METRICS",
            title: "Analitik Ekosistem Multi-Tenant",
            desc: "Pemantauan volume transaksi agregat seluruh institusi dan kesehatan layanan SaaS.",
            action: "Analitik Platform",
            icon: Calculator,
          },
          {
            href: "/customers",
            stage: "GLOBAL USERS",
            title: "Direktori Pengguna Platform",
            desc: "Manajemen identitas akun staf, kontrol akses multi-tenant, dan kepatuhan.",
            action: "Data Pengguna",
            icon: Users2,
          },
          {
            href: "/settings",
            stage: "SISTEM",
            title: "Konfigurasi Master Platform",
            desc: "Pengaturan keamanan enkripsi sistem, kebijakan audit, dan integrasi API perbankan.",
            action: "Pengaturan Sistem",
            icon: Database,
          },
        ];

      case "INSTITUTION_ADMIN":
      default:
        return [
          {
            href: "/akad-recommendation",
            stage: "TAHAP 1",
            title: "AI Akad Recommendation",
            desc: "Rekomendasi jenis akad cerdas berbasis parameter transaksi nasabah.",
            action: "Rekomendasi",
            icon: Sparkles,
          },
          {
            href: "/contracts/mapping",
            stage: "TAHAP 2",
            title: "Intelligent Akad Matching",
            desc: "Pencocokan kebutuhan pembiayaan & validasi urutan multi-akad.",
            action: "Petakan Akad",
            icon: GitBranch,
          },
          {
            href: "/sharia-rules",
            stage: "TAHAP 3",
            title: "Automated Sharia Validation",
            desc: "Inferensi 25+ kaidah rukun & syarat fatwa DSN-MUI otomatis.",
            action: "Validasi Kaidah",
            icon: Scale,
          },
          {
            href: "/documents/generator",
            stage: "TAHAP 4",
            title: "Automated Contract Generation",
            desc: "Penyusunan naskah hukum perjanjian akad siap cetak & ekspor.",
            action: "Buka Generator",
            icon: FileCode2,
          },
          {
            href: "/approvals",
            stage: "TAHAP 5",
            title: "Integrated Digital Approval",
            desc: "Alur persetujuan berjenjang: Legal → Compliance → DPS → Direksi.",
            action: "Alur Persetujuan",
            icon: CheckCheck,
          },
          {
            href: "/contracts",
            stage: "TAHAP 6",
            title: "Centralized Contract Monitoring",
            desc: "Sentralisasi pemantauan status akad, dokumen, dan portofolio.",
            action: "Monitor Kontrak",
            icon: TrendingUp,
          },
        ];
    }
  }, [role]);

  // Action: FO submits application to Legal
  const handleFOSubmit = async (item: WorkflowItem) => {
    try {
      await fetch(`/api/v1/applications/${item.id}`, {
        method: "POST",
        headers: { "x-user-name": fullName },
      });
    } catch (e) {
      console.warn("API sync fallback:", e);
    }

    const updated = storeData.items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          currentStage: "LEGAL" as const,
          status: "LEGAL_REVIEW" as const,
          statusLabel: "Menunggu Telaah Legal",
          hasBast: true,
          steps: i.steps.map((s, idx) => (idx === 0 ? { ...s, status: "COMPLETED" as const, actionDate: "Baru saja", comments: formNotes || "BAST dan harga perolehan lengkap diverifikasi FO." } : idx === 1 ? { ...s, status: "CURRENT" as const } : s)),
        };
      }
      return i;
    });

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("id-ID") + " WIB",
      action: "FO_SUBMITTED_TO_LEGAL",
      actor: fullName,
      role: role,
      entity: item.contractNumber,
      ipAddress: "192.168.1.55",
      details: `BAST kepemilikan bank diverifikasi. Draf diajukan ke Legal Officer. Catatan: ${formNotes || "Lengkap"}`,
      sha256: "9a8b7c" + Math.random().toString(16).substring(2, 8),
    };

    const nextData = { ...storeData, items: updated, auditLogs: [newLog, ...storeData.auditLogs] };
    setStoreData(nextData);
    saveStoredData(nextData);
    setActiveModal({ type: null });
    showToast(`✓ Berhasil: ${item.contractNumber} diteruskan ke Legal Officer.`);
  };

  // Action: Legal Officer approves clause
  const handleLegalApprove = async (item: WorkflowItem) => {
    try {
      await fetch(`/api/v1/applications/${item.id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleCode: "LEGAL_OFFICER",
          actorName: fullName,
          action: "APPROVE",
          comments: formNotes || "Klausul hukum dan pengikatan agunan sah.",
        }),
      });
    } catch (e) {
      console.warn("API sync fallback:", e);
    }

    const updated = storeData.items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          currentStage: "COMPLIANCE" as const,
          status: "COMPLIANCE_REVIEW" as const,
          statusLabel: "Menunggu Kepatuhan OJK",
          hasWadSeparation: true,
          steps: i.steps.map((s, idx) => (idx === 1 ? { ...s, status: "COMPLETED" as const, actionDate: "Baru saja", comments: formNotes || "Klausul hukum, akta Wa'd terpisah & agunan sah." } : idx === 2 ? { ...s, status: "CURRENT" as const } : s)),
        };
      }
      return i;
    });

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("id-ID") + " WIB",
      action: "LEGAL_APPROVED",
      actor: fullName,
      role: role,
      entity: item.contractNumber,
      ipAddress: "192.168.1.60",
      details: `Klausul hukum dan pengikatan agunan disetujui. Diteruskan ke Compliance Officer. Catatan: ${formNotes || "Klausul valid"}`,
      sha256: "4b5c6d" + Math.random().toString(16).substring(2, 8),
    };

    const nextData = { ...storeData, items: updated, auditLogs: [newLog, ...storeData.auditLogs] };
    setStoreData(nextData);
    saveStoredData(nextData);
    setActiveModal({ type: null });
    showToast(`✓ Berhasil: ${item.contractNumber} disetujui Legal & diteruskan ke Compliance.`);
  };

  // Action: Compliance Officer certifies POJK & BMPD
  const handleComplianceApprove = async (item: WorkflowItem) => {
    try {
      await fetch(`/api/v1/applications/${item.id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleCode: "COMPLIANCE_OFFICER",
          actorName: fullName,
          action: "APPROVE",
          comments: formNotes || "Rasio BMPD 12.8% aman, skrining APU-PPT lolos.",
        }),
      });
    } catch (e) {
      console.warn("API sync fallback:", e);
    }

    const updated = storeData.items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          currentStage: "DPS" as const,
          status: "DPS_REVIEW" as const,
          statusLabel: "Menunggu Opini DPS",
          amlStatus: "CLEARED" as const,
          steps: i.steps.map((s, idx) => (idx === 2 ? { ...s, status: "COMPLETED" as const, actionDate: "Baru saja", comments: formNotes || "Skrining APU-PPT lolos. BMPD 12.8% aman." } : idx === 3 ? { ...s, status: "CURRENT" as const } : s)),
        };
      }
      return i;
    });

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("id-ID") + " WIB",
      action: "COMPLIANCE_CERTIFIED",
      actor: fullName,
      role: role,
      entity: item.contractNumber,
      ipAddress: "192.168.1.72",
      details: `Uji kehati-hatian BMPD & skrining DTTOT selesai. Diteruskan ke Dewan Pengawas Syariah.`,
      sha256: "7e8f9a" + Math.random().toString(16).substring(2, 8),
    };

    const nextData = { ...storeData, items: updated, auditLogs: [newLog, ...storeData.auditLogs] };
    setStoreData(nextData);
    saveStoredData(nextData);
    setActiveModal({ type: null });
    showToast(`✓ Berhasil: ${item.contractNumber} disertifikasi Compliance & diteruskan ke DPS.`);
  };

  // Action: Sharia Reviewer / DPS approves Fatwa
  const handleDpsApprove = async (item: WorkflowItem) => {
    try {
      await fetch(`/api/v1/applications/${item.id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleCode: "SHARIA_REVIEWER",
          actorName: fullName,
          action: "APPROVE",
          comments: formNotes || "Sertifikat Opini Kepatuhan Syariah diterbitkan DPS.",
        }),
      });
    } catch (e) {
      console.warn("API sync fallback:", e);
    }

    const updated = storeData.items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          currentStage: "MANAGEMENT" as const,
          status: "MANAGEMENT_REVIEW" as const,
          statusLabel: "Menunggu Komite Pembiayaan",
          shariaScore: 99.4,
          dpsOpinionNotes: formNotes || "Lolos Fatwa DSN-MUI & AAOIFI. Akad sah terbebas dari riba, gharar, dan maysir.",
          steps: i.steps.map((s, idx) => (idx === 3 ? { ...s, status: "COMPLETED" as const, actionDate: "Baru saja", comments: formNotes || "Sertifikat Opini Kepatuhan Syariah diterbitkan DPS." } : idx === 4 ? { ...s, status: "CURRENT" as const } : s)),
        };
      }
      return i;
    });

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("id-ID") + " WIB",
      action: "SHARIA_CERTIFIED",
      actor: fullName,
      role: role,
      entity: item.contractNumber,
      ipAddress: "192.168.1.80",
      details: `Sertifikasi Fatwa DSN-MUI diterbitkan oleh DPS. Diteruskan ke Komite Pembiayaan Direksi.`,
      sha256: "1a2b3c" + Math.random().toString(16).substring(2, 8),
    };

    const nextData = { ...storeData, items: updated, auditLogs: [newLog, ...storeData.auditLogs] };
    setStoreData(nextData);
    saveStoredData(nextData);
    setActiveModal({ type: null });
    showToast(`✓ Berhasil: Opini Syariah DPS diterbitkan. Akad diteruskan ke Direksi.`);
  };

  // Action: Management / Direksi issues final approval
  const handleMgmtApprove = async (item: WorkflowItem) => {
    try {
      await fetch(`/api/v1/applications/${item.id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleCode: "MANAGEMENT",
          actorName: fullName,
          action: "APPROVE",
          comments: formNotes || "Persetujuan Komite Pembiayaan Direksi disahkan.",
        }),
      });
    } catch (e) {
      console.warn("API sync fallback:", e);
    }
    const updated = storeData.items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          currentStage: "EXECUTED" as const,
          status: "ACTIVE" as const,
          statusLabel: "Aktif Terverifikasi",
          managementNotes: formNotes || "Plafon pembiayaan disetujui Komite Pembiayaan Direksi.",
          steps: i.steps.map((s, idx) => (idx === 4 ? { ...s, status: "COMPLETED" as const, actionDate: "Baru saja", comments: formNotes || "Otorisasi Komite Pembiayaan Direksi disahkan." } : idx === 5 ? { ...s, status: "COMPLETED" as const, actionDate: "Baru saja", comments: "Akad sah & efektif mengikat para pihak." } : s)),
        };
      }
      return i;
    });

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("id-ID") + " WIB",
      action: "EXECUTIVE_APPROVAL",
      actor: fullName,
      role: role,
      entity: item.contractNumber,
      ipAddress: "192.168.1.10",
      details: `Persetujuan Komite Pembiayaan Direksi disahkan. Akad kini AKTIF dan mengikat para pihak.`,
      sha256: "3d4e5f" + Math.random().toString(16).substring(2, 8),
    };

    const nextData = { ...storeData, items: updated, auditLogs: [newLog, ...storeData.auditLogs] };
    setStoreData(nextData);
    saveStoredData(nextData);
    setActiveModal({ type: null });
    showToast(`✓ Berhasil: ${item.contractNumber} disahkan Komite Direksi dan berstatus AKTIF.`);
  };

  const handleRequestRevision = async (
    item: WorkflowItem,
    roleCode: "LEGAL_OFFICER" | "COMPLIANCE_OFFICER" | "SHARIA_REVIEWER"
  ) => {
    try {
      await fetch(`/api/v1/applications/${item.id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleCode,
          actorName: fullName,
          action: "REQUEST_REVISION",
          comments: formNotes || "Perlu perbaikan kelengkapan berkas dokumen.",
        }),
      });
    } catch (e) {
      console.warn("API sync fallback:", e);
    }
    const updated = storeData.items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          currentStage: "FO" as const,
          status: "REVISION_REQUESTED" as const,
          statusLabel: `Revisi Diminta oleh ${roleCode}`,
          notes: formNotes || "Perlu revisi berkas.",
        };
      }
      return i;
    });
    const nextData = { ...storeData, items: updated };
    setStoreData(nextData);
    saveStoredData(nextData);
    setActiveModal({ type: null });
    showToast(`Permintaan revisi dikirimkan ke Financing Officer.`);
  };

  // Reset demo store
  const handleResetDemo = async () => {
    if (confirm("Reset seluruh data workflow & jejak audit ke data awal demonstrasi?")) {
      try {
        await fetch("/api/v1/demo/reset", { method: "POST" });
      } catch (e) {
        console.warn("API reset fallback:", e);
      }
      localStorage.removeItem("sce_workflow_store_v2");
      const defaultData = loadStoredData();
      setStoreData(defaultData);
      showToast("Data demo telah direset ke kondisi awal.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-[#16A36A] text-white text-xs font-bold shadow-lg flex items-center justify-between animate-in slide-in-from-top-2">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. ROLE-SPECIFIC ENTERPRISE DESK BANNER */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#003366] via-[#004280] to-[#00549c] text-white shadow-xs border border-white/10 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-semibold text-slate-100 border border-white/15">
                <Building2 className="h-3.5 w-3.5 text-sky-300" />
                <span>{orgName}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-semibold text-slate-100 border border-white/15">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>{roleName}</span>
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md bg-sky-950/60 text-[10px] font-mono font-medium text-sky-200 border border-sky-800/40">
                DSN-MUI &amp; POJK No. 65
              </span>
            </div>

            {/* Tahap 3B.5: reset demo = aksi administratif (menuju API yang kini
                dijaga sesi & hanya SUPER_ADMIN / INSTITUTION_ADMIN). */}
            {(role === "INSTITUTION_ADMIN" || role === "SUPER_ADMIN") && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetDemo}
                className="h-7 text-[11px] font-semibold bg-white/10 text-slate-100 border-white/20 hover:bg-white/20 hover:text-white gap-1.5"
                title="Kembalikan semua akad & log ke kondisi awal demonstrasi"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Data Demo</span>
              </Button>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {role === "FINANCING_OFFICER" && "Meja Kerja Petugas Pembiayaan (FO) — Inisiasi & Draf Akad"}
              {role === "LEGAL_OFFICER" && "Meja Kerja Legal Officer — Telaah Klausul Hukum & Agunan"}
              {role === "COMPLIANCE_OFFICER" && "Meja Kerja Compliance Officer — Pengawasan Regulasi OJK & BMPD"}
              {role === "SHARIA_REVIEWER" && "Meja Kerja Dewan Pengawas Syariah (DPS) — Validasi Fatwa & Fiqh"}
              {role === "MANAGEMENT" && "Executive Command Center — Direksi & Komite Pembiayaan"}
              {role === "AUDITOR" && "Portal Pengawasan Audit — Audit Kepatuhan & Keuangan Syariah"}
              {role === "INSTITUTION_ADMIN" && "Panel Administrasi Institusi — Tata Kelola Staf & Tenant"}
              {role === "SUPER_ADMIN" && "Pusat Kendali Master Platform — Ekosistem Multi-Tenant SaaS"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-200/90 max-w-3xl leading-relaxed mt-1">
              Petugas: <strong>{fullName}</strong> •{" "}
              {role === "FINANCING_OFFICER" && "Kelola pengajuan nasabah baru, hitung marjin/ujrah, dan verifikasi bukti kepemilikan barang (Milkiyyah & Qabd)."}
              {role === "LEGAL_OFFICER" && "Validasi keabsahan perikatan hukum, periksa pengikatan agunan, pisahkan akta Wa'd IMBT, dan tinjau yurisdiksi Basyarnas."}
              {role === "COMPLIANCE_OFFICER" && "Pantau kepatuhan POJK, regulasi Bank Indonesia, batasan BMPD pihak terkait, dan skrining APU-PPT (AML/CFT)."}
              {role === "SHARIA_REVIEWER" && "Awasi kepatuhan Fatwa DSN-MUI & AAOIFI, cegah potensi riba/gharar, berikan catatan fiqh muamalah, dan otorisasi override."}
              {role === "MANAGEMENT" && "Pantau portofolio pembiayaan total, setujui pengajuan limit plafon komite (> Rp 500 Jt), dan tinjau yield imbal hasil."}
              {role === "AUDITOR" && "Mode inspeksi independen read-only: pengujian jejak audit tamper-evident, verifikasi hash SHA-256 dokumen, dan uji petik akad."}
              {role === "INSTITUTION_ADMIN" && "Konfigurasi akun staf & izin RBAC, kelola kuota langganan SaaS, cabang operasional, dan integrasi API Core Banking."}
              {role === "SUPER_ADMIN" && "Pusat kendali master platform: verifikasi registrasi lembaga keuangan baru, metrik MRR/ARR, dan pustaka global fatwa DSN."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. ENAM SOLUSI INTI SHARIA CONTRACT ENGINE (SCE PIPELINE HUB & ROLE WORKSPACE) */}
      <Card className="border border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <CardHeader className="py-3.5 px-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00549c]" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Enam Solusi Inti Sharia Contract Engine (SCE)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Alur bisnis terpadu 6 tahap: Rekomendasi Akad → Akad Matching → Validasi Syariah → Pembuatan Kontrak → Persetujuan Digital → Monitoring Kontrak.
              </CardDescription>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#DCEAF5] text-[#00549c] font-mono text-[10px] font-bold">
              <CheckCircle2 className="h-3 w-3 text-[#16A36A]" />
              Siklus 6 Tahap Terintegrasi
            </span>
          </div>
        </CardHeader>

        {/* 2A. Complete 6-Stage Business Lifecycle Pipeline (Highlights Active Role's Scope) */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Siklus Hidup Kontrak &amp; Pembagian Tanggung Jawab:
            </span>
            <span className="text-[11px] text-slate-500">
              Tahap wewenang peran <strong className="text-[#00549c]">{roleName}</strong> disorot warna biru
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { num: 1, name: "Rekomendasi Akad", actor: "FO, DPS" },
              { num: 2, name: "Akad Matching", actor: "FO, Legal, DPS" },
              { num: 3, name: "Validasi Syariah", actor: "FO, Legal, Comp, DPS" },
              { num: 4, name: "Pembuatan Kontrak", actor: "FO, Legal" },
              { num: 5, name: "Persetujuan Digital", actor: "Legal, Comp, DPS, Dir" },
              { num: 6, name: "Monitoring Kontrak", actor: "Semua Peran" },
            ].map((stage) => {
              const isMine = isStageResponsible(stage.num);
              return (
                <div
                  key={stage.num}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    isMine
                      ? "bg-white border-[#00549c]/40 shadow-xs ring-1 ring-[#00549c]/20"
                      : "bg-slate-100/60 border-slate-200/70 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                        isMine
                          ? "bg-[#00549c] text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {stage.num}
                    </span>
                    {isMine ? (
                      <span className="text-[9px] font-bold text-[#00549c] bg-[#DCEAF5] px-1.5 py-0.5 rounded font-mono">
                        Wewenang
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-400">
                        {stage.actor}
                      </span>
                    )}
                  </div>
                  <p className={`font-semibold text-[11px] truncate ${isMine ? "text-slate-900" : "text-slate-600"}`}>
                    {stage.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2B. Role-Tailored Workspace Cards */}
        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Ruang Kerja &amp; Modul Utama ({roleName})
            </h3>
            <span className="text-[11px] text-slate-500">
              Menampilkan {roleWorkspaceCards.length} modul sesuai hak akses &amp; tanggung jawab aktif
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
            {roleWorkspaceCards.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <Link
                  key={idx}
                  href={card.href}
                  className="group p-3 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-[#00549c] hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-md bg-[#DCEAF5] text-[#00549c] flex items-center justify-center group-hover:bg-[#00549c] group-hover:text-white transition-colors">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                        {card.stage}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-[#00549c] transition-colors leading-snug">
                        {card.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#00549c] pt-2.5 mt-2 border-t border-slate-200/60">
                    <span>{card.action}</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 3. ROLE-SPECIFIC METRIC CARDS (4 KPIS PER ROLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === "FINANCING_OFFICER" && (
          <>
            <MetricCard
              title="Draf Akad Berjalan"
              value={`${storeData.items.filter((i) => i.currentStage === "FO" || i.status === "DRAFT").length} Akad`}
              subValue="Sedang diproses FO"
              icon={FileText}
              trend={{ direction: "up", value: "+12.5%" }}
            />
            <MetricCard
              title="Menunggu BAST / Faktur"
              value="5 Pengajuan"
              subValue="Butuh bukti fisik kepemilikan"
              icon={Clock}
              trend={{ direction: "neutral", value: "0%" }}
            />
            <MetricCard
              title="Rata-rata Waktu Draf"
              value="14 Menit"
              subValue="SLA target < 30 menit"
              icon={CheckCircle2}
              trend={{ direction: "up", value: "+45.0%" }}
            />
            <MetricCard
              title="Target Penyaluran Bulan Ini"
              value="Rp 4,5 Miliar"
              subValue="75% dari target Rp 6,0 M"
              icon={TrendingUp}
              trend={{ direction: "up", value: "+8.2%" }}
            />
          </>
        )}

        {role === "LEGAL_OFFICER" && (
          <>
            <MetricCard
              title="Menunggu Telaah Legal"
              value={`${storeData.items.filter((i) => i.currentStage === "LEGAL").length} Dokumen`}
              subValue="Antrean telaah pasal & klausul"
              icon={FileText}
              trend={{ direction: "neutral", value: "0%" }}
            />
            <MetricCard
              title="Revisi Draf Versi (v1.1+)"
              value="4 Dokumen"
              subValue="Penyesuaian klausul khusus"
              icon={FileCode2}
              trend={{ direction: "down", value: "-10.0%" }}
            />
            <MetricCard
              title="Verifikasi Agunan / Jaminan"
              value="16 Pengikatan"
              subValue="APHT / SKMHT / FEO tervalidasi"
              icon={ShieldCheck}
              trend={{ direction: "up", value: "+14.0%" }}
            />
            <MetricCard
              title="Mitigasi Risiko Sengketa"
              value="100% Zero Defect"
              subValue="Klausul Basyarnas terpasang"
              icon={Scale}
              trend={{ direction: "up", value: "+5.0%" }}
            />
          </>
        )}

        {role === "COMPLIANCE_OFFICER" && (
          <>
            <MetricCard
              title="Indeks Kepatuhan POJK"
              value="99.4%"
              subValue="Rating Komposit 1 (Sangat Baik)"
              icon={ShieldCheck}
              trend={{ direction: "up", value: "+0.8%" }}
            />
            <MetricCard
              title="Skrining AML/CFT & PEP"
              value="142 Nasabah"
              subValue="100% lolos verifikasi DTTOT"
              icon={UserCheck}
              trend={{ direction: "up", value: "+100%" }}
            />
            <MetricCard
              title="Batas BMPD Terpakai"
              value="14.2%"
              subValue="Maksimal 20% modal inti"
              icon={Scale}
              trend={{ direction: "down", value: "-2.1%" }}
            />
            <MetricCard
              title="Kesiapan Laporan OJK"
              value="100% Siap Kirim"
              subValue="Pelaporan triwulan tata kelola"
              icon={FileCheck2}
              trend={{ direction: "up", value: "+100%" }}
            />
          </>
        )}

        {role === "SHARIA_REVIEWER" && (
          <>
            <MetricCard
              title="Tingkat Kepatuhan Fatwa"
              value="98.4%"
              subValue="Bebas potensi cacat akad"
              icon={Scale}
              trend={{ direction: "up", value: "+2.4%" }}
            />
            <MetricCard
              title="Antrean Review Fatwa DPS"
              value={`${storeData.items.filter((i) => i.currentStage === "DPS").length} Akad`}
              subValue="Butuh fatwa & opini tertulis"
              icon={Clock}
              trend={{ direction: "neutral", value: "0%" }}
            />
            <MetricCard
              title="Potensi Cacat Tercegah"
              value="14 Transaksi"
              subValue="Zero-Riba & Milkiyyah enforced"
              icon={ShieldCheck}
              trend={{ direction: "up", value: "+20.0%" }}
            />
            <MetricCard
              title="Override Fatwa Terbit"
              value="2 Otorisasi"
              subValue="Didukung alasan fiqh resmi"
              icon={Sparkles}
              trend={{ direction: "neutral", value: "0%" }}
            />
          </>
        )}

        {role === "MANAGEMENT" && (
          <>
            <MetricCard
              title="Total Portofolio Aktif"
              value="Rp 28,45 M"
              subValue="142 Kontrak pembiayaan aktif"
              icon={TrendingUp}
              trend={{ direction: "up", value: "+18.2%" }}
            />
            <MetricCard
              title="Proyeksi Net Margin Yield"
              value="13.8% p.a."
              subValue="Di atas rata-rata industri syariah"
              icon={CheckCircle2}
              trend={{ direction: "up", value: "+1.5%" }}
            />
            <MetricCard
              title="Komite Pembiayaan Menunggu"
              value={`${storeData.items.filter((i) => i.currentStage === "MANAGEMENT").length} Pengajuan`}
              subValue="Plafon besar (> Rp 500 Juta)"
              icon={Clock}
              trend={{ direction: "neutral", value: "0%" }}
            />
            <MetricCard
              title="Rasio NPF Gross"
              value="0.72%"
              subValue="Kolektibilitas sangat sehat"
              icon={ShieldCheck}
              trend={{ direction: "down", value: "-0.15%" }}
            />
          </>
        )}

        {role === "AUDITOR" && (
          <>
            <MetricCard
              title="Total Log Jejak Audit"
              value={`${storeData.auditLogs.length} Event`}
              subValue="Append-only tamper-evident"
              icon={Database}
              trend={{ direction: "up", value: "+15.0%" }}
            />
            <MetricCard
              title="Integritas Hash SHA-256"
              value="100% Sah"
              subValue="Zero dokumen termanipulasi"
              icon={ShieldCheck}
              trend={{ direction: "up", value: "+100%" }}
            />
            <MetricCard
              title="Sampel Uji Petik Fiqh"
              value={`${storeData.items.length} Akad`}
              subValue="Verifikasi bukti transaksi riil"
              icon={FileText}
              trend={{ direction: "up", value: "+25.0%" }}
            />
            <MetricCard
              title="Temuan Cacat Syariah"
              value="0 Kasus"
              subValue="Lolos kriteria audit syariah"
              icon={CheckCheck}
              trend={{ direction: "down", value: "-100%" }}
            />
          </>
        )}

        {role === "INSTITUTION_ADMIN" && (
          <>
            <MetricCard
              title="Staf Pengguna Aktif"
              value={`${storeData.staff.length} Akun`}
              subValue="Terbagi dalam 8 peran RBAC"
              icon={Users2}
              trend={{ direction: "up", value: "+8.0%" }}
            />
            <MetricCard
              title="Kuota Kontrak Terpakai"
              value="142 / 300"
              subValue="Paket Professional (47.3%)"
              icon={CreditCard}
              trend={{ direction: "up", value: "+14.2%" }}
            />
            <MetricCard
              title="Cabang & Unit Kerja"
              value="4 Kantor"
              subValue="Semua unit operasional online"
              icon={Building2}
              trend={{ direction: "neutral", value: "0%" }}
            />
            <MetricCard
              title="Core Banking System (CBS)"
              value="Tersambung"
              subValue="API Gateway Sinkron Real-Time"
              icon={CheckCircle2}
              trend={{ direction: "up", value: "+100%" }}
            />
          </>
        )}

        {role === "SUPER_ADMIN" && (
          <>
            <MetricCard
              title="Total Lembaga Terdaftar"
              value={`${storeData.tenants.length} Institusi`}
              subValue="BUS, UUS, BPRS & KSPPS"
              icon={Building2}
              trend={{ direction: "up", value: "+33.3%" }}
            />
            <MetricCard
              title="Monthly Recurring Revenue"
              value="Rp 38,8 Jt"
              subValue="ARR Proyeksi Rp 465,6 Jt"
              icon={TrendingUp}
              trend={{ direction: "up", value: "+22.5%" }}
            />
            <MetricCard
              title="Onboarding Menunggu Review"
              value={`${storeData.tenants.filter((t) => t.status === "PENDING_REVIEW").length} Lembaga`}
              subValue="Verifikasi izin OJK & direksi"
              icon={Clock}
              trend={{ direction: "neutral", value: "0%" }}
            />
            <MetricCard
              title="SLA Uptime Platform"
              value="99.98%"
              subValue="Server global beroperasi optimal"
              icon={ShieldCheck}
              trend={{ direction: "up", value: "+0.05%" }}
            />
          </>
        )}
      </div>

      {/* 3. PRIMARY INTERACTIVE WORKSPACE QUEUE TABLE FOR THIS ROLE */}
      <Card className="border border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#00549c]" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  {role === "FINANCING_OFFICER" && "Antrean Pengajuan Pembiayaan & Verifikasi Berkas (FO)"}
                  {role === "LEGAL_OFFICER" && "Antrean Telaah Klausul Hukum & Pengikatan Agunan (Legal)"}
                  {role === "COMPLIANCE_OFFICER" && "Antrean Pengawasan Kepatuhan POJK & Skrining AML/CFT"}
                  {role === "SHARIA_REVIEWER" && "Antrean Telaah Fatwa Dewan Pengawas Syariah (DPS)"}
                  {role === "MANAGEMENT" && "Antrean Persetujuan Komite Pembiayaan Direksi"}
                  {role === "AUDITOR" && "Jejak Audit Tamper-Evident & Riwayat Mutasi (Read-Only)"}
                  {role === "INSTITUTION_ADMIN" && "Direktori Staf Institusi & Manajemen Akun RBAC"}
                  {role === "SUPER_ADMIN" && "Direktori Lembaga Finansial Multi-Tenant Terdaftar"}
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {role === "FINANCING_OFFICER" && "Kelola pengajuan nasabah baru, verifikasi kepemilikan bank (Milkiyyah), dan ajukan draf ke Legal."}
                {role === "LEGAL_OFFICER" && "Telaah pasal perikatan, pastikan pemisahan akta Wa'd IMBT, dan setujui draf kontrak hukum."}
                {role === "COMPLIANCE_OFFICER" && "Sertifikasi batas penyaluran dana (BMPD) dan verifikasi skrining APU-PPT."}
                {role === "SHARIA_REVIEWER" && "Uji rukun & syarat sah Fatwa DSN-MUI dan terbitkan sertifikasi opini kepatuhan syariah."}
                {role === "MANAGEMENT" && "Otorisasi komite pembiayaan untuk pengajuan limit plafon strategis bank."}
                {role === "AUDITOR" && "Inspeksi kriptografis SHA-256 terhadap setiap mutasi status kontrak dan override fatwa."}
                {role === "INSTITUTION_ADMIN" && "Konfigurasi akun staf operasional, peran, dan kuota pembiayaan cabang."}
                {role === "SUPER_ADMIN" && "Verifikasi izin operasional OJK perbankan syariah baru dan aktifkan tenant."}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-[#00549c] bg-[#DCEAF5]/60 px-2.5 py-1 rounded border border-[#00549c]/20">
                {roleItems.length} Data Tersedia
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Nomor Akad / Entitas</th>
                  <th className="p-3.5">Nasabah / Lembaga</th>
                  <th className="p-3.5">Jenis Akad</th>
                  <th className="p-3.5">Nilai Plafon</th>
                  <th className="p-3.5">Tahap Alur Kerja</th>
                  <th className="p-3.5">Status Kepatuhan</th>
                  <th className="p-3.5 pr-5 text-right">Tindakan Langsung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {roleItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-[#00549c]">
                      {item.contractNumber}
                      <p className="text-[10px] text-slate-500 font-normal font-sans mt-0.5 line-clamp-1">{item.title}</p>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      {item.customer}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={item.akad === "MURABAHAH" ? "info" : item.akad === "IJARAH" ? "secondary" : item.akad === "MUSYARAKAH" ? "primary" : "neutral"}>
                        {item.akad}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono tabular-nums font-semibold text-slate-900">
                      {formatIDR(item.amount)}
                      <p className="text-[10px] text-slate-500 font-normal">{item.marginOrNisbah}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-900">{item.statusLabel}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Versi {item.documentVersion}</p>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                        <span className="font-bold text-emerald-700 font-mono tabular-nums">{item.shariaScore}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">SHA-256 Valid</p>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      {/* ROLE-SPECIFIC ACTION TRIGGER BUTTON */}
                      {role === "FINANCING_OFFICER" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setFormNotes("");
                            setActiveModal({ type: "FO_SUBMIT", item });
                          }}
                          className="h-8 text-xs font-bold bg-[#00549c] hover:bg-[#00427c] text-white"
                        >
                          Verifikasi & Ajukan
                        </Button>
                      )}

                      {role === "LEGAL_OFFICER" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setFormNotes("");
                            setActiveModal({ type: "LEGAL_REVIEW", item });
                          }}
                          className="h-8 text-xs font-bold bg-[#00549c] hover:bg-[#00427c] text-white"
                        >
                          Telaah Klausul
                        </Button>
                      )}

                      {role === "COMPLIANCE_OFFICER" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setFormNotes("");
                            setActiveModal({ type: "COMPLIANCE_CHECK", item });
                          }}
                          className="h-8 text-xs font-bold bg-[#00549c] hover:bg-[#00427c] text-white"
                        >
                          Uji Kepatuhan
                        </Button>
                      )}

                      {role === "SHARIA_REVIEWER" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setFormNotes("");
                            setActiveModal({ type: "DPS_OPINION", item });
                          }}
                          className="h-8 text-xs font-bold bg-[#00549c] hover:bg-[#00427c] text-white"
                        >
                          Sertifikasi Fatwa
                        </Button>
                      )}

                      {role === "MANAGEMENT" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setFormNotes("");
                            setActiveModal({ type: "MGMT_APPROVE", item });
                          }}
                          className="h-8 text-xs font-bold bg-[#00549c] hover:bg-[#00427c] text-white"
                        >
                          Keputusan Komite
                        </Button>
                      )}

                      {role === "AUDITOR" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveModal({ type: "AUDIT_VERIFY", item })}
                          className="h-8 text-xs font-semibold text-[#00549c] border-[#00549c]/30"
                        >
                          Inspeksi Hash
                        </Button>
                      )}

                      {(role === "INSTITUTION_ADMIN" || role === "SUPER_ADMIN") && (
                        <Link href="/contracts">
                          <Button size="sm" variant="outline" className="h-8 text-xs text-[#00549c]">
                            Kelola Akad
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. MODALS FOR ROLE ACTIONS (PERSISTENT & INTERACTIVE) */}

      {/* MODAL 1: FINANCING OFFICER (FO) VERIFICATION & SUBMIT */}
      {activeModal.type === "FO_SUBMIT" && activeModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#00549c]" />
                <h3 className="font-bold text-sm text-[#172B4D]">Verifikasi Berkas & Ajukan ke Legal</h3>
              </div>
              <button onClick={() => setActiveModal({ type: null })} className="text-[#64748B] hover:text-[#172B4D]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] text-xs space-y-1">
              <p>Nomor Akad: <strong>{activeModal.item.contractNumber}</strong></p>
              <p>Nasabah: <strong>{activeModal.item.customer}</strong></p>
              <p>Plafon: <strong>{formatIDR(activeModal.item.amount)}</strong> ({activeModal.item.akad})</p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formChecked}
                  onChange={(e) => setFormChecked(e.target.checked)}
                  className="rounded text-[#00549c]"
                />
                <span className="font-semibold text-[#172B4D]">
                  Bukti Kepemilikan Barang (BAST & Faktur Vendor) telah lengkap diverifikasi (*Milkiyyah & Qabd*).
                </span>
              </label>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Catatan Petugas Pembiayaan (FO):</label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#00549c]/20 outline-none"
                  rows={3}
                  placeholder="Contoh: Dokumen kepemilikan aset dan kalkulasi marjin telah tervalidasi sesuai ketentuan perbankan."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setActiveModal({ type: null })}>
                Batal
              </Button>
              <Button
                size="sm"
                disabled={!formChecked}
                onClick={() => handleFOSubmit(activeModal.item!)}
                className="bg-[#00549c] hover:bg-[#00427c] text-white font-bold"
              >
                Kirim ke Legal Officer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LEGAL OFFICER REVIEW */}
      {activeModal.type === "LEGAL_REVIEW" && activeModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-[#00549c]" />
                <h3 className="font-bold text-sm text-[#172B4D]">Telaah Klausul Legal & Pengikatan Agunan</h3>
              </div>
              <button onClick={() => setActiveModal({ type: null })} className="text-[#64748B] hover:text-[#172B4D]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#E2E8F0] text-xs space-y-1">
              <p>Akad: <strong>{activeModal.item.contractNumber}</strong> • {activeModal.item.customer}</p>
              <p>Nilai Pembiayaan: <strong>{formatIDR(activeModal.item.amount)}</strong></p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#DCEAF5]/40 border border-[#00549c]/20 space-y-1.5 text-[11px] text-[#00549c]">
                <p className="font-bold">✓ Pemisahan Akta Janji Wa&apos;d (Fatwa No. 27):</p>
                <p>Dokumen perjanjian sewa dan akta wa&apos;d pemindahan hak milik dipisahkan secara sah.</p>
                <p className="font-bold pt-1">✓ Yurisdiksi Sengketa Basyarnas:</p>
                <p>Klausul arbitrase syariah (Basyarnas) telah dimasukkan ke pasal penyelesaian sengketa.</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Catatan Telaah Legal Counsel:</label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#00549c]/20 outline-none"
                  rows={3}
                  placeholder="Klausul perikatan telah ditelaah. Pengikatan hak tanggungan APHT telah siap diproses notaris rekanan."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setActiveModal({ type: null })}>
                Batal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRequestRevision(activeModal.item!, "LEGAL_OFFICER")}
                className="text-[#D97706] border-[#D97706]/40 hover:bg-[#FEF3C7]"
              >
                Minta Revisi ke FO
              </Button>
              <Button
                size="sm"
                onClick={() => handleLegalApprove(activeModal.item!)}
                className="bg-[#00549c] hover:bg-[#00427c] text-white font-bold"
              >
                Setujui Klausul Legal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: COMPLIANCE OFFICER CHECK */}
      {activeModal.type === "COMPLIANCE_CHECK" && activeModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#00549c]" />
                <h3 className="font-bold text-sm text-[#172B4D]">Uji Kepatuhan POJK & Skrining AML/CFT</h3>
              </div>
              <button onClick={() => setActiveModal({ type: null })} className="text-[#64748B] hover:text-[#172B4D]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0]">
                  <p className="text-[10px] text-[#64748B]">Skrining APU-PPT & PEP</p>
                  <p className="text-sm font-bold text-[#16A36A]">✓ 100% Lolos Bersih</p>
                </div>
                <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0]">
                  <p className="text-[10px] text-[#64748B]">Rasio BMPD Terhadap Modal</p>
                  <p className="text-sm font-bold text-[#00549c]">{activeModal.item.bmpdRatio}% (Batas 20%)</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Catatan Verifikasi Kepatuhan:</label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#00549c]/20 outline-none"
                  rows={3}
                  placeholder="Uji kehati-hatian telah dilaksanakan. Nasabah bukan pihak terafiliasi bank dan eksposur memenuhi POJK No. 65."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setActiveModal({ type: null })}>
                Batal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRequestRevision(activeModal.item!, "COMPLIANCE_OFFICER")}
                className="text-[#D97706] border-[#D97706]/40 hover:bg-[#FEF3C7]"
              >
                Minta Revisi ke FO
              </Button>
              <Button
                size="sm"
                onClick={() => handleComplianceApprove(activeModal.item!)}
                className="bg-[#00549c] hover:bg-[#00427c] text-white font-bold"
              >
                Sertifikasi Kepatuhan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DEWAN PENGAWAS SYARIAH (DPS) OPINION */}
      {activeModal.type === "DPS_OPINION" && activeModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-[#00549c]" />
                <h3 className="font-bold text-sm text-[#172B4D]">Sertifikasi Opini Dewan Pengawas Syariah (DPS)</h3>
              </div>
              <button onClick={() => setActiveModal({ type: null })} className="text-[#64748B] hover:text-[#172B4D]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#DCEAF5]/50 rounded-lg border border-[#00549c]/25 space-y-1 text-[#00549c]">
                <p className="font-bold">Fatwa Rujukan: DSN-MUI No. 04, 09, 27, 111 & AAOIFI</p>
                <p className="text-[11px]">Akad dinyatakan terbebas dari Riba, Gharar, Maysir, dan Tadlis.</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#172B4D]">Diktum Opini Syariah DPS:</label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#00549c]/20 outline-none"
                  rows={3}
                  placeholder="Berdasarkan pemeriksaan rukun dan syarat sah, akad dinyatakan COMPLIANT terhadap prinsip syariah dan siap dieksekusi komite."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setActiveModal({ type: null })}>
                Batal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRequestRevision(activeModal.item!, "SHARIA_REVIEWER")}
                className="text-[#D97706] border-[#D97706]/40 hover:bg-[#FEF3C7]"
              >
                Minta Revisi ke FO
              </Button>
              <Button
                size="sm"
                onClick={() => handleDpsApprove(activeModal.item!)}
                className="bg-[#00549c] hover:bg-[#00427c] text-white font-bold"
              >
                Terbitkan Opini DPS
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: MANAGEMENT / DIREKSI APPROVAL */}
      {activeModal.type === "MGMT_APPROVE" && activeModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#16A36A]" />
                <h3 className="font-bold text-sm text-[#172B4D]">Persetujuan Komite Pembiayaan Direksi</h3>
              </div>
              <button onClick={() => setActiveModal({ type: null })} className="text-[#64748B] hover:text-[#172B4D]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#E2E8F0] text-xs space-y-1">
              <p>Penerima: <strong>{activeModal.item.customer}</strong></p>
              <p>Plafon: <strong>{formatIDR(activeModal.item.amount)}</strong> ({activeModal.item.tenorMonths} Bulan)</p>
              <p>Status Rekomendasi: <span className="font-bold text-[#16A36A]">Disetujui FO, Legal & DPS</span></p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-[#172B4D]">Catatan Komite Pembiayaan:</label>
              <textarea
                className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#00549c]/20 outline-none"
                rows={3}
                placeholder="Plafon pembiayaan disetujui. Syarat pencairan bertahap sesuai progres penyelesaian transaksi vendor."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setActiveModal({ type: null })}>
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => handleMgmtApprove(activeModal.item!)}
                className="bg-[#16A36A] hover:bg-[#128053] text-white font-bold"
              >
                Otorisasi & Sahkan Akad
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: AUDITOR INSPECTION MODAL */}
      {activeModal.type === "AUDIT_VERIFY" && activeModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#00549c]" />
                <h3 className="font-bold text-sm text-[#172B4D]">Inspeksi Kriptografis & Integritas Dokumen (SHA-256)</h3>
              </div>
              <button onClick={() => setActiveModal({ type: null })} className="text-[#64748B] hover:text-[#172B4D]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1 font-mono text-[11px]">
                <p className="text-[#64748B]">Document SHA-256 Checksum:</p>
                <p className="text-[#00549c] font-bold break-all">{activeModal.item.sha256Hash}</p>
                <p className="text-[#16A36A] font-bold pt-1">✓ Status: Hash Verified & Immutable</p>
              </div>

              <div className="space-y-1.5 text-xs text-[#172B4D]">
                <p>Nomor Akad: <strong>{activeModal.item.contractNumber}</strong></p>
                <p>Nasabah: <strong>{activeModal.item.customer}</strong></p>
                <p>Versi Terdaftar: <strong>{activeModal.item.documentVersion}</strong></p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <Button size="sm" onClick={() => setActiveModal({ type: null })} className="bg-[#00549c] text-white">
                Tutup Inspeksi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
