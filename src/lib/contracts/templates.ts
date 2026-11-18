/**
 * SHARIA CONTRACT ENGINE (SCE)
 * Standard Islamic Financial Agreement Templates (DSN-MUI Compliant)
 */

export interface ContractTemplateData {
  institutionName: string;
  institutionAddress: string;
  authorizedSignerName: string;
  authorizedSignerTitle: string;
  customerName: string;
  customerIdentityNumber: string; // KTP / NIK / NIB
  customerAddress: string;
  contractNumber: string;
  contractDate: string;
  nominalAmount: number;
  tenorMonths: number;
  // Akad Specifics
  akadType: "MURABAHAH" | "IJARAH" | "MUSYARAKAH" | "MUDHARABAH";
  costPrice?: number;
  profitMargin?: number;
  downPayment?: number;
  monthlyInstallment?: number;
  commodityDescription?: string;
  ujrahAmount?: number;
  isImbt?: boolean;
  transferMethod?: string;
  institutionNisbah?: number;
  partnerNisbah?: number;
  businessScope?: string;
}

export function generateLegalContractText(data: ContractTemplateData): string {
  const dateFormatted = data.contractDate || new Date().toLocaleDateString("id-ID", { dateStyle: "long" });

  let specificPasal = "";

  if (data.akadType === "MURABAHAH") {
    specificPasal = `
PASAL 2: OBJEK JUAL BELI & PENGUASAAN BARANG (MILKIYYAH)
1. PIHAK PERTAMA menjual kepada PIHAK KEDUA, dan PIHAK KEDUA membeli dari PIHAK PERTAMA objek berupa: ${data.commodityDescription || "1 Unit Komoditas/Aset Produktif"}.
2. PIHAK PERTAMA menyatakan bahwa objek jual beli tersebut telah dimiliki dan dikuasai secara sah (Milkiyyah Tammah) sebelum akad ini ditandatangani, sesuai Fatwa DSN-MUI No. 04/DSN-MUI/IV/2000.

PASAL 3: HARGA POKOK, MARJIN KEUNTUNGAN, DAN CARA PEMBAYARAN
1. Harga pokok perolehan (Cost Price) barang dari pemasok adalah sebesar Rp ${(data.costPrice || 0).toLocaleString("id-ID")}.
2. Marjin keuntungan yang disepakati bersama adalah sebesar Rp ${(data.profitMargin || 0).toLocaleString("id-ID")}.
3. Total Harga Jual (Selling Price) yang disepakati adalah sebesar Rp ${((data.costPrice || 0) + (data.profitMargin || 0)).toLocaleString("id-ID")}.
4. Uang Muka (Urbun) dibayarkan sebesar Rp ${(data.downPayment || 0).toLocaleString("id-ID")}, sehingga sisa piutang adalah sebesar Rp ${(((data.costPrice || 0) + (data.profitMargin || 0)) - (data.downPayment || 0)).toLocaleString("id-ID")}.
5. PIHAK KEDUA berjanji dan mengikatkan diri untuk melunasi sisa piutang secara mengangsur sebesar Rp ${(data.monthlyInstallment || 0).toLocaleString("id-ID")} setiap bulan selama jangka waktu ${data.tenorMonths} bulan.
`;
  } else if (data.akadType === "IJARAH") {
    specificPasal = `
PASAL 2: OBJEK SEWA & MANFAAT YANG DIIJINKAN
1. PIHAK PERTAMA menyewakan manfaat atas objek: ${data.commodityDescription || "1 Unit Aset Produktif"} kepada PIHAK KEDUA.
2. Manfaat objek sewa hanya diperbolehkan untuk kegiatan usaha yang halal dan tidak melanggar ketentuan syariat Islam.

PASAL 3: BESARAN UJRAH & JANGKA WAKTU SEWA
1. Biaya sewa (Ujrah) yang disepakati adalah sebesar Rp ${(data.ujrahAmount || 0).toLocaleString("id-ID")} per bulan.
2. Jangka waktu sewa berlaku selama ${data.tenorMonths} bulan terhitung sejak serah terima objek sewa.

PASAL 4: PEMELIHARAAN OBJEK SEWA (MAINTENANCE SPLIT)
1. Sesuai Fatwa DSN-MUI No. 09/DSN-MUI/IV/2000, pemeliharaan struktural/kerusakan asal (bukan akibat kelalaian PIHAK KEDUA) menjadi tanggung jawab penuh PIHAK PERTAMA.
2. Pemeliharaan rutin operasional dan harian menjadi tanggung jawab PIHAK KEDUA.
${data.isImbt ? `3. Janji pengalihan hak milik (Wa'ad Mulzim) pada akhir masa sewa dituangkan dalam dokumen terpisah (${data.transferMethod || "HIBAH"}).` : ""}
`;
  } else if (data.akadType === "MUSYARAKAH") {
    specificPasal = `
PASAL 2: BENTUK KEMITRAAN & MODAL PENYERTAAN
1. PARA PIHAK bersepakat menjalankan usaha kemitraan (Syirkah 'Inan) dalam bidang: ${data.businessScope || "Usaha Produktif Komersial"}.
2. Porsi modal PIHAK PERTAMA adalah sebesar Rp ${(data.nominalAmount || 0).toLocaleString("id-ID")}.
3. Penyetoran modal wajib disetorkan ke rekening bersama (Escrow Account) kemitraan.

PASAL 3: NISBAH BAGI HASIL DAN FORMULA TANGGUNG RUGI
1. Keuntungan riil usaha dibagi berdasarkan nisbah: PIHAK PERTAMA ${data.institutionNisbah || 40}% dan PIHAK KEDUA ${data.partnerNisbah || 60}%.
2. Sesuai Fatwa DSN-MUI No. 08/DSN-MUI/IV/2000, kerugian usaha ditanggung oleh PARA PIHAK secara proporsional sesuai porsi modal masing-masing, kecuali apabila kerugian disebabkan oleh kelalaian (Ta'addi) atau wanprestasi (Mukhalafah) oleh mitra pengelola.
3. Dilarang menetapkan jaminan imbal hasil tetap (Guaranteed Return) yang menyerupai riba pinjaman.
`;
  } else if (data.akadType === "MUDHARABAH") {
    specificPasal = `
PASAL 2: PERMODALAN DAN PERAN PARA PIHAK
1. PIHAK PERTAMA bertindak sebagai Shahibul Maal yang menyediakan 100% modal usaha sebesar Rp ${(data.nominalAmount || 0).toLocaleString("id-ID")}.
2. PIHAK KEDUA bertindak sebagai Mudharib yang mengelola usaha secara amanah dengan keahlian, waktu, dan manajemen profesional.

PASAL 3: NISBAH BAGI HASIL RIIL
1. Hasil usaha riil (Net Distributable Profit) dibagi berdasarkan nisbah: Shahibul Maal ${data.institutionNisbah || 70}% dan Mudharib ${data.partnerNisbah || 30}%.
2. Sesuai Fatwa DSN-MUI No. 07/DSN-MUI/IV/2000, jika terjadi kerugian finansial bukan akibat kelalaian, kerugian tersebut sepenuhnya ditanggung oleh Shahibul Maal sebagai pengurang modal, dan Mudharib tidak memperoleh kompensasi atas tenaganya.
3. Shahibul Maal dilarang menuntut jaminan atas pengembalian modal pokok.
`;
  }

  return `
PERJANJIAN PEMBIAYAAN SYARIAH DENGAN AKAD ${data.akadType}
Nomor Kontrak: ${data.contractNumber}

Bismillahir Rahmanir Rahim.
Pada hari ini, ${dateFormatted}, bertempat di kantor ${data.institutionName}, yang bertanda tangan di bawah ini:

I. ${data.institutionName}, berkedudukan di ${data.institutionAddress}, dalam hal ini diwakili secara sah oleh ${data.authorizedSignerName}, bertindak dalam kapasitas selaku ${data.authorizedSignerTitle}, untuk selanjutnya disebut sebagai "PIHAK PERTAMA".

II. ${data.customerName}, Nomor Identitas/NIB: ${data.customerIdentityNumber || "3171000000000001"}, beralamat di ${data.customerAddress || "DKI Jakarta"}, untuk selanjutnya disebut sebagai "PIHAK KEDUA".

PARA PIHAK terlebih dahulu menerangkan hal-hal sebagai berikut:
a. Bahwa PIHAK KEDUA telah mengajukan permohonan fasilitas pembiayaan syariah kepada PIHAK PERTAMA.
b. Bahwa PIHAK PERTAMA menyetujui pemberian fasilitas tersebut berdasarkan prinsip syariah dengan menggunakan Akad ${data.akadType}.
c. Bahwa akad ini telah dirancang untuk memenuhi ketentuan hukum Islam, Fatwa Dewan Syari'ah Nasional - Majelis Ulama Indonesia (DSN-MUI), serta peraturan perundang-undangan perbankan syariah yang berlaku di Republik Indonesia.

Maka berlandaskan iktikad baik dan prinsip saling ridha (Antaradhin Minkum), PARA PIHAK bersepakat untuk mengikatkan diri dalam Perjanjian ini dengan syarat-syarat dan ketentuan sebagai berikut:

PASAL 1: DEFINISI DAN RUANG LINGKUP AKAD
Dalam perjanjian ini yang dimaksud dengan Akad ${data.akadType} adalah perjanjian pembiayaan syariah yang tunduk pada prinsip muamalah Islam, bebas dari unsur Riba, Gharar, Maysir, Tadlis, dan Risywah.
${specificPasal}
PASAL 5: HAK DAN KEWAJIBAN PARA PIHAK
1. PIHAK PERTAMA berhak menerima pembayaran angsuran / bagi hasil sesuai jadwal yang telah disepakati.
2. PIHAK KEDUA berhak menerima manfaat penuh atas objek pembiayaan / modal usaha yang disepakati.
3. PIHAK KEDUA berkewajiban menyampaikan laporan keuangan atau bukti penggunaan dana secara jujur, transparan, dan dapat dipertanggungjawabkan kepada Dewan Pengawas Syariah (DPS).

PASAL 6: WANPRESTASI DAN TA'WIDH (GANTI RUGI RIIL)
1. Apabila PIHAK KEDUA lalai dalam memenuhi kewajibannya tanpa alasan syar'i yang dapat diterima, PIHAK PERTAMA dapat mengenakan ganti rugi (Ta'widh) sebatas kerugian riil (real cost) yang diderita LKS.
2. Dana denda sanksi (Ta'zir) yang dikenakan kepada nasabah yang mampu namun menunda pembayaran TIDAK BOLEH diakui sebagai pendapatan LKS, dan wajib disalurkan 100% sebagai Dana Kebajikan (Qardhul Hasan / Sosial).

PASAL 7: PENYELESAIAN SENGKETA
1. Segala perselisihan yang timbul dari pelaksanaan Akad ini diselesaikan terlebih dahulu melalui musyawarah untuk mufakat.
2. Apabila mufakat tidak tercapai, PARA PIHAK sepakat menyelesaikan sengketa melalui Badan Arbitrase Syariah Nasional (BASYARNAS) atau Pengadilan Agama setempat yang berwenang.

Demikian Perjanjian ini dibuat dalam rangkap 2 (dua) bermeterai cukup dan masing-masing mempunyai kekuatan hukum yang sama bagi PARA PIHAK.

PIHAK PERTAMA                                PIHAK KEDUA
${data.institutionName}                      Nasabah / Mitra Pembiayaan



______________________                       ______________________
${data.authorizedSignerName}                 ${data.customerName}
${data.authorizedSignerTitle}
`.trim();
}

