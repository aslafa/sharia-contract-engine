# Sharia Contract Engine (SCE) — Core Feature Integration Audit

## Fitur: Automated Contract Generation (`/documents/generator`)

### 1. Status Route & Frontend UI
- **Lokasi**: `src/app/(dashboard)/documents/generator/page.tsx`
- **Fungsi UI**: Antarmuka generator naskah hukum 4 akad (Murabahah, Ijarah, Musyarakah, Mudharabah) dengan live editor, tab pratinjau surat resmi, panel riwayat revisi, dan cetak/ekspor PDF.
- **Kondisi**: Berjalan di browser secara visual, namun seluruh field input (nama nasabah, NIB, plafon, marjin, tenor) masih diinisialisasi dengan data statis/hardcoded tanpa membaca query parameter (`searchParams`) atau memuat data dari aplikasi nyata di database.

### 2. Integrasi API & Backend
- **Endpoint Terkait**: `POST /api/v1/contracts`
- **Temuan**:
  - Tombol *"Simpan Draf Kontrak"* memanggil `POST /api/v1/contracts`, namun payload yang dikirim hanya metadata dasar (`akadCategory`, `title`, `customerName`, `objectDescription`, `nominalValue`, `tenorMonths`).
  - Naskah kontrak hukum yang diedit (`editableDocument`) **tidak dikirim atau disimpan** ke backend.
  - Di backend, `POST /api/v1/contracts` sebenarnya hanya memanggil `DBRepository.createApplication(...)`, bukan membuat record `DBContract` ataupun record `DBDocument`.

### 3. Penyimpanan Dokumen & Riwayat Versi
- **Penyimpanan Dokumen**: Belum ada endpoint penyimpanan fisik atau database untuk naskah dokumen yang dihasilkan generator (`data/uploads` atau `state.documents` di `data/sce_database.json`). Dokumen tidak otomatis muncul di Brankas Dokumen (`/documents`).
- **Riwayat Versi (Versioning)**: Array `versions` (`v1.0`, `v1.1`, dst.) hanya tersimpan di in-memory state komponen React (`useState`), sehingga seluruh riwayat revisi hilang saat halaman di-refresh.

### 4. Relasi Data & Workflow
- **Relasi dengan Permohonan/Kontrak**: Tidak ada mekanisme *pre-filling* dari data pengajuan pembiayaan yang telah disetujui DPS/Direksi (`applicationId` atau `contractId`).
- **Integrasi Approval**: Tombol *"Ajukan ke Alur Persetujuan"* hanya berupa tautan navigasi statis (`<Link href="/approvals">`), bukan mutasi workflow nyata untuk mendaftarkan dokumen ke antrean penelaahan.

### 5. Keamanan & RBAC
- **Frontend**: Telah menggunakan `useSession()` dan `ReadOnlyPanel` untuk membatasi tombol simpan hanya pada peran yang memiliki izin `contracts:create`.
- **Backend**: `POST /api/v1/contracts` telah terlindungi dengan `getAuthenticatedUser`, `assertPermission(session, "contracts:create")`, dan pengikatan tenant `session.organizationId`.
- **Celah**: Ketiadaan endpoint terisolasi khusus dokumen menyebabkan teks kontrak hasil generate belum memiliki verifikasi hash SHA-256 tersimpan di database.

---

## Fitur: Automated Sharia Validation & Dynamic Sharia Rule Engine (`/sharia-rules`)

### 1. Route `/sharia-rules` (UI & Simulasi Client-Side)
Halaman antarmuka menyediakan 3 tab (Katalog Aturan, Simulator Interaktif, dan Catatan Diskresi/Override DPS). Tab Simulator dan Override sepenuhnya berjalan secara *in-memory* di browser menggunakan React state (`useState`) tanpa melakukan pemanggilan API ke backend.

### 2. Engine Logika (`src/lib/sharia/engine.ts`)
Mengimplementasikan fungsi murni `ShariaRuleEngine.evaluate()` yang memfilter aturan berdasarkan kategori akad, mengevaluasi muatan (payload), menghitung pelanggaran kritis/peringatan, serta menghasilkan skor indeks (0-100) dan status (`COMPLIANT`, `NON_COMPLIANT`, `WARNING`). Tidak memiliki dependensi basis data atau I/O fisik.

### 3. Pustaka Aturan (`src/lib/sharia/rules-registry.ts`)
Seluruh aturan syariah (Murabahah, Ijarah, Musyarakah, Mudharabah, Global) didefinisikan secara statis dalam kode TypeScript lengkap dengan fungsi validator in-code dan referensi fatwa DSN-MUI. Aturan tidak dapat ditambah, disunting, atau dinonaktifkan secara dinamis oleh pengguna melalui database.

### 4. API Validasi Syariah (`/api/v1/sharia-engine/validate`)
Tersedia endpoint `POST /api/v1/sharia-engine/validate` yang menerima payload transaksi, memvalidasi schema dengan Zod, dan mengeksekusi `ShariaRuleEngine.evaluate()`, lalu mengembalikan objek laporan evaluasi (`ContractValidationReport`) dalam bentuk response JSON.

### 5. Ketiadaan Autentikasi & RBAC pada API Validasi
Endpoint `/api/v1/sharia-engine/validate` saat ini **tidak memiliki proteksi autentikasi** (`getAuthenticatedUser`), tidak memeriksa izin RBAC (`sharia:validate`), dan tidak menerapkan isolasi tenant (`assertTenantIsolation`). Endpoint ini dapat dipanggil secara anonim tanpa kredensial sesi.

### 6. Hasil Validasi Tidak Disimpan ke `data/sce_database.json`
Baik eksekusi simulator di halaman `/sharia-rules` maupun endpoint `/api/v1/sharia-engine/validate` tidak pernah menyimpan laporan evaluasi syariah ke dalam database. `data/sce_database.json` tidak memiliki tabel/koleksi untuk `shariaValidationReports` maupun `shariaOverrides`.

### 7. Terputus dari Pembuatan Aplikasi & Approval Workflow
Pada `DBRepository.createApplication()`, nilai `shariaScore` (95.0) dan `shariaStatus` ("PASS") di-hardcode secara statis tanpa memanggil `ShariaRuleEngine`. Pada tahap review DPS di `DBRepository.processApproval()`, pengesahan fatwa tidak mengeksekusi evaluasi otomatis engine melainkan hanya mencatat aksi approval status.

### 8. Human Override DPS Tidak Persisten & Tanpa Isolasi Tenant
Fitur pencatatan diskresi/fatwa override DPS (`INITIAL_OVERRIDES`) di `/sharia-rules` hanya tersimpan di memori lokal peramban. Belum ada API atau tabel repositori untuk menyimpan alasan syariah, tenggat waktu syarat, maupun mengisolasi catatan override antar-tenant.

---

## Fitur: Integrated Digital Approval Workflow (`/approvals`)

### 1. Halaman `/approvals` Terputus dari Backend (Mock LocalStorage)
Antarmuka `/approvals` saat ini tidak melakukan *fetch* data aplikasi dari API backend (`/api/v1/applications`), melainkan membaca data statis contoh (`INITIAL_APPROVAL_REQUESTS`) dan menyimpan mutasi status/komentar hanya pada `localStorage` peramban (`sce_approvals_store_v2`).

### 2. Backend Persistensi `processApproval()` Berfungsi Penuh
Pada repositori backend, fungsi `DBRepository.processApproval()` telah terimplementasi secara lengkap. Keputusan approval benar-benar memperbarui `app.status`, `app.currentStage`, catatan `currentStep`, membuat log audit bertanda tangan kriptografi SHA-256, mengirim notifikasi peran berikutnya, serta otomatis menerbitkan entri `newContract` ke dalam `data/sce_database.json`.

### 3. API Backend `/api/v1/applications/[id]/approval` Terlindungi Ketat
Endpoint approval rute ini telah menerapkan:
- `getAuthenticatedUser(req)`: Menolak request anonim dengan HTTP 401 Unauthorized.
- `assertTenantIsolation`: Menolak aksi persetujuan terhadap aplikasi milik institusi lain dengan HTTP 403 Forbidden dan mencatat audit log insiden keamanan.
- `assertPermission`: Memvalidasi hak izin peran (`approvals:approve`, `approvals:revise`, `approvals:reject`).

### 4. Penegakan Separation of Duties (SoD) & Anti-Impersonation
Backend secara ketat menolak persetujuan jika tahapan aplikasi saat ini tidak sesuai dengan peran pemohon (`app.currentStage !== allowedStage`), serta menolak jika peran aktif di sesi berbeda dengan `roleCode` pada payload tindakan (`session.role !== roleCode`, kecuali Super Admin).

### 5. Alur Status & Tahapan Workflow Deterministik
Tahapan persetujuan berjalan sekuensial:
`FO` (Inisiasi) $\rightarrow$ `LEGAL` (Legal Officer) $\rightarrow$ `COMPLIANCE` (Compliance Officer) $\rightarrow$ `DPS` (Dewan Pengawas Syariah) $\rightarrow$ `MANAGEMENT` (Direksi/Komite) $\rightarrow$ `APPROVED / EXECUTED`.
Aksi `REQUEST_REVISION` mengembalikan tahapan langsung ke `FO` dengan status `REVISION_REQUESTED`.

### 6. Ketiadaan Integrasi Otomatis dengan Sharia Rule Engine
Pada saat giliran DPS (`SHARIA_REVIEWER`) memproses persetujuan, `processApproval()` tidak memicu evaluasi otomatis parameter akad via `ShariaRuleEngine.evaluate()`. Persetujuan syariah hanya mencatat status manual tanpa validasi komparasi skor fatwa sistem.

### 7. Keberadaan Rute Legacy Tidak Berfungsi (`/api/v1/approvals`)
Masih terdapat endpoint usang di `src/app/api/v1/approvals/route.ts` yang mengandalkan Prisma client ke PostgreSQL lokal yang tidak aktif, berpotensi membingungkan pengembang jika tidak dialihkan secara tegas ke endpoint terpadu `/api/v1/applications/[id]/approval`.

### 8. Kesenjangan Isolasi Tenant Frontend vs Backend
Di sisi backend, isolasi tenant data approval telah diterapkan secara ketat. Namun karena halaman frontend `/approvals` mengandalkan mock data di `localStorage`, UI belum menampilkan data permohonan yang terisolasi berdasarkan `session.organizationId` pengguna yang sedang login.

---

## Fitur: Centralized Contract Monitoring & Analytics (`/contracts` & `/analytics`)

### 1. Halaman Analytics (`/analytics`) 100% Menggunakan Mock Data Statis
Seluruh grafik Recharts (tren pembiayaan bulanan, diagram lingkaran porsi akad, pembagian bagi hasil kemitraan) serta kartu metrik KPI (Total Portofolio Rp 30,3 Miliar, Outstanding Murabahah Rp 17,2 Miliar, Kepatuhan 98,4%) bersumber murni dari konstanta *hardcoded* lokal tanpa memanggil API atau membaca `data/sce_database.json`.

### 2. Filter Rentang Waktu Analytics Tidak Berfungsi
Pilihan rentang waktu analitik (1M, 3M, 6M, 1Y, YTD) hanya mengubah state string lokal tanpa memicu kalkulasi ulang metrik keuangan ataupun mengubah data koordinat pada diagram Recharts.

### 3. Ekspor CSV Analytics Bersumber dari Array Statis
Fungsi *"Ekspor CSV"* pada `/analytics` hanya merender data array statis `MONTHLY_FINANCING_DATA` ke dalam blob file teks, bukan mengekstrak catatan transaksi pembiayaan riil dari repositori data institusi.

### 4. Halaman Monitoring Kontrak (`/contracts`) Tercampur Data Mock (Hibrida)
Halaman `/contracts` telah memanggil backend `GET /api/v1/contracts`, namun secara eksplisit menggabungkan (*merge*) hasil data API dengan 7 entri mock statis bawaan (`REGISTRY_CONTRACTS`), sehingga kontrak fiktif (`CT-001` s/d `CT-007`) selalu muncul mencemari daftar kontrak institusi manapun.

### 5. Pencarian & Filter Status Berjalan di Sisi Client
Pencarian nomor kontrak/nama nasabah dan filter status (9 status siklus kontrak dari `DRAFT` hingga `COMPLETED`) pada `/contracts` dieksekusi secara lokal di memori peramban via `contractsList.filter()`, belum memanfaatkan parameter query server-side backend.

### 6. Ketiadaan Sinkronisasi Real-Time
Tidak tersedia mekanisme sinkronisasi data real-time, *server-sent events*, maupun re-fetch otomatis pada halaman `/contracts` dan `/analytics`. Data hanya di-load satu kali saat halaman pertama kali dibuka (*on-mount*).

### 7. Kesenjangan Isolasi Tenant Visual
Meskipun backend `GET /api/v1/contracts` telah menerapkan isolasi tenant secara ketat, pencampuran data mock di UI `/contracts` dan data statis di `/analytics` menyebabkan isolasi data multi-tenant institusi tidak tercermin pada tampilan visual peramban.

### 8. Ketiadaan Pembatasan Hak Akses (RBAC) pada Halaman Analytics
Halaman `/analytics` belum menerapkan pengamanan hak izin granular peran (seperti izin `analytics:view` atau `reports:export`) menggunakan `useSession()` / `ReadOnlyPanel`, sehingga seluruh peran pengguna yang dapat mengakses menu sidebar dapat melihat angka portofolio statis yang sama.



