import { AkadCategory } from "@/types/akad";
import { formatIDR, formatDateID } from "@/lib/utils";

export interface ContractGenerationInput {
  contractNumber: string;
  akadCategory: AkadCategory;
  institutionName: string;
  institutionSignerName: string;
  institutionSignerTitle: string;
  customerName: string;
  customerIdentifier: string; // NIK / KTP
  customerAddress: string;
  startDate: Date | string;
  tenorMonths: number;
  payload: Record<string, unknown>;
}

export class ContractGenerator {
  public static generateDocumentMarkdown(input: ContractGenerationInput): string {
    const {
      contractNumber,
      akadCategory,
      institutionName,
      institutionSignerName,
      institutionSignerTitle,
      customerName,
      customerIdentifier,
      customerAddress,
      startDate,
      tenorMonths,
      payload,
    } = input;

    let specificTerms = "";

    switch (akadCategory) {
      case "MURABAHAH": {
        const cost = Number(payload.costPrice ?? 0);
        const margin = Number(payload.profitMargin ?? 0);
        const selling = cost + margin;
        const urbun = Number(payload.downPaymentUrbun ?? 0);
        const remaining = selling - urbun;
        const monthly = tenorMonths > 0 ? remaining / tenorMonths : 0;

        specificTerms = `
### PASAL 2: OBJEK MURABAHAH DAN SPESIFIKASI BARANG
1. **Objek Jual Beli:** ${payload.commodityDescription || "Satu unit barang modal / konsumtif sesuai PO/Pesanan"}.
2. **Kondisi Kepemilikan:** Pihak Pertama menegaskan bahwa objek barang telah dibeli dan dimiliki/dikuasai secara sah oleh Pihak Pertama sebelum dilangsungkannya akad ini.

### PASAL 3: HARGA PEROLEHAN, MARJIN DAN SKEMA PEMBAYARAN
1. **Harga Pokok Perolehan (Cost Price):** ${formatIDR(cost)}
2. **Marjin Keuntungan Disepakati:** ${formatIDR(margin)}
3. **Total Harga Jual (Selling Price):** ${formatIDR(selling)}
4. **Uang Muka (Urbun):** ${formatIDR(urbun)}
5. **Sisa Piutang Murabahah:** ${formatIDR(remaining)}
6. **Jangka Waktu Pembiayaan:** ${tenorMonths} bulan
7. **Angsuran Pokok + Marjin per Bulan:** ${formatIDR(monthly)}
`;
        break;
      }
      case "IJARAH": {
        const assetValue = Number(payload.assetValue ?? 0);
        const monthlyFee = Number(payload.rentalFeePerMonth ?? 0);
        const totalFee = monthlyFee * tenorMonths;
        const isImbt = Boolean(payload.isImbt);

        specificTerms = `
### PASAL 2: OBJEK SEWA (MA'JUR) DAN MANFAAT
1. **Objek Sewa:** ${payload.assetDescription || "Barang modal / jasa usaha"}.
2. **Nilai Aset Sewa:** ${formatIDR(assetValue)}.
3. **Klausul Pemeliharaan:** Pemeliharaan struktural/pokok menjadi beban Pihak Pertama, sedangkan pemeliharaan operasional harian menjadi beban Pihak Kedua.

### PASAL 3: BIAYA SEWA (UJRAH) & JANGKA WAKTU
1. **Ujrah per Bulan:** ${formatIDR(monthlyFee)}.
2. **Total Imbalan Sewa:** ${formatIDR(totalFee)}.
3. **Masa Sewa:** ${tenorMonths} bulan.
${
  isImbt
    ? `4. **Skema IMBT:** Perjanjian sewa ini dilengkapi dengan Janji (Wa'd) pemindahan kepemilikan aset pada akhir masa sewa melalui hibah atau jual beli dengan harga nominal.`
    : ""
}
`;
        break;
      }
      case "MUSYARAKAH": {
        const instCap = Number(payload.institutionCapital ?? 0);
        const partCap = Number(payload.partnerCapital ?? 0);
        const totalCap = instCap + partCap;
        const instNisbah = Number(payload.institutionNisbah ?? 0);
        const partNisbah = Number(payload.partnerNisbah ?? 0);

        specificTerms = `
### PASAL 2: BIDANG USAHA DAN MODAL KEMITRAAN (SYIRKAH)
1. **Bidang Usaha:** ${payload.businessScope || "Usaha produktif mitra"}.
2. **Total Modal Kerja Bersama:** ${formatIDR(totalCap)}.
3. **Porsi Modal Pihak Pertama:** ${formatIDR(instCap)} (${totalCap > 0 ? ((instCap / totalCap) * 100).toFixed(1) : 0}%).
4. **Porsi Modal Pihak Kedua:** ${formatIDR(partCap)} (${totalCap > 0 ? ((partCap / totalCap) * 100).toFixed(1) : 0}%).

### PASAL 3: NISBAH BAGI HASIL DAN TANGGUNG JAWAB KERUGIAN
1. **Nisbah Pihak Pertama:** ${instNisbah}% dari ${payload.calculationBasis === "PROFIT_SHARING" ? "Laba Bersih" : "Pendapatan Usaha (Revenue Sharing)"}.
2. **Nisbah Pihak Kedua:** ${partNisbah}% dari ${payload.calculationBasis === "PROFIT_SHARING" ? "Laba Bersih" : "Pendapatan Usaha (Revenue Sharing)"}.
3. **Kerugian Finansial:** Kerugian usaha yang bukan disebabkan oleh kecurangan atau kelalaian wajib ditanggung oleh masing-masing pihak secara proporsional sesuai perbandingan kontribusi modal riil.
`;
        break;
      }
      case "MUDHARABAH": {
        const capital = Number(payload.capitalShahibulMal ?? 0);
        const sNisbah = Number(payload.shahibulMalNisbah ?? 0);
        const mNisbah = Number(payload.mudharibNisbah ?? 0);

        specificTerms = `
### PASAL 2: PENYEDIAAN MODAL DAN PENGELOLAAN USAHA
1. **Penyedia Modal 100% (Shahibul Mal):** ${institutionName}.
2. **Total Modal Pembiayaan:** ${formatIDR(capital)}.
3. **Pengelola Usaha (Mudharib):** ${customerName}.
4. **Bidang Usaha Usaha:** ${payload.businessField || "Usaha dagang dan jasa"}.

### PASAL 3: NISBAH KEUNTUNGAN DAN KETENTUAN KERUGIAN
1. **Nisbah Shahibul Mal:** ${sNisbah}%.
2. **Nisbah Mudharib:** ${mNisbah}%.
3. **Risiko Kerugian:** Segala kerugian finansial dari perputaran usaha wajar ditanggung sepenuhnya oleh Shahibul Mal, sedangkan Mudharib kehilangan imbalan kerja/tenaganya, kecuali terbukti ada kecurangan (ta'addi) atau kelalaian berat (tafrith).
`;
        break;
      }
    }

    return `
================================================================================
  SHARIA CONTRACT ENGINE (SCE) — SISTEM MANAJEMEN AKAD KEUANGAN SYARIAH
  Terakreditasi Kepatuhan Fatwa DSN-MUI & Tata Kelola Keuangan Syariah
================================================================================

# بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
## PERJANJIAN PEMBIAYAAN SYARIAH BERDASARKAN AKAD ${akadCategory}
**Nomor Akad Resmi SCE:** ${contractNumber}

Pada hari ini, tanggal **${formatDateID(startDate)}**, bertempat di kantor ${institutionName}, kami yang bertanda tangan di bawah ini:

### I. PIHAK PERTAMA (LEMBAGA KEUANGAN SYARIAH):
* **Nama Lembaga:** ${institutionName}
* **Diwakili Oleh:** ${institutionSignerName}
* **Jabatan:** ${institutionSignerTitle}
* Selanjutnya disebut sebagai **PIHAK PERTAMA**.

### II. PIHAK KEDUA (NASABAH / MITRA):
* **Nama Lengkap:** ${customerName}
* **Nomor Identitas (NIK/KTP):** ${customerIdentifier}
* **Alamat Domisili:** ${customerAddress}
* Selanjutnya disebut sebagai **PIHAK KEDUA**.

Para pihak secara sadar dan sukarela, tanpa ada paksaan (taradhin), telah sepakat untuk mengikatkan diri dalam Akad **${akadCategory}** dengan ketentuan-ketentuan sebagai berikut:

---

${specificTerms}

---

### PASAL KEPATUHAN SYARIAH (SHARIA COMPLIANCE)
1. Perjanjian ini disusun dan tunduk pada prinsip-prinsip syariah Islam sebagaimana difatwakan oleh Dewan Syari'ah Nasional - Majelis Ulama Indonesia (DSN-MUI) dan peraturan otoritas terkait.
2. Perjanjian ini bebas dari unsur Riba (bunga terlarang), Gharar (ketidakjelasan objek dan harga), Maysir (spekulasi perjudian), Tadlis (penipuan), dan Dharar (bahaya/kerugian sepihak).

### TANDA TANGAN PARA PIHAK

| PIHAK PERTAMA | PIHAK KEDUA |
| :---: | :---: |
| **${institutionName}** | **Nasabah / Mitra** |
| (Meterai Rp 10.000) | (Meterai Rp 10.000) |
| <br><br><br> | <br><br><br> |
| **${institutionSignerName}** | **${customerName}** |
| ${institutionSignerTitle} | Pihak Kedua |

*Dokumen ini diterbitkan secara otomatis dan terverifikasi oleh Sharia Contract Engine (SCE).*
`;
  }
}

