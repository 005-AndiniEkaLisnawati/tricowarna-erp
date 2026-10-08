// Mock master data — Tricowarna Group (multi-company holding).
// All names, NPWP and figures are fictional demo values.

export const TODAY = "2026-10-08";

export const companies = [
  {
    id: "TKN",
    name: "PT Tricowarna Karya Nusantara",
    role: "Holding · Kontraktor Utama",
    npwp: "0074 5218 9031 7010",
  },
  {
    id: "TBK",
    name: "PT Trico Bahari Konstruksi",
    role: "Afiliasi · Marine Works",
    npwp: "0081 3307 4412 6020",
  },
  {
    id: "TBP",
    name: "PT Tricowarna Beton Precast",
    role: "Afiliasi · Supplier Precast",
    npwp: "0092 1145 0078 3030",
  },
];

export const currentUser = {
  name: "Rina Kartikasari",
  email: "rina.k@tricowarna.co.id",
  role: "Finance Controller",
  initials: "RK",
};

export const projects = [
  {
    code: "PRJ-TRT-2026-001",
    short: "Jembatan A",
    name: "Pembangunan Jembatan Sei Ambawang",
    location: "Kab. Kubu Raya, Kalbar",
    contract: 18_640_000_000,
    progress: 62,
  },
  {
    code: "PRJ-TRT-2026-002",
    short: "Jalan B",
    name: "Peningkatan Jalan Ruas Sungai Kakap – Punggur",
    location: "Kab. Kubu Raya, Kalbar",
    contract: 11_275_500_000,
    progress: 38,
  },
  {
    code: "PRJ-TRT-2026-004",
    short: "Kampung Nelayan",
    name: "Kampung Nelayan Merah Putih – Kuala Secapah",
    location: "Kab. Mempawah, Kalbar",
    contract: 24_918_300_000,
    progress: 9,
  },
];

export const projectByCode = Object.fromEntries(projects.map((p) => [p.code, p]));

export const costCenters = [
  { code: "CC-100", name: "Direksi & Umum" },
  { code: "CC-200", name: "Keuangan & Akuntansi" },
  { code: "CC-300", name: "Estimasi & Tender" },
  { code: "CC-400", name: "Pengadaan" },
  { code: "CC-500", name: "Operasional Lapangan" },
  { code: "CC-600", name: "Peralatan & Workshop" },
];
