// Akuntansi & pajak — General Ledger, laporan keuangan kolumnar per proyek,
// konsolidasi grup, dan faktur/bukti potong Coretax. Fictional demo data.
// Semua jurnal seimbang; laporan dihitung dari angka dasar agar konsisten
// (Laba bersih L/R YTD = Laba tahun berjalan di Neraca; Neraca seimbang per kolom).

/* ───────────────────────── Bagan akun (COA) ───────────────────────── */

export const coa = [
  { code: "1-1101", name: "Kas Kecil Kantor", group: "Aset" },
  { code: "1-1102", name: "Kas Kecil Proyek", group: "Aset" },
  { code: "1-1201", name: "Bank BCA Operasional", group: "Aset" },
  { code: "1-1202", name: "Bank Mandiri Proyek", group: "Aset" },
  { code: "1-1301", name: "Piutang Usaha / Termin", group: "Aset" },
  { code: "1-1302", name: "Piutang Afiliasi", group: "Aset" },
  { code: "1-1310", name: "Tagihan Bruto Pemberi Kerja", group: "Aset" },
  { code: "1-1401", name: "Uang Muka Kerja", group: "Aset" },
  { code: "1-1501", name: "PPN Masukan", group: "Aset" },
  { code: "1-1601", name: "PPh Final 4(2) Dibayar Dimuka", group: "Aset" },
  { code: "1-2101", name: "Peralatan & Alat Berat", group: "Aset" },
  { code: "1-2901", name: "Akumulasi Penyusutan", group: "Aset" },
  { code: "2-1101", name: "Utang Usaha", group: "Liabilitas" },
  { code: "2-1201", name: "PPN Keluaran", group: "Liabilitas" },
  { code: "2-1202", name: "Utang PPh 23", group: "Liabilitas" },
  { code: "2-1203", name: "Utang PPh 4(2)", group: "Liabilitas" },
  { code: "2-1204", name: "Utang PPh 21", group: "Liabilitas" },
  { code: "2-1301", name: "Uang Muka dari Pemberi Kerja", group: "Liabilitas" },
  { code: "2-1401", name: "Utang Afiliasi", group: "Liabilitas" },
  { code: "3-1101", name: "Modal Disetor", group: "Ekuitas" },
  { code: "3-1201", name: "Saldo Laba", group: "Ekuitas" },
  { code: "4-1101", name: "Pendapatan Kontrak", group: "Pendapatan" },
  { code: "5-1101", name: "HPP Material", group: "HPP" },
  { code: "5-1102", name: "HPP Material Alam", group: "HPP" },
  { code: "5-1201", name: "HPP Upah Langsung", group: "HPP" },
  { code: "5-1301", name: "HPP Sewa Peralatan", group: "HPP" },
  { code: "5-1401", name: "HPP Jasa Subkontraktor", group: "HPP" },
  { code: "6-1101", name: "Beban Gaji", group: "Beban" },
  { code: "6-1105", name: "Beban BBM", group: "Beban" },
  { code: "6-1301", name: "Beban ATK", group: "Beban" },
  { code: "6-1501", name: "Beban Penyusutan", group: "Beban" },
  { code: "7-1101", name: "Pendapatan Bunga Jasa Giro", group: "Lain-lain" },
  { code: "7-2101", name: "Beban Bunga Pinjaman Afiliasi", group: "Lain-lain" },
  { code: "7-2102", name: "Beban Administrasi Bank", group: "Lain-lain" },
  { code: "8-1101", name: "Beban PPh Final 4(2)", group: "Pajak" },
];

export const coaByCode = Object.fromEntries(coa.map((a) => [a.code, a]));

export const isCashAccount = (code) => code.startsWith("1-11") || code.startsWith("1-12");

/* ───────────────────────── General Ledger ───────────────────────── */

export const glSources = {
  bank: { label: "Bank", tone: "blue" },
  kas: { label: "Kas Kecil", tone: "amber" },
  pembelian: { label: "Pembelian", tone: "violet" },
  expense: { label: "Expense", tone: "green" },
  manual: { label: "Manual", tone: "neutral" },
  penyesuaian: { label: "Penyesuaian", tone: "neutral" },
};

// Prefix nomor jurnal per sumber — sama dengan buku Excel tim akuntansi.
export const journalPrefix = {
  BCA: "bank",
  MDR: "bank",
  KKP: "kas",
  PB: "pembelian",
  JE: "expense",
  JU: "manual",
  AJP: "penyesuaian",
};

const P1 = "PRJ-TRT-2026-001";
const P2 = "PRJ-TRT-2026-002";
const P4 = "PRJ-TRT-2026-004";

export const journals = [
  {
    no: "BCA-01",
    date: "2026-09-02",
    source: "bank",
    desc: "Pencairan kasbon kas lapangan September – Hendra Gunawan",
    doc: "ADV-2026-0412",
    cashflow: "Operasi",
    detail: { type: "Kasbon (Uang Muka Kerja)", party: "Hendra Gunawan · Site Manager Jembatan A", approval: "Disetujui L2 · Bambang Sutrisno, 1 Sep 2026", posted: "Auto-post saat transfer BCA terkonfirmasi" },
    lines: [
      { acc: "1-1401", dr: 75_000_000, project: P1, memo: "UMK ADV-2026-0412" },
      { acc: "1-1201", cr: 75_000_000, project: P1 },
    ],
  },
  {
    no: "BCA-02",
    date: "2026-09-08",
    source: "bank",
    desc: "Pinjaman dari PT Trico Bahari Konstruksi – tahap II",
    doc: "ICL-2026-007",
    cashflow: "Pendanaan",
    intercompany: {
      company: "TBK",
      mirror: "JU-TBK-0412",
      lines: [
        { acc: "1-1302", name: "Piutang Afiliasi – PT Tricowarna Karya Nusantara", dr: 500_000_000 },
        { acc: "1-1201", name: "Bank BCA Operasional", cr: 500_000_000 },
      ],
    },
    detail: { type: "Perjanjian Pinjaman Antar Perusahaan", party: "PT Trico Bahari Konstruksi (TBK)", approval: "Board approval grup · Direktur Utama, 5 Sep 2026", posted: "Jurnal cermin dibuat otomatis di buku TBK" },
    lines: [
      { acc: "1-1201", dr: 500_000_000, project: null, memo: "Tahap II · bunga 10% p.a." },
      { acc: "2-1401", cr: 500_000_000, project: null, memo: "Utang afiliasi – TBK" },
    ],
  },
  {
    no: "BCA-03",
    date: "2026-09-10",
    source: "bank",
    desc: "Pencairan kasbon BBM excavator & dump truck – Yusuf Ramadhan",
    doc: "ADV-2026-0418",
    cashflow: "Operasi",
    detail: { type: "Kasbon (Uang Muka Kerja)", party: "Yusuf Ramadhan · Pelaksana Jalan B", approval: "Disetujui L1 · Agus Salim, 9 Sep 2026", posted: "Auto-post saat transfer BCA terkonfirmasi" },
    lines: [
      { acc: "1-1401", dr: 42_000_000, project: P2, memo: "UMK ADV-2026-0418" },
      { acc: "1-1201", cr: 42_000_000, project: P2 },
    ],
  },
  {
    no: "JU-01",
    date: "2026-09-12",
    source: "manual",
    desc: "Penagihan termin 3 Jembatan Sei Ambawang (BAPP progres 60%)",
    doc: "INV-2026-0091",
    cashflow: null,
    detail: { type: "Invoice Termin", party: "Satker PJN Wilayah I Prov. Kalbar – Ditjen Bina Marga", approval: "BAPP No. 091/BAPP/PJN-I/IX/2026", posted: "Rina Kartikasari · 12 Sep 2026 16:20" },
    lines: [
      { acc: "1-1301", dr: 1_998_000_000, project: P1, memo: "Termin 3" },
      { acc: "4-1101", cr: 1_800_000_000, project: P1 },
      { acc: "2-1201", cr: 198_000_000, project: P1, memo: "PPN 12% × DPP 11/12" },
    ],
  },
  {
    no: "PB-01",
    date: "2026-09-18",
    source: "pembelian",
    desc: "Semen PCC & besi beton ulir – pengecoran pilar P2",
    doc: "BILL-2026-0466",
    ref: "PO-2026-0318",
    cashflow: null,
    detail: { type: "Tagihan Pembelian (3-way match)", party: "PT Semen Borneo Perkasa", approval: "PO-2026-0318 · GRN-2026-0544 · Match", posted: "Auto-post saat bill disetujui" },
    lines: [
      { acc: "5-1101", dr: 250_000_000, project: P1 },
      { acc: "1-1501", dr: 27_500_000, project: P1, memo: "FP 04002600000231184" },
      { acc: "2-1101", cr: 277_500_000, project: P1 },
    ],
  },
  {
    no: "PB-02",
    date: "2026-09-22",
    source: "pembelian",
    desc: "Jasa pemancangan tiang pancang spun pile – progres 40%",
    doc: "BILL-2026-0471",
    ref: "PO-2026-0322",
    cashflow: null,
    detail: { type: "Tagihan Subkontraktor", party: "CV Pancang Mandiri", approval: "Opname progres 40% · PO-2026-0322", posted: "Auto-post saat bill disetujui" },
    lines: [
      { acc: "5-1401", dr: 420_000_000, project: P1 },
      { acc: "1-1501", dr: 46_200_000, project: P1 },
      { acc: "2-1101", cr: 458_850_000, project: P1 },
      { acc: "2-1203", cr: 7_350_000, project: P1, memo: "PPh 4(2) 1,75% subkon" },
    ],
  },
  {
    no: "MDR-01",
    date: "2026-09-24",
    source: "bank",
    desc: "Penerimaan uang muka 15% Kampung Nelayan Merah Putih",
    doc: "INV-2026-0094",
    cashflow: "Operasi",
    detail: { type: "Invoice Uang Muka", party: "Satker Ditjen Perikanan Tangkap – KKP", approval: "Jaminan uang muka BG-2026-0117", posted: "Auto-post dari mutasi rekening Mandiri" },
    lines: [
      { acc: "1-1202", dr: 3_638_694_757, project: P4 },
      { acc: "1-1601", dr: 99_050_243, project: P4, memo: "PPh 4(2) 2,65% dipotong" },
      { acc: "2-1301", cr: 3_737_745_000, project: P4 },
    ],
  },
  {
    no: "MDR-02",
    date: "2026-09-26",
    source: "bank",
    desc: "Penerimaan termin 3 Jembatan Sei Ambawang dari KPPN",
    doc: "INV-2026-0091",
    cashflow: "Operasi",
    detail: { type: "SP2D", party: "KPPN Pontianak a.n. Satker PJN Wilayah I", approval: "SP2D No. 260931201004218", posted: "Auto-post dari mutasi rekening Mandiri" },
    lines: [
      { acc: "1-1202", dr: 1_752_300_000, project: P1 },
      { acc: "8-1101", dr: 47_700_000, project: P1, memo: "PPh final 2,65%" },
      { acc: "2-1201", dr: 198_000_000, project: P1, memo: "PPN dipungut WAPU" },
      { acc: "1-1301", cr: 1_998_000_000, project: P1 },
    ],
  },
  {
    no: "BCA-04",
    date: "2026-09-29",
    source: "bank",
    desc: "Pelunasan tagihan PT Semen Borneo Perkasa",
    doc: "BILL-2026-0466",
    cashflow: "Operasi",
    detail: { type: "Pembayaran Hutang", party: "PT Semen Borneo Perkasa", approval: "Payment run PR-2026-39 · Direktur Keuangan", posted: "Auto-post saat transfer BCA terkonfirmasi" },
    lines: [
      { acc: "2-1101", dr: 277_500_000, project: P1 },
      { acc: "1-1201", cr: 277_500_000, project: P1 },
    ],
  },
  {
    no: "KKP-01",
    date: "2026-09-30",
    source: "kas",
    desc: "Settlement upah tukang harian minggu 39 – Jalan B",
    doc: "EXP-2026-1264",
    cashflow: null,
    detail: { type: "Expense · settle kasbon ADV-2026-0431", party: "Koperasi Tukang Punggur", approval: "Disetujui L1 · Agus Salim", posted: "Auto-post saat settlement" },
    lines: [
      { acc: "5-1201", dr: 28_500_000, project: P2 },
      { acc: "1-1401", cr: 28_500_000, project: P2, memo: "ADV-2026-0431" },
    ],
  },
  {
    no: "JE-01",
    date: "2026-09-27",
    source: "expense",
    desc: "Fotokopi & jilid dokumen penawaran tender",
    doc: "EXP-2026-1252",
    cashflow: "Operasi",
    detail: { type: "Expense kantor", party: "Fotocopy Pratama", approval: "Disetujui L1 · Dimas Prakoso", posted: "Auto-post saat approval" },
    lines: [
      { acc: "6-1301", dr: 1_185_000, project: null, memo: "CC-300 Estimasi & Tender" },
      { acc: "1-1101", cr: 1_185_000, project: null },
    ],
  },
  {
    no: "AJP-01",
    date: "2026-09-30",
    source: "penyesuaian",
    desc: "Penyusutan peralatan & alat berat September 2026",
    doc: "DEP-2026-09",
    cashflow: null,
    detail: { type: "Jadwal Penyusutan Aset Tetap", party: "Modul Aset Tetap · garis lurus", approval: "Closing September · Rina Kartikasari", posted: "Batch closing 30 Sep 2026" },
    lines: [
      { acc: "6-1501", dr: 18_000_000, project: P1 },
      { acc: "6-1501", dr: 12_500_000, project: P2 },
      { acc: "6-1501", dr: 7_750_000, project: null, memo: "CC-600 Peralatan" },
      { acc: "1-2901", cr: 38_250_000, project: null },
    ],
  },
  {
    no: "AJP-02",
    date: "2026-09-30",
    source: "penyesuaian",
    desc: "Pengakuan tagihan bruto (metode persentase penyelesaian) Kampung Nelayan",
    doc: "POC-2026-09-004",
    cashflow: null,
    detail: { type: "Kertas kerja POC (PSAK 72)", party: "Progres fisik 9% · biaya aktual vs estimasi total", approval: "Direview Controller", posted: "Batch closing 30 Sep 2026" },
    lines: [
      { acc: "1-1310", dr: 640_000_000, project: P4 },
      { acc: "4-1101", cr: 640_000_000, project: P4 },
    ],
  },
  {
    no: "AJP-03",
    date: "2026-09-30",
    source: "penyesuaian",
    desc: "Akrual bunga pinjaman PT Trico Bahari Konstruksi – September",
    doc: "ICL-2026-007",
    cashflow: null,
    intercompany: {
      company: "TBK",
      mirror: "AJP-TBK-0093",
      lines: [
        { acc: "1-1302", name: "Piutang Afiliasi – PT Tricowarna Karya Nusantara", dr: 12_500_000 },
        { acc: "7-1102", name: "Pendapatan Bunga Pinjaman Afiliasi", cr: 12_500_000 },
      ],
    },
    detail: { type: "Akrual bunga antar perusahaan", party: "PT Trico Bahari Konstruksi (TBK)", approval: "Rp1,5 M × 10% ÷ 12", posted: "Batch closing 30 Sep 2026" },
    lines: [
      { acc: "7-2101", dr: 12_500_000, project: null },
      { acc: "2-1401", cr: 12_500_000, project: null },
    ],
  },
  {
    no: "JE-02",
    date: "2026-10-02",
    source: "expense",
    desc: "Sewa excavator PC200 – pekerjaan galian badan jalan",
    doc: "EXP-2026-1270",
    cashflow: null,
    detail: { type: "Expense proyek (via AP)", party: "PT Sarana Alat Berat Borneo", approval: "Disetujui L1 · Agus Salim", posted: "Auto-post saat approval" },
    lines: [
      { acc: "5-1301", dr: 36_000_000, project: P2 },
      { acc: "2-1101", cr: 36_000_000, project: P2 },
    ],
  },
  {
    no: "KKP-02",
    date: "2026-10-05",
    source: "kas",
    desc: "Semen & besi darurat pengecoran abutment",
    doc: "EXP-2026-1281",
    cashflow: null,
    detail: { type: "Expense · potong kasbon ADV-2026-0412", party: "Toko Bangunan Sinar Kubu", approval: "Disetujui L1 · Hendra Gunawan", posted: "Auto-post saat approval" },
    lines: [
      { acc: "5-1101", dr: 7_340_000, project: P1 },
      { acc: "1-1401", cr: 7_340_000, project: P1, memo: "ADV-2026-0412" },
    ],
  },
  {
    no: "BCA-05",
    date: "2026-10-06",
    source: "bank",
    desc: "Pembayaran gaji staf kantor pusat September 2026",
    doc: "PAY-2026-09",
    cashflow: "Operasi",
    detail: { type: "Payroll", party: "42 karyawan kantor pusat", approval: "Disetujui Direktur Keuangan", posted: "Auto-post dari modul payroll" },
    lines: [
      { acc: "6-1101", dr: 186_400_000, project: null, memo: "CC-100 / CC-200" },
      { acc: "1-1201", cr: 182_300_000, project: null },
      { acc: "2-1204", cr: 4_100_000, project: null, memo: "PPh 21 TER" },
    ],
  },
  {
    no: "KKP-03",
    date: "2026-10-07",
    source: "kas",
    desc: "BBM solar genset & kendaraan proyek",
    doc: "EXP-2026-1287",
    cashflow: null,
    detail: { type: "Expense · potong kasbon ADV-2026-0412", party: "SPBU 64.781.03 Ambawang", approval: "Disetujui L1 · Hendra Gunawan", posted: "Auto-post saat approval" },
    lines: [
      { acc: "6-1105", dr: 4_860_000, project: P1 },
      { acc: "1-1401", cr: 4_860_000, project: P1, memo: "ADV-2026-0412" },
    ],
  },
  {
    no: "BCA-06",
    date: "2026-10-08",
    source: "bank",
    desc: "Setoran PPh 4(2) masa September via e-Billing",
    doc: "NTPN 0A8F3C21D9E70B4K",
    cashflow: "Operasi",
    detail: { type: "Setoran Pajak", party: "Kas Negara · KAP 411128 / KJS 409", approval: "Kode billing 826092212345678", posted: "Auto-post dari bukti penerimaan negara" },
    lines: [
      { acc: "2-1203", dr: 7_350_000, project: P1 },
      { acc: "1-1201", cr: 7_350_000, project: null },
    ],
  },
].sort((a, b) => (a.date === b.date ? a.no.localeCompare(b.no) : a.date.localeCompare(b.date)));

/* ───────────────────────── Laporan keuangan ───────────────────────── */

export const reportPeriods = [
  { value: "ytd", label: "Jan–Sep 2026 (YTD)", short: "1 Jan – 30 Sep 2026" },
  { value: "q3", label: "Q3 2026 (Jul–Sep)", short: "1 Jul – 30 Sep 2026" },
  { value: "sep", label: "September 2026", short: "1 – 30 Sep 2026" },
];

export const segmentColumns = [
  { key: "PUSAT", code: "Pusat", short: "Kantor pusat" },
  { key: P1, code: P1, short: "Jembatan A" },
  { key: P2, code: P2, short: "Jalan B" },
  { key: P4, code: P4, short: "Kampung Nelayan" },
];

export const consolColumns = [
  { key: "TKN", code: "TKN", short: "Tricowarna Karya N." },
  { key: "TBK", code: "TBK", short: "Trico Bahari K." },
  { key: "TBP", code: "TBP", short: "Tricowarna Beton P." },
  { key: "ELIM", code: "Eliminasi", short: "Intercompany", elim: true },
];

// Margin kotor menurut RAB (anggaran biaya) per proyek, untuk analisis AI.
export const rabMargin = { [P1]: 22.5, [P2]: 21.0, [P4]: 18.0 };

export const PPH_FINAL_RATE = 0.0265;

// Laba rugi YTD — kolom [Pusat, P1, P2, P4]. Beban disimpan negatif.
const segLR = {
  rev: [0, 11_556_800_000, 4_284_690_000, 2_242_647_000],
  mat: [0, -4_622_720_000, -1_799_570_000, -1_008_190_000],
  sub: [0, -2_080_220_000, -642_700_000, -380_000_000],
  upah: [0, -1_155_680_000, -556_980_000, -268_400_000],
  alat: [0, -924_540_000, -471_320_000, -195_600_000],
  gaji: [-1_642_800_000, -186_400_000, -112_300_000, -64_900_000],
  bbm: [-96_450_000, -58_320_000, -71_900_000, -22_150_000],
  susut: [-69_750_000, -162_000_000, -112_500_000, -31_200_000],
  umum: [-287_640_000, -41_800_000, -28_650_000, -19_300_000],
  bunga: [18_420_000, 0, 0, 0],
  icInc: [0, 0, 0, 0],
  icExp: [-37_500_000, 0, 0, 0],
  bank: [-6_180_000, -2_140_000, -1_380_000, -960_000],
};

const entityLR = {
  TBK: { rev: 6_842_000_000, mat: -2_394_700_000, sub: -1_231_560_000, upah: -889_460_000, alat: -1_026_300_000, gaji: -412_600_000, bbm: -88_400_000, susut: -214_800_000, umum: -96_300_000, bunga: 6_840_000, icInc: 37_500_000, icExp: 0, bank: -2_860_000 },
  TBP: { rev: 3_215_400_000, mat: -1_864_900_000, sub: 0, upah: -412_300_000, alat: -96_800_000, gaji: -236_400_000, bbm: -41_200_000, susut: -168_000_000, umum: -54_900_000, bunga: 3_120_000, icInc: 0, icExp: 0, bank: -1_460_000 },
  // Penjualan girder precast TBP → TKN dan bunga pinjaman TBK → TKN.
  ELIM: { rev: -1_264_000_000, mat: 1_264_000_000, sub: 0, upah: 0, alat: 0, gaji: 0, bbm: 0, susut: 0, umum: 0, bunga: 0, icInc: -37_500_000, icExp: 37_500_000, bank: 0 },
};

const pphRate = { TBK: PPH_FINAL_RATE, TBP: 0, ELIM: 0 };

const periodFactor = {
  ytd: { seg: [1, 1, 1, 1], TBK: 1, TBP: 1, ELIM: 1 },
  q3: { seg: [0.34, 0.38, 0.44, 0.82], TBK: 0.36, TBP: 0.33, ELIM: 0.35 },
  sep: { seg: [0.115, 0.13, 0.16, 0.34], TBK: 0.12, TBP: 0.11, ELIM: 0.12 },
};
// Bunga pinjaman afiliasi Rp12,5 jt/bulan sejak Juli — tidak diskalakan proporsional.
const icFactor = { ytd: 1, q3: 1, sep: 1 / 3 };

const r1000 = (v) => Math.round(v / 1000) * 1000;

function scaleLeaf(key, value, factor, period) {
  if (key === "icInc" || key === "icExp") return Math.round(value * icFactor[period]);
  return factor === 1 ? value : r1000(value * factor);
}

export const lrLayout = [
  { type: "section", label: "Pendapatan Usaha" },
  { key: "rev", label: "Pendapatan kontrak (termin & tagihan bruto)", coa: "4-1101" },
  { type: "subtotal", key: "revT", label: "Jumlah pendapatan usaha", sum: ["rev"] },
  { type: "section", label: "Beban Pokok Pendapatan (HPP)" },
  { key: "mat", label: "Material", coa: "5-1101" },
  { key: "sub", label: "Jasa subkontraktor", coa: "5-1401" },
  { key: "upah", label: "Gaji & upah lapangan", coa: "5-1201" },
  { key: "alat", label: "Sewa alat berat", coa: "5-1301" },
  { type: "subtotal", key: "hppT", label: "Jumlah HPP", sum: ["mat", "sub", "upah", "alat"] },
  { type: "total", key: "gp", label: "Laba kotor", sum: ["revT", "hppT"] },
  { type: "margin", key: "gpm", label: "Margin laba kotor", of: "gp" },
  { type: "section", label: "Beban Administrasi & Umum" },
  { key: "gaji", label: "Gaji & tunjangan staf", coa: "6-1101" },
  { key: "bbm", label: "BBM & operasional kendaraan", coa: "6-1105" },
  { key: "susut", label: "Penyusutan aset tetap", coa: "6-1501" },
  { key: "umum", label: "Umum & administrasi lainnya", coa: "6-1301" },
  { type: "subtotal", key: "admT", label: "Jumlah beban adm & umum", sum: ["gaji", "bbm", "susut", "umum"] },
  { type: "total", key: "ebit", label: "Laba usaha", sum: ["gp", "admT"] },
  { type: "section", label: "Pendapatan / (Beban) Lain-lain" },
  { key: "bunga", label: "Pendapatan bunga jasa giro", coa: "7-1101" },
  { key: "icInc", label: "Pendapatan bunga pinjaman afiliasi", coa: "7-1102", ic: true },
  { key: "icExp", label: "Beban bunga pinjaman afiliasi", coa: "7-2101", ic: true },
  { key: "bank", label: "Beban administrasi bank", coa: "7-2102" },
  { type: "subtotal", key: "othT", label: "Jumlah lain-lain", sum: ["bunga", "icInc", "icExp", "bank"] },
  { type: "total", key: "ebt", label: "Laba sebelum PPh final", sum: ["ebit", "othT"] },
  { key: "pph", label: "PPh final Pasal 4(2) jasa konstruksi (2,65%)", coa: "8-1101" },
  { type: "grand", key: "net", label: "Laba bersih", sum: ["ebt", "pph"] },
  { type: "margin", key: "npm", label: "Margin laba bersih", of: "net" },
];

const lrLeafKeys = lrLayout.filter((r) => !r.type).map((r) => r.key);

function evalLayout(layout, leaf, n) {
  // leaf: key -> number[n]; returns key -> number[n] including subtotals.
  const out = { ...leaf };
  for (const row of layout) {
    if (row.sum) out[row.key] = Array.from({ length: n }, (_, i) => row.sum.reduce((s, k) => s + out[k][i], 0));
  }
  return out;
}

/** Leaf values per column for the L/R, before subtotals. */
function lrLeaves(period, mode) {
  const f = periodFactor[period];
  const leaf = {};
  if (mode === "entity") {
    for (const k of lrLeafKeys) {
      if (k === "pph") continue;
      leaf[k] = segLR[k].map((v, i) => scaleLeaf(k, v, f.seg[i], period));
    }
    leaf.pph = leaf.rev.map((v) => -Math.round(v * PPH_FINAL_RATE));
  } else {
    const seg = lrLeaves(period, "entity");
    const ents = ["TBK", "TBP", "ELIM"];
    for (const k of lrLeafKeys) {
      const tkn = seg[k].reduce((s, v) => s + v, 0);
      if (k === "pph") {
        leaf.pph = [tkn, ...ents.map((e) => -Math.round(scaleLeaf("rev", entityLR[e].rev, f[e], period) * pphRate[e]))];
      } else {
        leaf[k] = [tkn, ...ents.map((e) => scaleLeaf(k, entityLR[e][k], f[e], period))];
      }
    }
  }
  return leaf;
}

function withTotal(values) {
  const out = {};
  for (const [k, arr] of Object.entries(values)) out[k] = [...arr, arr.reduce((s, v) => s + v, 0)];
  return out;
}

export function buildLR(period, mode) {
  const leaf = withTotal(lrLeaves(period, mode));
  const n = leaf.rev.length;
  const v = evalLayout(lrLayout, leaf, n);
  for (const row of lrLayout) {
    if (row.type === "margin") v[row.key] = v[row.of].map((x, i) => (v.revT[i] ? (x / v.revT[i]) * 100 : null));
  }
  return v;
}

/* ── Neraca per 30 Sep 2026 ── */

const segBS = {
  piut: [0, 1_240_000_000, 684_500_000, 0],
  piutAff: [0, 0, 0, 0],
  wip: [0, 865_300_000, 412_800_000, 640_000_000],
  umk: [6_500_000, 21_550_000, 54_700_000, 1_800_000],
  ppn: [312_480_000, 0, 0, 99_050_000],
  at: [2_184_000_000, 1_268_000_000, 842_500_000, 486_300_000],
  ut: [124_800_000, 1_036_400_000, 518_700_000, 742_300_000],
  utPajak: [186_350_000, 7_350_000, 0, 0],
  umPk: [0, 932_000_000, 1_127_550_000, 3_737_745_000],
  utAff: [1_537_500_000, 0, 0, 0],
  modal: [5_000_000_000, 0, 0, 0],
  saldo: [1_846_000_000, 0, 0, 0],
  kasProyek: [null, 48_600_000, 31_250_000, 92_400_000],
};

const entityBS = {
  TBK: { piut: 1_486_200_000, piutAff: 1_537_500_000, wip: 524_000_000, umk: 38_400_000, ppn: 96_700_000, at: 3_412_000_000, ut: 864_300_000, utPajak: 74_200_000, umPk: 1_215_000_000, utAff: 0, modal: 4_000_000_000, saldo: 1_273_000_000 },
  TBP: { piut: 842_600_000, piutAff: 0, wip: 0, umk: 12_300_000, ppn: 58_900_000, at: 2_946_000_000, ut: 312_700_000, utPajak: 41_800_000, umPk: 0, utAff: 0, modal: 2_500_000_000, saldo: 1_082_000_000 },
  ELIM: { piut: -418_600_000, piutAff: -1_537_500_000, wip: 0, umk: 0, ppn: 0, at: 0, ut: -418_600_000, utPajak: 0, umPk: 0, utAff: -1_537_500_000, modal: 0, saldo: 0 },
};

export const bsLayout = [
  { type: "section", label: "Aset Lancar" },
  { key: "kas", label: "Kas & bank", coa: "1-1201", side: "A" },
  { key: "piut", label: "Piutang usaha / termin", coa: "1-1301", side: "A" },
  { key: "piutAff", label: "Piutang afiliasi", coa: "1-1302", side: "A", ic: true },
  { key: "wip", label: "Tagihan bruto pemberi kerja (WIP)", coa: "1-1310", side: "A" },
  { key: "umk", label: "Uang muka kerja", coa: "1-1401", side: "A" },
  { key: "ppn", label: "PPN masukan & pajak dibayar dimuka", coa: "1-1501", side: "A" },
  { type: "subtotal", key: "alT", label: "Jumlah aset lancar", sum: ["kas", "piut", "piutAff", "wip", "umk", "ppn"] },
  { type: "section", label: "Aset Tidak Lancar" },
  { key: "at", label: "Aset tetap – neto setelah akumulasi penyusutan", coa: "1-2101", side: "A" },
  { type: "subtotal", key: "atT", label: "Jumlah aset tidak lancar", sum: ["at"] },
  { type: "grand", key: "aset", label: "Jumlah aset", sum: ["alT", "atT"] },
  { type: "section", label: "Liabilitas" },
  { key: "ut", label: "Utang usaha", coa: "2-1101", side: "L" },
  { key: "utPajak", label: "Utang pajak (PPh & PPN)", coa: "2-1203", side: "L" },
  { key: "umPk", label: "Uang muka dari pemberi kerja", coa: "2-1301", side: "L" },
  { key: "utAff", label: "Utang afiliasi", coa: "2-1401", side: "L", ic: true },
  { type: "subtotal", key: "liabT", label: "Jumlah liabilitas", sum: ["ut", "utPajak", "umPk", "utAff"] },
  { type: "section", label: "Rekening Antar Kantor" },
  { key: "rk", label: "RK Pusat – Proyek", coa: "3-9101", side: "L" },
  { type: "section", label: "Ekuitas" },
  { key: "modal", label: "Modal disetor", coa: "3-1101", side: "L" },
  { key: "saldo", label: "Saldo laba", coa: "3-1201", side: "L" },
  { key: "laba", label: "Laba tahun berjalan", coa: "3-1301", side: "L" },
  { type: "subtotal", key: "eqT", label: "Jumlah ekuitas", sum: ["modal", "saldo", "laba"] },
  { type: "grand", key: "le", label: "Jumlah liabilitas & ekuitas", sum: ["liabT", "rk", "eqT"] },
];

const bsKeys = ["piut", "piutAff", "wip", "umk", "ppn", "at", "ut", "utPajak", "umPk", "utAff", "modal", "saldo"];
const assetKeys = ["piut", "piutAff", "wip", "umk", "ppn", "at"];
const liabKeys = ["ut", "utPajak", "umPk", "utAff"];

function bsLeaves(mode) {
  const net = lrLeaves("ytd", mode);
  const n = net.rev.length;
  const laba = Array.from({ length: n }, (_, i) => lrLeafKeys.reduce((s, k) => s + net[k][i], 0));
  const leaf = { laba };

  if (mode === "entity") {
    for (const k of bsKeys) leaf[k] = [...segBS[k]];
    leaf.kas = [0, ...segBS.kasProyek.slice(1)];
    leaf.rk = [0, 0, 0, 0];
    const sumAt = (keys, i) => keys.reduce((s, k) => s + leaf[k][i], 0);
    // Proyek: RK menjadi penyeimbang (kas termin & uang muka diterima di rekening pusat).
    for (let i = 1; i < 4; i++) leaf.rk[i] = leaf.kas[i] + sumAt(assetKeys, i) - sumAt(liabKeys, i) - laba[i];
    leaf.rk[0] = -(leaf.rk[1] + leaf.rk[2] + leaf.rk[3]);
    leaf.kas[0] = sumAt(liabKeys, 0) + leaf.rk[0] + leaf.modal[0] + leaf.saldo[0] + laba[0] - sumAt(assetKeys, 0);
  } else {
    const seg = bsLeaves("entity");
    const ents = ["TBK", "TBP", "ELIM"];
    for (const k of [...bsKeys, "kas", "rk"]) {
      const tkn = seg[k].reduce((s, v) => s + v, 0);
      leaf[k] = [tkn, ...ents.map((e) => entityBS[e][k] ?? 0)];
    }
    for (let i = 1; i < 4; i++) {
      if (ents[i - 1] === "ELIM") continue;
      const sa = assetKeys.reduce((s, k) => s + leaf[k][i], 0);
      const sl = liabKeys.reduce((s, k) => s + leaf[k][i], 0);
      leaf.kas[i] = sl + leaf.modal[i] + leaf.saldo[i] + laba[i] - sa;
    }
  }
  return leaf;
}

export function buildBS(mode) {
  const leaf = withTotal(bsLeaves(mode));
  return evalLayout(bsLayout, leaf, leaf.kas.length);
}

/* ── Neraca saldo (trial balance) per 30 Sep 2026 ── */

export function buildTB(mode) {
  const bs = withTotal(bsLeaves(mode));
  const lr = withTotal(lrLeaves("ytd", mode));
  const rows = [];
  for (const row of bsLayout) {
    if (row.type || row.key === "laba") continue;
    const values = bs[row.key].map((v) => (row.side === "A" ? v : -v));
    rows.push({ coa: row.coa, label: row.label, values, ic: row.ic });
  }
  for (const row of lrLayout) {
    if (row.type) continue;
    rows.push({ coa: row.coa, label: row.label, values: lr[row.key].map((v) => -v), ic: row.ic });
  }
  rows.sort((a, b) => a.coa.localeCompare(b.coa));
  return rows;
}

/* ───────────────────────── Pajak & Coretax ───────────────────────── */

export const taxPeriods = [
  { value: "2026-10", label: "Oktober 2026", note: "masa berjalan" },
  { value: "2026-09", label: "September 2026", note: "jatuh tempo lapor 31 Okt" },
  { value: "2026-08", label: "Agustus 2026", note: "sudah dilaporkan" },
];

export const coretaxSync = {
  lastSync: "2026-10-08T07:42:00",
  lastSyncLabel: "8 Okt 2026, 07.42 WIB",
  schema: "TaxInvoiceBulk v1.2",
  certificate: "Sertifikat elektronik aktif s.d. 14 Mar 2028",
};

// Harga = nilai penyerahan (belum PPN). DPP Nilai Lain = 11/12 × harga, PPN 12%.
export const fakturKeluaran = [
  { id: "FK-0816", no: "04002600000178204", date: "2026-08-14", buyer: "Dinas PUPR Kab. Kubu Raya", tin: "0003551288074000", idType: "NPWP", address: "Jl. Arteri Supadio Km 11, Sungai Raya", item: "Termin 1 – Peningkatan Jalan Ruas Sungai Kakap – Punggur", price: 1_690_000_000, trx: "02", project: P2, status: "Exported" },
  { id: "FK-0821", no: "04002600000178211", date: "2026-08-28", buyer: "Satker PJN Wilayah I Prov. Kalbar – Ditjen Bina Marga", tin: "0001240876139000", idType: "NPWP", address: "Jl. Sutan Syahrir No. 5, Pontianak", item: "Termin 2 – Pembangunan Jembatan Sei Ambawang", price: 2_330_000_000, trx: "02", project: P1, status: "Exported" },
  { id: "FK-0911", no: "04002600000184311", date: "2026-09-12", buyer: "Satker PJN Wilayah I Prov. Kalbar – Ditjen Bina Marga", tin: "0001240876139000", idType: "NPWP", address: "Jl. Sutan Syahrir No. 5, Pontianak", item: "Termin 3 – Pembangunan Jembatan Sei Ambawang (BAPP 60%)", price: 1_800_000_000, trx: "02", project: P1, status: "Siap Export" },
  { id: "FK-0912", no: "04002600000184312", date: "2026-09-15", buyer: "Dinas PUPR Kab. Kubu Raya", tin: "0003551288074000", idType: "NPWP", address: "Jl. Arteri Supadio Km 11, Sungai Raya", item: "Termin 2 – Peningkatan Jalan Ruas Sungai Kakap – Punggur", price: 1_240_000_000, trx: "02", project: P2, status: "Exported" },
  { id: "FK-0913", no: "04002600000184313", date: "2026-09-24", buyer: "Satker Ditjen Perikanan Tangkap – KKP", tin: "0001772094418000", idType: "NPWP", address: "Jl. Medan Merdeka Timur No. 16, Jakarta Pusat", item: "Uang muka 15% – Kampung Nelayan Merah Putih Kuala Secapah", price: 3_737_745_000, trx: "02", project: P4, status: "Siap Export" },
  { id: "FK-0914", no: "04002600000184314", date: "2026-09-25", buyer: "PT Borneo Dermaga Lestari", tin: "0215803364721000", idType: "NPWP", address: "Jl. Komyos Sudarso No. 88, Pontianak Barat", item: "Sewa crane 50T beserta operator – September 2026", price: 186_000_000, trx: "04", project: null, status: "Siap Export" },
  { id: "FK-0915", no: "04002600000184315", date: "2026-09-27", buyer: "CV Mitra Kapuas Mandiri", tin: "", idType: "NPWP", address: "Jl. Parit Haji Husin II, Pontianak", item: "Penjualan sisa material besi beton D16", price: 42_750_000, trx: "04", project: P1, status: "Siap Export" },
  { id: "FK-0916", no: "04002600000184316", date: "2026-09-29", buyer: "PT Kubu Raya Properti", tin: "0318447209165000", idType: "NPWP", address: "Jl. Adisucipto Km 9,5, Sungai Raya", item: "Pekerjaan jalan lingkungan Perumahan Graha Ambawang – Termin 1", price: 625_000_000, trx: "04", project: null, status: "Siap Export" },
  { id: "FK-0917", no: "04002600000184317", date: "2026-09-30", buyer: "H. Syarifuddin (Pemilik Tambak Secapah)", tin: "6104031207750002", idType: "NIK", address: "Desa Kuala Secapah, Mempawah Hilir", item: "Perbaikan tambatan perahu & turap kayu ulin", price: 96_500_000, trx: "04", project: P4, status: "Siap Export" },
  { id: "FK-0918", no: "04002600000184318", date: "2026-09-30", buyer: "PT Sentosa Bangun Persada", tin: "", idType: "NPWP", address: "Jl. Gajah Mada No. 141, Pontianak", item: "Jasa pengujian beton & core drill", price: 58_200_000, trx: "04", project: null, status: "Siap Export" },
  { id: "FK-1001", no: "04002600000190402", date: "2026-10-03", buyer: "PT Borneo Dermaga Lestari", tin: "0215803364721000", idType: "NPWP", address: "Jl. Komyos Sudarso No. 88, Pontianak Barat", item: "Sewa crane 50T beserta operator – Oktober 2026 (pro-rata)", price: 48_000_000, trx: "04", project: null, status: "Siap Export" },
  { id: "FK-1002", no: "04002600000190403", date: "2026-10-06", buyer: "Dinas PUPR Kab. Kubu Raya", tin: "0003551288074000", idType: "NPWP", address: "Jl. Arteri Supadio Km 11, Sungai Raya", item: "Termin 3 – Peningkatan Jalan Ruas Sungai Kakap – Punggur", price: 1_118_600_000, trx: "02", project: P2, status: "Siap Export" },
];

export const fakturMasukan = [
  { id: "FM-0811", no: "04002600000162231", date: "2026-08-20", seller: "PT Semen Borneo Perkasa", tin: "0211450873962000", doc: "BILL-2026-0431", price: 312_000_000, valid: true },
  { id: "FM-0901", no: "04002600000231184", date: "2026-09-18", seller: "PT Semen Borneo Perkasa", tin: "0211450873962000", doc: "BILL-2026-0466", price: 250_000_000, valid: true },
  { id: "FM-0902", no: "04002600000231977", date: "2026-09-22", seller: "CV Pancang Mandiri", tin: "0628114093701000", doc: "BILL-2026-0471", price: 420_000_000, valid: true },
  { id: "FM-0903", no: "04002600000232540", date: "2026-09-23", seller: "PT Tricowarna Beton Precast", tin: "0092114500783030", doc: "BILL-2026-0478", price: 418_600_000, valid: true, affiliate: true },
  { id: "FM-0904", no: "04002600000233016", date: "2026-09-25", seller: "PT Sarana Alat Berat Borneo", tin: "0743920156118000", doc: "BILL-2026-0480", price: 36_000_000, valid: true },
  { id: "FM-0905", no: "04002600000233582", date: "2026-09-26", seller: "UD Sumber Pasir Ambawang", tin: "", doc: "BILL-2026-0483", price: 68_400_000, valid: false, issue: "NPWP Kosong" },
  { id: "FM-0906", no: "04002600000234105", date: "2026-09-29", seller: "CV Karya Las Mandiri", tin: "0819 2207 31", doc: "BILL-2026-0489", price: 24_600_000, valid: false, issue: "NPWP Tidak Valid" },
  { id: "FM-1001", no: "04002600000241736", date: "2026-10-02", seller: "PT Sarana Alat Berat Borneo", tin: "0743920156118000", doc: "BILL-2026-0494", price: 36_000_000, valid: true },
];

// PPh potong/pungut. arah: "dipotong" = kita dipotong pihak lain (kredit/final),
// "memotong" = kita memotong & wajib setor.
export const pphPotput = [
  { id: "BP-01", date: "2026-08-28", type: "PPh 4(2)", direction: "dipotong", party: "Satker PJN Wilayah I Prov. Kalbar", object: "Jasa pelaksanaan konstruksi – kualifikasi menengah", base: 2_330_000_000, rate: 2.65, bp: "BPPU-2608-004102", status: "BP Diterima" },
  { id: "BP-02", date: "2026-09-15", type: "PPh 4(2)", direction: "dipotong", party: "Dinas PUPR Kab. Kubu Raya", object: "Jasa pelaksanaan konstruksi – kualifikasi menengah", base: 1_240_000_000, rate: 2.65, bp: "BPPU-2609-004187", status: "BP Diterima" },
  { id: "BP-03", date: "2026-09-24", type: "PPh 4(2)", direction: "dipotong", party: "Satker Ditjen Perikanan Tangkap – KKP", object: "Uang muka jasa pelaksanaan konstruksi", base: 3_737_745_000, rate: 2.65, bp: "BPPU-2609-004203", status: "BP Diterima" },
  { id: "BP-04", date: "2026-09-26", type: "PPh 4(2)", direction: "dipotong", party: "Satker PJN Wilayah I Prov. Kalbar", object: "Jasa pelaksanaan konstruksi – kualifikasi menengah", base: 1_800_000_000, rate: 2.65, bp: null, status: "Menunggu BP" },
  { id: "BP-05", date: "2026-09-22", type: "PPh 4(2)", direction: "memotong", party: "CV Pancang Mandiri", object: "Subkon pemancangan – kualifikasi kecil", base: 420_000_000, rate: 1.75, bp: "BPPU-2609-000318", status: "Disetor" },
  { id: "BP-06", date: "2026-09-29", type: "PPh 4(2)", direction: "memotong", party: "CV Karya Las Mandiri", object: "Jasa konstruksi – tanpa SBU", base: 24_600_000, rate: 4, bp: null, status: "Draft" },
  { id: "BP-07", date: "2026-09-25", type: "PPh 23", direction: "memotong", party: "PT Sarana Alat Berat Borneo", object: "Sewa alat berat (excavator PC200)", base: 36_000_000, rate: 2, bp: "BPPU-2609-000321", status: "BPPU Terbit" },
  { id: "BP-08", date: "2026-09-19", type: "PPh 23", direction: "memotong", party: "PT Geoteknika Survei Nusantara", object: "Jasa teknik – penyelidikan tanah (sondir & boring)", base: 48_500_000, rate: 2, bp: "BPPU-2609-000309", status: "BPPU Terbit" },
  { id: "BP-09", date: "2026-09-25", type: "PPh 23", direction: "dipotong", party: "PT Borneo Dermaga Lestari", object: "Sewa crane 50T", base: 186_000_000, rate: 2, bp: null, status: "Menunggu BP" },
  { id: "BP-10", date: "2026-10-02", type: "PPh 23", direction: "memotong", party: "PT Sarana Alat Berat Borneo", object: "Sewa alat berat (excavator PC200)", base: 36_000_000, rate: 2, bp: null, status: "Draft" },
];

export const dppNilaiLain = (price) => Math.round((price * 11) / 12);
export const ppn12 = (price) => Math.round(dppNilaiLain(price) * 0.12);
