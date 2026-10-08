// Mock data — Delivery Order / BAST, Sales Invoice (AR) and cash-in.
// Mirrors the canonical Sales Orders (SO-202608-0039 … SO-202610-0044).
// All names, NPWP and figures are fictional demo values.
//
// Tax model (PMK 131/2024, Coretax):
//   base       = harga jual / nilai termin excl. PPN
//   DPP        = base × 11/12 (DPP Nilai Lain)
//   PPN        = 12% × DPP (= 11% of base)
//   PPN dipungut = PPN, only for instansi pemerintah (pemungut PPN, faktur kode 02)
//   PPh 4(2)   = 2,65% × base for jasa konstruksi (withheld by the buyer)
//   Retensi    = 5% × base on progress termins (not on uang muka)
//   Neto       = base + PPN − PPN dipungut − PPh − retensi  (cash we expect)

export const SALES_TODAY = "2026-10-08";

export const clients = {
  KKP: {
    id: "KKP",
    name: "Ditjen Perikanan Tangkap – KKP",
    short: "DJPT – KKP",
    gov: true,
    npwp: "0013 2245 7781 4000",
    email: "keuangan.djpt@kkp.go.id",
    payer: "KPPN Pontianak (SP2D)",
    terms: 30,
  },
  LRT: {
    id: "LRT",
    name: "PT LRT Jakarta",
    short: "LRT Jakarta",
    gov: false,
    npwp: "0761 2290 4418 1000",
    email: "ap@lrtjakarta.co.id",
    payer: "PT LRT JAKARTA",
    terms: 30,
  },
  CKI: {
    id: "CKI",
    name: "PT Cakrawala Indopac",
    short: "Cakrawala Indopac",
    gov: false,
    npwp: "0312 8874 1106 3000",
    email: "finance@cakrawala-indopac.co.id",
    payer: "CAKRAWALA INDOPAC PT",
    terms: 30,
  },
  PUPR: {
    id: "PUPR",
    name: "Dinas PUPR Kab. Kubu Raya (Bina Marga)",
    short: "PUPR Kubu Raya",
    gov: true,
    npwp: "0024 6610 3357 7000",
    email: "bendahara.pupr@kuburayakab.go.id",
    payer: "RKUD Kab. Kubu Raya (SP2D)",
    terms: 30,
  },
  ART: {
    id: "ART",
    name: "PT Artha Envirotama",
    short: "Artha Envirotama",
    gov: false,
    npwp: "0835 4471 9902 4000",
    email: "purchasing@arthaenvirotama.co.id",
    payer: "ARTHA ENVIROTAMA PT",
    terms: 14,
  },
};

export const clientList = Object.values(clients);

/* ───────────────────────── Sales Orders (reference copy) ───────────────────────── */

// pph: withholding the buyer applies; retensi: % of base held on progress termins.
export const billingSOs = [
  {
    no: "SO-202608-0039",
    client: "KKP",
    scope: "Kontrak Kampung Nelayan Merah Putih Kuala Secapah",
    project: "PRJ-TRT-2026-004",
    grand: 24_918_300_000,
    kind: "Kontrak",
    pph: { type: "4(2)", rate: 2.65 },
    retensi: 5,
    revenue: "kontrak",
  },
  {
    no: "SO-202608-0040",
    client: "LRT",
    scope: "Perbaikan drainase depo Kelapa Gading",
    project: null,
    grand: 742_900_000,
    kind: "Kontrak",
    pph: { type: "4(2)", rate: 2.65 },
    retensi: 5,
    revenue: "kontrak",
  },
  {
    no: "SO-202609-0041",
    client: "CKI",
    scope: "Supply & pasang paving + kanstin gudang Cikarang",
    project: null,
    grand: 1_284_600_000,
    kind: "Supply",
    pph: { type: "4(2)", rate: 2.65 },
    retensi: 0,
    revenue: "kontrak",
    site: "Gudang Cakrawala, Kawasan Industri Jababeka Blok GG-5, Cikarang",
    lines: [
      { id: "PV8", short: "Paving K-300", item: "Paving block K-300 tebal 8 cm (supply & pasang)", unit: "m²", qty: 4_800, price: 189_000 },
      { id: "KST", short: "Kanstin", item: "Kanstin precast 20×30×60 cm (supply & pasang)", unit: "bh", qty: 1_600, price: 156_300 },
    ],
  },
  {
    no: "SO-202609-0042",
    client: "PUPR",
    scope: "Peningkatan Jalan Sungai Kakap – Punggur",
    project: "PRJ-TRT-2026-002",
    grand: 11_275_500_000,
    kind: "Kontrak",
    pph: { type: "4(2)", rate: 2.65 },
    retensi: 5,
    revenue: "kontrak",
  },
  {
    no: "SO-202610-0043",
    client: "ART",
    scope: "Supply U-Ditch precast 60×60 – 120 unit",
    project: null,
    grand: 486_180_000,
    kind: "Supply",
    pph: null,
    retensi: 0,
    revenue: "barang",
    shipper: "PT Tricowarna Beton Precast (afiliasi) — Plant Karawang",
    site: "Proyek IPAL Artha Envirotama, Jl. Raya Narogong Km 12, Bekasi",
    lines: [{ id: "UD60", short: "U-Ditch", item: "U-Ditch precast 60×60×120 cm + tutup", unit: "unit", qty: 120, price: 3_650_000 }],
  },
  {
    no: "SO-202610-0044",
    client: "PUPR",
    scope: "Jembatan Sei Ambawang (adendum 1)",
    project: "PRJ-TRT-2026-001",
    grand: 18_640_000_000,
    kind: "Kontrak",
    pph: { type: "4(2)", rate: 2.65 },
    retensi: 5,
    revenue: "kontrak",
    soStatus: "Awaiting Approval",
  },
];

export const soByNo = Object.fromEntries(billingSOs.map((s) => [s.no, s]));

/** Contract value excl. PPN (grand total incl. PPN 11% effective). */
export const soBase = (so) => Math.round(so.grand / 1.11);
const share = (soNo, pct) => Math.round((soBase(soByNo[soNo]) * pct) / 100);
const lineValue = (soNo, qty) =>
  soByNo[soNo].lines.reduce((s, l) => s + (qty[l.id] ?? 0) * l.price, 0);

/* ───────────────────────── Delivery Order & BAST progres ───────────────────────── */

export const vehicles = [
  { plate: "B 9123 KYU", type: "Truk tronton", driver: "Slamet Riyadi", phone: "0812-8834-1120" },
  { plate: "B 9471 FXT", type: "Truk fuso", driver: "Agus Prasetyo", phone: "0813-1902-5571" },
  { plate: "T 8742 DA", type: "Truk trailer (TBP)", driver: "Wawan Setiawan", phone: "0857-2210-4436" },
];

// BAST work breakdown: bobot and contributions (% of contract) s.d. lalu / s.d. kini.
const bastJembatan62 = [
  { item: "Pekerjaan persiapan & mobilisasi", bobot: 4, lalu: 4, kini: 4 },
  { item: "Pondasi tiang pancang spun pile Ø60", bobot: 26, lalu: 26, kini: 26 },
  { item: "Struktur bawah — abutment & pilar", bobot: 22, lalu: 17, kini: 22 },
  { item: "Struktur atas — girder PCI & lantai", bobot: 34, lalu: 0, kini: 10 },
  { item: "Oprit & perkerasan", bobot: 10, lalu: 0, kini: 0 },
  { item: "Finishing, railing & marka", bobot: 4, lalu: 0, kini: 0 },
];

export const deliveries = [
  {
    no: "BAST-202606-0003",
    type: "BAST Progres",
    so: "SO-202610-0044",
    date: "2026-06-15",
    location: "Jembatan Sei Ambawang, Kab. Kubu Raya",
    progress: 25,
    prevProgress: 0,
    value: share("SO-202610-0044", 25),
    status: "BAST Signed",
    receiver: { name: "Ir. Yohanes Kristianto", title: "PPK Jembatan, Dinas PUPR", at: "2026-06-15" },
    works: [
      { item: "Pekerjaan persiapan & mobilisasi", bobot: 4, lalu: 0, kini: 4 },
      { item: "Pondasi tiang pancang spun pile Ø60", bobot: 26, lalu: 0, kini: 21 },
    ],
    invoice: "INV-202606-0011",
  },
  {
    no: "BAST-202607-0005",
    type: "BAST Progres",
    so: "SO-202610-0044",
    date: "2026-07-03",
    location: "Jembatan Sei Ambawang, Kab. Kubu Raya",
    progress: 47,
    prevProgress: 25,
    value: share("SO-202610-0044", 22),
    status: "BAST Signed",
    receiver: { name: "Ir. Yohanes Kristianto", title: "PPK Jembatan, Dinas PUPR", at: "2026-07-03" },
    works: [
      { item: "Pekerjaan persiapan & mobilisasi", bobot: 4, lalu: 4, kini: 4 },
      { item: "Pondasi tiang pancang spun pile Ø60", bobot: 26, lalu: 21, kini: 26 },
      { item: "Struktur bawah — abutment & pilar", bobot: 22, lalu: 0, kini: 17 },
    ],
    invoice: "INV-202607-0016",
  },
  {
    no: "DO-202608-0009",
    type: "Supply",
    so: "SO-202609-0041",
    date: "2026-08-03",
    location: soByNo["SO-202609-0041"].site,
    lines: [
      { id: "PV8", qty: 1_440 },
      { id: "KST", qty: 480 },
    ],
    value: lineValue("SO-202609-0041", { PV8: 1_440, KST: 480 }),
    vehicle: "B 9123 KYU",
    status: "Delivered",
    receiver: { name: "Hendra Wijaya", title: "Site Supervisor, Cakrawala Indopac", at: "2026-08-04" },
    invoice: "INV-202608-0018",
  },
  {
    no: "BAST-202608-0006",
    type: "BAST Progres",
    so: "SO-202608-0040",
    date: "2026-08-28",
    location: "Depo LRT Kelapa Gading, Jakarta Utara",
    progress: 100,
    prevProgress: 0,
    value: share("SO-202608-0040", 100),
    status: "BAST Signed",
    receiver: { name: "Bimo Adhitama", title: "Manajer Depo & Fasilitas, LRT Jakarta", at: "2026-08-28" },
    works: [
      { item: "Bongkar & normalisasi saluran eksisting", bobot: 35, lalu: 0, kini: 35 },
      { item: "Saluran U-Ditch & box culvert baru", bobot: 50, lalu: 0, kini: 50 },
      { item: "Grill penutup & pemulihan perkerasan", bobot: 15, lalu: 0, kini: 15 },
    ],
    invoice: "INV-202609-0024",
  },
  {
    no: "DO-202609-0012",
    type: "Supply",
    so: "SO-202609-0041",
    date: "2026-09-08",
    location: soByNo["SO-202609-0041"].site,
    lines: [
      { id: "PV8", qty: 1_440 },
      { id: "KST", qty: 480 },
    ],
    value: lineValue("SO-202609-0041", { PV8: 1_440, KST: 480 }),
    vehicle: "B 9471 FXT",
    status: "Void",
    note: "Dibatalkan — truk mogok di Tol Cikampek, muatan dipindah ke DO-202609-0014.",
  },
  {
    no: "DO-202609-0014",
    type: "Supply",
    so: "SO-202609-0041",
    date: "2026-09-11",
    location: soByNo["SO-202609-0041"].site,
    lines: [
      { id: "PV8", qty: 1_440 },
      { id: "KST", qty: 480 },
    ],
    value: lineValue("SO-202609-0041", { PV8: 1_440, KST: 480 }),
    vehicle: "B 9471 FXT",
    status: "Delivered",
    receiver: { name: "Hendra Wijaya", title: "Site Supervisor, Cakrawala Indopac", at: "2026-09-12" },
    invoice: "INV-202609-0029",
  },
  {
    no: "BAST-202609-0007",
    type: "BAST Progres",
    so: "SO-202610-0044",
    date: "2026-09-30",
    location: "Jembatan Sei Ambawang, Kab. Kubu Raya",
    progress: 62,
    prevProgress: 47,
    value: share("SO-202610-0044", 15),
    status: "BAST Signed",
    receiver: { name: "Ir. Yohanes Kristianto", title: "PPK Jembatan, Dinas PUPR", at: "2026-09-30" },
    works: bastJembatan62,
    invoice: "INV-202610-0031",
  },
  {
    no: "DO-202610-0016",
    type: "Supply",
    so: "SO-202610-0043",
    date: "2026-10-03",
    location: soByNo["SO-202610-0043"].site,
    lines: [{ id: "UD60", qty: 40 }],
    value: lineValue("SO-202610-0043", { UD60: 40 }),
    vehicle: "T 8742 DA",
    status: "Delivered",
    receiver: { name: "Dimas Saputra", title: "Staf Logistik, Artha Envirotama", at: "2026-10-04" },
    invoice: null,
  },
  {
    no: "BAST-202610-0008",
    type: "BAST Progres",
    so: "SO-202609-0042",
    date: "2026-10-06",
    location: "Ruas Sungai Kakap – Punggur, Kab. Kubu Raya",
    progress: 30,
    prevProgress: 0,
    value: share("SO-202609-0042", 30),
    status: "Draft",
    note: "Opname bersama konsultan selesai 5 Okt — menunggu tanda tangan PPK.",
    works: [
      { item: "Pekerjaan persiapan & mobilisasi", bobot: 5, lalu: 0, kini: 5 },
      { item: "Galian, timbunan & lapis pondasi agregat", bobot: 38, lalu: 0, kini: 21 },
      { item: "Drainase U-Ditch kiri-kanan", bobot: 17, lalu: 0, kini: 4 },
      { item: "Perkerasan AC-WC / AC-BC", bobot: 40, lalu: 0, kini: 0 },
    ],
  },
  {
    no: "DO-202610-0018",
    type: "Supply",
    so: "SO-202610-0043",
    date: "2026-10-08",
    location: soByNo["SO-202610-0043"].site,
    lines: [{ id: "UD60", qty: 40 }],
    value: lineValue("SO-202610-0043", { UD60: 40 }),
    vehicle: "B 9123 KYU",
    status: "In Transit",
    eta: "2026-10-08 16:30",
    invoice: null,
  },
];

/* ───────────────────────── Billables (termin plan per SO) ───────────────────────── */

// kind: "um" (uang muka) | "progress" (termin by BAST) | "supply" (per DO)
// blocked: why it can't be invoiced yet (null = ready)
export const billables = [
  { key: "0039-UM", so: "SO-202608-0039", kind: "um", label: "Uang Muka 20%", ref: null, base: share("SO-202608-0039", 20), blocked: null },
  { key: "0039-T1", so: "SO-202608-0039", kind: "progress", label: "Termin 1 · progres 25%", ref: null, base: share("SO-202608-0039", 25), blocked: "Progres lapangan 9% — belum ada BAST" },
  { key: "0040-T1", so: "SO-202608-0040", kind: "progress", label: "Termin 100% · PHO", ref: "BAST-202608-0006", base: share("SO-202608-0040", 100), blocked: null },
  { key: "0041-DO9", so: "SO-202609-0041", kind: "supply", label: "Supply DO-202608-0009", ref: "DO-202608-0009", base: lineValue("SO-202609-0041", { PV8: 1_440, KST: 480 }), blocked: null },
  { key: "0041-DO14", so: "SO-202609-0041", kind: "supply", label: "Supply DO-202609-0014", ref: "DO-202609-0014", base: lineValue("SO-202609-0041", { PV8: 1_440, KST: 480 }), blocked: null },
  { key: "0041-SISA", so: "SO-202609-0041", kind: "supply", label: "Sisa 40% (belum dikirim)", ref: null, base: lineValue("SO-202609-0041", { PV8: 1_920, KST: 640 }), blocked: "Belum ada DO Delivered untuk sisa qty" },
  { key: "0042-UM", so: "SO-202609-0042", kind: "um", label: "Uang Muka 20%", ref: null, base: share("SO-202609-0042", 20), blocked: null },
  { key: "0042-T1", so: "SO-202609-0042", kind: "progress", label: "Termin 1 · progres 30%", ref: "BAST-202610-0008", base: share("SO-202609-0042", 30), blocked: "BAST-202610-0008 belum ditandatangani PPK" },
  { key: "0043-DO16", so: "SO-202610-0043", kind: "supply", label: "Supply DO-202610-0016", ref: "DO-202610-0016", base: lineValue("SO-202610-0043", { UD60: 40 }), blocked: null },
  { key: "0043-DO18", so: "SO-202610-0043", kind: "supply", label: "Supply DO-202610-0018", ref: "DO-202610-0018", base: lineValue("SO-202610-0043", { UD60: 40 }), blocked: "DO masih In Transit" },
  { key: "0044-UM", so: "SO-202610-0044", kind: "um", label: "Uang Muka 20%", ref: null, base: share("SO-202610-0044", 20), blocked: null },
  { key: "0044-T1", so: "SO-202610-0044", kind: "progress", label: "Termin 1 · progres 25%", ref: "BAST-202606-0003", base: share("SO-202610-0044", 25), blocked: null },
  { key: "0044-T2", so: "SO-202610-0044", kind: "progress", label: "Termin 2 · progres 47%", ref: "BAST-202607-0005", base: share("SO-202610-0044", 22), blocked: null },
  { key: "0044-T3", so: "SO-202610-0044", kind: "progress", label: "Termin 3 · progres 62%", ref: "BAST-202609-0007", base: share("SO-202610-0044", 15), blocked: null },
];

export const billableByKey = Object.fromEntries(billables.map((b) => [b.key, b]));

/* ───────────────────────── Sales invoices ───────────────────────── */

export const salesInvoices = [
  { no: "INV-202603-0004", date: "2026-03-12", due: "2026-04-11", bill: "0044-UM", faktur: "04002600061285140" },
  { no: "INV-202606-0011", date: "2026-06-16", due: "2026-07-16", bill: "0044-T1", faktur: "04002600118734025" },
  { no: "INV-202607-0016", date: "2026-07-06", due: "2026-08-05", bill: "0044-T2", faktur: "04002600132907318" },
  { no: "INV-202608-0018", date: "2026-08-05", due: "2026-09-04", bill: "0041-DO9", faktur: "04002600150462291" },
  { no: "INV-202608-0019", date: "2026-08-20", due: "2026-09-19", bill: "0039-UM", faktur: "04002600156118804" },
  { no: "INV-202609-0024", date: "2026-09-02", due: "2026-10-02", bill: "0040-T1", faktur: "04002600167340956" },
  { no: "INV-202609-0026", date: "2026-09-08", due: "2026-10-08", bill: "0042-UM", faktur: "04002600170025537" },
  { no: "INV-202609-0029", date: "2026-09-14", due: "2026-10-14", bill: "0041-DO14", faktur: "04002600173881460" },
  { no: "INV-202610-0031", date: "2026-10-08", due: "2026-11-07", bill: "0044-T3", faktur: null, draft: true },
];

/** Full tax breakdown of one invoice (or a billable being drafted). */
export function calcBill(billKey) {
  const b = billableByKey[billKey];
  const so = soByNo[b.so];
  const client = clients[so.client];
  const base = b.base;
  const dpp = Math.round((base * 11) / 12);
  const ppn = Math.round(dpp * 0.12);
  const ppnDipungut = client.gov ? ppn : 0;
  const pph = so.pph ? Math.round((base * so.pph.rate) / 100) : 0;
  const retensi = so.retensi && b.kind !== "um" ? Math.round((base * so.retensi) / 100) : 0;
  const gross = base + ppn;
  const neto = gross - ppnDipungut - pph - retensi;
  return {
    billable: b,
    so,
    client,
    base,
    dpp,
    ppn,
    ppnDipungut,
    pph,
    pphMeta: so.pph,
    retensi,
    gross,
    neto,
    kodeFaktur: client.gov ? "02" : "04",
  };
}

const invByNo = Object.fromEntries(salesInvoices.map((i) => [i.no, i]));
const netoOf = (no) => calcBill(invByNo[no].bill).neto;

/* ───────────────────────── Receipts (money in) ───────────────────────── */

export const banks = {
  BCA: { id: "BCA", label: "BCA ··· 1234", coa: "1-1102", coaName: "Bank BCA Operasional" },
  MDR: { id: "MDR", label: "Mandiri ··· 5678", coa: "1-1103", coaName: "Bank Mandiri Proyek" },
};

const ckiPartial = 200_000_000;

// applied: cash allocated per invoice. unapplied: cash parked as Uang Muka Pelanggan.
// ai: suggestion for a bank mutation not yet matched.
export const receipts = [
  {
    no: "RCV-202603-0004",
    date: "2026-03-27",
    client: "PUPR",
    bank: "MDR",
    mutation: "SP2D 00412/LS/2026 RKUD KUBU RAYA UM JBT SEI AMBAWANG",
    amount: netoOf("INV-202603-0004"),
    applied: [{ inv: "INV-202603-0004", amount: netoOf("INV-202603-0004") }],
    status: "Reconciled",
  },
  {
    no: "RCV-202606-0007",
    date: "2026-06-30",
    client: "PUPR",
    bank: "MDR",
    mutation: "SP2D 01877/LS/2026 RKUD KUBU RAYA TERMIN I JBT",
    amount: netoOf("INV-202606-0011"),
    applied: [{ inv: "INV-202606-0011", amount: netoOf("INV-202606-0011") }],
    status: "Reconciled",
  },
  {
    no: "RCV-202609-0009",
    date: "2026-09-18",
    client: "CKI",
    bank: "BCA",
    mutation: "TRSF E-BANKING CR 1809/FTSCY/WS95051 CAKRAWALA INDOPAC",
    amount: ckiPartial,
    applied: [{ inv: "INV-202608-0018", amount: ckiPartial }],
    status: "Reconciled",
  },
  {
    no: "RCV-202610-0010",
    date: "2026-10-02",
    client: "LRT",
    bank: "BCA",
    mutation: "TRSF RTGS CR 0210 PT LRT JAKARTA INV-202609-0024",
    amount: netoOf("INV-202609-0024"),
    applied: [{ inv: "INV-202609-0024", amount: netoOf("INV-202609-0024") }],
    status: "Reconciled",
  },
  {
    no: "RCV-202610-0011",
    date: "2026-10-03",
    client: "ART",
    bank: "BCA",
    mutation: "TRSF E-BANKING CR 0310 ARTHA ENVIROTAMA DP 30% UDITCH",
    amount: 145_854_000,
    applied: [],
    unapplied: 145_854_000,
    note: "Uang muka pelanggan 30% · SO-202610-0043",
    status: "Reconciled",
  },
  {
    no: "RCV-202610-0012",
    date: "2026-10-06",
    client: "CKI",
    bank: "BCA",
    mutation: "TRSF E-BANKING CR 0610/FTSCY/WS95114 CAKRAWALA INDOPAC PELUNASAN",
    amount: netoOf("INV-202608-0018") - ckiPartial,
    applied: [],
    status: "Pending Match",
    ai: {
      inv: "INV-202608-0018",
      confidence: 96,
      reason: "Nominal sama persis dengan sisa tagihan INV-202608-0018 setelah transfer 18 Sep · berita transfer 'PELUNASAN'.",
    },
  },
  {
    no: "RCV-202610-0013",
    date: "2026-10-07",
    client: "KKP",
    bank: "MDR",
    mutation: "SP2D 260930/KPPN-PNK/LS UM KAMPUNG NELAYAN KUALA SECAPAH",
    amount: netoOf("INV-202608-0019"),
    applied: [],
    status: "Pending Match",
    ai: {
      inv: "INV-202608-0019",
      confidence: 92,
      reason: "Nominal = DPP − PPh 4(2) 2,65% (PPN dipungut KPPN) untuk Uang Muka 20% · uraian SP2D menyebut 'UM Kampung Nelayan'.",
    },
  },
];

// Cash-in per month (all customers, incl. SO outside this demo set).
export const monthlyCashIn = [
  { month: "Jan", value: 1_120_000_000 },
  { month: "Feb", value: 845_000_000 },
  { month: "Mar", value: 4_062_000_000 },
  { month: "Apr", value: 1_318_000_000 },
  { month: "Mei", value: 1_906_000_000 },
  { month: "Jun", value: 4_715_000_000 },
  { month: "Jul", value: 1_284_000_000 },
  { month: "Agu", value: 962_000_000 },
  { month: "Sep", value: 538_000_000 },
];

/* ───────────────────────── Chart of accounts used here ───────────────────────── */

export const arCoa = {
  piutang: { coa: "1-1201", name: "Piutang Usaha" },
  retensi: { coa: "1-1202", name: "Piutang Retensi" },
  umPph: { coa: "1-1403", name: "Uang Muka PPh Final 4(2)" },
  umPph22: { coa: "1-1404", name: "Uang Muka PPh 22" },
  pendapatanKontrak: { coa: "4-1101", name: "Pendapatan Kontrak Konstruksi" },
  pendapatanBarang: { coa: "4-1201", name: "Pendapatan Penjualan Precast" },
  ppnKeluaran: { coa: "2-1301", name: "PPN Keluaran" },
  ppnDipungut: { coa: "2-1301", name: "PPN Keluaran — dipungut pemungut (SSP)" },
  umPelanggan: { coa: "2-1401", name: "Uang Muka Pelanggan" },
};
