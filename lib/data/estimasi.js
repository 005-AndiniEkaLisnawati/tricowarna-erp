// Master Bahan & Upah, Master Analisa AHSP and the BOQ of tender
// "Kampung Nelayan Merah Putih Sungai Burung". Prices: wilayah Kalbar 2026 (mock).
// Unit price = Σ(koefisien × harga master) × (1 + overhead & keuntungan) — deterministic.

export const master = [
  // Tenaga (TKDN 100%)
  { code: "L.01", type: "tenaga", name: "Pekerja", unit: "OH", price: 135_000, tkdn: 100, history: [118_000, 124_000, 129_500, 135_000] },
  { code: "L.02", type: "tenaga", name: "Tukang batu", unit: "OH", price: 160_000, tkdn: 100, history: [140_000, 148_000, 155_000, 160_000] },
  { code: "L.03", type: "tenaga", name: "Kepala tukang", unit: "OH", price: 175_000, tkdn: 100, history: [155_000, 162_000, 170_000, 175_000] },
  { code: "L.04", type: "tenaga", name: "Mandor", unit: "OH", price: 190_000, tkdn: 100, history: [165_000, 175_000, 182_000, 190_000] },
  { code: "L.05", type: "tenaga", name: "Tukang besi", unit: "OH", price: 160_000, tkdn: 100, history: [140_000, 148_000, 155_000, 160_000] },
  { code: "L.06", type: "tenaga", name: "Tukang kayu", unit: "OH", price: 160_000, tkdn: 100, history: [140_000, 148_000, 155_000, 160_000] },
  { code: "L.07", type: "tenaga", name: "Operator alat berat", unit: "OH", price: 210_000, tkdn: 100, history: [185_000, 192_000, 200_000, 210_000] },
  // Bahan
  { code: "M.01", type: "bahan", name: "Semen Portland (PCC)", unit: "kg", price: 1_360, tkdn: 96.2, history: [1_250, 1_290, 1_330, 1_360] },
  { code: "M.02", type: "bahan", name: "Pasir beton", unit: "m³", price: 285_000, tkdn: 100, history: [248_000, 260_000, 275_000, 285_000] },
  { code: "M.03", type: "bahan", name: "Batu pecah / split 1–2", unit: "m³", price: 410_000, tkdn: 100, history: [365_000, 380_000, 398_000, 410_000] },
  { code: "M.04", type: "bahan", name: "Batu belah 15–20 cm", unit: "m³", price: 340_000, tkdn: 100, history: [298_000, 312_000, 330_000, 340_000] },
  { code: "M.05", type: "bahan", name: "Besi beton ulir BjTS 420", unit: "kg", price: 15_800, tkdn: 58.4, history: [13_900, 14_200, 14_800, 15_800] },
  { code: "M.06", type: "bahan", name: "Kawat beton", unit: "kg", price: 24_000, tkdn: 72.0, history: [21_500, 22_000, 23_000, 24_000] },
  { code: "M.07", type: "bahan", name: "Kayu kelas III (bekisting)", unit: "m³", price: 3_850_000, tkdn: 100, history: [3_400_000, 3_550_000, 3_700_000, 3_850_000] },
  { code: "M.08", type: "bahan", name: "Paku 5–10 cm", unit: "kg", price: 22_000, tkdn: 64.0, history: [19_000, 20_000, 21_000, 22_000] },
  { code: "M.09", type: "bahan", name: "Air kerja", unit: "liter", price: 50, tkdn: 100, history: [40, 45, 50, 50] },
  { code: "M.10", type: "bahan", name: "Pasir urug", unit: "m³", price: 165_000, tkdn: 100, history: [140_000, 148_000, 158_000, 165_000] },
  { code: "M.11", type: "bahan", name: "Tiang pancang spun pile Ø40 cm kelas A", unit: "m'", price: 1_120_000, tkdn: 74.6, history: [1_020_000, 1_065_000, 1_090_000, 1_120_000] },
  { code: "M.12", type: "bahan", name: "Minyak bekisting", unit: "liter", price: 28_000, tkdn: 40.0, history: [24_000, 25_000, 27_000, 28_000] },
  // Alat
  { code: "E.01", type: "alat", name: "Excavator 0,8 m³ (sewa + BBM)", unit: "jam", price: 495_000, tkdn: 45.0, history: [430_000, 455_000, 475_000, 495_000] },
  { code: "E.02", type: "alat", name: "Concrete mixer 0,35 m³", unit: "jam", price: 92_000, tkdn: 60.0, history: [80_000, 85_000, 88_000, 92_000] },
  { code: "E.03", type: "alat", name: "Crawler crane 25T + hammer", unit: "jam", price: 1_180_000, tkdn: 35.0, history: [1_020_000, 1_080_000, 1_140_000, 1_180_000] },
  { code: "E.04", type: "alat", name: "Concrete vibrator", unit: "jam", price: 58_000, tkdn: 60.0, history: [50_000, 52_000, 55_000, 58_000] },
  { code: "E.05", type: "alat", name: "Ponton / tongkang kerja", unit: "jam", price: 640_000, tkdn: 80.0, history: [560_000, 590_000, 615_000, 640_000] },
];

export const historyLabels = ["Ketapang '23", "Kubu Raya '24", "Kuala Secapah '25", "Master '26"];

export const masterByCode = Object.fromEntries(master.map((m) => [m.code, m]));

export const coefficientSets = [
  { id: "PUPR-2024", label: "Permen PUPR 8/2023 · TA 2024", note: "Set lama — dipakai tender Kubu Raya 2024", laborFactor: 1.04 },
  { id: "PUPR-2025", label: "Permen PUPR 8/2023 · TA 2025", note: "Set acuan KAK Sungai Burung", laborFactor: 1 },
  { id: "PUPR-2026", label: "Permen PU 2026 (draft)", note: "Koefisien tenaga direvisi turun ±3%", laborFactor: 0.97 },
];

export const analyses = [
  {
    code: "A.2.3.1.1",
    name: "Galian tanah biasa dengan excavator",
    unit: "m³",
    usedIn: 4,
    lines: [["L.01", 0.025], ["L.04", 0.0025], ["L.07", 0.04], ["E.01", 0.04]],
  },
  {
    code: "A.3.2.1.1",
    name: "Pasangan batu belah 1PC : 4PP",
    unit: "m³",
    usedIn: 7,
    lines: [["L.01", 1.5], ["L.02", 0.6], ["L.03", 0.06], ["L.04", 0.075], ["M.04", 1.2], ["M.01", 163], ["M.02", 0.52]],
  },
  {
    code: "A.4.1.1.7",
    name: "Beton mutu fc' 24,9 MPa (K-300) – mixer",
    unit: "m³",
    usedIn: 9,
    lines: [["L.01", 1.65], ["L.02", 0.275], ["L.03", 0.028], ["L.04", 0.083], ["M.01", 413], ["M.02", 0.49], ["M.03", 0.76], ["M.09", 215], ["E.02", 0.5], ["E.04", 0.5]],
  },
  {
    code: "A.4.1.1.17",
    name: "Pembesian 1 kg besi ulir",
    unit: "kg",
    usedIn: 11,
    lines: [["L.01", 0.007], ["L.05", 0.007], ["L.03", 0.0007], ["L.04", 0.0004], ["M.05", 1.05], ["M.06", 0.015]],
  },
  {
    code: "A.4.1.1.20",
    name: "Bekisting balok & lantai (kayu, 2× pakai)",
    unit: "m²",
    usedIn: 8,
    lines: [["L.01", 0.52], ["L.06", 0.26], ["L.03", 0.026], ["L.04", 0.026], ["M.07", 0.02], ["M.08", 0.3], ["M.12", 0.2]],
  },
  {
    code: "A.2.3.1.9",
    name: "Urugan pasir dipadatkan",
    unit: "m³",
    usedIn: 6,
    lines: [["L.01", 0.3], ["L.04", 0.01], ["M.10", 1.2]],
  },
  {
    code: "A.4.1.1.4",
    name: "Rabat beton K-175 tebal 12 cm",
    unit: "m²",
    usedIn: 3,
    lines: [["L.01", 0.198], ["L.02", 0.033], ["L.04", 0.01], ["M.01", 39.1], ["M.02", 0.069], ["M.03", 0.09], ["M.09", 26], ["E.02", 0.03]],
  },
  {
    code: "T.06.a",
    name: "Revetment batu kosong dengan excavator dari ponton",
    unit: "m³",
    usedIn: 2,
    custom: false,
    lines: [["L.01", 0.25], ["L.04", 0.025], ["L.07", 0.06], ["M.04", 1.15], ["E.01", 0.06], ["E.05", 0.02]],
  },
  {
    code: "P.05",
    name: "Pemancangan spun pile Ø40 cm dari ponton",
    unit: "m'",
    usedIn: 2,
    lines: [["L.01", 0.12], ["L.02", 0.06], ["L.04", 0.012], ["L.07", 0.06], ["M.11", 1], ["E.03", 0.08], ["E.05", 0.08]],
  },
];

export const analysisByCode = Object.fromEntries(analyses.map((a) => [a.code, a]));

/** Cost breakdown of one analysis under a coefficient set. */
export function costAnalysis(analysis, set, prices = masterByCode) {
  const factor = set?.laborFactor ?? 1;
  const rows = analysis.lines.map(([code, koef]) => {
    const m = prices[code];
    const k = m.type === "tenaga" ? koef * factor : koef;
    return { ...m, koef: k, total: k * m.price };
  });
  const sum = (t) => rows.filter((r) => r.type === t).reduce((s, r) => s + r.total, 0);
  const direct = rows.reduce((s, r) => s + r.total, 0);
  const tkdn = direct ? rows.reduce((s, r) => s + r.total * r.tkdn, 0) / direct : 0;
  return { rows, tenaga: sum("tenaga"), bahan: sum("bahan"), alat: sum("alat"), direct, tkdn };
}

// BOQ R-2. `raw` is the text exactly as written in the panitia's document —
// what the AI had to match. `ahsp` null + no `lumpsum` = no price yet.
export const boqSections = [
  {
    no: "I",
    name: "Pekerjaan Persiapan",
    items: [
      { no: "1", name: "Mobilisasi & demobilisasi peralatan", raw: "Mob/demob alat", unit: "ls", vol: 1, lumpsum: 285_000_000, tkdnL: 85, conf: 99 },
      { no: "2", name: "Direksi keet, gudang & los kerja", raw: "Direksi keet + gudang", unit: "m²", vol: 48, lumpsum: 1_650_000, tkdnL: 95, conf: 97 },
      { no: "3", name: "Penerapan SMKK", raw: "SMKK (Sistem Manajemen Keselamatan Konstruksi)", unit: "ls", vol: 1, lumpsum: 96_500_000, tkdnL: 70, conf: 99 },
    ],
  },
  {
    no: "II",
    name: "Pekerjaan Revetment",
    items: [
      { no: "1", name: "Galian tanah dengan excavator", raw: "Pek. galian tnh dg excavator", unit: "m³", vol: 3_240, ahsp: "A.2.3.1.1", conf: 96 },
      { no: "2", name: "Geotextile non-woven 300 gr/m²", raw: "Geotextile NW 300gr", unit: "m²", vol: 2_480, ahsp: null, conf: 41 },
      { no: "3", name: "Revetment batu belah (batu kosong)", raw: "Revetment batu kosong 15-20", unit: "m³", vol: 6_820, volR1: 7_040, ahsp: "T.06.a", conf: 93 },
      { no: "4", name: "Pasangan batu belah crest 1PC:4PP", raw: "Psg batu kali 1:4 (crest)", unit: "m³", vol: 512, ahsp: "A.3.2.1.1", conf: 98 },
    ],
  },
  {
    no: "III",
    name: "Pekerjaan Tambatan Perahu",
    items: [
      { no: "1", name: "Pemancangan spun pile Ø40 cm", raw: "Pemancangan tiang spun pile D400", unit: "m'", vol: 1_536, ahsp: "P.05", conf: 95 },
      { no: "2", name: "Beton K-300 lantai, balok & pile cap", raw: "Beton fc'25 (K-300) lantai dermaga", unit: "m³", vol: 412, ahsp: "A.4.1.1.7", conf: 97 },
      { no: "3", name: "Pembesian besi ulir", raw: "Pembesian ulir (BjTS 420)", unit: "kg", vol: 58_740, ahsp: "A.4.1.1.17", conf: 99 },
      { no: "4", name: "Bekisting balok & lantai", raw: "Bekisting", unit: "m²", vol: 1_860, ahsp: "A.4.1.1.20", conf: 88 },
      { no: "5", name: "Bollard besi cor kapasitas 5 ton", raw: "Bolder 5T", unit: "bh", vol: 12, ahsp: null, conf: 38 },
      { no: "6", name: "Fender karet tipe V 300H", raw: "Fender rubber V300H L=1m", unit: "bh", vol: 24, ahsp: null, conf: 44 },
      { no: "7", name: "Tangga monyet galvanis", raw: "Tangga monyet galv.", unit: "unit", vol: 4, ahsp: null, conf: 52 },
    ],
  },
  {
    no: "IV",
    name: "Pekerjaan Dinding Penahan Tanah (DPT)",
    items: [
      { no: "1", name: "Galian tanah pondasi DPT", raw: "Galian pondasi DPT", unit: "m³", vol: 1_120, ahsp: "A.2.3.1.1", conf: 91 },
      { no: "2", name: "Pasangan batu belah 1PC:4PP", raw: "Pas. batu belah 1 : 4", unit: "m³", vol: 918, ahsp: "A.3.2.1.1", conf: 98 },
      { no: "3", name: "Urugan pasir bawah pondasi", raw: "Urug pasir t=10", unit: "m³", vol: 420, ahsp: "A.2.3.1.9", conf: 84 },
    ],
  },
  {
    no: "V",
    name: "Pekerjaan Jalan Lingkungan",
    items: [
      { no: "1", name: "Urugan pasir dipadatkan", raw: "Urugan pasir padat", unit: "m³", vol: 960, ahsp: "A.2.3.1.9", conf: 95 },
      { no: "2", name: "Rabat beton K-175 tebal 12 cm", raw: "Rabat beton t=12cm K175", unit: "m²", vol: 4_380, ahsp: "A.4.1.1.4", conf: 94 },
    ],
  },
];
