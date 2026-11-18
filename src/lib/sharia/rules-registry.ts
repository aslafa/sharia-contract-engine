import { ShariaRuleDefinition } from "@/types/sharia";

export const SHARIA_RULES_REGISTRY: ShariaRuleDefinition[] = [
  // ==========================================
  // MURABAHAH RULES (DSN-MUI No. 04 / 13 / 111)
  // ==========================================
  {
    ruleCode: "RULE-MRB-01",
    title: "Transparansi Harga Pokok Perolehan & Marjin",
    akadCategory: "MURABAHAH",
    severity: "CRITICAL",
    description:
      "Penjual (Lembaga Keuangan Syariah) wajib memberitahukan secara jujur dan transparan harga pokok perolehan barang serta marjin keuntungan kepada pembeli.",
    dsnMuiRef: "Fatwa DSN-MUI No. 04/DSN-MUI/IV/2000 (Diktum Pertama, Butir 2)",
    remediationGuidance:
      "Pastikan nilai 'costPrice' dan 'profitMargin' terisi lebih dari nol dan dicantumkan dalam klausul pokok akad.",
    validator: (payload) => {
      const cost = Number(payload.costPrice ?? 0);
      const margin = Number(payload.profitMargin ?? 0);
      if (cost <= 0) {
        return {
          isCompliant: false,
          reason: "Harga pokok perolehan (costPrice) tidak boleh kosong atau Rp 0.",
          suggestedCorrection: "Masukkan nominal harga beli riil dari pemasok/supplier.",
        };
      }
      if (margin < 0) {
        return {
          isCompliant: false,
          reason: "Marjin keuntungan (profitMargin) tidak boleh bernilai negatif.",
          suggestedCorrection: "Tentukan marjin keuntungan yang disepakati bersama nasabah.",
        };
      }
      return { isCompliant: true };
    },
  },
  {
    ruleCode: "RULE-MRB-02",
    title: "Penguasaan & Kepemilikan Objek Akad (Milkiyyah)",
    akadCategory: "MURABAHAH",
    severity: "CRITICAL",
    description:
      "Barang yang diperjualbelikan harus telah menjadi milik sah penjual (atau telah dikuasai melalui hak penerimaan barang/wakalah) sebelum akad Murabahah diikat.",
    dsnMuiRef: "Fatwa DSN-MUI No. 04/DSN-MUI/IV/2000 & Hadits Riwayat Hakim bin Hizam",
    remediationGuidance:
      "Jika barang dibeli melalui nasabah, pastikan Akad Wakalah telah ditandatangani dan penerimaan barang (isGoodsReceived) telah dikonfirmasi.",
    validator: (payload) => {
      if (payload.isGoodsReceived === false) {
        return {
          isCompliant: false,
          reason: "Barang belum diterima/dikuasai oleh LKS atau wakilnya sebelum akad jual beli dilaksanakan.",
          suggestedCorrection:
            "Lengkapi Berita Acara Serah Terima Barang (BAST) atau dokumen penerimaan fisik sebelum eksekusi akad.",
        };
      }
      return { isCompliant: true };
    },
  },
  {
    ruleCode: "RULE-MRB-03",
    title: "Kesesuaian Total Harga Jual (Selling Price Formula)",
    akadCategory: "MURABAHAH",
    severity: "CRITICAL",
    description:
      "Total harga jual (sellingPrice) harus secara tepat merupakan penjumlahan dari harga pokok ditambah marjin yang disepakati.",
    dsnMuiRef: "Fatwa DSN-MUI No. 111/DSN-MUI/IX/2017",
    remediationGuidance: "Pastikan sellingPrice = costPrice + profitMargin.",
    validator: (payload) => {
      const cost = Number(payload.costPrice ?? 0);
      const margin = Number(payload.profitMargin ?? 0);
      const selling = Number(payload.sellingPrice ?? 0);
      const calculated = cost + margin;

      if (selling > 0 && Math.abs(selling - calculated) > 1) {
        return {
          isCompliant: false,
          reason: `Harga jual tercantum (Rp ${selling.toLocaleString("id-ID")}) tidak sesuai dengan pokok + marjin (Rp ${calculated.toLocaleString("id-ID")}).`,
          suggestedCorrection: `Perbarui harga jual menjadi Rp ${calculated.toLocaleString("id-ID")}.`,
        };
      }
      return { isCompliant: true };
    },
  },
  {
    ruleCode: "RULE-MRB-04",
    title: "Batas Maksimal Uang Muka (Urbun)",
    akadCategory: "MURABAHAH",
    severity: "HIGH",
    description:
      "Uang muka (Urbun) yang dibayarkan nasabah tidak boleh melebihi atau sama dengan total harga jual barang.",
    dsnMuiRef: "Fatwa DSN-MUI No. 13/DSN-MUI/IX/2000",
    remediationGuidance: "Pastikan urbun lebih kecil dari total harga jual barang.",
    validator: (payload) => {
      const downPayment = Number(payload.downPaymentUrbun ?? 0);
      const selling = Number(payload.sellingPrice ?? (Number(payload.costPrice ?? 0) + Number(payload.profitMargin ?? 0)));
      if (selling > 0 && downPayment >= selling) {
        return {
          isCompliant: false,
          reason: "Uang muka tidak boleh sama dengan atau melebihi harga jual barang.",
          suggestedCorrection: "Turunkan porsi uang muka atau gunakan skema transaksi tunai biasa.",
        };
      }
      return { isCompliant: true };
    },
  },

  // ==========================================
  // IJARAH & IMBT RULES (DSN-MUI No. 09 / 27)
  // ==========================================
  {
    ruleCode: "RULE-IJR-01",
    title: "Kejelasan Objek Sewa & Ujrah (Manfa'ah Ma'lumah)",
    akadCategory: "IJARAH",
    severity: "CRITICAL",
    description:
      "Objek sewa dan nilai imbalan sewa (ujrah) harus jelas, terukur, dan diketahui kedua belah pihak sejak awal masa sewa.",
    dsnMuiRef: "Fatwa DSN-MUI No. 09/DSN-MUI/IV/2000",
    remediationGuidance: "Sebutkan deskripsi objek sewa dan nominal sewa bulanan secara spesifik.",
    validator: (payload) => {
      const desc = String(payload.assetDescription || "").trim();
      const fee = Number(payload.rentalFeePerMonth ?? 0);
      if (!desc) {
        return {
          isCompliant: false,
          reason: "Deskripsi objek sewa (assetDescription) belum ditentukan.",
          suggestedCorrection: "Lengkapi data spesifikasi teknis dan kondisi objek yang disewakan.",
        };
      }
      if (fee <= 0) {
        return {
          isCompliant: false,
          reason: "Biaya sewa (ujrah) tidak boleh bernilai nol atau gratis dalam akad komersial.",
          suggestedCorrection: "Tetapkan nominal ujrah per periode sewa.",
        };
      }
      return { isCompliant: true };
    },
  },
  {
    ruleCode: "RULE-IJR-02",
    title: "Pemisahan Janji Pemindahan Milik (Wa'd) pada IMBT",
    akadCategory: "IJARAH",
    severity: "HIGH",
    description:
      "Dalam IMBT, akad pemindahan kepemilikan (hibah atau jual) tidak boleh digabung dalam akad sewa pokok, melainkan berupa janji sepihak (Wa'd) yang dieksekusi setelah sewa selesai.",
    dsnMuiRef: "Fatwa DSN-MUI No. 27/DSN-MUI/III/2002",
    remediationGuidance:
      "Jika produk berjenis IMBT (isImbt = true), cantumkan nomor dokumen janji pemindahan hak milik (waadPromiseRef).",
    validator: (payload) => {
      if (payload.isImbt === true && !payload.waadPromiseRef) {
        return {
          isCompliant: false,
          reason: "Skema IMBT mewajibkan dokumen janji (Wa'd) terpisah dari akad induk Ijarah.",
          suggestedCorrection: "Lampirkan dan referensikan Surat Perjanjian Janji Pemindahan Kepemilikan (Wa'd).",
        };
      }
      return { isCompliant: true };
    },
  },

  // ==========================================
  // MUSYARAKAH RULES (DSN-MUI No. 08 / 73 / 114)
  // ==========================================
  {
    ruleCode: "RULE-MSY-01",
    title: "Kontribusi Modal Para Pihak (Ra'sul Mal Syirkah)",
    akadCategory: "MUSYARAKAH",
    severity: "CRITICAL",
    description:
      "Setiap mitra dalam syirkah/musyarakah wajib menyetorkan kontribusi modal riil.",
    dsnMuiRef: "Fatwa DSN-MUI No. 08/DSN-MUI/IV/2000",
    remediationGuidance: "Pastikan lembaga dan nasabah masing-masing menyetorkan modal > 0.",
    validator: (payload) => {
      const instCap = Number(payload.institutionCapital ?? 0);
      const partCap = Number(payload.partnerCapital ?? 0);
      if (instCap <= 0 || partCap <= 0) {
        return {
          isCompliant: false,
          reason: "Kedua pihak wajib menyetorkan modal. Musyarakah tidak sah jika salah satu pihak tanpa modal.",
          suggestedCorrection: "Gunakan akad Mudharabah jika salah satu pihak menyumbang 100% modal.",
        };
      }
      return { isCompliant: true };
    },
  },
  {
    ruleCode: "RULE-MSY-02",
    title: "Keseimbangan Total Rasio Nisbah Keuntungan (100%)",
    akadCategory: "MUSYARAKAH",
    severity: "CRITICAL",
    description:
      "Total rasio pembagian keuntungan (nisbah) antara lembaga dan mitra harus tepat berjumlah 100%.",
    dsnMuiRef: "Fatwa DSN-MUI No. 114/DSN-MUI/IX/2017",
    remediationGuidance: "Jumlah institutionNisbah + partnerNisbah harus sama dengan 100.",
    validator: (payload) => {
      const n1 = Number(payload.institutionNisbah ?? 0);
      const n2 = Number(payload.partnerNisbah ?? 0);
      if (Math.abs(n1 + n2 - 100) > 0.01) {
        return {
          isCompliant: false,
          reason: `Total nisbah adalah ${(n1 + n2).toFixed(2)}%, bukan 100%.`,
          suggestedCorrection: "Sesuaikan persentase nisbah lembaga dan mitra agar totalnya tepat 100%.",
        };
      }
      return { isCompliant: true };
    },
  },
  {
    ruleCode: "RULE-MSY-03",
    title: "Tanggung Jawab Kerugian Berdasarkan Rasio Modal (Al-Ghurmu bil Ghunmi)",
    akadCategory: "MUSYARAKAH",
    severity: "CRITICAL",
    description:
      "Kerugian finansial dalam musyarakah mutlak ditanggung oleh masing-masing pihak sebanding dengan porsi penyertaan modal (Al-Wadhi'ah 'ala qadri al-malain).",
    dsnMuiRef: "Fatwa DSN-MUI No. 08/DSN-MUI/IV/2000 (Diktum Ketiga)",
    remediationGuidance:
      "Klausul pembagian kerugian harus mengikuti rasio modal, dilarang membebankan seluruh rugi kepada salah satu pihak.",
    validator: (payload) => {
      const formula = String(payload.lossSharingFormula || "CAPITAL_RATIO");
      if (formula !== "CAPITAL_RATIO") {
        return {
          isCompliant: false,
          reason: "Klausul kerugian tidak sebanding porsi modal melanggar asas fiqh syirkah mu'tamadah.",
          suggestedCorrection: "Atur klausul pembagian kerugian agar mengikuti proporsi kontribusi modal riil.",
        };
      }
      return { isCompliant: true };
    },
  },

  // ==========================================
  // MUDHARABAH RULES (DSN-MUI No. 07 / 115)
  // ==========================================
  {
    ruleCode: "RULE-MDH-01",
    title: "Penyediaan Modal 100% oleh Shahibul Mal",
    akadCategory: "MUDHARABAH",
    severity: "CRITICAL",
    description:
      "Pemilik modal (Shahibul Mal) wajib menyediakan 100% modal usaha, sementara Mudharib menyumbangkan keahlian manajemen/pengelolaan.",
    dsnMuiRef: "Fatwa DSN-MUI No. 07/DSN-MUI/IV/2000 (Diktum Pertama)",
    remediationGuidance: "Pastikan capitalShahibulMal bernilai penuh dan Mudharib tidak dipungut modal finansial.",
    validator: (payload) => {
      const cap = Number(payload.capitalShahibulMal ?? 0);
      if (cap <= 0) {
        return {
          isCompliant: false,
          reason: "Nominal modal dari Shahibul Mal belum ditentukan atau Rp 0.",
          suggestedCorrection: "Tetapkan jumlah modal riil yang diserahkan kepada Mudharib.",
        };
      }
      return { isCompliant: true };
    },
  },
  {
    ruleCode: "RULE-MDH-02",
    title: "Rasio Nisbah Mudharabah Berjumlah Tepat 100%",
    akadCategory: "MUDHARABAH",
    severity: "CRITICAL",
    description:
      "Keuntungan usaha wajib dibagi dalam persentase nisbah yang disepakati dengan total 100%, dilarang menetapkan nominal keuntungan tetap di muka.",
    dsnMuiRef: "Fatwa DSN-MUI No. 07/DSN-MUI/IV/2000",
    remediationGuidance: "Pastikan shahibulMalNisbah + mudharibNisbah = 100%.",
    validator: (payload) => {
      const sNisbah = Number(payload.shahibulMalNisbah ?? 0);
      const mNisbah = Number(payload.mudharibNisbah ?? 0);
      if (Math.abs(sNisbah + mNisbah - 100) > 0.01) {
        return {
          isCompliant: false,
          reason: `Total rasio nisbah adalah ${(sNisbah + mNisbah).toFixed(2)}%, bukan 100%.`,
          suggestedCorrection: "Sesuaikan rasio bagi hasil Shahibul Mal dan Mudharib agar totalnya 100%.",
        };
      }
      return { isCompliant: true };
    },
  },
  {
    ruleCode: "RULE-MDH-03",
    title: "Tanggung Jawab Kerugian Finansial Shahibul Mal",
    akadCategory: "MUDHARABAH",
    severity: "CRITICAL",
    description:
      "Kerugian finansial ditanggung 100% oleh Shahibul Mal, kecuali jika kerugian timbul karena kelalaian sengaja (tafrith) atau pelanggaran amanah (ta'addi) dari Mudharib.",
    dsnMuiRef: "Fatwa DSN-MUI No. 07/DSN-MUI/IV/2000 (Diktum Keempat)",
    remediationGuidance:
      "Dilarang mensyaratkan jaminan pengembalian modal pasti dari Mudharib atas risiko bisnis wajar.",
    validator: (payload) => {
      const terms = String(payload.lossTerms || "");
      if (terms.includes("MUDHARIB_FULL_GUARANTEE")) {
        return {
          isCompliant: false,
          reason: "Klausul penjaminan modal oleh Mudharib atas risiko bisnis wajar mengubah akad menjadi riba qardh jarra naf'an.",
          suggestedCorrection:
            "Hapus klausul garansi modal mudharib dan gunakan klausul baku kerugian syariah.",
        };
      }
      return { isCompliant: true };
    },
  },
];

