// Budgeting v2 — Project Budget & Cost Center (department) budgets, structured by
// Kategori Biaya (COA cost codes) instead of work categories. Every total is derived
// from line items, so lists, statistics and detail pages always agree.
// Fictional demo data; amounts in rupiah.

const jt = (n) => Math.round(n * 1_000_000);

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const CURRENT_MONTH = 9; // Oktober 2026 (index), realisasi berjalan

export const costCategories = {
  21010: "BIAYA TENAGA KERJA",
  21020: "BIAYA MATERIAL",
  21030: "BIAYA SEWA ALAT BERAT",
  21040: "BIAYA SUBKONTRAKTOR",
  21050: "BIAYA AKOMODASI",
  6101: "BIAYA GAJI",
  6102: "BIAYA MCU",
  6202: "BIAYA TRANSPORTASI (BBM, TOL, PARKIR, TRANSPORT)",
  6205: "BIAYA SEWA (KENDARAAN, GEDUNG, PERALATAN KERJA)",
  6301: "BIAYA ATK & CETAK",
  6401: "BIAYA PELATIHAN & SERTIFIKASI",
  6501: "BIAYA ENTERTAINMENT & ATENSI",
  6601: "BIAYA K3 & APD",
};

/* ───────────────────────── helpers ───────────────────────── */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Item reference code in the style of the client's system (SE3A1DA, TM658F4…). */
function itemCode(seed, i) {
  const h = hash(`${seed}:${i}`);
  const prefix = ["SE", "TM", "SE", "TE"][h % 4];
  return prefix + (h >>> 4).toString(16).toUpperCase().slice(0, 5).padStart(5, "0");
}

/** Spread `total` over months [from..to] with gentle, deterministic variation. */
function spread(total, from, to, seed) {
  const n = to - from + 1;
  const months = Array(12).fill(0);
  if (!total || n <= 0) return months;
  const w = Array.from({ length: n }, (_, i) => 3 + ((hash(seed) >>> (i % 24)) % 5));
  const sum = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const v = i === n - 1 ? total - acc : Math.round((total * w[i]) / sum / 1000) * 1000;
    months[from + i] = v;
    acc += v;
  }
  return months;
}

/**
 * Build a budget from a compact spec:
 *   groups: { [coa]: [[name, budgetJt, commitmentJt, realizationJt, carryJt?], …] }
 * `period` = realisasi months [from, to] within the report year.
 */
function build(spec) {
  const [from, to] = spec.period ?? [0, CURRENT_MONTH];
  // Integer-like keys iterate in ascending COA order, which is the order we want.
  const groups = Object.entries(spec.groups).map(([coa, rows]) => ({
    coa,
    name: costCategories[coa],
    items: rows.map(([name, budget, commitment, realization, carry = 0], i) => {
      return {
        code: spec.codes?.[name] ?? itemCode(spec.id, `${coa}-${i}`),
        name,
        budget: jt(budget),
        commitment: jt(commitment),
        carry: jt(carry),
        monthly: spread(jt(realization) - jt(carry), from, to, `${spec.id}${name}`),
      };
    }),
  }));
  return { ...spec, groups };
}

/** Totals for an item / group / budget. Realisasi = monthly + carry-over. */
export function itemTotals(item) {
  const realization = item.monthly.reduce((a, b) => a + b, 0) + (item.carry ?? 0);
  return {
    budget: item.budget,
    commitment: item.commitment,
    realization,
    remaining: item.budget - item.commitment - realization,
  };
}

export function sumTotals(list) {
  return list.reduce(
    (s, t) => ({
      budget: s.budget + t.budget,
      commitment: s.commitment + t.commitment,
      realization: s.realization + t.realization,
      remaining: s.remaining + t.remaining,
    }),
    { budget: 0, commitment: 0, realization: 0, remaining: 0 },
  );
}

export function groupTotals(group) {
  const t = sumTotals(group.items.map(itemTotals));
  return { ...t, status: t.commitment + t.realization > t.budget ? "Out of Budget" : "On Budget" };
}

export function budgetTotals(budget) {
  return sumTotals(budget.groups.map(groupTotals));
}

/** A generic cost structure for budgets we don't hand-detail, scaled to a total. */
function templated({ id, total, stage, period, overrun }) {
  const real = { Closed: 0.985, "On Going": 0.46, "Multi Years": 0.31, Draft: 0 }[stage];
  const com = { Closed: 0, "On Going": 0.12, "Multi Years": 0.14, Draft: 0 }[stage];
  const plan = [
    ["21010", "Upah tenaga kerja lapangan", 0.13],
    ["21010", "Persiapan & mobilisasi", 0.07],
    ["21020", "Material utama", 0.24],
    ["21020", "Material pendukung", 0.1],
    ["21030", "Sewa alat berat", 0.13],
    ["21040", "Subkontraktor spesialis", 0.17],
    ["21050", "Mess & konsumsi pekerja", 0.06],
    ["6202", "BBM & transport operasional", 0.06],
    ["6601", "APD & rambu K3", 0.04],
  ];
  const groups = {};
  for (const [coa, name, share] of plan) {
    const b = (total * share) / 1e6;
    const r = coa === overrun ? b * 1.08 : b * real;
    (groups[coa] ??= []).push([name, b, b * com, r]);
  }
  return build({ id, period, groups });
}

/* ───────────────────────── Project budgets ───────────────────────── */

const projectSpecs = [
  build({
    id: "jembatan-sei-ambawang-2026",
    name: "PEMBANGUNAN JEMBATAN SEI AMBAWANG",
    projectCode: "PRJ-TRT-2026-001",
    project: "Jembatan Sei Ambawang",
    location: "Kab. Kubu Raya, Kalbar",
    year: "2026",
    status: "On Going",
    owner: "Hendra Gunawan",
    source: "RAB kontrak — addendum CCO-1, disetujui 3 Jun 2026",
    groups: {
      21010: [
        ["Persiapan & mobilisasi bahan baku", 412, 0, 398.6],
        ["Pondasi tiang pancang – upah pancang", 1240, 96, 1198.2],
        ["Pembesian & bekisting girder", 1860, 312, 1402.5],
        ["Pengecoran lantai jembatan", 980, 140, 286.4],
      ],
      21020: [
        ["Besi beton D16 / D13", 2140, 820, 1612],
        ["Beton ready mix K-350", 1920, 410, 1288],
        ["Spun pile Ø60 (afiliasi PT Tricowarna Beton Precast)", 1480, 0, 1462.5],
        ["Elastomeric bearing pad", 186, 186, 0],
      ],
      21030: [
        ["Crawler crane 50T", 960, 120, 742.8],
        ["Excavator PC200 + operator", 420, 0, 318.6],
        ["Vibro hammer", 210, 0, 204.4],
      ],
      21040: [
        ["Subkon erection girder", 1350, 540, 610],
        ["Subkon pengaspalan oprit", 640, 0, 0],
      ],
      21050: [
        ["Tiket pesawat tenaga ahli 4 orang CGK – PNK", 38, 0, 31.6],
        ["Mess pekerja lapangan (12 bulan)", 168, 14, 126],
        ["Konsumsi lapangan", 96, 0, 81.4],
      ],
      6202: [
        ["BBM operasional kendaraan", 72, 0, 58.9],
        ["Tol, parkir & penyeberangan", 12, 0, 8.4],
      ],
      6601: [["APD & rambu K3", 88, 0, 61.2]],
    },
  }),
  build({
    id: "jalan-sungai-kakap-punggur-2026",
    name: "PENINGKATAN JALAN SUNGAI KAKAP – PUNGGUR",
    projectCode: "PRJ-TRT-2026-002",
    project: "Jalan Sungai Kakap – Punggur",
    location: "Kab. Kubu Raya, Kalbar",
    year: "2026",
    status: "On Going",
    owner: "Yusuf Ramadhan",
    source: "RAB kontrak — revisi R-1, disetujui 21 Mar 2026",
    period: [2, CURRENT_MONTH],
    groups: {
      21010: [
        ["Penyiapan badan jalan", 380, 0, 352.4],
        ["Penghamparan LPA / LPB", 620, 120, 402.6],
      ],
      21020: [
        ["Agregat kelas A & B", 1540, 520, 880.5],
        ["Aspal AC-BC & AC-WC", 3980, 1207.8, 2987.4],
        ["U-Ditch 60×60 (afiliasi PT Tricowarna Beton Precast)", 540, 205, 198],
      ],
      21030: [
        ["Asphalt finisher + tandem roller", 640, 0, 566.8],
        ["Dump truck 6 unit", 380, 34, 301.2],
      ],
      21040: [["Subkon marka & rambu jalan", 240, 0, 0]],
      21050: [["Mess & konsumsi pekerja", 120, 0, 94.6]],
      6202: [["BBM alat berat", 310, 0, 286.4]],
    },
  }),
  build({
    id: "kampung-nelayan-kuala-secapah",
    name: "KAMPUNG NELAYAN MERAH PUTIH – KUALA SECAPAH",
    projectCode: "PRJ-TRT-2026-004",
    project: "Kampung Nelayan Kuala Secapah",
    location: "Kab. Mempawah, Kalbar",
    year: "2026 – 2027",
    status: "Multi Years",
    owner: "Maya Anggraini",
    source: "RAB tender — revisi R-3, disetujui 12 Agu 2026",
    period: [7, CURRENT_MONTH],
    groups: {
      21010: [
        ["Persiapan & mobilisasi", 640, 180, 418.2],
        ["Pemasangan revetment batu armor", 1820, 640, 212.4],
      ],
      21020: [
        ["Batu armor 200–400 kg", 2960, 1020, 384],
        ["Geotekstil non-woven 300 gr", 410, 140, 0],
        ["Spun pile Ø40 (afiliasi PT Tricowarna Beton Precast)", 1973, 1480, 0],
      ],
      21030: [["Ponton & long-arm excavator", 1240, 612, 168.4]],
      21050: [
        ["Base camp & mess Kuala Secapah", 380, 72, 118.2],
        ["Tiket pesawat tim inti 8 orang CGK – PNK", 48, 0, 21.6],
      ],
      6102: [["MCU pekerja pra-kerja", 36, 0, 34.8]],
      6205: [["Sewa kendaraan operasional", 144, 0, 42]],
    },
  }),
  // Mirrors the client's own example budget (screenshot): small O&M contract in Jatim.
  build({
    id: "jasa-pemeliharaan-ipal-4",
    name: "JASA PEMELIHARAAN IPAL - 4",
    projectCode: "PRJ-TRT-2026-007",
    project: "Jasa Pemeliharaan IPAL - 4",
    location: "Kab. Gresik, Jawa Timur",
    year: "2026",
    status: "On Going",
    owner: "Dimas Prakoso",
    source: "Kontrak O&M 12 bulan — budget disetujui 6 Jan 2026",
    // Item codes exactly as they appear in the client's screenshot.
    codes: {
      "MCU Komplit": "SE3A1DA",
      "MCU KOMPLIT A.N HENDRA": "SE09F71",
      "PA, HSE PLAN, PSB dan meeting koordinasi di site": "TME8A73",
      "BBM Operasional Kendaraan": "SE8EC33",
      BBM: "EXP 018",
      "BBM JULI 2026": "TM4ACAA",
      "ISI BBM SEWA MOBIL": "TM658F4",
      "Sewa Kendaraan + BBM": "SE2FE3A",
      "Sewa Kosan": "SE32FFA",
      "Sewa mobil 4 hari dan bensin": "TM0DB2D",
      "Biaya sewa mess bulan April 2026": "SE839F2",
      "Biaya sewa motor operasional bulan April 2026": "SE89CD6",
    },
    groups: {
      21010: [
        ["Persiapan & mobilisasi bahan baku", 46, 0, 41.8],
        ["Pondasi tiang pancang mini pile", 84, 12.4, 38.6],
        ["Upah teknisi harian", 62, 0, 21.2],
      ],
      21050: [
        ["Tiket pesawat tenaga kerja 6 orang CGK - SBY", 14.4, 0, 16.9],
        ["Mess teknisi Gresik", 36, 0, 9.6],
      ],
      6101: [["Gaji operator IPAL (12 bulan)", 186, 22, 0]],
      6102: [
        ["MCU Komplit", 9.6, 0, 7.2],
        ["MCU KOMPLIT A.N HENDRA", 1.85, 0, 1.85],
      ],
      6202: [
        ["PA, HSE PLAN, PSB dan meeting koordinasi di site", 18, 0, 11.4],
        ["BBM Operasional Kendaraan", 24, 0, 13.6],
        ["BBM", 9.6, 0, 6.12],
        ["BBM JULI 2026", 4.2, 0, 4.2],
        ["ISI BBM SEWA MOBIL", 3.6, 0, 2.9],
      ],
      6205: [
        ["Sewa Kendaraan + BBM", 54, 0, 22.5],
        ["Sewa Kosan", 21.6, 0, 9],
        ["Sewa mobil 4 hari dan bensin", 4.8, 0, 4.8],
        ["Biaya sewa mess bulan April 2026", 6, 0, 6],
        ["Biaya sewa motor operasional bulan April 2026", 1.82, 0, 1.82],
      ],
    },
  }),
  {
    ...templated({ id: "ipal-ketapang-2025", total: 6_480_000_000, stage: "Multi Years", period: [0, CURRENT_MONTH] }),
    name: "REHABILITASI IPAL KAWASAN INDUSTRI KETAPANG",
    projectCode: "PRJ-TRT-2025-011",
    project: "IPAL Kawasan Industri Ketapang",
    location: "Kab. Ketapang, Kalbar",
    year: "2025 – 2027",
    status: "Multi Years",
    owner: "Bayu Saputra",
    source: "Kontrak multi tahun — 3 tahap",
    anomaly: "Realisasi 2025 belum di-carry over ke tahun 2026",
  },
  {
    ...templated({ id: "workshop-mempawah-2026", total: 2_140_000_000, stage: "Multi Years", period: [5, CURRENT_MONTH] }),
    name: "GEDUNG KANTOR PROYEK & WORKSHOP MEMPAWAH",
    projectCode: "PRJ-TRT-2026-006",
    project: "Workshop Mempawah",
    location: "Kab. Mempawah, Kalbar",
    year: "2026 – 2027",
    status: "Multi Years",
    owner: "Teguh Santoso",
    source: "Budget internal — capex gedung",
    anomaly: "Pagu 2027 tercatat ganda di 2 periode",
  },
  {
    ...templated({ id: "supply-uditch-artha-2026", total: 384_000_000, stage: "On Going", period: [9, CURRENT_MONTH] }),
    name: "SUPPLY U-DITCH PRECAST – PT ARTHA ENVIROTAMA",
    projectCode: "SO-202610-0043",
    project: "Supply U-Ditch 120 unit",
    location: "Kab. Bekasi, Jawa Barat",
    year: "2026",
    status: "On Going",
    owner: "Fitri Handayani",
    source: "Dari Sales Order SO-202610-0043",
  },
  {
    ...templated({ id: "paving-cikarang-2026", total: 1_046_000_000, stage: "On Going", period: [8, CURRENT_MONTH] }),
    name: "PAVING & KANSTIN GUDANG CIKARANG",
    projectCode: "SO-202609-0041",
    project: "PT Cakrawala Indopac – Gudang Cikarang",
    location: "Kab. Bekasi, Jawa Barat",
    year: "2026",
    status: "On Going",
    owner: "Agus Salim",
    source: "Dari Sales Order SO-202609-0041",
  },
  {
    ...templated({ id: "drainase-depo-lrt-2026", total: 604_000_000, stage: "Closed", period: [7, 8], overrun: "21030" }),
    name: "PERBAIKAN DRAINASE DEPO KELAPA GADING",
    projectCode: "SO-202608-0040",
    project: "PT LRT Jakarta – Depo Kelapa Gading",
    location: "Jakarta Utara",
    year: "2026",
    status: "Closed",
    owner: "Agus Salim",
    source: "Dari Sales Order SO-202608-0040",
  },
  {
    ...templated({ id: "pemeliharaan-jalan-kubu-raya-2025", total: 3_820_000_000, stage: "Closed", overrun: "21020", period: [0, 11] }),
    name: "PEMELIHARAAN RUTIN JALAN KAB. KUBU RAYA",
    projectCode: "PRJ-TRT-2025-004",
    project: "Pemeliharaan Jalan Kubu Raya",
    location: "Kab. Kubu Raya, Kalbar",
    year: "2025",
    status: "Closed",
    owner: "Yusuf Ramadhan",
    source: "Kontrak 2025 — BAST akhir 18 Des 2025",
  },
  {
    ...templated({ id: "revetment-sambas-2025", total: 5_260_000_000, stage: "Closed", period: [0, 11] }),
    name: "REVETMENT PANTAI SAMBAS (PT TRICO BAHARI KONSTRUKSI)",
    projectCode: "PRJ-TBK-2025-002",
    project: "Revetment Pantai Sambas",
    location: "Kab. Sambas, Kalbar",
    year: "2025",
    status: "Closed",
    owner: "Maya Anggraini",
    source: "Kontrak 2025 — BAST akhir 2 Nov 2025",
  },
  {
    ...templated({ id: "dermaga-sungai-rengas-2027", total: 6_890_000_000, stage: "Draft" }),
    name: "REHABILITASI DERMAGA PP SUNGAI RENGAS",
    projectCode: "TDR-2026-027",
    project: "Dermaga PP Sungai Rengas",
    location: "Kab. Kubu Raya, Kalbar",
    year: "2027",
    status: "Draft",
    owner: "Bayu Saputra",
    source: "Draft dari RAB tender (status Lolos)",
  },
];

export const projectBudgetList = projectSpecs;
export const projectBudgetById = Object.fromEntries(projectSpecs.map((b) => [b.id, b]));

/* ───────────────────────── Department (cost center) budgets ───────────────────────── */

const dept = (id, costCenter, year, status, owner, groups, period) =>
  build({ id, name: `${costCenter} - ${year}`, costCenter, year, status, owner, groups, period, source: "Budget OPEX departemen" });

const departmentSpecs = [
  dept("hrga-2026", "HRGA", "2026", "On Going", "Ratna Sari", {
    6101: [["Gaji staf HRGA", 612, 0, 459], ["Lembur & insentif", 48, 0, 31.2]],
    6102: [["MCU tahunan karyawan (142 orang)", 156, 46.8, 98.4], ["MCU pra-kerja", 24, 0, 18.6]],
    6205: [["Sewa gedung kantor Pontianak", 420, 0, 315], ["Sewa kendaraan operasional kantor", 96, 0, 72]],
    6301: [["ATK & cetak kantor", 42, 2.4, 33.1]],
    6401: [["Pelatihan kepemimpinan supervisor", 64, 18, 22]],
  }),
  dept("director-2026", "DIRECTOR", "2026", "On Going", "Bambang Wicaksono", {
    6101: [["Gaji direksi", 1440, 0, 1080]],
    6202: [["Perjalanan dinas direksi", 186, 12, 164.8], ["Tiket pesawat PNK – CGK (rapat pemilik)", 48, 0, 51.2]],
    6501: [["Entertainment klien & mitra", 120, 0, 104.6], ["Atensi pemangku kepentingan", 96, 0, 88.4]],
  }),
  dept("hse-2026", "HSE", "2026", "On Going", "Arief Nugroho", {
    6101: [["Gaji HSE officer (4 orang)", 336, 0, 252]],
    6401: [["Sertifikasi Ahli K3 Konstruksi", 54, 0, 38.5], ["Pelatihan P3K & evakuasi", 18, 0, 9.6]],
    6601: [["APD stok pusat", 142, 24, 131.2], ["Rambu & safety signage", 38, 0, 12.4]],
    6102: [["MCU khusus pekerja ketinggian", 22, 0, 14.4]],
  }),
  dept("finance-2026", "FINANCE & ACCOUNTING", "2026", "On Going", "Rina Kartikasari", {
    6101: [["Gaji staf finance & akunting", 684, 0, 513]],
    6401: [["Brevet pajak & update Coretax", 36, 0, 28.5]],
    6301: [["Materai, cetak faktur & ATK", 28, 0, 19.8]],
    6205: [["Lisensi software akuntansi", 64, 0, 64]],
  }),
  dept("it-2026", "IT", "2026", "On Going", "Kevin Pratama", {
    6101: [["Gaji tim IT", 288, 0, 216]],
    6205: [["Sewa server & cloud", 96, 8, 72.4], ["Lisensi Microsoft 365 (80 user)", 118, 0, 118]],
    6301: [["Perangkat & aksesoris", 64, 12.6, 58.2]],
  }),
  dept("operations-2026", "OPERATIONS", "2026", "On Going", "Hendra Gunawan", {
    6101: [["Gaji site manager & pengawas", 1680, 0, 1260]],
    6202: [["BBM operasional kendaraan", 210, 0, 168.6], ["Tiket pesawat tenaga kerja 6 orang CGK - SBY", 36, 0, 41.4]],
    6205: [["Sewa mess koordinator wilayah", 96, 0, 72]],
    6102: [["MCU pekerja lapangan", 84, 0, 61.2]],
  }),
  dept("tse-2026", "TECHNICAL SALES ENGINEERING", "2026", "On Going", "Dewi Lestari", {
    6202: [["Kunjungan teknis ke calon klien", 48, 4.2, 18.6]],
    6401: [["Sertifikasi SKK Ahli Muda", 32, 3.7, 3.8]],
    6501: [["Presentasi teknis & sampel", 26.98, 0, 0]],
  }, [0, CURRENT_MONTH]),
  dept("sales-ops-2026", "SALES OPERATION", "2026", "On Going", "Andhy Reeza", {
    6202: [["Perjalanan sales & follow-up", 64.9, 18.4, 21.2]],
    6501: [["Entertainment prospek", 42, 12.46, 6.3]],
    6301: [["Brosur & company profile", 18, 0, 0]],
  }),
  dept("procurement-2026", "PROCUREMENT", "2026", "On Going", "Fitri Handayani", {
    6101: [["Gaji tim procurement", 396, 0, 297]],
    6202: [["Survei vendor & material", 36, 0, 22.6]],
  }),
  dept("estimasi-2026", "ESTIMASI & TENDER", "2026", "On Going", "Bayu Saputra", {
    6101: [["Gaji estimator", 528, 0, 396]],
    6301: [["Cetak & legalisir dokumen tender", 54, 6.5, 48.1]],
    6401: [["Pelatihan AHSP & e-katalog", 24, 0, 12]],
    6501: [["Atensi aanwijzing", 30, 0, 33.4]],
  }),
  dept("hrga-2025", "HRGA", "2025", "Closed", "Ratna Sari", {
    6101: [["Gaji staf HRGA", 588, 0, 588]],
    6102: [["MCU tahunan karyawan", 142, 0, 151.6]],
    6205: [["Sewa gedung kantor Pontianak", 396, 0, 396]],
  }, [0, 11]),
  dept("operations-2025", "OPERATIONS", "2025", "Closed", "Hendra Gunawan", {
    6101: [["Gaji site manager & pengawas", 1560, 0, 1548]],
    6202: [["BBM operasional kendaraan", 196, 0, 189.2]],
  }, [0, 11]),
  dept("it-2027", "IT", "2027", "Draft", "Kevin Pratama", {
    6205: [["Sewa server & cloud", 108, 0, 0], ["Lisensi Microsoft 365 (90 user)", 132, 0, 0]],
    6301: [["Peremajaan laptop", 180, 0, 0]],
  }),
];

export const departmentBudgetList = departmentSpecs;
export const departmentBudgetById = Object.fromEntries(departmentSpecs.map((b) => [b.id, b]));
