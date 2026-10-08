// Procurement (P2P) mock data — PR → PO → GR → Vendor Bill.
// All names, NPWP, faktur numbers and figures are fictional demo values.

/* ───────────────────────── Tax helpers ───────────────────────── */

// PMK 131/2024: PPN 12% × DPP nilai lain 11/12 → effectively 11% of harga jual.
export function ppnOf(base) {
  return Math.round(base * (11 / 12) * 0.12);
}

export function lineTotal(lines) {
  return lines.reduce((s, l) => s + l.qty * l.price, 0);
}

/* ───────────────────────── Vendors ───────────────────────── */

export const vendors = {
  MJU: { name: "PT Material Jaya Utama", npwp: "0213 4478 1092 8000", city: "Pontianak", contact: "Suryadi · 0812 5678 2210", top: 30 },
  TBP: { name: "PT Tricowarna Beton Precast", npwp: "0092 1145 0078 3030", city: "Kubu Raya", contact: "Desi Ratnasari · 0813 4521 7788", top: 30, affiliate: true },
  BAM: { name: "CV Batu Alam Mempawah", npwp: "0317 8820 5561 4000", city: "Mempawah", contact: "H. Rahmat · 0821 5402 3317", top: 30 },
  SAB: { name: "PT Sarana Alat Berat Borneo", npwp: "0254 1190 3348 7000", city: "Pontianak", contact: "Wendy Tan · 0811 5730 9921", top: 30 },
  APK: { name: "PT Aspal Prima Khatulistiwa", npwp: "0408 6613 2275 9000", city: "Pontianak", contact: "Kevin Halim · 0812 5011 4432", top: 30 },
  SKR: { name: "UD Sumber Kayu Rasau", npwp: "0532 7714 0981 4000", city: "Rasau Jaya", contact: "Abdul Gani · 0852 4519 6620", top: 30 },
  GTB: { name: "PT Geotekindo Borneo", npwp: "0376 2208 5514 7000", city: "Pontianak", contact: "Ratna Dewi · 0813 4590 2214", top: 30 },
  STP: { name: "CV Sinar Teknik Pontianak", npwp: "0441 9032 6618 2000", city: "Pontianak", contact: "Andreas · 0812 5600 1179", top: 30 },
  BPK: { name: "CV Bangun Pondasi Khatulistiwa", npwp: "0619 3327 4401 5000", city: "Kubu Raya", contact: "Ir. Sugeng · 0821 5733 0042", top: 30, subcon: "Kecil" },
  MKA: { name: "CV Mitra Konstruksi Ambawang", npwp: "0587 1146 9920 3000", city: "Kubu Raya", contact: "Bayu Saputra · 0857 5012 8836", top: 30, subcon: "Menengah" },
};

export const deliveryAddress = {
  "PRJ-TRT-2026-001": "Gudang lapangan Jembatan Sei Ambawang, Jl. Trans Kalimantan Km 12, Kab. Kubu Raya",
  "PRJ-TRT-2026-002": "Base camp Ruas Sungai Kakap – Punggur, Desa Punggur Kecil, Kab. Kubu Raya",
  "PRJ-TRT-2026-004": "Base camp Kuala Secapah, Kec. Mempawah Hilir, Kab. Mempawah",
  "CC-600": "Workshop Pusat, Jl. Adisucipto Km 9, Sungai Raya, Kab. Kubu Raya",
};

/* ───────────────────────── Purchase Request ───────────────────────── */

export const approverRoles = {
  L1: "Project Manager / Kadiv",
  L2: "Manager Pengadaan",
  L3: "Direktur Operasional",
};

const PROC = { name: "Teguh Wibowo", initials: "TW" };
const DIR = { name: "Ir. Darmawan Hartono", initials: "DH" };

// Matriks approval: ≤ Rp50 jt cukup L1–L2; > Rp50 jt sampai Direktur (L3).
export const APPROVAL_L3_THRESHOLD = 50_000_000;

export const purchaseRequests = [
  {
    no: "PR-2026-0189",
    date: "2026-10-08",
    project: null,
    costCenter: "CC-300",
    requester: { name: "Dimas Prakoso", initials: "DP", role: "Estimator" },
    category: "Dokumen & Administrasi Tender",
    purpose: "Cetak dokumen penawaran tender Dermaga Sungai Burung",
    needBy: "2026-10-12",
    items: [
      { material: "Cetak & jilid hard cover dokumen penawaran", qty: 6, unit: "set", price: 850_000 },
      { material: "Meterai elektronik Rp10.000", qty: 120, unit: "lbr", price: 10_000 },
    ],
    budget: { pagu: 185_000_000, commitment: 22_400_000, realisasi: 96_750_000 },
    approvals: [
      { level: "L1", name: "Lukman Hakim", initials: "LH", status: "pending" },
      { level: "L2", ...PROC, status: "waiting" },
    ],
    attachments: [{ name: "Daftar kebutuhan dokumen – Sungai Burung.xlsx", size: "24 KB" }],
    status: "Menunggu Approval",
  },
  {
    no: "PR-2026-0188",
    date: "2026-10-08",
    project: "PRJ-TRT-2026-004",
    requester: { name: "Fajar Nugroho", initials: "FN", role: "Staf Logistik" },
    category: "Precast & Drainase",
    purpose: "Saluran drainase jalan lingkungan zona B",
    needBy: "2026-11-02",
    items: [
      { material: "U-ditch 60×60×120 cm", qty: 220, unit: "unit", price: 1_480_000 },
      { material: "Cover U-ditch 60 cm (heavy duty)", qty: 220, unit: "unit", price: 465_000 },
    ],
    budget: { pagu: 1_640_000_000, commitment: 0, realisasi: 0 },
    approvals: [
      { level: "L1", name: "Maya Anggraini", initials: "MA", status: "waiting" },
      { level: "L2", ...PROC, status: "waiting" },
      { level: "L3", ...DIR, status: "waiting" },
    ],
    attachments: [
      { name: "BOQ-Drainase-Zona-B-rev1.xlsx", size: "88 KB" },
      { name: "Shop drawing U-ditch DR-04.pdf", size: "1,4 MB" },
    ],
    status: "Draft",
  },
  {
    no: "PR-2026-0187",
    date: "2026-10-07",
    project: "PRJ-TRT-2026-001",
    requester: { name: "Hendra Gunawan", initials: "HG", role: "Site Engineer" },
    category: "Material Besi & Beton",
    purpose: "Pembesian pier P2–P3 & pile cap",
    needBy: "2026-10-16",
    items: [
      { material: "Besi beton ulir D16 – 12 m", qty: 420, unit: "btg", price: 212_000 },
      { material: "Besi beton ulir D13 – 12 m", qty: 380, unit: "btg", price: 140_000 },
      { material: "Kawat bendrat 25 kg", qty: 12, unit: "roll", price: 465_000 },
    ],
    budget: { pagu: 2_450_000_000, commitment: 1_384_000_000, realisasi: 742_500_000 },
    approvals: [
      { level: "L1", name: "Bambang Sutrisno", initials: "BS", status: "approved", at: "7 Okt 2026 · 16.42", channel: "email" },
      { level: "L2", ...PROC, status: "pending" },
      { level: "L3", ...DIR, status: "waiting" },
    ],
    attachments: [
      { name: "Bar bending schedule P2-P3.pdf", size: "642 KB" },
      { name: "Penawaran MJU 0610.pdf", size: "212 KB" },
    ],
    status: "Menunggu Approval",
  },
  {
    no: "PR-2026-0186",
    date: "2026-10-07",
    project: "PRJ-TRT-2026-004",
    requester: { name: "Irwan Setiadi", initials: "IS", role: "Site Engineer" },
    category: "Material Alam",
    purpose: "Revetment batu kosong segmen 1–3",
    needBy: "2026-10-20",
    items: [
      { material: "Batu belah 15/20", qty: 640, unit: "m³", price: 365_000 },
      { material: "Sirtu urug", qty: 300, unit: "m³", price: 195_000 },
    ],
    budget: { pagu: 3_860_000_000, commitment: 612_000_000, realisasi: 284_300_000 },
    approvals: [
      { level: "L1", name: "Maya Anggraini", initials: "MA", status: "approved", at: "7 Okt 2026 · 10.05", channel: "sistem" },
      { level: "L2", ...PROC, status: "approved", at: "8 Okt 2026 · 09.15", channel: "email" },
      { level: "L3", ...DIR, status: "pending" },
    ],
    attachments: [{ name: "Perhitungan volume revetment.xlsx", size: "56 KB" }],
    status: "Menunggu Approval",
  },
  {
    no: "PR-2026-0185",
    date: "2026-10-06",
    project: "PRJ-TRT-2026-002",
    requester: { name: "Yusuf Ramadhan", initials: "YR", role: "Site Manager" },
    category: "Aspal & Agregat",
    purpose: "Lapis AC-BC STA 4+200 – 6+800",
    needBy: "2026-10-14",
    items: [
      { material: "Aspal curah pen 60/70", qty: 18_000, unit: "kg", price: 14_750 },
      { material: "Agregat kelas A", qty: 240, unit: "m³", price: 410_000 },
    ],
    budget: { pagu: 1_920_000_000, commitment: 1_108_000_000, realisasi: 512_600_000 },
    approvals: [
      { level: "L1", name: "Agus Salim", initials: "AS", status: "pending" },
      { level: "L2", ...PROC, status: "waiting" },
      { level: "L3", ...DIR, status: "waiting" },
    ],
    attachments: [
      { name: "Job mix formula AC-BC.pdf", size: "1,1 MB" },
      { name: "Penawaran APK 0510.pdf", size: "198 KB" },
    ],
    status: "Menunggu Approval",
  },
  {
    no: "PR-2026-0184",
    date: "2026-10-06",
    project: null,
    costCenter: "CC-600",
    requester: { name: "Rudi Hartanto", initials: "RH", role: "Kepala Workshop" },
    category: "Sparepart Alat Berat",
    purpose: "Service berkala excavator PC200 unit EX-07",
    needBy: "2026-10-09",
    items: [
      { material: "Filter set excavator PC200-8", qty: 6, unit: "set", price: 1_250_000 },
      { material: "Hydraulic hose 1\" assy", qty: 4, unit: "pcs", price: 2_150_000 },
      { material: "Grease EP2 18 kg", qty: 5, unit: "pail", price: 685_000 },
    ],
    budget: { pagu: 240_000_000, commitment: 64_000_000, realisasi: 118_400_000 },
    approvals: [
      { level: "L1", name: "Ahmad Fauzi", initials: "AF", status: "approved", at: "6 Okt 2026 · 08.20", channel: "sistem" },
      { level: "L2", ...PROC, status: "approved", at: "6 Okt 2026 · 11.47", channel: "email" },
    ],
    attachments: [{ name: "Service report EX-07.pdf", size: "320 KB" }],
    status: "Disetujui",
  },
  {
    no: "PR-2026-0183",
    date: "2026-10-05",
    project: "PRJ-TRT-2026-001",
    requester: { name: "Hendra Gunawan", initials: "HG", role: "Site Engineer" },
    category: "Precast & Pondasi",
    purpose: "Tiang pancang abutment A2 & pier P3",
    needBy: "2026-10-20",
    items: [{ material: "Spun pile Ø40 cm kelas A2 – 12 m", qty: 64, unit: "btg", price: 9_850_000 }],
    budget: { pagu: 4_120_000_000, commitment: 2_210_000_000, realisasi: 1_034_000_000 },
    approvals: [
      { level: "L1", name: "Bambang Sutrisno", initials: "BS", status: "approved", at: "5 Okt 2026 · 13.10", channel: "sistem" },
      { level: "L2", ...PROC, status: "approved", at: "5 Okt 2026 · 15.32", channel: "email" },
      { level: "L3", ...DIR, status: "approved", at: "5 Okt 2026 · 19.04", channel: "email" },
    ],
    attachments: [{ name: "Gambar pondasi A2-P3.pdf", size: "2,3 MB" }],
    status: "Disetujui",
  },
  {
    no: "PR-2026-0182",
    date: "2026-10-04",
    project: "PRJ-TRT-2026-002",
    requester: { name: "Fajar Nugroho", initials: "FN", role: "Staf Logistik" },
    category: "Sewa Alat",
    purpose: "Galian & pemadatan badan jalan STA 6+800 – 8+000",
    needBy: "2026-10-07",
    items: [
      { material: "Sewa excavator PC200 (incl. operator)", qty: 200, unit: "jam", price: 485_000 },
      { material: "Sewa vibro roller 10 ton", qty: 120, unit: "jam", price: 395_000 },
    ],
    budget: { pagu: 1_150_000_000, commitment: 486_000_000, realisasi: 402_800_000 },
    approvals: [
      { level: "L1", name: "Agus Salim", initials: "AS", status: "approved", at: "4 Okt 2026 · 09.40", channel: "email" },
      {
        level: "L2",
        ...PROC,
        status: "rejected",
        at: "4 Okt 2026 · 14.02",
        channel: "sistem",
        note: "Pakai kontrak payung PT Sarana Alat Berat Borneo — tarif PC200 Rp455rb/jam.",
      },
      { level: "L3", ...DIR, status: "waiting" },
    ],
    attachments: [],
    status: "Ditolak",
  },
  {
    no: "PR-2026-0181",
    date: "2026-10-03",
    project: "PRJ-TRT-2026-004",
    requester: { name: "Irwan Setiadi", initials: "IS", role: "Site Engineer" },
    category: "Bekisting",
    purpose: "Bekisting pile cap dermaga tambat",
    needBy: "2026-10-07",
    items: [
      { material: "Plywood 12 mm 122×244", qty: 180, unit: "lbr", price: 168_000 },
      { material: "Kayu meranti 5/7", qty: 4.5, unit: "m³", price: 4_850_000 },
    ],
    budget: { pagu: 420_000_000, commitment: 38_000_000, realisasi: 96_400_000 },
    approvals: [
      { level: "L1", name: "Maya Anggraini", initials: "MA", status: "approved", at: "3 Okt 2026 · 08.12", channel: "sistem" },
      { level: "L2", ...PROC, status: "approved", at: "3 Okt 2026 · 10.25", channel: "email" },
      { level: "L3", ...DIR, status: "approved", at: "3 Okt 2026 · 13.50", channel: "email" },
    ],
    attachments: [{ name: "Kebutuhan bekisting PC-01.xlsx", size: "31 KB" }],
    status: "Disetujui",
  },
  {
    no: "PR-2026-0180",
    date: "2026-10-02",
    project: "PRJ-TRT-2026-001",
    requester: { name: "Hendra Gunawan", initials: "HG", role: "Site Engineer" },
    category: "Material Geoteknik",
    purpose: "Perkuatan oprit timbunan sisi barat",
    needBy: "2026-10-12",
    items: [{ material: "Geotextile non-woven 250 gr/m²", qty: 2_400, unit: "m²", price: 18_500 }],
    budget: { pagu: 380_000_000, commitment: 0, realisasi: 112_600_000 },
    approvals: [
      { level: "L1", name: "Bambang Sutrisno", initials: "BS", status: "approved", at: "2 Okt 2026 · 10.30", channel: "email" },
      { level: "L2", ...PROC, status: "approved", at: "2 Okt 2026 · 16.18", channel: "email" },
    ],
    attachments: [{ name: "Spesifikasi teknis geotextile.pdf", size: "410 KB" }],
    status: "Disetujui",
  },
  {
    no: "PR-2026-0179",
    date: "2026-09-29",
    project: "PRJ-TRT-2026-002",
    requester: { name: "Yusuf Ramadhan", initials: "YR", role: "Site Manager" },
    category: "Material Besi & Beton",
    purpose: "Pasangan batu & saluran samping STA 2+000 – 3+400",
    needBy: "2026-10-02",
    items: [
      { material: "Pasir pasang", qty: 120, unit: "m³", price: 285_000 },
      { material: "Semen PCC 50 kg", qty: 400, unit: "sak", price: 68_000 },
    ],
    budget: { pagu: 860_000_000, commitment: 214_000_000, realisasi: 388_900_000 },
    approvals: [
      { level: "L1", name: "Agus Salim", initials: "AS", status: "approved", at: "29 Sep 2026 · 11.02", channel: "sistem" },
      { level: "L2", ...PROC, status: "approved", at: "29 Sep 2026 · 14.40", channel: "email" },
      { level: "L3", ...DIR, status: "approved", at: "30 Sep 2026 · 07.55", channel: "email" },
    ],
    attachments: [{ name: "Opname kebutuhan saluran.xlsx", size: "42 KB" }],
    status: "Disetujui",
  },
];

export const prStats = {
  avgApprovalHours: 5.8,
  prevAvgApprovalHours: 9.4,
  emailOneClickShare: 64,
};

/* ───────────────────────── Purchase Order ───────────────────────── */

export const purchaseOrders = [
  {
    no: "PO-2026-0347",
    date: "2026-10-08",
    pr: "PR-2026-0177",
    vendor: "SAB",
    project: "PRJ-TRT-2026-004",
    deliveryDue: "2026-10-15",
    status: "Draft",
    lines: [
      { material: "Sewa crane 25 ton (incl. operator)", qty: 14, unit: "hari", price: 6_750_000, received: 0 },
      { material: "Mobilisasi & demobilisasi crane", qty: 1, unit: "ls", price: 12_500_000, received: 0 },
    ],
  },
  {
    no: "PO-2026-0346",
    date: "2026-10-07",
    pr: "PR-2026-0184",
    vendor: "STP",
    project: null,
    costCenter: "CC-600",
    deliveryDue: "2026-10-10",
    status: "Terkirim",
    sentVia: "Email & WA",
    lines: [
      { material: "Filter set excavator PC200-8", qty: 6, unit: "set", price: 1_250_000, received: 0 },
      { material: "Hydraulic hose 1\" assy", qty: 4, unit: "pcs", price: 2_150_000, received: 0 },
      { material: "Grease EP2 18 kg", qty: 5, unit: "pail", price: 685_000, received: 0 },
    ],
  },
  {
    no: "PO-2026-0345",
    date: "2026-10-06",
    pr: "PR-2026-0183",
    vendor: "TBP",
    project: "PRJ-TRT-2026-001",
    deliveryDue: "2026-10-20",
    status: "Diterima Sebagian",
    sentVia: "Email",
    lines: [{ material: "Spun pile Ø40 cm kelas A2 – 12 m", qty: 64, unit: "btg", price: 9_850_000, received: 24 }],
  },
  {
    no: "PO-2026-0344",
    date: "2026-10-04",
    pr: "PR-2026-0181",
    vendor: "SKR",
    project: "PRJ-TRT-2026-004",
    deliveryDue: "2026-10-07",
    status: "Diterima Penuh",
    sentVia: "WA",
    lines: [
      { material: "Plywood 12 mm 122×244", qty: 180, unit: "lbr", price: 168_000, received: 180 },
      { material: "Kayu meranti 5/7", qty: 4.5, unit: "m³", price: 4_850_000, received: 4.5 },
    ],
  },
  {
    no: "PO-2026-0343",
    date: "2026-10-03",
    pr: "PR-2026-0180",
    vendor: "GTB",
    project: "PRJ-TRT-2026-001",
    deliveryDue: "2026-10-12",
    status: "Terkirim",
    sentVia: "Email",
    lines: [{ material: "Geotextile non-woven 250 gr/m²", qty: 2_400, unit: "m²", price: 18_500, received: 0 }],
  },
  {
    no: "PO-2026-0342",
    date: "2026-09-28",
    pr: "PR-2026-0174",
    vendor: "MJU",
    project: "PRJ-TRT-2026-001",
    deliveryDue: "2026-10-05",
    status: "Diterima Sebagian",
    sentVia: "Email & WA",
    lines: [
      { material: "Besi beton ulir D13 – 12 m", qty: 600, unit: "btg", price: 140_000, received: 600 },
      { material: "Semen PCC 50 kg", qty: 800, unit: "sak", price: 68_000, received: 800 },
      { material: "Besi beton ulir D16 – 12 m", qty: 300, unit: "btg", price: 212_000, received: 180 },
    ],
  },
  {
    no: "PO-2026-0341",
    date: "2026-09-29",
    pr: "PR-2026-0179",
    vendor: "BAM",
    project: "PRJ-TRT-2026-002",
    deliveryDue: "2026-10-01",
    status: "Diterima Penuh",
    sentVia: "WA",
    lines: [{ material: "Pasir pasang", qty: 120, unit: "m³", price: 285_000, received: 120 }],
  },
  {
    no: "PO-2026-0340",
    date: "2026-09-29",
    pr: "PR-2026-0179",
    vendor: "MJU",
    project: "PRJ-TRT-2026-002",
    deliveryDue: "2026-10-01",
    status: "Diterima Penuh",
    sentVia: "Email",
    lines: [{ material: "Semen PCC 50 kg", qty: 400, unit: "sak", price: 68_000, received: 400 }],
  },
  {
    no: "PO-2026-0339",
    date: "2026-09-26",
    pr: "PR-2026-0172",
    vendor: "BAM",
    project: "PRJ-TRT-2026-004",
    deliveryDue: "2026-10-04",
    status: "Diterima Sebagian",
    sentVia: "WA",
    lines: [{ material: "Batu belah 15/20", qty: 400, unit: "m³", price: 365_000, received: 260 }],
  },
  {
    no: "PO-2026-0338",
    date: "2026-09-24",
    pr: "PR-2026-0171",
    vendor: "BPK",
    project: "PRJ-TRT-2026-001",
    deliveryDue: "2026-10-18",
    status: "Diterima Sebagian",
    sentVia: "Email",
    lines: [{ material: "Jasa pemancangan spun pile Ø40", qty: 768, unit: "m'", price: 185_000, received: 512 }],
  },
  {
    no: "PO-2026-0336",
    date: "2026-08-28",
    pr: "PR-2026-0158",
    vendor: "APK",
    project: "PRJ-TRT-2026-002",
    deliveryDue: "2026-09-05",
    status: "Diterima Penuh",
    sentVia: "Email",
    lines: [{ material: "Aspal curah pen 60/70", qty: 12_000, unit: "kg", price: 14_750, received: 12_000 }],
  },
];

/* ───────────────────────── Goods Receipt (3-way match) ───────────────────────── */

// qtyBill / priceBill null → tagihan belum diterima.
export const goodsReceipts = [
  {
    no: "GR-2026-0219",
    date: "2026-10-07",
    po: "PO-2026-0342",
    sj: "SJ/MJU/X/0412",
    receivedBy: "Hendra Gunawan",
    bill: "BILL-2026-0466",
    lines: [
      { material: "Besi beton ulir D13 – 12 m", unit: "btg", qtyPo: 600, qtyGr: 600, qtyBill: 600, pricePo: 140_000, priceBill: 145_880 },
      { material: "Semen PCC 50 kg", unit: "sak", qtyPo: 800, qtyGr: 800, qtyBill: 800, pricePo: 68_000, priceBill: 68_000 },
      { material: "Besi beton ulir D16 – 12 m", unit: "btg", qtyPo: 300, qtyGr: 180, qtyBill: 180, pricePo: 212_000, priceBill: 212_000 },
    ],
  },
  {
    no: "GR-2026-0218",
    date: "2026-10-06",
    po: "PO-2026-0345",
    sj: "SJ/TBP/2026/1187",
    receivedBy: "Hendra Gunawan",
    bill: "BILL-2026-0463",
    lines: [
      { material: "Spun pile Ø40 cm kelas A2 – 12 m", unit: "btg", qtyPo: 64, qtyGr: 24, qtyBill: 24, pricePo: 9_850_000, priceBill: 9_850_000 },
    ],
  },
  {
    no: "GR-2026-0217",
    date: "2026-10-06",
    po: "PO-2026-0344",
    sj: "SJ-SKR-0921",
    receivedBy: "Maya Anggraini",
    bill: "BILL-2026-0462",
    lines: [
      { material: "Plywood 12 mm 122×244", unit: "lbr", qtyPo: 180, qtyGr: 180, qtyBill: 180, pricePo: 168_000, priceBill: 168_000 },
      { material: "Kayu meranti 5/7", unit: "m³", qtyPo: 4.5, qtyGr: 4.5, qtyBill: 4.8, pricePo: 4_850_000, priceBill: 4_850_000 },
    ],
  },
  {
    no: "GR-2026-0215",
    date: "2026-10-04",
    po: "PO-2026-0339",
    sj: "SJ/BAM/X/0088",
    receivedBy: "Maya Anggraini",
    bill: "BILL-2026-0458",
    lines: [{ material: "Batu belah 15/20", unit: "m³", qtyPo: 400, qtyGr: 260, qtyBill: 260, pricePo: 365_000, priceBill: 365_000 }],
  },
  {
    no: "GR-2026-0214",
    date: "2026-10-02",
    po: "PO-2026-0338",
    sj: "BAPP-BPK-02",
    receivedBy: "Bambang Sutrisno",
    bill: "BILL-2026-0455",
    lines: [{ material: "Jasa pemancangan spun pile Ø40", unit: "m'", qtyPo: 768, qtyGr: 512, qtyBill: 512, pricePo: 185_000, priceBill: 185_000 }],
  },
  {
    no: "GR-2026-0212",
    date: "2026-09-30",
    po: "PO-2026-0341",
    sj: "SJ/BAM/IX/0071",
    receivedBy: "Yusuf Ramadhan",
    bill: "BILL-2026-0449",
    lines: [{ material: "Pasir pasang", unit: "m³", qtyPo: 120, qtyGr: 120, qtyBill: 120, pricePo: 285_000, priceBill: 285_000 }],
  },
  {
    no: "GR-2026-0211",
    date: "2026-09-30",
    po: "PO-2026-0340",
    sj: "SJ/MJU/IX/0398",
    receivedBy: "Yusuf Ramadhan",
    bill: "BILL-2026-0441",
    lines: [{ material: "Semen PCC 50 kg", unit: "sak", qtyPo: 400, qtyGr: 400, qtyBill: 400, pricePo: 68_000, priceBill: 68_000 }],
  },
  {
    no: "GR-2026-0208",
    date: "2026-09-05",
    po: "PO-2026-0336",
    sj: "DO-APK-26-0915",
    receivedBy: "Yusuf Ramadhan",
    bill: "BILL-2026-0428",
    lines: [{ material: "Aspal curah pen 60/70", unit: "kg", qtyPo: 12_000, qtyGr: 12_000, qtyBill: 12_000, pricePo: 14_750, priceBill: 14_750 }],
  },
];

/** Match status for a GR: Match / Selisih Qty / Selisih Harga / Menunggu Tagihan. */
export function matchStatus(lines) {
  if (lines.some((l) => l.qtyBill == null)) return "Menunggu Tagihan";
  if (lines.some((l) => l.priceBill !== l.pricePo)) return "Selisih Harga";
  if (lines.some((l) => l.qtyBill !== l.qtyGr)) return "Selisih Qty";
  return "Match";
}

/* ───────────────────────── Vendor Bill (AP) ───────────────────────── */

export const bankAccounts = [
  { id: "BCA", label: "BCA ··· 1234 — Operasional", coa: "1-1102", coaName: "Bank BCA Operasional", balance: 4_826_400_000 },
  { id: "MDR", label: "Mandiri ··· 5678 — Proyek", coa: "1-1103", coaName: "Bank Mandiri Proyek", balance: 2_118_750_000 },
];

// pph: null (pembelian material) | { type: "4(2)", rate } jasa konstruksi | { type: "23", rate } sewa alat
export const vendorBills = [
  { no: "BILL-2026-0466", faktur: "04002600187264513", vendor: "MJU", po: "PO-2026-0342", gr: "GR-2026-0219", date: "2026-10-07", due: "2026-11-06", base: 180_088_000, pph: null, match: "Selisih Harga" },
  { no: "BILL-2026-0463", faktur: "04002600187190227", vendor: "TBP", po: "PO-2026-0345", gr: "GR-2026-0218", date: "2026-10-06", due: "2026-11-05", base: 236_400_000, pph: null, match: "Match" },
  { no: "BILL-2026-0462", faktur: "04002600186954108", vendor: "SKR", po: "PO-2026-0344", gr: "GR-2026-0217", date: "2026-10-06", due: "2026-11-05", base: 53_520_000, pph: null, match: "Selisih Qty" },
  { no: "BILL-2026-0458", faktur: "04002600186611392", vendor: "BAM", po: "PO-2026-0339", gr: "GR-2026-0215", date: "2026-10-04", due: "2026-11-03", base: 94_900_000, pph: null, match: "Match" },
  { no: "BILL-2026-0455", faktur: "04002600186205871", vendor: "BPK", po: "PO-2026-0338", gr: "GR-2026-0214", date: "2026-10-02", due: "2026-11-01", base: 94_720_000, pph: { type: "4(2)", rate: 1.75 }, match: "Match" },
  { no: "BILL-2026-0449", faktur: "04002600185730046", vendor: "BAM", po: "PO-2026-0341", gr: "GR-2026-0212", date: "2026-09-30", due: "2026-10-30", base: 34_200_000, pph: null, match: "Match" },
  { no: "BILL-2026-0441", faktur: "04002600185402219", vendor: "MJU", po: "PO-2026-0340", gr: "GR-2026-0211", date: "2026-09-29", due: "2026-10-13", base: 27_200_000, pph: null, match: "Match" },
  { no: "BILL-2026-0435", faktur: "04002600184977350", vendor: "TBP", po: "PO-2026-0329", gr: "GR-2026-0201", date: "2026-09-01", due: "2026-10-01", base: 148_000_000, pph: null, match: "Match", paidOn: "2026-10-01", paidFrom: "BCA" },
  { no: "BILL-2026-0428", faktur: "04002600184318804", vendor: "APK", po: "PO-2026-0336", gr: "GR-2026-0208", date: "2026-09-06", due: "2026-10-06", base: 177_000_000, pph: null, match: "Match" },
  { no: "BILL-2026-0412", faktur: "04002600183506631", vendor: "SAB", po: "PO-2026-0318", gr: "GR-2026-0189", date: "2026-08-20", due: "2026-09-19", base: 109_200_000, pph: { type: "23", rate: 2 }, match: "Match" },
  { no: "BILL-2026-0402", faktur: "04002600182941175", vendor: "GTB", po: "PO-2026-0311", gr: "GR-2026-0182", date: "2026-08-12", due: "2026-09-11", base: 32_800_000, pph: null, match: "Match", paidOn: "2026-09-10", paidFrom: "MDR" },
  { no: "BILL-2026-0397", faktur: "04002600182660409", vendor: "SAB", po: "PO-2026-0301", gr: "GR-2026-0174", date: "2026-07-28", due: "2026-08-27", base: 63_200_000, pph: { type: "23", rate: 2 }, match: "Match" },
  { no: "BILL-2026-0371", faktur: "04002600180815562", vendor: "MKA", po: "PO-2026-0274", gr: "BAPP-2026-0031", date: "2026-06-30", due: "2026-07-30", base: 286_500_000, pph: { type: "4(2)", rate: 2.65 }, match: "Selisih Qty", note: "Termin 2 bekisting & pengecoran pier P1 — opname dikoreksi QS" },
];
