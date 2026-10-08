// Mock sales pipeline — Leads → Quotation → Sales Order (money-in side).
// Seller entity: PT Tricowarna Karya Nusantara. PPN 12% × DPP nilai lain (11/12).
// All names, contacts and figures are fictional demo values.

import { companies } from "@/lib/data/org";

export const SELLER = companies[0];
export const PPN_RATE = 0.12;
export const DPP_FACTOR = 11 / 12;

/** Subtotal (harga jual) → DPP nilai lain, PPN 12%, grand total. */
export function taxFromSubtotal(subtotal) {
  const dpp = Math.round(subtotal * DPP_FACTOR);
  const ppn = Math.round(dpp * PPN_RATE);
  return { subtotal, dpp, ppn, grand: subtotal + ppn };
}

/** Grand total (incl. PPN) → breakdown, so seeded totals stay exact. */
export function taxFromGrand(grand) {
  const subtotal = Math.round(grand / (1 + PPN_RATE * DPP_FACTOR));
  return { subtotal, dpp: Math.round(subtotal * DPP_FACTOR), ppn: grand - subtotal, grand };
}

/**
 * Builds line items whose subtotal lands exactly on `subtotal`.
 * spec: [description, qty, unit, weight]; the last row absorbs rounding.
 */
function buildItems(subtotal, spec) {
  let left = subtotal;
  return spec.map(([desc, qty, unit, weight], i) => {
    if (i === spec.length - 1) {
      const price = left / qty;
      if (Number.isInteger(price)) return { desc, qty, unit, price };
      return { desc, qty: 1, unit: "ls", price: left };
    }
    const price = Math.round((subtotal * weight) / qty / 1000) * 1000;
    left -= price * qty;
    return { desc, qty, unit, price };
  });
}

export function itemsSubtotal(items) {
  return items.reduce((s, i) => s + i.qty * i.price, 0);
}

/* ───────────────────────── People ───────────────────────── */

export const salesTeam = [
  { id: "YUN", name: "Yunita Hapsari", initials: "YH", tone: "indigo", role: "Sales Manager" },
  { id: "RKA", name: "Rizky Kurnia Akbar", initials: "RA", tone: "green", role: "Account Executive · Pemerintah" },
  { id: "DPR", name: "Dimas Prasetyo", initials: "DP", tone: "amber", role: "Account Executive · Swasta" },
  { id: "SWL", name: "Sari Wulandari", initials: "SW", tone: "zinc", role: "Sales Admin" },
];

export const salesById = Object.fromEntries(salesTeam.map((s) => [s.id, s]));

/* ───────────────────────── Customers ───────────────────────── */

export const customers = [
  "Ditjen Perikanan Tangkap – KKP",
  "Dinas PUPR Kab. Kubu Raya",
  "Dinas PUPR Kab. Kubu Raya (Bina Marga)",
  "PT LRT Jakarta",
  "PT Cakrawala Indopac",
  "PT Artha Envirotama",
  "PT INDOJAYA MITRA SARANA",
  "PTSC M&C",
  "Kawasan Industri Ketapang",
  "PT Pelindo Regional 2 Pontianak",
  "Balai Wilayah Sungai Kalimantan I",
  "PT Graha Borneo Properti",
];

/* ───────────────────────── Leads ───────────────────────── */

export const leadStatuses = ["Data Baru", "Follow-up", "Customer", "Lost"];
export const leadSources = ["INAPROC", "Referral", "Website", "Pameran"];

export const leads = [
  {
    id: "LD-0101",
    name: "Hendra Wijaya",
    title: "Direktur Pengembangan",
    company: "Kawasan Industri Ketapang",
    email: "hendra.w@kiketapang.co.id",
    phone: "0812-5634-2210",
    value: 38_500_000_000,
    source: "Pameran",
    tags: ["Infrastruktur", "Kawasan Industri"],
    assigned: "YUN",
    status: "Follow-up",
    created: "2026-09-02",
    location: "Ketapang, Kalbar",
    need: "Jalan kawasan + drainase utama fase 1 (± 4,2 km) dan dermaga barang curah.",
    activities: [
      { date: "2026-10-06", type: "Meeting", by: "YUN", text: "Presentasi company profile & referensi proyek jalan di kantor pengelola kawasan." },
      { date: "2026-09-20", type: "Site visit", by: "DPR", text: "Survey lokasi bersama tim teknis KI Ketapang — tanah lunak, perlu cerucuk." },
      { date: "2026-09-02", type: "Lead masuk", by: "SWL", text: "Kartu nama dari Pameran Konstruksi Indonesia 2026, booth Tricowarna." },
    ],
  },
  {
    id: "LD-0102",
    name: "Lukas Tanoto",
    title: "Procurement Manager",
    company: "PT Cakrawala Indopac",
    email: "lukas.tanoto@cakrawalaindopac.com",
    phone: "0811-1872-9054",
    value: 2_150_000_000,
    source: "Referral",
    tags: ["Swasta", "Repeat order"],
    assigned: "YUN",
    status: "Customer",
    created: "2026-07-14",
    location: "Cikarang, Jawa Barat",
    need: "Ekspansi gudang tahap 2 — paving, kanstin, saluran keliling.",
    activities: [
      { date: "2026-09-03", type: "Sales Order", by: "YUN", text: "SO-202609-0041 terbit dari Quotation 055-YUN-Rev01." },
      { date: "2026-08-25", type: "Negosiasi", by: "YUN", text: "Revisi harga paving K-350 — diskon volume 4%." },
      { date: "2026-07-14", type: "Lead masuk", by: "SWL", text: "Referensi dari PT Artha Envirotama." },
    ],
  },
  {
    id: "LD-0103",
    name: "Agus Salim Nasution",
    title: "Project Director",
    company: "PT INDOJAYA MITRA SARANA",
    email: "agus.nasution@indojayams.co.id",
    phone: "0813-4410-7782",
    value: 6_800_000_000,
    source: "Website",
    tags: ["Swasta", "Gedung"],
    assigned: "DPR",
    status: "Follow-up",
    created: "2026-09-11",
    location: "Pontianak, Kalbar",
    need: "Pekerjaan struktur gudang logistik 2 lantai + pondasi tiang pancang.",
    activities: [
      { date: "2026-10-05", type: "Email", by: "DPR", text: "Kirim draft RAB & metode kerja tiang pancang spun pile 40 cm." },
      { date: "2026-09-18", type: "Call", by: "DPR", text: "Konfirmasi gambar DED tersedia, minta jadwal aanwijzing internal." },
      { date: "2026-09-11", type: "Lead masuk", by: "SWL", text: "Form kontak website — permintaan penawaran struktur." },
    ],
  },
  {
    id: "LD-0104",
    name: "Ir. Bambang Suryadi",
    title: "Manager Proyek",
    company: "PTSC M&C",
    email: "bambang.s@ptscmc.co.id",
    phone: "0812-9900-3412",
    value: 4_250_000_000,
    source: "Referral",
    tags: ["Marine", "BUMN"],
    assigned: "RKA",
    status: "Data Baru",
    created: "2026-10-03",
    location: "Mempawah, Kalbar",
    need: "Subkon pekerjaan revetment & turap baja untuk terminal kargo.",
    activities: [
      { date: "2026-10-03", type: "Lead masuk", by: "RKA", text: "Referensi dari konsultan pengawas Kampung Nelayan Kuala Secapah." },
    ],
  },
  {
    id: "LD-0105",
    name: "Drs. Syamsul Bahri",
    title: "PPK Jalan & Jembatan",
    company: "Dinas PUPR Kab. Kubu Raya",
    email: "ppk.binamarga@kuburayakab.go.id",
    phone: "0561-722-410",
    value: 18_640_000_000,
    source: "INAPROC",
    tags: ["Pemerintah", "Jembatan"],
    assigned: "RKA",
    status: "Customer",
    created: "2026-03-10",
    location: "Kab. Kubu Raya, Kalbar",
    need: "Pembangunan Jembatan Sei Ambawang + adendum 1 (pekerjaan oprit).",
    activities: [
      { date: "2026-10-06", type: "Sales Order", by: "RKA", text: "SO-202610-0044 adendum 1 menunggu approval Direktur." },
      { date: "2026-09-28", type: "Sales Order", by: "RKA", text: "SO-202609-0042 ruas Sungai Kakap – Punggur disetujui." },
      { date: "2026-03-10", type: "Lead masuk", by: "RKA", text: "Paket tender dari INAPROC / SPSE Kab. Kubu Raya." },
    ],
  },
  {
    id: "LD-0106",
    name: "Rudi Hartono",
    title: "Kabid Prasarana",
    company: "Ditjen Perikanan Tangkap – KKP",
    email: "rudi.hartono@kkp.go.id",
    phone: "021-3519-070",
    value: 24_918_300_000,
    source: "INAPROC",
    tags: ["Pemerintah", "Marine"],
    assigned: "RKA",
    status: "Customer",
    created: "2026-05-22",
    location: "Kab. Mempawah, Kalbar",
    need: "Kampung Nelayan Merah Putih Kuala Secapah — dermaga, cold storage, jalan lingkungan.",
    activities: [
      { date: "2026-08-12", type: "Sales Order", by: "RKA", text: "SO-202608-0039 terbit · uang muka 20% telah ditagih." },
      { date: "2026-07-30", type: "Tender", by: "RKA", text: "Ditetapkan pemenang, Quotation 049-RKA-Rev02 jadi dasar kontrak." },
      { date: "2026-05-22", type: "Lead masuk", by: "SWL", text: "Pengumuman paket di INAPROC." },
    ],
  },
  {
    id: "LD-0107",
    name: "Maria Christina",
    title: "Head of Facility",
    company: "PT LRT Jakarta",
    email: "maria.c@lrtj.co.id",
    phone: "021-2952-1188",
    value: 1_350_000_000,
    source: "Website",
    tags: ["BUMD", "Maintenance"],
    assigned: "YUN",
    status: "Follow-up",
    created: "2026-09-25",
    location: "Jakarta Utara",
    need: "Lanjutan perbaikan drainase & rigid pavement area stabling depo.",
    activities: [
      { date: "2026-10-07", type: "Call", by: "YUN", text: "Klien minta penawaran paket kedua sebelum akhir Oktober." },
      { date: "2026-09-25", type: "Lead masuk", by: "SWL", text: "Repeat inquiry setelah SO-202608-0040 selesai." },
    ],
  },
  {
    id: "LD-0108",
    name: "Fransiska Lim",
    title: "Development Manager",
    company: "PT Graha Borneo Properti",
    email: "fransiska@grahaborneo.id",
    phone: "0813-5200-6671",
    value: 9_600_000_000,
    source: "Pameran",
    tags: ["Developer", "Perumahan"],
    assigned: "DPR",
    status: "Data Baru",
    created: "2026-10-01",
    location: "Kubu Raya, Kalbar",
    need: "Infrastruktur cluster 320 unit — jalan, saluran, box culvert.",
    activities: [
      { date: "2026-10-01", type: "Lead masuk", by: "SWL", text: "Kunjungan booth REI Expo Pontianak." },
    ],
  },
  {
    id: "LD-0109",
    name: "Yohanes Pratama",
    title: "Kasatker PJSA",
    company: "Balai Wilayah Sungai Kalimantan I",
    email: "satker.pjsa@bwskal1.pu.go.id",
    phone: "0561-736-512",
    value: 14_200_000_000,
    source: "INAPROC",
    tags: ["Pemerintah", "SDA"],
    assigned: "RKA",
    status: "Follow-up",
    created: "2026-08-19",
    location: "Sambas, Kalbar",
    need: "Pengaman pantai Paloh — tetrapod & geobag. Rencana lelang Nov 2026.",
    activities: [
      { date: "2026-10-02", type: "Meeting", by: "RKA", text: "Pre-market sounding satker — konfirmasi pagu & jadwal lelang." },
      { date: "2026-08-19", type: "Lead masuk", by: "RKA", text: "RUP tercantum di SiRUP / INAPROC." },
    ],
  },
  {
    id: "LD-0110",
    name: "Dewi Anggraini",
    title: "Purchasing Supervisor",
    company: "PT Artha Envirotama",
    email: "dewi.a@arthaenvirotama.com",
    phone: "0812-8123-4477",
    value: 486_180_000,
    source: "Referral",
    tags: ["Supply", "Precast"],
    assigned: "YUN",
    status: "Customer",
    created: "2026-09-08",
    location: "Bekasi, Jawa Barat",
    need: "U-Ditch 60×60 — 120 unit, kirim bertahap.",
    activities: [
      { date: "2026-10-02", type: "Sales Order", by: "YUN", text: "SO-202610-0043 Ready for DO · produksi PT Tricowarna Beton Precast." },
      { date: "2026-09-08", type: "Lead masuk", by: "DPR", text: "Referensi dari PT Cakrawala Indopac." },
    ],
  },
  {
    id: "LD-0111",
    name: "Rahmat Hidayat",
    title: "Kepala UPT",
    company: "PT Pelindo Regional 2 Pontianak",
    email: "rahmat.h@pelindo.co.id",
    phone: "0561-734-221",
    value: 7_400_000_000,
    source: "INAPROC",
    tags: ["BUMN", "Pelabuhan"],
    assigned: "RKA",
    status: "Lost",
    created: "2026-06-03",
    location: "Pontianak, Kalbar",
    need: "Rehabilitasi lapangan penumpukan peti kemas.",
    lostReason: "Kalah harga — selisih 6,8% dari pemenang.",
    activities: [
      { date: "2026-08-14", type: "Lost", by: "RKA", text: "Pengumuman pemenang: PT Karya Samudra. Selisih harga 6,8%." },
      { date: "2026-06-03", type: "Lead masuk", by: "RKA", text: "Paket e-tender eproc Pelindo." },
    ],
  },
  {
    id: "LD-0112",
    name: "Stevanus Gunawan",
    title: "Owner",
    company: "CV Sinar Khatulistiwa",
    email: "stevanus@sinarkhatulistiwa.id",
    phone: "0821-5410-9002",
    value: 820_000_000,
    source: "Website",
    tags: ["Swasta", "Supply"],
    assigned: "DPR",
    status: "Lost",
    created: "2026-07-21",
    location: "Singkawang, Kalbar",
    need: "Supply buis beton & box culvert.",
    lostReason: "Proyek ditunda pemilik (pendanaan).",
    activities: [
      { date: "2026-09-01", type: "Lost", by: "DPR", text: "Klien menunda proyek ke 2027." },
      { date: "2026-07-21", type: "Lead masuk", by: "SWL", text: "Form kontak website." },
    ],
  },
  {
    id: "LD-0113",
    name: "Nur Aisyah Putri",
    title: "Estate Engineer",
    company: "Kawasan Industri Ketapang",
    email: "aisyah.p@kiketapang.co.id",
    phone: "0812-5634-2288",
    value: 3_100_000_000,
    source: "Referral",
    tags: ["Kawasan Industri", "Supply"],
    assigned: "DPR",
    status: "Data Baru",
    created: "2026-10-07",
    location: "Ketapang, Kalbar",
    need: "Supply precast saluran tertutup untuk kavling tenant.",
    activities: [
      { date: "2026-10-07", type: "Lead masuk", by: "YUN", text: "Diteruskan oleh Hendra Wijaya (Direktur Pengembangan)." },
    ],
  },
  {
    id: "LD-0114",
    name: "Bonifasius Ade",
    title: "Kabid Cipta Karya",
    company: "Dinas PUPR Kab. Mempawah",
    email: "ciptakarya@mempawahkab.go.id",
    phone: "0561-691-044",
    value: 5_450_000_000,
    source: "INAPROC",
    tags: ["Pemerintah", "Air Bersih"],
    assigned: "RKA",
    status: "Follow-up",
    created: "2026-09-15",
    location: "Kab. Mempawah, Kalbar",
    need: "Jaringan pipa distribusi SPAM IKK Sungai Pinyuh.",
    activities: [
      { date: "2026-10-04", type: "Email", by: "RKA", text: "Kirim dokumen kualifikasi (SBU SI003, pengalaman 4 tahun terakhir)." },
      { date: "2026-09-15", type: "Lead masuk", by: "RKA", text: "Paket pengadaan langsung dari SiRUP." },
    ],
  },
];

/* ───────────────────────── Quotations ───────────────────────── */

const projectSpec = [
  ["Pekerjaan persiapan & mobilisasi", 1, "ls", 0.04],
  ["Pekerjaan tanah & perbaikan subgrade", 1, "ls", 0.18],
  ["Pekerjaan struktur utama", 1, "ls", 0.52],
  ["Pekerjaan pelengkap & finishing", 1, "ls", 0.22],
  ["SMK3, demobilisasi & as-built drawing", 1, "ls", 0.04],
];

const spec = {
  "049-RKA-Rev02": [
    ["Dermaga beton tiang pancang 120 m", 1, "ls", 0.38],
    ["Cold storage 30 ton + ice flake machine", 1, "unit", 0.21],
    ["Jalan lingkungan rigid pavement", 2_850, "m²", 0.09],
    ["Balai nelayan & TPI", 1, "ls", 0.16],
    ["Utilitas — air bersih, listrik, IPAL", 1, "ls", 0.16],
  ],
  "053-YUN-Rev00": [
    ["Bongkar saluran eksisting", 180, "m'", 0.08],
    ["U-Ditch 80×80 + cover heavy duty", 180, "m'", 0.62],
    ["Rigid pavement K-350 t=25 cm", 320, "m²", 0.24],
    ["Pembersihan & testing aliran", 1, "ls", 0.06],
  ],
  "055-YUN-Rev01": [
    ["Paving block K-350 t=8 cm (supply & pasang)", 6_400, "m²", 0.58],
    ["Kanstin beton 20×30×60", 1_150, "m'", 0.14],
    ["Lapis pondasi agregat kelas A t=15 cm", 960, "m³", 0.2],
    ["Mobilisasi & pengaturan lalu lintas gudang", 1, "ls", 0.08],
  ],
  "054-RKA-Rev00": [
    ["Lapis pondasi agregat kelas A", 6_200, "m³", 0.24],
    ["Laston AC-WC t=4 cm", 24_800, "m²", 0.41],
    ["Drainase beton U-Ditch 60×60", 3_400, "m'", 0.27],
    ["Marka, rambu & pelengkap jalan", 1, "ls", 0.08],
  ],
  "057-YUN-Rev00": [
    ["U-Ditch precast 60×60×120 cm K-350", 120, "unit", 0.78],
    ["Cover U-Ditch 60 light duty", 120, "unit", 0.14],
    ["Ongkos kirim Cikarang – Bekasi (trailer)", 1, "ls", 0.08],
  ],
  "058-YUN-Rev00": [
    ["Pekerjaan oprit jembatan sisi Ambawang", 1, "ls", 0.31],
    ["Pondasi bored pile Ø80 tambahan", 24, "titik", 0.27],
    ["Gelagar PCI-girder H-170 L=40,8 m", 8, "bh", 0.34],
    ["Perkerasan & pelengkap oprit", 1, "ls", 0.08],
  ],
};

function q(ref, rev, data) {
  const no = `${ref}-${data.code}-${rev}`;
  const t = taxFromGrand(data.grand);
  const items = buildItems(t.subtotal, spec[no] ?? projectSpec);
  return { ref, rev, no, ...data, items };
}

export const quotations = [
  q("045", "Rev00", { code: "SWL", subject: "Pengurugan & pematangan lahan gudang Sungai Raya", client: "PT Graha Borneo Properti", date: "2026-04-22", validTo: "2026-05-22", status: "Converted to SO", soNo: "SO-202605-0035", grand: 2_164_500_000 }),
  q("047", "Rev01", { code: "YUN", subject: "Supply box culvert 2×2 m — 46 segmen", client: "PT Cakrawala Indopac", date: "2026-05-28", validTo: "2026-06-27", status: "Converted to SO", soNo: "SO-202606-0036", grand: 1_087_800_000 }),
  q("048", "Rev00", { code: "RKA", subject: "Rehabilitasi saluran primer Desa Kuala Dua", client: "Dinas PUPR Kab. Kubu Raya", date: "2026-06-30", validTo: "2026-07-30", status: "Converted to SO", soNo: "SO-202607-0037", grand: 3_496_500_000 }),
  q("046", "Rev00", { code: "DPR", subject: "Perkerasan jalan akses pabrik tahap 1", client: "PT INDOJAYA MITRA SARANA", date: "2026-07-08", validTo: "2026-08-07", status: "Converted to SO", soNo: "SO-202607-0038", grand: 1_665_000_000 }),
  q("049", "Rev02", { code: "RKA", subject: "Kontrak Kampung Nelayan Merah Putih Kuala Secapah", client: "Ditjen Perikanan Tangkap – KKP", date: "2026-07-24", validTo: "2026-08-23", status: "Converted to SO", soNo: "SO-202608-0039", grand: 24_918_300_000 }),
  q("053", "Rev00", { code: "YUN", subject: "Perbaikan drainase depo Kelapa Gading", client: "PT LRT Jakarta", date: "2026-08-06", validTo: "2026-09-05", status: "Converted to SO", soNo: "SO-202608-0040", grand: 742_900_000 }),
  q("052", "Rev00", { code: "DPR", subject: "Pagar panel beton gudang Pontianak", client: "CV Sinar Khatulistiwa", date: "2026-07-18", validTo: "2026-08-17", status: "Void", grand: 512_820_000 }),
  q("055", "Rev01", { code: "YUN", subject: "Supply & pasang paving + kanstin gudang Cikarang", client: "PT Cakrawala Indopac", date: "2026-08-26", validTo: "2026-09-25", status: "Converted to SO", soNo: "SO-202609-0041", grand: 1_284_600_000 }),
  q("054", "Rev00", { code: "RKA", subject: "Peningkatan Jalan Sungai Kakap – Punggur", client: "Dinas PUPR Kab. Kubu Raya (Bina Marga)", date: "2026-09-10", validTo: "2026-10-10", status: "Converted to SO", soNo: "SO-202609-0042", grand: 11_275_500_000 }),
  q("056", "Rev01", { code: "RKA", subject: "Rehabilitasi lapangan penumpukan peti kemas", client: "PT Pelindo Regional 2 Pontianak", date: "2026-07-02", validTo: "2026-08-01", status: "Void", grand: 7_881_000_000 }),
  q("057", "Rev00", { code: "YUN", subject: "Supply U-Ditch precast 60×60 – 120 unit", client: "PT Artha Envirotama", date: "2026-09-24", validTo: "2026-10-24", status: "Converted to SO", soNo: "SO-202610-0043", grand: 486_180_000 }),
  q("058", "Rev00", { code: "YUN", subject: "Pembangunan Jembatan Sei Ambawang (adendum 1)", client: "Dinas PUPR Kab. Kubu Raya", date: "2026-09-30", validTo: "2026-10-30", status: "Converted to SO", soNo: "SO-202610-0044", grand: 18_640_000_000 }),
  q("050", "Rev01", { code: "SWL", subject: "Supply buis beton Ø100 — 80 unit", client: "PT INDOJAYA MITRA SARANA", date: "2026-08-28", validTo: "2026-09-27", status: "Waiting Customer", grand: 298_590_000 }),
  q("059", "Rev00", { code: "YUN", subject: "Drainase & rigid pavement stabling depo (paket 2)", client: "PT LRT Jakarta", date: "2026-10-01", validTo: "2026-10-31", status: "Waiting Customer", grand: 1_498_500_000 }),
  q("060", "Rev01", { code: "DPR", subject: "Struktur gudang logistik 2 lantai + spun pile", client: "PT INDOJAYA MITRA SARANA", date: "2026-10-05", validTo: "2026-11-04", status: "Approved Internal", grand: 7_548_000_000 }),
  q("061", "Rev00", { code: "RKA", subject: "Revetment & turap baja terminal kargo", client: "PTSC M&C", date: "2026-10-06", validTo: "2026-11-05", status: "Approved Internal", grand: 4_717_500_000 }),
  q("062", "Rev00", { code: "DPR", subject: "Jalan kawasan & drainase utama fase 1", client: "Kawasan Industri Ketapang", date: "2026-10-07", validTo: "2026-11-06", status: "Waiting Internal", grand: 42_735_000_000 }),
  q("063", "Rev00", { code: "SWL", subject: "Supply precast saluran tertutup kavling tenant", client: "Kawasan Industri Ketapang", date: "2026-10-08", validTo: "2026-11-07", status: "Waiting Internal", grand: 3_441_000_000 }),
];

/* ───────────────────────── Sales Orders ───────────────────────── */

const quoteByNo = Object.fromEntries(quotations.map((x) => [x.no, x]));

const projectTerms = {
  dp: 20,
  termin: "Termin progres fisik 30% · 60% · 100% (MC bulanan)",
  retensi: 5,
  retensiDays: 180,
  top: "30 hari setelah invoice diterima",
};

const projectBilling = (paidCount) =>
  [
    ["Uang muka", 20, "Penandatanganan kontrak + jaminan uang muka"],
    ["Termin 1", 25, "Progres fisik 30%"],
    ["Termin 2", 25, "Progres fisik 60%"],
    ["Termin 3", 25, "Progres fisik 100% / PHO"],
    ["Retensi", 5, "FHO · 180 hari setelah PHO"],
  ].map(([label, pct, basis], i) => ({ label, pct, basis, state: i < paidCount ? "Ditagih" : "Terjadwal" }));

function so(no, data) {
  const quote = quoteByNo[data.quoteRef];
  return {
    no,
    seller: SELLER.name,
    items: quote?.items ?? [],
    salesperson: quote?.code ?? "YUN",
    terms: projectTerms,
    ...data,
  };
}

export const salesOrders = [
  so("SO-202605-0035", {
    quoteRef: "045-SWL-Rev00", client: "PT Graha Borneo Properti", scope: "Pengurugan & pematangan lahan gudang Sungai Raya", project: null,
    grandTotal: 2_164_500_000, date: "2026-05-04", status: "Closed", invoicedPct: 100,
    terms: { dp: 30, termin: "Pelunasan 70% setelah BAST", retensi: 0, retensiDays: 0, top: "14 hari" },
    billing: [
      { label: "Uang muka", pct: 30, basis: "Penandatanganan SO", state: "Ditagih" },
      { label: "Pelunasan", pct: 70, basis: "BAST pekerjaan", state: "Ditagih" },
    ],
  }),
  so("SO-202606-0036", {
    quoteRef: "047-YUN-Rev01", client: "PT Cakrawala Indopac", scope: "Supply box culvert 2×2 m — 46 segmen (via afiliasi PT Tricowarna Beton Precast)", project: null,
    grandTotal: 1_087_800_000, date: "2026-06-02", status: "Closed", invoicedPct: 100,
    terms: { dp: 30, termin: "Pelunasan 70% setelah DO diterima", retensi: 0, retensiDays: 0, top: "30 hari" },
    billing: [
      { label: "Uang muka", pct: 30, basis: "PO diterima", state: "Ditagih" },
      { label: "Pelunasan", pct: 70, basis: "Surat jalan ditandatangani", state: "Ditagih" },
    ],
  }),
  so("SO-202607-0037", {
    quoteRef: "048-RKA-Rev00", client: "Dinas PUPR Kab. Kubu Raya", scope: "Rehabilitasi saluran primer Desa Kuala Dua", project: null,
    grandTotal: 3_496_500_000, date: "2026-07-06", status: "Closed", invoicedPct: 100,
    terms: { dp: 20, termin: "Pelunasan setelah PHO", retensi: 5, retensiDays: 180, top: "30 hari" },
    billing: [
      { label: "Uang muka", pct: 20, basis: "Kontrak + jaminan uang muka", state: "Ditagih" },
      { label: "Pelunasan", pct: 75, basis: "PHO 100%", state: "Ditagih" },
      { label: "Retensi", pct: 5, basis: "Dicairkan dengan jaminan pemeliharaan", state: "Ditagih" },
    ],
  }),
  so("SO-202607-0038", {
    quoteRef: "046-DPR-Rev00", client: "PT INDOJAYA MITRA SARANA", scope: "Perkerasan jalan akses pabrik tahap 1", project: null,
    grandTotal: 1_665_000_000, date: "2026-07-15", status: "Closed", invoicedPct: 100,
    terms: { dp: 20, termin: "Pelunasan 80% setelah BAST", retensi: 0, retensiDays: 0, top: "30 hari" },
    billing: [
      { label: "Uang muka", pct: 20, basis: "Penandatanganan SO", state: "Ditagih" },
      { label: "Pelunasan", pct: 80, basis: "BAST pekerjaan", state: "Ditagih" },
    ],
  }),
  so("SO-202608-0039", {
    quoteRef: "049-RKA-Rev02", client: "Ditjen Perikanan Tangkap – KKP", scope: "Kontrak Kampung Nelayan Merah Putih Kuala Secapah", project: "PRJ-TRT-2026-004",
    grandTotal: 24_918_300_000, date: "2026-08-12", status: "Approved", invoicedPct: 20,
    billing: projectBilling(1),
  }),
  so("SO-202608-0040", {
    quoteRef: "053-YUN-Rev00", client: "PT LRT Jakarta", scope: "Perbaikan drainase depo Kelapa Gading", project: null,
    grandTotal: 742_900_000, date: "2026-08-20", status: "Closed", invoicedPct: 100,
    terms: { dp: 30, termin: "Pelunasan 70% setelah BAST", retensi: 0, retensiDays: 0, top: "30 hari" },
    billing: [
      { label: "Uang muka", pct: 30, basis: "Penandatanganan SO", state: "Ditagih" },
      { label: "Pelunasan", pct: 70, basis: "BAST pekerjaan", state: "Ditagih" },
    ],
  }),
  so("SO-202609-0041", {
    quoteRef: "055-YUN-Rev01", client: "PT Cakrawala Indopac", scope: "Supply & pasang paving + kanstin gudang Cikarang", project: null,
    grandTotal: 1_284_600_000, date: "2026-09-03", status: "Approved", invoicedPct: 60,
    terms: { dp: 20, termin: "Termin progres 50% · 100%", retensi: 5, retensiDays: 180, top: "30 hari" },
    billing: [
      { label: "Uang muka", pct: 20, basis: "Penandatanganan SO", state: "Ditagih" },
      { label: "Termin 1", pct: 40, basis: "Progres fisik 50%", state: "Ditagih" },
      { label: "Termin 2", pct: 35, basis: "Progres 100% / BAST", state: "Terjadwal" },
      { label: "Retensi", pct: 5, basis: "180 hari setelah BAST", state: "Terjadwal" },
    ],
  }),
  so("SO-202609-0042", {
    quoteRef: "054-RKA-Rev00", client: "Dinas PUPR Kab. Kubu Raya (Bina Marga)", scope: "Peningkatan Jalan Sungai Kakap – Punggur", project: "PRJ-TRT-2026-002",
    grandTotal: 11_275_500_000, date: "2026-09-28", status: "Approved", invoicedPct: 20,
    billing: projectBilling(1),
  }),
  so("SO-202610-0043", {
    quoteRef: "057-YUN-Rev00", client: "PT Artha Envirotama", scope: "Supply U-Ditch precast 60×60 – 120 unit (via afiliasi PT Tricowarna Beton Precast)", project: null,
    grandTotal: 486_180_000, date: "2026-10-02", status: "Ready for DO", invoicedPct: 0,
    terms: { dp: 0, termin: "100% setelah barang diterima (per DO)", retensi: 0, retensiDays: 0, top: "30 hari setelah surat jalan" },
    billing: [
      { label: "Pengiriman 1", pct: 50, basis: "DO 60 unit diterima", state: "Terjadwal" },
      { label: "Pengiriman 2", pct: 50, basis: "DO 60 unit diterima", state: "Terjadwal" },
    ],
  }),
  so("SO-202610-0044", {
    quoteRef: "058-YUN-Rev00", client: "Dinas PUPR Kab. Kubu Raya", scope: "Kontrak Pembangunan Jembatan Sei Ambawang (adendum 1)", project: "PRJ-TRT-2026-001",
    grandTotal: 18_640_000_000, date: "2026-10-06", status: "Awaiting Approval", invoicedPct: 0,
    billing: projectBilling(0),
  }),
].reverse();

export const NEXT_SO_SEQ = 45;
