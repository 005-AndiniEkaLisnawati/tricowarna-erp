// Settlement kasbon: realisasi lines per advance that complement the expenses
// already linked through `expense.advance`, so each advance's linked expenses +
// these lines add up exactly to `advance.realized` in finance.js. Fictional data.

import { categoryByName } from "@/lib/data/finance";

// Field categories that aren't in the expense master yet but exist in the COA.
export const extraCategories = [
  { name: "Material Aspal & Agregat", coa: "5-1103", coaName: "HPP Material Aspal" },
  { name: "Sewa Base Camp & Gudang", coa: "5-1401", coaName: "HPP Biaya Lapangan" },
  { name: "Angkutan & Mobilisasi", coa: "5-1302", coaName: "HPP Angkutan" },
];

export const settlementCategoryByName = {
  ...categoryByName,
  ...Object.fromEntries(extraCategories.map((c) => [c.name, c])),
};

export const realisasiLines = {
  "ADV-2026-0412": [
    { ref: "NT-0412-01", date: "2026-09-04", vendor: "Toko Bangunan Sinar Kubu", desc: "Semen PCC 160 sak, besi D10 40 btg", category: "Material Bangunan - Semen & Besi", amount: 14_820_000 },
    { ref: "NT-0412-02", date: "2026-09-06", vendor: "Koperasi Tukang Ambawang", desc: "Upah harian minggu 36 – 24 orang", category: "Upah Tukang Harian", amount: 18_600_000 },
    { ref: "NT-0412-03", date: "2026-09-13", vendor: "CV Pasir Kapuas", desc: "Pasir pasang 42 m³", category: "Material Alam - Pasir & Batu", amount: 9_430_000 },
    { ref: "NT-0412-04", date: "2026-09-20", vendor: "Koperasi Tukang Ambawang", desc: "Upah harian minggu 38 – 14 orang", category: "Upah Tukang Harian", amount: 10_200_000 },
    { ref: "NT-0412-05", date: "2026-09-27", vendor: "SPBU 64.781.03 Ambawang", desc: "Solar genset & pompa air", category: "BBM & Pelumas", amount: 3_200_000 },
  ],
  "ADV-2026-0425": [
    { ref: "NT-0425-01", date: "2026-09-20", vendor: "PT Sarana Alat Berat Borneo", desc: "Mobilisasi excavator & tongkang ke Kuala Secapah", category: "Angkutan & Mobilisasi", amount: 46_500_000 },
    { ref: "NT-0425-02", date: "2026-09-22", vendor: "H. Rusdi Abdullah", desc: "Sewa lahan & bangunan base camp 6 bulan", category: "Sewa Base Camp & Gudang", amount: 38_000_000 },
    { ref: "NT-0425-03", date: "2026-09-25", vendor: "CV Batu Alam Mempawah", desc: "Batu split timbunan akses base camp", category: "Material Alam - Pasir & Batu", amount: 9_800_000 },
    { ref: "NT-0425-04", date: "2026-09-28", vendor: "Mandor Syahrial", desc: "Upah bongkar muat mobilisasi", category: "Upah Tukang Harian", amount: 5_150_000 },
  ],
  "ADV-2026-0398": [
    { ref: "NT-0398-01", date: "2026-08-14", vendor: "PT Aspal Prima Pontianak", desc: "Aspal curah pen 60/70 – 3,6 ton", category: "Material Aspal & Agregat", amount: 41_400_000 },
    { ref: "NT-0398-02", date: "2026-08-15", vendor: "CV Angkutan Kapuas Raya", desc: "Truk tangki aspal Pontianak – Punggur", category: "Angkutan & Mobilisasi", amount: 7_600_000 },
    { ref: "NT-0398-03", date: "2026-08-16", vendor: "Mandor Usman", desc: "Upah bongkar & pemanasan aspal", category: "Upah Tukang Harian", amount: 2_300_000 },
  ],
};

// Advances already closed, with their settlement date.
export const settledOn = {
  "ADV-2026-0431": "2026-10-02",
};

// Planned settlement date (SOP: maks. 30 hari setelah pencairan).
export const plannedSettle = {
  "ADV-2026-0412": "2026-10-02",
  "ADV-2026-0418": "2026-10-10",
  "ADV-2026-0421": "2026-10-14",
  "ADV-2026-0425": "2026-10-19",
  "ADV-2026-0431": "2026-10-03",
  "ADV-2026-0436": "2026-10-15",
  "ADV-2026-0398": "2026-09-11",
};
