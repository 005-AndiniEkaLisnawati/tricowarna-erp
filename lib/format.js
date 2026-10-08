const num = new Intl.NumberFormat("id-ID");
const dec = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const dateLongFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Rp1.455.000.000 — the format panitia & tim keuangan already use. */
export function rp(value) {
  const n = Math.round(value);
  return n < 0 ? `(Rp${num.format(-n)})` : `Rp${num.format(n)}`;
}

/** Bare thousands-separated number, negatives in parentheses (accounting style). */
export function amount(value) {
  if (!value) return "–";
  const n = Math.round(value);
  return n < 0 ? `(${num.format(-n)})` : num.format(n);
}

/** Rp18,74 M · Rp512,4 jt — compact Indonesian units. */
export function rpShort(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}Rp${dec.format(abs / 1e12)} T`;
  if (abs >= 1e9) return `${sign}Rp${dec.format(abs / 1e9)} M`;
  if (abs >= 1e6) return `${sign}Rp${dec.format(abs / 1e6)} jt`;
  return `${sign}Rp${num.format(abs)}`;
}

export function decimal(value, digits = 2) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function pct(value, digits = 1) {
  return `${decimal(value, digits)}%`;
}

export function date(iso) {
  return dateFmt.format(new Date(iso));
}

export function dateLong(iso) {
  return dateLongFmt.format(new Date(iso));
}

const DAY = 86_400_000;

/** Whole days between two ISO dates (b - a). */
export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / DAY);
}

/** "4h 13j 22m" style countdown, or null when already past. */
export function countdown(targetIso, now) {
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / DAY);
  const h = Math.floor((diff % DAY) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  if (d > 0) return `${d}h ${h}j ${m}m`;
  return `${h}j ${m}m ${String(s).padStart(2, "0")}d`;
}

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}
