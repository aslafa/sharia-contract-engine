import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/enterprise/page-header";
import { FolderLock, FileText, Download, ShieldCheck, Plus, Sparkles, FileCode2 } from "lucide-react";

export default function DocumentsVaultPage() {
  const documents = [
    {
      id: "doc-1",
      name: "Akad_Murabahah_SCE-2026-MRB-00142_Signed.pdf",
      category: "SIGNED_CONTRACT",
      size: "1.4 MB",
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      date: "14 Nov 2026",
    },
    {
      id: "doc-2",
      name: "Surat_Janji_Waad_IMBT_2026_009.pdf",
      category: "WAAD_DOCUMENT",
      size: "820 KB",
      sha256: "5d41402abc4b2a76b9719d911017c592",
      date: "13 Nov 2026",
    },
    {
      id: "doc-3",
      name: "BAST_Serah_Terima_Mesin_CNC_Mazak.pdf",
      category: "BAST_PHYSICAL",
      size: "2.1 MB",
      sha256: "8f434346648f6b96df89dda901c5176b",
      date: "12 Nov 2026",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brankas Dokumen Kontrak (Secure Document Vault)"
        description="Penyimpanan dokumen terenkripsi dengan checksum SHA-256 anti-tamper untuk alat bukti hukum syariah dan perbankan."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Brankas Dokumen" },
        ]}
        actions={
          <Link href="/documents/generator">
            <Button size="sm" variant="primary" className="gap-1.5 font-bold shadow-sm">
              <FileCode2 className="h-4 w-4" />
              <span>Buka Contract Generator</span>
            </Button>
          </Link>
        }
      />

      {/* QUICK LAUNCH GENERATOR CARD */}
      <Card className="border border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-[#00549c]" />
              <h3 className="font-bold text-slate-900 text-sm">
                Penyusunan Perjanjian Pembiayaan Baru (Automated Contract Generator)
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Gunakan template legal syariah terstandarisasi DSN-MUI untuk menyusun draf akad Murabahah, Ijarah, Musyarakah, atau Mudharabah secara otomatis, rapi, dan siap cetak.
            </p>
          </div>

          <Link href="/documents/generator">
            <Button variant="primary" size="sm" className="font-bold shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Susun Draf Akad Baru
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FolderLock className="h-4 w-4 text-[#00549c]" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Arsip Dokumen Terenkripsi (Multi-Tenant Document Vault)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Penyimpanan dokumen legal perbankan syariah dengan verifikasi integritas hash kriptografis SHA-256.
              </CardDescription>
            </div>
            <Badge variant="success" className="font-mono text-[10px] w-fit">
              <ShieldCheck className="h-3 w-3 mr-1" />
              100% Hash Tamper-Evident
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-bold text-[10px]">
              <tr>
                <th className="px-5 py-3">Nama Berkas &amp; Dokumen</th>
                <th className="px-4 py-3">Kategori Dokumen</th>
                <th className="px-4 py-3">Integritas SHA-256</th>
                <th className="px-4 py-3">Ukuran &amp; Tanggal</th>
                <th className="px-5 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#DCEAF5] text-[#00549c] flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#172B4D]">{doc.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {doc.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 w-fit">
                      <ShieldCheck className="h-3 w-3" />
                      {doc.sha256.slice(0, 16)}...
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    <p className="font-mono text-[11px] text-slate-700 font-medium">{doc.size}</p>
                    <p className="text-[10px] text-slate-400">{doc.date}</p>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button size="sm" variant="outline" className="h-7 text-xs font-semibold gap-1.5 text-[#00549c] hover:bg-[#DCEAF5]/50">
                      <Download className="h-3 w-3" />
                      <span>Unduh PDF</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
