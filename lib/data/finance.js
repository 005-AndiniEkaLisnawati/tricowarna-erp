// Kas lapangan: advances (kasbon proyek), expenses, settlement. Fictional data.

export const expenseCategories = [
  { name: "Material Bangunan - Semen & Besi", coa: "5-1101", coaName: "HPP Material" },
  { name: "Material Alam - Pasir & Batu", coa: "5-1102", coaName: "HPP Material Alam" },
  { name: "Sewa Alat Berat", coa: "5-1301", coaName: "HPP Sewa Peralatan" },
  { name: "Upah Tukang Harian", coa: "5-1201", coaName: "HPP Upah Langsung" },
  { name: "BBM & Pelumas", coa: "6-1105", coaName: "Beban BBM" },
  { name: "Gaji & BPJS", coa: "6-1101", coaName: "Beban Gaji" },
  { name: "Entertainment", coa: "6-1201", coaName: "Beban Jamuan" },
  { name: "Atensi", coa: "6-1202", coaName: "Beban Atensi" },
  { name: "ATK & Fotokopi", coa: "6-1301", coaName: "Beban ATK" },
  { name: "Seminar & Pelatihan", coa: "6-1401", coaName: "Beban Pelatihan" },
  { name: "SKK / SKA", coa: "6-1402", coaName: "Beban Sertifikasi" },
  { name: "Rumah Tangga Kantor", coa: "6-1302", coaName: "Beban RT Kantor" },
];

export const categoryByName = Object.fromEntries(expenseCategories.map((c) => [c.name, c]));

export const advances = [
  { no: "ADV-2026-0412", date: "2026-09-02", pic: "Hendra Gunawan", initials: "HG", project: "PRJ-TRT-2026-001", purpose: "Kas lapangan September – pembelian material kecil & upah harian", amount: 75_000_000, realized: 68_450_000, status: "Settle Sebagian" },
  { no: "ADV-2026-0418", date: "2026-09-10", pic: "Yusuf Ramadhan", initials: "YR", project: "PRJ-TRT-2026-002", purpose: "BBM excavator & dump truck – minggu 37–38", amount: 42_000_000, realized: 0, status: "Outstanding" },
  { no: "ADV-2026-0421", date: "2026-09-14", pic: "Hendra Gunawan", initials: "HG", project: "PRJ-TRT-2026-001", purpose: "Semen & besi darurat pengecoran abutment A2", amount: 15_000_000, realized: 0, status: "Outstanding" },
  { no: "ADV-2026-0425", date: "2026-09-19", pic: "Maya Anggraini", initials: "MA", project: "PRJ-TRT-2026-004", purpose: "Mobilisasi & sewa base camp Kuala Secapah", amount: 120_000_000, realized: 118_200_000, status: "Settle Sebagian" },
  { no: "ADV-2026-0431", date: "2026-09-26", pic: "Yusuf Ramadhan", initials: "YR", project: "PRJ-TRT-2026-002", purpose: "Upah tukang harian minggu 39", amount: 28_500_000, realized: 28_500_000, status: "Settled" },
  { no: "ADV-2026-0436", date: "2026-10-01", pic: "Dimas Prakoso", initials: "DP", project: null, costCenter: "CC-300", purpose: "Biaya cetak & legalisir dokumen tender Sungai Burung", amount: 6_500_000, realized: 0, status: "Outstanding" },
  { no: "ADV-2026-0398", date: "2026-08-12", pic: "Agus Salim", initials: "AS", project: "PRJ-TRT-2026-002", purpose: "Pembelian aspal curah & pengiriman", amount: 64_000_000, realized: 51_300_000, status: "Settle Sebagian" },
];

export const expenses = [
  { no: "EXP-2026-1287", date: "2026-10-07", vendor: "SPBU 64.781.03 Ambawang", category: "BBM & Pelumas", project: "PRJ-TRT-2026-001", amount: 4_860_000, advance: "ADV-2026-0412", status: "Disetujui", ai: 97.8, by: "Hendra Gunawan" },
  { no: "EXP-2026-1285", date: "2026-10-06", vendor: "CV Batu Alam Mempawah", category: "Material Alam - Pasir & Batu", project: "PRJ-TRT-2026-004", amount: 18_750_000, advance: "ADV-2026-0425", status: "Menunggu Approval", ai: 95.2, by: "Maya Anggraini" },
  { no: "EXP-2026-1281", date: "2026-10-05", vendor: "Toko Bangunan Sinar Kubu", category: "Material Bangunan - Semen & Besi", project: "PRJ-TRT-2026-001", amount: 7_340_000, advance: "ADV-2026-0412", status: "Disetujui", ai: 98.9, by: "Hendra Gunawan" },
  { no: "EXP-2026-1276", date: "2026-10-03", vendor: "Rumah Makan Simpang Raya", category: "Entertainment", project: null, costCenter: "CC-100", amount: 2_150_000, advance: null, status: "Menunggu Approval", ai: 99.3, by: "Dimas Prakoso" },
  { no: "EXP-2026-1270", date: "2026-10-02", vendor: "PT Sarana Alat Berat Borneo", category: "Sewa Alat Berat", project: "PRJ-TRT-2026-002", amount: 36_000_000, advance: null, status: "Disetujui", ai: null, by: "Agus Salim" },
  { no: "EXP-2026-1264", date: "2026-09-30", vendor: "Koperasi Tukang Punggur", category: "Upah Tukang Harian", project: "PRJ-TRT-2026-002", amount: 28_500_000, advance: "ADV-2026-0431", status: "Posted", ai: 91.6, by: "Yusuf Ramadhan" },
  { no: "EXP-2026-1259", date: "2026-09-29", vendor: "LPJK Kalbar", category: "SKK / SKA", project: null, costCenter: "CC-300", amount: 3_750_000, advance: null, status: "Ditolak", ai: 96.1, by: "Dimas Prakoso", note: "Duplikat dengan EXP-2026-1241" },
  { no: "EXP-2026-1252", date: "2026-09-27", vendor: "Fotocopy Pratama", category: "ATK & Fotokopi", project: null, costCenter: "CC-300", amount: 1_185_000, advance: null, status: "Posted", ai: 98.2, by: "Dimas Prakoso" },
];

// What the mock OCR "reads" off the sample receipt.
export const ocrResult = {
  vendor: { value: "PT Material Jaya Utama", confidence: 97.2 },
  date: { value: "2026-10-08", confidence: 99.1 },
  amount: { value: 12_500_000, confidence: 98.4 },
  category: { value: "Material Bangunan - Semen & Besi", confidence: 94.6 },
  invoiceNo: { value: "INV/MJU/X/2026/0817", confidence: 96.3 },
  npwp: { value: "0213 4478 1092 8000", confidence: 93.8 },
  lines: [
    { desc: "Semen PCC 50 kg", qty: 120, unit: "sak", price: 68_000 },
    { desc: "Besi beton ulir D13 – 12 m", qty: 31, unit: "btg", price: 140_000 },
  ],
};
