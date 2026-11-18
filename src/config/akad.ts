import { AkadCategory } from "@/types/akad";

export interface AkadConfig {
  code: AkadCategory;
  name: string;
  arabicName: string;
  tagline: string;
  description: string;
  fatwaDsnMui: string[];
  pillars: string[]; // Rukun Akad
  conditions: string[]; // Syarat Sah
  defaultTenorRangeMonths: [number, number];
  primaryUseCases: string[];
}

export const AKAD_REGISTRY: Record<AkadCategory, AkadConfig> = {
  MURABAHAH: {
    code: "MURABAHAH",
    name: "Akad Murabahah",
    arabicName: "المرابحة",
    tagline: "Jual Beli dengan Penegasan Harga Pokok dan Keuntungan (Cost-Plus Sale)",
    description:
      "Akad jual beli barang dengan menyatakan harga perolehan dan keuntungan (marjin) yang disepakati oleh penjual dan pembeli. Pembayaran dapat dilakukan secara tangguh (cicilan) atau tunai.",
    fatwaDsnMui: [
      "Fatwa DSN-MUI No. 04/DSN-MUI/IV/2000 tentang Murabahah",
      "Fatwa DSN-MUI No. 13/DSN-MUI/IX/2000 tentang Uang Muka dalam Murabahah (Urbun)",
      "Fatwa DSN-MUI No. 16/DSN-MUI/IX/2000 tentang Diskon dalam Murabahah",
      "Fatwa DSN-MUI No. 111/DSN-MUI/IX/2017 tentang Akad Jual Beli Murabahah",
    ],
    pillars: [
      "Ba'i (Penjual / Lembaga Keuangan)",
      "Musytari (Pembeli / Nasabah)",
      "Mabi' (Objek Barang yang Dijualbelikan)",
      "Tsaman (Harga: Pokok + Marjin)",
      "Ijab dan Qabul (Pernyataan Kesepakatan)",
    ],
    conditions: [
      "Objek jual beli harus halal dan bermanfaat",
      "Objek harus telah dimiliki secara sah oleh penjual sebelum akad",
      "Harga pokok perolehan harus diketahui secara transparan oleh pembeli",
      "Tidak boleh ada klausul bunga atau denda yang menjadi pendapatan lembaga",
    ],
    defaultTenorRangeMonths: [3, 120],
    primaryUseCases: [
      "Pembiayaan Kendaraan Bermotor Syariah",
      "Pembiayaan Pemilikan Rumah (KPR Syariah)",
      "Pengadaan Mesin & Peralatan Usaha",
      "Pengadaan Bahan Baku Dagang",
    ],
  },
  IJARAH: {
    code: "IJARAH",
    name: "Akad Ijarah & IMBT",
    arabicName: "الإجارة والمنتهية بالتمليك",
    tagline: "Sewa Menyewa Hak Manfaat & Sewa Beli Berakhir Pemindahan Kepemilikan",
    description:
      "Akad pemindahan hak guna (manfaat) atas suatu barang atau jasa dalam waktu tertentu dengan pembayaran sewa (ujrah), tanpa diikuti pemindahan kepemilikan barang itu sendiri, atau diikuti janji pemindahan kepemilikan pada akhir masa sewa (IMBT).",
    fatwaDsnMui: [
      "Fatwa DSN-MUI No. 09/DSN-MUI/IV/2000 tentang Pembiayaan Ijarah",
      "Fatwa DSN-MUI No. 27/DSN-MUI/III/2002 tentang Ijarah Muntahiyah Bittamlik (IMBT)",
      "Fatwa DSN-MUI No. 112/DSN-MUI/IX/2017 tentang Akad Ijarah",
    ],
    pillars: [
      "Mu'jir (Pemberi Sewa)",
      "Musta'jir (Penyewa)",
      "Ma'jur (Objek Sewa / Manfaat)",
      "Ujrah (Biaya Sewa)",
      "Shighat (Ijab dan Qabul)",
    ],
    conditions: [
      "Objek sewa diketahui spesifikasinya secara jelas",
      "Manfaat yang disewakan harus halal dan tidak bertentangan dengan syariah",
      "Pemeliharaan pokok objek sewa menjadi tanggung jawab pemberi sewa",
      "Janji pemindahan kepemilikan (Wa'd) pada IMBT harus terpisah dari akad sewa pokok",
    ],
    defaultTenorRangeMonths: [6, 180],
    primaryUseCases: [
      "Sewa Alat Berat & Mesin Industri",
      "Pembiayaan Properti IMBT",
      "Pembiayaan Pendidikan (Ijarah Jasa)",
      "Pembiayaan Paket Umroh/Haji (Ijarah Multijasa)",
    ],
  },
  MUSYARAKAH: {
    code: "MUSYARAKAH",
    name: "Akad Musyarakah & MMQ",
    arabicName: "المشاركة والمشاركة المتناقصة",
    tagline: "Kemitraan Usaha dengan Pembagian Keuntungan & Risiko Secara Adil",
    description:
      "Akad kerjasama antara dua pihak atau lebih untuk suatu usaha tertentu, di mana masing-masing pihak memberikan kontribusi dana dengan ketentuan bahwa keuntungan dibagi sesuai kesepakatan (nisbah) dan kerugian ditanggung berdasarkan porsi modal masing-masing.",
    fatwaDsnMui: [
      "Fatwa DSN-MUI No. 08/DSN-MUI/IV/2000 tentang Pembiayaan Musyarakah",
      "Fatwa DSN-MUI No. 73/DSN-MUI/XI/2008 tentang Musyarakah Mutanaqisah (MMQ)",
      "Fatwa DSN-MUI No. 114/DSN-MUI/IX/2017 tentang Akad Syirkah",
    ],
    pillars: [
      "Syuraqa' (Para Pihak yang Bermitra)",
      "Ra'sul Mal (Modal Usaha dari Masing-Masing Pihak)",
      "'Amal (Pekerjaan / Pengelolaan Usaha)",
      "Nisbah Ribh (Rasio Pembagian Keuntungan)",
      "Shighat (Ijab dan Qabul)",
    ],
    conditions: [
      "Modal harus berupa uang tunai atau aset yang dapat dinilai secara objektif",
      "Nisbah keuntungan disepakati dalam persentase, bukan nominal tetap",
      "Kerugian finansial wajib ditanggung bersama secara proporsional sesuai rasio kontribusi modal",
      "Pihak pengelola berhak menjalankan operasional sesuai kesepakatan tata kelola syirkah",
    ],
    defaultTenorRangeMonths: [6, 60],
    primaryUseCases: [
      "Pembiayaan Modal Kerja Konstruksi & Proyek",
      "Kemitraan Pemilikan Properti (Musyarakah Mutanaqisah)",
      "Ekspansi Pabrik & Kapasitas Produksi",
      "Pembiayaan Pengadaan Vendor / Supply Chain",
    ],
  },
  MUDHARABAH: {
    code: "MUDHARABAH",
    name: "Akad Mudharabah",
    arabicName: "المضاربة",
    tagline: "Investasi Kepercayaan: 100% Modal Lembaga & Keahlian Pengelola Usaha",
    description:
      "Akad kerjasama usaha antara pemilik modal (Shahibul Mal) yang menyediakan 100% modal, dengan pengelola (Mudharib) yang mengelola usaha secara profesional. Keuntungan dibagi menurut rasio (nisbah) yang disepakati, sedangkan kerugian finansial ditanggung pemilik modal selama bukan kelalaian mudharib.",
    fatwaDsnMui: [
      "Fatwa DSN-MUI No. 07/DSN-MUI/IV/2000 tentang Pembiayaan Mudharabah (Qiradh)",
      "Fatwa DSN-MUI No. 115/DSN-MUI/IX/2017 tentang Akad Mudharabah",
    ],
    pillars: [
      "Shahibul Mal (Penyedia Modal 100%)",
      "Mudharib (Pengelola Usaha)",
      "Ra'sul Mal (Modal Pembiayaan)",
      "Ribh wa Nisbah (Keuntungan & Rasio Nisbah)",
      "Shighat (Ijab dan Qabul)",
    ],
    conditions: [
      "Modal diserahkan penuh secara tunai atau bertahap sesuai kebutuhan riil usaha",
      "Shahibul Mal tidak ikut campur dalam manajemen teknis harian, namun berhak mengawasi",
      "Keuntungan tidak boleh dipatok nominal pasti di muka",
      "Kerugian finansial ditanggung 100% oleh Shahibul Mal kecuali jika terbukti pelanggaran amanah (ta'addi) atau kelalaian berat (tafrith)",
    ],
    defaultTenorRangeMonths: [3, 36],
    primaryUseCases: [
      "Pembiayaan Modal Kerja Perdagangan",
      "Pembiayaan Usaha Mikro dan Pertanian (Agro-financing)",
      "Project Financing Berbasis Kepercayaan",
      "Fintech P2P Syariah Produktif",
    ],
  },
};

