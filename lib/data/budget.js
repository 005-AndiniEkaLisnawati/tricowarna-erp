// Budget control: project budget (RAB → pagu), cost center OPEX, CAPEX & aset tetap.
// Fictional demo values, consistent with projects/costCenters in org.js.

const jt = (n) => Math.round(n * 1_000_000);

/* ───────────────────────── Project budget (RAB → Budget) ───────────────────────── */

// pagu = RAB biaya (cost), commitment = PO/SPK belum ditagih, realized = sudah dibukukan,
// eac = estimate at completion per kategori.
export const projectBudgets = {
  "PRJ-TRT-2026-001": {
    rabSource: "Dari RAB kontrak — addendum CCO-1, disetujui 3 Jun 2026",
    rabRevision: "CCO-1",
    rabItems: 214,
    lastSync: "2026-10-07",
    categories: [
      { name: "Persiapan & Mobilisasi", items: 12, pagu: jt(612), commitment: 0, realized: jt(571.3), eac: jt(584) },
      { name: "Pekerjaan Tanah", items: 18, pagu: jt(1_184.5), commitment: jt(96), realized: jt(702.4), eac: jt(1_162) },
      { name: "Pondasi Tiang Pancang", items: 26, pagu: jt(3_920), commitment: jt(318), realized: jt(3_402.6), eac: jt(4_085) },
      { name: "Struktur Jembatan (Girder & Lantai)", items: 64, pagu: jt(6_480), commitment: jt(1_406.2), realized: jt(3_218.5), eac: jt(6_436) },
      { name: "Oprit & Perkerasan", items: 41, pagu: jt(1_642), commitment: jt(220), realized: jt(186.4), eac: jt(1_655) },
      { name: "Drainase & Pelengkap", items: 29, pagu: jt(548), commitment: 0, realized: jt(92.7), eac: jt(548) },
      { name: "Overhead Lapangan", items: 24, pagu: jt(1_928), commitment: jt(64.5), realized: jt(1_276.8), eac: jt(1_982) },
    ],
  },
  "PRJ-TRT-2026-002": {
    rabSource: "Dari RAB kontrak — revisi R-1, disetujui 21 Mar 2026",
    rabRevision: "R-1",
    rabItems: 168,
    lastSync: "2026-10-06",
    categories: [
      { name: "Persiapan & Mobilisasi", items: 9, pagu: jt(386), commitment: 0, realized: jt(352.1), eac: jt(371) },
      { name: "Pekerjaan Tanah", items: 21, pagu: jt(1_412), commitment: jt(112), realized: jt(824.6), eac: jt(1_398) },
      { name: "Lapis Pondasi Agregat (LPA/LPB)", items: 14, pagu: jt(1_980), commitment: jt(640), realized: jt(801.3), eac: jt(2_024) },
      { name: "Perkerasan Aspal (AC-BC/AC-WC)", items: 33, pagu: jt(4_560), commitment: jt(1_207.8), realized: jt(2_987.4), eac: jt(4_912) },
      { name: "Drainase (U-Ditch & Gorong-gorong)", items: 38, pagu: jt(860), commitment: jt(205), realized: jt(312.5), eac: jt(874) },
      { name: "Bahu Jalan & Marka", items: 27, pagu: jt(342), commitment: 0, realized: 0, eac: jt(342) },
      { name: "Overhead Lapangan", items: 26, pagu: jt(820), commitment: jt(34), realized: jt(368.2), eac: jt(856) },
    ],
  },
  "PRJ-TRT-2026-004": {
    rabSource: "Dari RAB tender — revisi R-3, disetujui 12 Agu 2026",
    rabRevision: "R-3",
    rabItems: 287,
    lastSync: "2026-08-12",
    categories: [
      { name: "Persiapan & Mobilisasi", items: 15, pagu: jt(1_240), commitment: jt(612), realized: jt(418.2), eac: jt(1_262) },
      { name: "Pekerjaan Tanah & Reklamasi", items: 22, pagu: jt(3_860), commitment: jt(1_020), realized: jt(212.4), eac: jt(3_812) },
      { name: "Revetment (Batu Armor & Geotekstil)", items: 31, pagu: jt(5_420), commitment: jt(2_140), realized: jt(384), eac: jt(5_465) },
      { name: "Tambatan Perahu (Dermaga Tiang Pancang)", items: 47, pagu: jt(4_980), commitment: jt(1_480), realized: 0, eac: jt(4_980) },
      { name: "Bangunan (Balai Nelayan & Cold Storage)", items: 108, pagu: jt(4_350), commitment: 0, realized: 0, eac: jt(4_350) },
      { name: "Drainase & Utilitas", items: 36, pagu: jt(1_310), commitment: 0, realized: 0, eac: jt(1_310) },
      { name: "Overhead Lapangan", items: 28, pagu: jt(1_690), commitment: jt(72), realized: jt(168.4), eac: jt(1_690) },
    ],
  },
};

/* ───────────────────────── Cost center & OPEX ───────────────────────── */

export const opexGroups = [
  { name: "Gaji & BPJS", coa: "6-1101" },
  { name: "Sewa Kantor", coa: "6-1103" },
  { name: "Utilitas", coa: "6-1104" },
  { name: "Perjalanan Dinas", coa: "6-1106" },
  { name: "ATK", coa: "6-1301" },
  { name: "Entertainment & Atensi", coa: "6-1201" },
  { name: "SKK/SKA & Pelatihan", coa: "6-1401" },
];

export const OPEX_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep"];

// Spread a total over months by weight; last month takes the rounding remainder
// so the monthly bars always add up to `used`.
function spread(total, weights) {
  const sum = weights.reduce((s, w) => s + w, 0);
  const out = weights.map((w) => Math.round((total * w) / sum / 100_000) * 100_000);
  out[out.length - 1] += total - out.reduce((s, v) => s + v, 0);
  return out;
}

const ccSeed = [
  {
    code: "CC-100",
    mode: "Group",
    pic: "Bambang Wicaksono",
    initials: "BW",
    groups: { "Gaji & BPJS": [2_160, 1_598.4], "Sewa Kantor": [420, 315], Utilitas: [96, 74.8], "Perjalanan Dinas": [240, 211.6], ATK: [36, 21.3], "Entertainment & Atensi": [180, 171.2], "SKK/SKA & Pelatihan": [48, 12.5] },
    weights: [10, 10, 11, 10, 12, 11, 12, 11, 13],
  },
  {
    code: "CC-200",
    mode: "Group",
    pic: "Rina Kartikasari",
    initials: "RK",
    groups: { "Gaji & BPJS": [1_140, 842.7], "Perjalanan Dinas": [60, 28.4], ATK: [42, 30.1], "Entertainment & Atensi": [12, 3.2], "SKK/SKA & Pelatihan": [85, 61.5] },
    weights: [11, 10, 13, 10, 10, 11, 10, 12, 11],
  },
  {
    code: "CC-300",
    mode: "Group",
    pic: "Dimas Prakoso",
    initials: "DP",
    groups: { "Gaji & BPJS": [1_320, 978.3], "Perjalanan Dinas": [180, 152.4], ATK: [96, 83.9], "Entertainment & Atensi": [60, 22], "SKK/SKA & Pelatihan": [140, 96.2] },
    weights: [8, 9, 13, 11, 9, 10, 12, 14, 15],
  },
  {
    code: "CC-400",
    mode: "Lumpsum",
    pic: "Fitri Handayani",
    initials: "FH",
    pagu: 1_150,
    groups: { "Gaji & BPJS": [0, 702.6], "Perjalanan Dinas": [0, 64.3], ATK: [0, 12.8], "Entertainment & Atensi": [0, 18.5], "SKK/SKA & Pelatihan": [0, 9] },
    weights: [9, 10, 10, 11, 11, 11, 12, 13, 12],
  },
  {
    code: "CC-500",
    mode: "Lumpsum",
    pic: "Hendra Gunawan",
    initials: "HG",
    pagu: 2_850,
    groups: { "Gaji & BPJS": [0, 1_684.2], Utilitas: [0, 62.4], "Perjalanan Dinas": [0, 248.5], ATK: [0, 15.1], "Entertainment & Atensi": [0, 41], "SKK/SKA & Pelatihan": [0, 118.6] },
    weights: [7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  {
    code: "CC-600",
    mode: "Group",
    pic: "Teguh Santoso",
    initials: "TS",
    groups: { "Gaji & BPJS": [780, 566.1], "Sewa Kantor": [240, 180], Utilitas: [132, 108.7], "Perjalanan Dinas": [48, 19.2], ATK: [12, 5.4], "SKK/SKA & Pelatihan": [60, 58.3] },
    weights: [10, 9, 10, 12, 11, 10, 13, 11, 14],
  },
];

export const costCenterBudgets = ccSeed.map((c) => {
  const groups = opexGroups
    .filter((g) => c.groups[g.name])
    .map((g) => ({ name: g.name, coa: g.coa, pagu: jt(c.groups[g.name][0]), used: jt(c.groups[g.name][1]) }));
  const used = groups.reduce((s, g) => s + g.used, 0);
  const pagu = c.mode === "Group" ? groups.reduce((s, g) => s + g.pagu, 0) : jt(c.pagu);
  return { code: c.code, mode: c.mode, pic: c.pic, initials: c.initials, pagu, used, groups, monthly: spread(used, c.weights) };
});

/* ───────────────────────── CAPEX & aset tetap ───────────────────────── */

export const capexLines = [
  { no: "CPX-2026-01", name: "Excavator PC200 unit baru", detail: "Kelas 20 ton, bucket 0,8 m³ — pengganti unit 2014", costCenter: "CC-600", pagu: jt(2_350), realized: jt(2_298.5), status: "Selesai", vendor: "PT Borneo Traktor Utama" },
  { no: "CPX-2026-02", name: "Concrete batching plant mini", detail: "Kapasitas 30 m³/jam untuk Jembatan A & Kampung Nelayan", costCenter: "CC-600", pagu: jt(1_480), realized: jt(444), status: "Disetujui", vendor: "PT Mixindo Teknik", note: "DP 30% dibayar, kirim Nov 2026" },
  { no: "CPX-2026-03", name: "Dump truck 2 unit", detail: "6 roda, bak 8 m³ — angkutan material Jalan B", costCenter: "CC-500", pagu: jt(1_260), realized: jt(1_238), status: "Selesai", vendor: "PT Kalbar Motor Niaga" },
  { no: "CPX-2026-04", name: "Laptop estimator", detail: "4 unit workstation (RAM 32 GB) untuk tim estimasi", costCenter: "CC-300", pagu: jt(96), realized: jt(58.4), status: "Disetujui", vendor: "CV Data Prima Komputer", note: "2 dari 4 unit diterima" },
  { no: "CPX-2026-05", name: "Genset 100 kVA", detail: "Silent type, untuk base camp Kuala Secapah", costCenter: "CC-500", pagu: jt(285), realized: 0, status: "Menunggu Approval", vendor: "Penawaran 3 vendor" },
];

// Garis lurus tanpa nilai residu; penyusutan dimulai bulan perolehan.
export const assets = [
  { code: "AST-BGN-2021-001", name: "Workshop & gudang Kubu Raya", group: "Bangunan", acquired: "2021-01-10", cost: jt(3_150), life: 20 },
  { code: "AST-INV-2021-014", name: "Total station & GPS geodetik", group: "Inventaris", acquired: "2021-03-01", cost: jt(186), life: 4 },
  { code: "AST-ALB-2019-003", name: "Hydraulic pile hammer 7 ton", group: "Alat Berat", acquired: "2019-06-01", cost: jt(1_820), life: 8 },
  { code: "AST-ALB-2022-007", name: "Crawler crane 50 ton", group: "Alat Berat", acquired: "2022-08-01", cost: jt(4_620), life: 16 },
  { code: "AST-ALB-2023-004", name: "Vibro roller 10 ton", group: "Alat Berat", acquired: "2023-02-10", cost: jt(1_340), life: 8 },
  { code: "AST-KND-2024-011", name: "Mobil double cabin 4x4", group: "Kendaraan", acquired: "2024-04-05", cost: jt(545), life: 8 },
  { code: "AST-ALB-2026-001", name: "Excavator PC200 (CPX-2026-01)", group: "Alat Berat", acquired: "2026-03-16", cost: jt(2_298.5), life: 8 },
  { code: "AST-KND-2026-002", name: "Dump truck #1 (CPX-2026-03)", group: "Kendaraan", acquired: "2026-05-20", cost: jt(619), life: 8 },
  { code: "AST-KND-2026-003", name: "Dump truck #2 (CPX-2026-03)", group: "Kendaraan", acquired: "2026-05-20", cost: jt(619), life: 8 },
  { code: "AST-INV-2026-021", name: "Laptop estimator 2 unit (CPX-2026-04)", group: "Inventaris", acquired: "2026-09-12", cost: jt(58.4), life: 4 },
];

/** Months of depreciation from acquisition month through `ym` ("2026-09"), inclusive. */
export function monthsElapsed(acquired, ym) {
  const [ay, am] = acquired.split("-").map(Number);
  const [y, m] = ym.split("-").map(Number);
  return Math.max(0, (y - ay) * 12 + (m - am) + 1);
}

export function depreciation(asset, ym) {
  const monthly = asset.cost / (asset.life * 12);
  const months = Math.min(monthsElapsed(asset.acquired, ym), asset.life * 12);
  const accumulated = Math.round(monthly * months);
  return { monthly, months, accumulated, book: asset.cost - accumulated };
}
