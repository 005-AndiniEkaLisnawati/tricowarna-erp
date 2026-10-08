"use client";

import { useMemo, useState } from "react";
import {
  AlarmClock,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  FileCheck2,
  Mail,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  Wallet,
  X,
} from "lucide-react";
import {
  arCoa,
  billableByKey,
  billables,
  billingSOs,
  calcBill,
  clients,
  receipts as receiptSeed,
  salesInvoices as seed,
  soByNo,
} from "@/lib/data/sales-billing";
import { TODAY } from "@/lib/data/org";
import {
  Badge,
  Button,
  Callout,
  Card,
  Drawer,
  EmptyState,
  Field,
  Input,
  Modal,
  Mono,
  PageHeader,
  Segmented,
  Select,
  StatCard,
  StatusBadge,
  td,
  th,
  trHover,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { useCompany } from "@/components/shell/app-shell";
import { cx, date, daysBetween, decimal, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

/* ───────────────────────── Shared bits for the sales billing pages ───────────────────────── */

export function Checkbox({ checked, disabled, onChange, label }) {
  return (
    <label className={cx("flex size-4 items-center justify-center", disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer")}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={onChange} aria-label={label} />
      <span
        className={cx(
          "flex size-4 items-center justify-center rounded-[4px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)]",
          checked ? "border-fg bg-fg text-surface" : "border-line-strong bg-surface",
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
    </label>
  );
}

export function SectionLabel({ children, aside }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="text-[12.5px] font-semibold text-muted">{children}</h2>
      {aside}
    </div>
  );
}

/** Page size · Export · refresh on the left, search on the right — the client's list toolbar. */
export function ListToolbar({ pageSize, onPageSize, onExport, onRefresh, query, onQuery, placeholder, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[12.5px] text-subtle">
          Tampilkan
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-8 rounded-md border border-line bg-surface px-1.5 text-[13px] text-fg tabular outline-none hover:border-line-strong focus:border-line-strong"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Button icon={Download} onClick={onExport}>
          Export
        </Button>
        <Button size="icon" variant="ghost" onClick={onRefresh} aria-label="Muat ulang" title="Muat ulang">
          <RefreshCw className="size-3.5" />
        </Button>
        {children}
      </div>
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
        />
      </div>
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage, children }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[12px] text-subtle">
      <span className="min-w-0">{children}</span>
      <span className="flex items-center gap-2">
        <span className="tabular">
          {from}–{to} dari {total}
        </span>
        <Button size="icon" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Halaman sebelumnya">
          <ChevronLeft className="size-3.5" />
        </Button>
        <Button size="icon" variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Halaman berikutnya">
          <ChevronRight className="size-3.5" />
        </Button>
      </span>
    </div>
  );
}

/** Balanced journal preview. rows: [{ coa, name, debit, credit }] — credits are indented. */
export function JournalTable({ title = "Jurnal (preview)", dateIso, rows, note }) {
  const dr = rows.reduce((s, r) => s + (r.debit ?? 0), 0);
  const cr = rows.reduce((s, r) => s + (r.credit ?? 0), 0);
  const balanced = Math.abs(dr - cr) < 1;
  return (
    <div className="rounded-xl border border-line">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="text-[12.5px] font-semibold text-fg">{title}</span>
        <span className="flex items-center gap-2 text-[11.5px] text-subtle tabular">
          {dateIso && date(dateIso)}
          <Badge tone={balanced ? "green" : "red"}>{balanced ? "Balance" : "Tidak balance"}</Badge>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-subtle">
              <th className="px-3.5 py-1.5 text-left text-[11px] font-medium tracking-wide uppercase">Akun</th>
              <th className="px-3.5 py-1.5 text-right text-[11px] font-medium tracking-wide uppercase">Debit</th>
              <th className="px-3.5 py-1.5 text-right text-[11px] font-medium tracking-wide uppercase">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) => (r.debit ?? 0) > 0 || (r.credit ?? 0) > 0)
              .map((r) => (
                <tr key={`${r.coa}-${r.name}-${r.debit ? "d" : "c"}`} className="border-t border-line">
                  <td className={cx("py-2 pr-3.5 whitespace-nowrap text-fg", r.credit ? "pl-8" : "pl-3.5")}>
                    <Mono>{r.coa}</Mono> {r.name}
                  </td>
                  <td className="px-3.5 py-2 text-right whitespace-nowrap text-fg tabular">{r.debit ? rp(r.debit) : ""}</td>
                  <td className="px-3.5 py-2 text-right whitespace-nowrap text-fg tabular">{r.credit ? rp(r.credit) : ""}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-strong bg-surface-2 font-semibold text-fg">
              <td className="px-3.5 py-2">Total</td>
              <td className="px-3.5 py-2 text-right whitespace-nowrap tabular">{rp(dr)}</td>
              <td className="px-3.5 py-2 text-right whitespace-nowrap tabular">{rp(cr)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {note && <div className="border-t border-line px-3.5 py-2 text-[11.5px] leading-relaxed text-subtle">{note}</div>}
    </div>
  );
}

export function pctLabel(rate) {
  return `${decimal(rate, rate % 1 ? 2 : 0)}%`;
}

/* ───────────────────────── Invoice logic ───────────────────────── */

const buckets = [
  { id: "current", label: "Belum jatuh tempo", tone: "neutral" },
  { id: "1-30", label: "1–30 hari", tone: "amber" },
  { id: "31-60", label: "31–60 hari", tone: "red" },
  { id: "60+", label: "> 60 hari", tone: "red" },
];

const statusFilters = ["Semua", "Unpaid", "Partially Paid", "Overdue", "Paid", "Draft"];

function enrich(inv, receipts) {
  const c = calcBill(inv.bill);
  const pays = receipts
    .filter((r) => r.status === "Reconciled")
    .flatMap((r) => r.applied.filter((a) => a.inv === inv.no).map((a) => ({ rcv: r.no, date: r.date, amount: a.amount, bank: r.bank })));
  const paid = pays.reduce((s, p) => s + p.amount, 0);
  const outstanding = inv.draft ? 0 : Math.max(0, c.neto - paid);
  const days = daysBetween(TODAY, inv.due);
  let status;
  if (inv.draft) status = "Draft";
  else if (outstanding < 1) status = "Paid";
  else if (paid > 0) status = "Partially Paid";
  else status = days < 0 ? "Overdue" : "Unpaid";
  const bucket = outstanding < 1 ? null : days >= 0 ? "current" : -days <= 30 ? "1-30" : -days <= 60 ? "31-60" : "60+";
  const paidOn = status === "Paid" ? pays.at(-1)?.date : null;
  return { ...inv, ...c, pays, paid, outstanding, days, status, bucket, paidOn };
}

/** Invoice journal: revenue + PPN keluaran; retensi split out. PPh is recognised at payment. */
export function invoiceJournal(c) {
  const revenue = c.so.revenue === "barang" ? arCoa.pendapatanBarang : arCoa.pendapatanKontrak;
  return [
    { ...arCoa.piutang, debit: c.gross - c.retensi },
    { ...arCoa.retensi, debit: c.retensi },
    { ...revenue, credit: c.base },
    { ...arCoa.ppnKeluaran, credit: c.ppn },
  ];
}

function invoiceJournalNote(c) {
  const parts = [];
  if (c.pph)
    parts.push(
      `PPh ${c.pphMeta.type} ${rp(c.pph)} dipotong pemberi kerja — diakui Dr ${arCoa.umPph.coa} ${arCoa.umPph.name} / Cr Piutang Usaha saat pembayaran (bukti potong).`,
    );
  if (c.ppnDipungut) parts.push(`PPN ${rp(c.ppnDipungut)} dipungut & disetor bendahara (faktur kode 02) — dikompensasi ke PPN Keluaran saat SP2D cair.`);
  if (c.retensi) parts.push(`Retensi ${c.so.retensi}% dicairkan setelah masa pemeliharaan (FHO).`);
  return parts.length ? parts.join(" ") : null;
}

function nextInvoiceNo(rows) {
  const seq = rows
    .filter((r) => r.no.startsWith("INV-202610-"))
    .map((r) => Number(r.no.slice(-4)))
    .reduce((a, b) => Math.max(a, b), 30);
  return `INV-202610-${String(seq + 1).padStart(4, "0")}`;
}

function fakturFor(no) {
  const seq = Number(no.slice(-4));
  return `0400260018${String(4_412_000 + seq * 1_373).padStart(7, "0")}`;
}

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ───────────────────────── View ───────────────────────── */

export function SalesInvoiceView() {
  const toast = useToast();
  const [rows, setRows] = useState(seed);
  const [bucket, setBucket] = useState(null);
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [openNo, setOpenNo] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const invoices = useMemo(() => rows.map((r) => enrich(r, receiptSeed)).sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no)), [rows]);
  const posted = invoices.filter((i) => i.status !== "Draft");
  const open = posted.filter((i) => i.outstanding > 0);

  const aging = buckets.map((bk) => {
    const items = open.filter((i) => i.bucket === bk.id);
    return { ...bk, count: items.length, total: items.reduce((s, i) => s + i.outstanding, 0) };
  });
  const outstandingTotal = aging.reduce((s, a) => s + a.total, 0);
  const dueSoon = open.filter((i) => i.days >= 0 && i.days <= 7);
  const overdue = open.filter((i) => i.days < 0);
  const paidThisMonth = posted.flatMap((i) => i.pays).filter((p) => p.date >= "2026-10-01");
  const settledThisMonth = posted.filter((i) => i.status === "Paid" && i.paidOn >= "2026-10-01");
  const retensiHeld = posted.reduce((s, i) => s + i.retensi, 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter(
      (i) =>
        (filter === "Semua" || i.status === filter) &&
        (!bucket || i.bucket === bucket) &&
        (!q ||
          i.no.toLowerCase().includes(q) ||
          (i.faktur ?? "").includes(q) ||
          i.so.no.toLowerCase().includes(q) ||
          i.client.name.toLowerCase().includes(q) ||
          i.billable.label.toLowerCase().includes(q)),
    );
  }, [invoices, filter, bucket, query]);

  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const curPage = Math.min(page, pages);
  const paged = visible.slice((curPage - 1) * pageSize, curPage * pageSize);

  const allChecked = paged.length > 0 && paged.every((i) => selected.has(i.no));
  const chosen = invoices.filter((i) => selected.has(i.no));
  const chosenOutstanding = chosen.reduce((s, i) => s + i.outstanding, 0);
  const draft = invoices.find((i) => i.status === "Draft" && i.bill === "0044-T3");
  const current = invoices.find((i) => i.no === openNo);

  const toggle = (no) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(no)) n.delete(no);
      else n.add(no);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allChecked) paged.forEach((i) => n.delete(i.no));
      else paged.forEach((i) => n.add(i.no));
      return n;
    });

  const postInvoice = (no) => {
    setRows((rs) => rs.map((r) => (r.no === no ? { ...r, draft: false, faktur: fakturFor(no) } : r)));
    const inv = invoices.find((i) => i.no === no);
    toast({
      title: `${no} diposting · ${rp(inv.gross)}`,
      description: `Faktur kode ${inv.kodeFaktur} terbit di Coretax (${fakturFor(no)}). Jurnal piutang & pendapatan diposting.`,
    });
  };

  const create = ({ bill, invDate, due, post }) => {
    const no = nextInvoiceNo(rows);
    setRows((rs) => [...rs, { no, date: invDate, due, bill, faktur: post ? fakturFor(no) : null, draft: !post }]);
    setCreating(false);
    setFilter("Semua");
    setBucket(null);
    const c = calcBill(bill);
    toast({
      title: post ? `${no} diposting · ${rp(c.gross)}` : `Draft ${no} disimpan`,
      description: post
        ? `${c.client.short} · ${billableByKey[bill].label}. Faktur kode ${c.kodeFaktur} terbit di Coretax.`
        : `${c.client.short} · ${billableByKey[bill].label}. Belum ada faktur pajak sampai diposting.`,
    });
  };

  return (
    <div className={cx(selected.size > 0 && "pb-20")}>
      <PageHeader
        icon={ReceiptText}
        title="Sales Invoice"
        description="Penagihan termin, uang muka dan supply — DPP Nilai Lain 11/12, PPN 12%, potongan PPh 4(2) dan retensi dalam satu tempat."
      />

      <SectionLabel>Sales Invoice Statistic</SectionLabel>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total piutang outstanding"
          icon={Wallet}
          value={<span className="tabular">{rpShort(outstandingTotal)}</span>}
          hint={`${open.length} invoice terbuka · retensi ditahan ${rpShort(retensiHeld)}`}
        />
        <StatCard
          label="Jatuh tempo ≤ 7 hari"
          icon={AlarmClock}
          value={<span className="tabular">{rpShort(dueSoon.reduce((s, i) => s + i.outstanding, 0))}</span>}
          delta={`${dueSoon.length} invoice`}
          deltaTone="amber"
          hint="s.d. 15 Okt 2026"
        />
        <StatCard
          label="Overdue"
          icon={CircleAlert}
          value={<span className="tabular text-red-600 dark:text-red-400">{rpShort(overdue.reduce((s, i) => s + i.outstanding, 0))}</span>}
          delta={`${overdue.length} invoice`}
          deltaTone="red"
          hint={`terlama lewat ${Math.max(0, ...overdue.map((i) => -i.days))} hari`}
        />
        <StatCard
          label="Dibayar bulan ini"
          icon={BadgeCheck}
          value={<span className="tabular">{rpShort(paidThisMonth.reduce((s, p) => s + p.amount, 0))}</span>}
          delta={`${settledThisMonth.length} lunas`}
          hint="Oktober 2026"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {aging.map((a) => {
          const active = bucket === a.id;
          return (
            <button
              key={a.id}
              onClick={() => {
                setBucket(active ? null : a.id);
                setFilter("Semua");
                setPage(1);
              }}
              className={cx(
                "rounded-xl border bg-surface px-4 py-3 text-left transition-colors",
                active ? "border-fg ring-1 ring-fg" : "border-line hover:border-line-strong",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">AR {a.label}</span>
                <Badge tone={a.count ? a.tone : "neutral"}>{a.count}</Badge>
              </div>
              <div
                className={cx(
                  "mt-1 text-[18px] leading-6 font-semibold tracking-tight tabular",
                  a.id === "current" || !a.total ? "text-fg" : a.tone === "amber" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400",
                )}
              >
                {rpShort(a.total)}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={cx("h-full rounded-full", a.id === "current" ? "bg-slate-400" : a.tone === "amber" ? "bg-amber-500" : "bg-red-500")}
                  style={{ width: `${outstandingTotal ? (a.total / outstandingTotal) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-subtle tabular">{outstandingTotal ? decimal((a.total / outstandingTotal) * 100, 0) : 0}% dari piutang</div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="md" variant="primary" icon={Plus} onClick={() => setCreating(true)}>
          New Invoice
        </Button>
        <Button size="md" icon={Mail} onClick={() => toast({ title: "Pengingat terkirim", description: `${overdue.length} klien dengan invoice overdue menerima email pengingat + PDF invoice.`, tone: "info" })}>
          Kirim pengingat overdue
        </Button>
        <Button size="md" icon={Download} onClick={() => toast({ title: "Aging AR diekspor", description: "Per klien & SO, posisi 8 Okt 2026 (.xlsx).", tone: "info" })}>
          Export aging AR
        </Button>
      </div>

      {draft && (
        <Callout tone="indigo" icon={FileCheck2} className="mt-4 items-center">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <span className="font-semibold">Termin 3 Jembatan Sei Ambawang siap ditagih.</span> BAST-202609-0007 (progres 62%) ditandatangani PPK 30 Sep — draft{" "}
              <span className="font-medium">{draft.no}</span> senilai <span className="font-semibold tabular">{rp(draft.gross)}</span> incl. PPN, neto diharapkan{" "}
              <span className="tabular">{rp(draft.neto)}</span>. Termin masih dalam lingkup kontrak awal, tidak menunggu approval adendum SO.
            </span>
            <Button variant="primary" onClick={() => setOpenNo(draft.no)}>
              Review & posting
            </Button>
          </div>
        </Callout>
      )}

      <Card className="mt-4 overflow-hidden">
        <ListToolbar
          pageSize={pageSize}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          onExport={() => toast({ title: `${visible.length} invoice diekspor`, description: "Sales Invoice beserta nomor faktur & potongan (.xlsx).", tone: "info" })}
          onRefresh={() => toast({ title: "Data diperbarui", description: "Status pembayaran tersinkron dengan mutasi bank terakhir 08:15.", tone: "info" })}
          query={query}
          onQuery={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Cari invoice, faktur, SO, klien…"
        >
          <Segmented
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            items={statusFilters.map((s) => ({ value: s, label: s, count: s === "Semua" ? invoices.length : invoices.filter((i) => i.status === s).length }))}
          />
          {bucket && (
            <button onClick={() => setBucket(null)} className="flex h-7 items-center gap-1 rounded-md border border-line px-2 text-[12px] text-muted hover:text-fg">
              {buckets.find((b) => b.id === bucket).label} <X className="size-3" />
            </button>
          )}
        </ListToolbar>
        <TableScroll>
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                <th className={cx(th, "w-9 pr-0")}>
                  <Checkbox checked={allChecked} disabled={paged.length === 0} onChange={toggleAll} label="Pilih semua" />
                </th>
                <th className={th}>Invoice No</th>
                <th className={th}>Faktur pajak</th>
                <th className={th}>SO Ref</th>
                <th className={th}>Client</th>
                <th className={th}>Termin</th>
                <th className={cx(th, "text-right")}>DPP</th>
                <th className={cx(th, "text-right")}>PPN</th>
                <th className={cx(th, "text-right")}>PPh dipotong</th>
                <th className={cx(th, "text-right")}>Retensi</th>
                <th className={cx(th, "text-right")}>Neto diharapkan</th>
                <th className={th}>Jatuh tempo</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((i) => {
                const checked = selected.has(i.no);
                return (
                  <tr
                    key={i.no}
                    onClick={() => setOpenNo(i.no)}
                    className={cx(trHover, "cursor-pointer", checked && "bg-indigo-500/[0.05] hover:bg-indigo-500/[0.08]", i.status === "Draft" && "bg-indigo-500/[0.03]")}
                  >
                    <td className={cx(td, "pr-0")} onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked} onChange={() => toggle(i.no)} label={`Pilih ${i.no}`} />
                    </td>
                    <td className={td}>
                      <div className="font-medium text-fg">{i.no}</div>
                      <div className="text-[12px] text-subtle tabular">{date(i.date)}</div>
                    </td>
                    <td className={td}>
                      {i.faktur ? (
                        <>
                          <Mono className="block tracking-tight">{i.faktur}</Mono>
                          <span className="text-[11px] text-subtle">Kode {i.kodeFaktur}{i.client.gov ? " · pemungut" : " · DPP NL"}</span>
                        </>
                      ) : (
                        <span className="text-[12px] text-subtle">terbit saat posting</span>
                      )}
                    </td>
                    <td className={td}>
                      <Mono className="text-[11.5px]">{i.so.no}</Mono>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-1.5 text-fg">
                        {i.client.short}
                        {i.client.gov && <Badge tone="violet">Pemerintah</Badge>}
                      </div>
                    </td>
                    <td className={td}>
                      <div className="text-fg">{i.billable.label}</div>
                      {i.billable.ref && !i.billable.label.includes(i.billable.ref) && <Mono className="text-[11px] text-subtle">{i.billable.ref}</Mono>}
                    </td>
                    <td className={cx(td, "text-right tabular")}>
                      <div>{rp(i.base)}</div>
                      <div className="text-[11.5px] text-subtle">NL 11/12 {rp(i.dpp)}</div>
                    </td>
                    <td className={cx(td, "text-right tabular text-muted")}>
                      <div>{rp(i.ppn)}</div>
                      {i.ppnDipungut > 0 && <div className="text-[11.5px] text-subtle">dipungut</div>}
                    </td>
                    <td className={cx(td, "text-right tabular")}>
                      {i.pph ? (
                        <>
                          <div>({rp(i.pph)})</div>
                          <div className="text-[11.5px] text-subtle">
                            PPh {i.pphMeta.type} · {pctLabel(i.pphMeta.rate)}
                          </div>
                        </>
                      ) : (
                        <span className="text-subtle">–</span>
                      )}
                    </td>
                    <td className={cx(td, "text-right tabular")}>{i.retensi ? `(${rp(i.retensi)})` : <span className="text-subtle">–</span>}</td>
                    <td className={cx(td, "text-right tabular")}>
                      <div className={cx("font-semibold", i.status === "Paid" ? "text-muted" : "text-fg")}>{rp(i.neto)}</div>
                      {i.status === "Partially Paid" && <div className="text-[11.5px] text-subtle">sisa {rp(i.outstanding)}</div>}
                    </td>
                    <td className={td}>
                      <div className="tabular">{date(i.due)}</div>
                      <DueHint inv={i} />
                    </td>
                    <td className={td}>
                      <StatusBadge status={i.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState icon={ReceiptText} title="Tidak ada invoice" description="Ubah filter aging, status, atau kata kunci." />}
        </TableScroll>
        <Pager page={curPage} pageSize={pageSize} total={visible.length} onPage={setPage}>
          Piutang terbuka <span className="font-medium text-fg tabular">{rp(outstandingTotal)}</span> neto · PPN keluaran periode Okt{" "}
          <span className="text-fg tabular">{rp(posted.filter((i) => i.date >= "2026-10-01").reduce((s, i) => s + i.ppn, 0))}</span>
        </Pager>
      </Card>

      {selected.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface py-2 pr-2 pl-4 shadow-2xl shadow-slate-950/20 animate-pop">
            <span className="text-[13px] text-muted">
              <span className="font-semibold text-fg tabular">{selected.size}</span> invoice · sisa{" "}
              <span className="font-semibold text-fg tabular">{rp(chosenOutstanding)}</span>
            </span>
            <Button variant="ghost" onClick={() => setSelected(new Set())}>
              Batal
            </Button>
            <Button
              icon={Printer}
              onClick={() => toast({ title: `${selected.size} PDF invoice dibuat`, description: "Digabung dalam satu file beserta faktur pajak.", tone: "info" })}
            >
              Cetak PDF
            </Button>
            <Button
              variant="primary"
              icon={Mail}
              onClick={() => {
                toast({ title: `${selected.size} invoice dikirim`, description: "Email ke PIC keuangan klien dengan lampiran invoice, faktur & BAST/DO." });
                setSelected(new Set());
              }}
            >
              Kirim email ({selected.size})
            </Button>
          </div>
        </div>
      )}

      {current && <InvoiceDrawer inv={current} onClose={() => setOpenNo(null)} onPost={postInvoice} />}
      {creating && <NewInvoiceModal rows={rows} onClose={() => setCreating(false)} onCreate={create} />}
    </div>
  );
}

function DueHint({ inv }) {
  if (inv.status === "Draft") return <div className="text-[12px] text-subtle">belum diterbitkan</div>;
  if (inv.status === "Paid") return <div className="text-[12px] text-emerald-600 tabular dark:text-emerald-400">lunas {date(inv.paidOn)}</div>;
  const d = inv.days;
  return (
    <div
      className={cx(
        "text-[12px] tabular",
        d < 0 ? "font-medium text-red-600 dark:text-red-400" : d <= 7 ? "text-amber-600 dark:text-amber-400" : "text-subtle",
      )}
    >
      {d < 0 ? `lewat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`}
    </div>
  );
}

/* ───────────────────────── Breakdown ───────────────────────── */

function Breakdown({ c }) {
  const line = (label, value, opts = {}) => (
    <div className={cx("flex items-center justify-between gap-4 py-1.5", opts.strong && "border-t border-line pt-2 font-semibold text-fg", opts.muted ? "text-subtle" : "text-fg")}>
      <span className={cx("text-[13px]", !opts.strong && !opts.muted && "text-muted")}>{label}</span>
      <span className="text-[13px] tabular">{value}</span>
    </div>
  );
  return (
    <div className="rounded-xl border border-line px-3.5 py-2">
      {line("Nilai termin (excl. PPN)", rp(c.base))}
      {line("DPP Nilai Lain (11/12)", rp(c.dpp), { muted: true })}
      {line("PPN 12% × DPP", rp(c.ppn))}
      {line("Total tagihan incl. PPN", rp(c.gross), { strong: true })}
      {c.ppnDipungut > 0 && line("PPN dipungut bendahara (kode 02)", `(${rp(c.ppnDipungut)})`)}
      {c.pph > 0 && line(`PPh ${c.pphMeta.type} ${pctLabel(c.pphMeta.rate)} × nilai termin`, `(${rp(c.pph)})`)}
      {c.retensi > 0 && line(`Retensi ${c.so.retensi}%`, `(${rp(c.retensi)})`)}
      {line("Neto diharapkan masuk bank", rp(c.neto), { strong: true })}
    </div>
  );
}

/* ───────────────────────── Drawer ───────────────────────── */

function InvoiceDrawer({ inv, onClose, onPost }) {
  const toast = useToast();
  const company = useCompany();
  const isDraft = inv.status === "Draft";
  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-2xl"
      title={inv.no}
      subtitle={
        <>
          <StatusBadge status={inv.status} />
          <span className="text-[12.5px] text-muted">{inv.client.name}</span>
        </>
      }
      footer={
        <>
          <Button icon={Printer} onClick={() => toast({ title: `PDF ${inv.no} dibuat`, description: "Invoice + rincian termin + lampiran BAST/DO siap diunduh.", tone: "info" })}>
            Cetak PDF
          </Button>
          {isDraft ? (
            <Button
              variant="primary"
              icon={FileCheck2}
              onClick={() => {
                onPost(inv.no);
                onClose();
              }}
            >
              Posting & terbitkan faktur
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={Mail}
              onClick={() => toast({ title: `${inv.no} dikirim`, description: `Email ke ${inv.client.email} dengan lampiran invoice & faktur pajak.` })}
            >
              Kirim invoice (email)
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {isDraft && (
          <Callout tone="indigo" icon={FileCheck2}>
            Draft dari {inv.billable.ref}. Posting akan menerbitkan faktur pajak kode {inv.kodeFaktur} di Coretax dan memposting jurnal piutang.
          </Callout>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Party label="Penjual" name={company.name} sub={`NPWP ${company.npwp}`} />
          <Party label="Pembeli" name={inv.client.name} sub={`NPWP ${inv.client.npwp}${inv.client.gov ? " · Pemungut PPN" : ""}`} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-line px-3.5 py-3 text-[13px] sm:grid-cols-3">
          <Meta label="SO Ref" value={<Mono>{inv.so.no}</Mono>} />
          <Meta label="Termin" value={inv.billable.label} />
          <Meta label="Dokumen dasar" value={inv.billable.ref ? <Mono>{inv.billable.ref}</Mono> : "Kontrak / SPMK"} />
          <Meta label="Tanggal invoice" value={date(inv.date)} />
          <Meta label="Jatuh tempo" value={<>{date(inv.due)} <DueHint inv={inv} /></>} />
          <Meta label="Faktur pajak" value={inv.faktur ? <Mono>{inv.faktur}</Mono> : <span className="text-subtle">belum terbit</span>} />
        </dl>

        <div>
          <h3 className="mb-2 text-[12.5px] font-semibold text-fg">Rincian tagihan</h3>
          <Breakdown c={inv} />
        </div>

        {!isDraft && (
          <div>
            <h3 className="mb-2 text-[12.5px] font-semibold text-fg">Pembayaran</h3>
            {inv.pays.length ? (
              <div className="rounded-xl border border-line">
                {inv.pays.map((p) => (
                  <div key={p.rcv} className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2 text-[13px] last:border-0">
                    <span>
                      <Mono>{p.rcv}</Mono> <span className="text-subtle">· {date(p.date)}</span>
                    </span>
                    <span className="font-medium text-fg tabular">{rp(p.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-surface-2 px-3.5 py-2 text-[12.5px]">
                  <span className="text-muted">Sisa</span>
                  <span className="font-semibold text-fg tabular">{rp(inv.outstanding)}</span>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-line px-3.5 py-3 text-[12.5px] text-subtle">
                Belum ada pembayaran. Mutasi bank yang cocok akan muncul di halaman Payments.
              </p>
            )}
          </div>
        )}

        <JournalTable title={isDraft ? "Jurnal saat posting (preview)" : "Jurnal invoice"} dateIso={inv.date} rows={invoiceJournal(inv)} note={invoiceJournalNote(inv)} />
      </div>
    </Drawer>
  );
}

function Party({ label, name, sub }) {
  return (
    <div className="rounded-xl border border-line px-3.5 py-2.5">
      <div className="text-[11px] font-medium tracking-wide text-subtle uppercase">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium text-fg">{name}</div>
      <Mono className="text-[11.5px] text-subtle">{sub}</Mono>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg">{value}</dd>
    </div>
  );
}

/* ───────────────────────── New invoice ───────────────────────── */

function NewInvoiceModal({ rows, onClose, onCreate }) {
  const billedKeys = new Map(rows.map((r) => [r.bill, r]));
  const [soNo, setSoNo] = useState("SO-202610-0043");
  const options = billables.filter((b) => b.so === soNo);
  const firstReady = (no) => billables.find((b) => b.so === no && !b.blocked && !billedKeys.has(b.key))?.key ?? null;
  const [bill, setBill] = useState(() => firstReady("SO-202610-0043"));
  const [invDate, setInvDate] = useState(TODAY);
  const so = soByNo[soNo];
  const client = clients[so.client];
  const [due, setDue] = useState(addDays(TODAY, client.terms));
  const c = bill ? calcBill(bill) : null;

  const pickSo = (no) => {
    setSoNo(no);
    setBill(firstReady(no));
    setDue(addDays(invDate, clients[soByNo[no].client].terms));
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="New Invoice"
      description="Pilih SO lalu termin atau DO yang siap ditagih. Pajak & potongan dihitung otomatis."
      footer={
        <>
          <span className="mr-auto text-[12.5px] text-subtle">
            {c ? (
              <>
                Total tagihan <span className="font-semibold text-fg tabular">{rp(c.gross)}</span> · neto <span className="text-fg tabular">{rp(c.neto)}</span>
              </>
            ) : (
              "Belum ada termin yang dipilih"
            )}
          </span>
          <Button onClick={onClose}>Batal</Button>
          <Button disabled={!bill} onClick={() => onCreate({ bill, invDate, due, post: false })}>
            Simpan draft
          </Button>
          <Button variant="primary" icon={FileCheck2} disabled={!bill || !invDate || !due} onClick={() => onCreate({ bill, invDate, due, post: true })}>
            Posting & terbitkan faktur
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px_150px]">
          <Field label="Sales Order" hint={`${client.name}${client.gov ? " · pemungut PPN (faktur kode 02)" : " · faktur kode 04 (DPP Nilai Lain)"}`}>
            <Select value={soNo} onChange={(e) => pickSo(e.target.value)}>
              {billingSOs.map((s) => (
                <option key={s.no} value={s.no}>
                  {s.no} — {clients[s.client].short} · {s.scope}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal invoice">
            <Input
              type="date"
              value={invDate}
              onChange={(e) => {
                setInvDate(e.target.value);
                if (e.target.value) setDue(addDays(e.target.value, client.terms));
              }}
            />
          </Field>
          <Field label="Jatuh tempo" hint={`Termin ${client.terms} hari`}>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-medium text-muted">Termin / DO</div>
          <div className="space-y-1.5">
            {options.map((b) => {
              const existing = billedKeys.get(b.key);
              const disabled = !!b.blocked || !!existing;
              const active = bill === b.key;
              return (
                <button
                  key={b.key}
                  disabled={disabled}
                  onClick={() => setBill(b.key)}
                  className={cx(
                    "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    active ? "border-fg ring-1 ring-fg" : "border-line",
                    disabled ? "cursor-not-allowed bg-surface-2 opacity-70" : "hover:border-line-strong",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className={cx("flex size-4 shrink-0 items-center justify-center rounded-full border", active ? "border-fg bg-fg" : "border-line-strong")}>
                      {active && <span className="size-1.5 rounded-full bg-surface" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-fg">{b.label}</span>
                      <span className="block truncate text-[11.5px] text-subtle">
                        {existing
                          ? `Sudah ditagih — ${existing.no}${existing.draft ? " (draft)" : ""}`
                          : b.blocked ?? (b.ref ? `Dasar: ${b.ref}` : "Dasar: kontrak / jaminan uang muka")}
                      </span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[13px] text-fg tabular">{rp(b.base)}</span>
                    <span className="block text-[11px] text-subtle">excl. PPN</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {c && (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Breakdown c={c} />
              <JournalTable title="Jurnal invoice (preview)" dateIso={invDate || TODAY} rows={invoiceJournal(c)} />
            </div>
            <Callout tone={c.client.gov ? "amber" : "indigo"}>
              {invoiceJournalNote(c) ?? "Tanpa potongan PPh — pembeli swasta, penyerahan barang (bukan pemungut PPh 22)."}
              {soNo === "SO-202610-0043" && " Ada uang muka pelanggan Rp145.854.000 (RCV-202610-0011) yang bisa di-apply ke invoice ini di halaman Payments."}
            </Callout>
          </>
        )}
        {!c && <Callout tone="amber">Semua termin SO ini sudah ditagih atau belum memenuhi syarat (BAST / DO Delivered).</Callout>}
      </div>
    </Modal>
  );
}
