"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import {
  customers,
  NEXT_SO_SEQ,
  quotations as seed,
  salesById,
  salesTeam,
  SELLER,
  taxFromGrand,
  taxFromSubtotal,
  itemsSubtotal,
} from "@/lib/data/sales";
import { TODAY } from "@/lib/data/org";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Field,
  Input,
  Modal,
  Mono,
  PageHeader,
  Select,
  StatCard,
  StatusBadge,
  td,
  th,
  trHover,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { TableScroll } from "@/components/table-scroll";
import { cx, date, decimal, rp, rpShort } from "@/lib/format";

/* ═════════════════════ Shared sales list primitives ═════════════════════ */

export function Checkbox({ checked, indeterminate, disabled, onChange, label }) {
  return (
    <label
      onClick={(e) => e.stopPropagation()}
      className={cx("flex size-4 items-center justify-center", disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer")}
    >
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={onChange} aria-label={label} />
      <span
        className={cx(
          "flex size-4 items-center justify-center rounded-[4px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)]",
          checked || indeterminate ? "border-fg bg-fg text-surface" : "border-line-strong bg-surface",
        )}
      >
        {checked ? <Check className="size-3" strokeWidth={3} /> : indeterminate ? <span className="h-0.5 w-2 rounded bg-surface" /> : null}
      </span>
    </label>
  );
}

/** "Bulk Actions" dropdown; items: [{ label, icon, onClick, danger, disabled }]. */
export function BulkMenu({ count, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button size="md" iconRight={ChevronDown} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        Bulk Actions
        {count > 0 && (
          <span className="rounded bg-fg px-1.5 text-[11px] leading-[18px] text-surface tabular">{count}</span>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-1 w-60 rounded-lg border border-line bg-surface p-1 shadow-lg shadow-slate-950/10 animate-pop">
            {count === 0 && <p className="px-2.5 py-1.5 text-[12px] text-subtle">Pilih baris terlebih dahulu.</p>}
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <button
                  key={it.label}
                  disabled={count === 0 || it.disabled}
                  onClick={() => {
                    setOpen(false);
                    it.onClick();
                  }}
                  className={cx(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40",
                    it.danger ? "text-red-600 hover:bg-red-500/10 dark:text-red-400" : "text-fg hover:bg-surface-3",
                  )}
                >
                  {Icon && <Icon className="size-3.5" />}
                  {it.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const miniSelect =
  "h-8 rounded-md border border-line bg-surface px-2 text-[13px] text-fg outline-none hover:border-line-strong focus:border-line-strong";

/** Page-size select + Export + refresh on the left, search on the right. */
export function ListToolbar({ pageSize, onPageSize, onExport, onRefresh, query, onQuery, placeholder }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
      <div className="flex items-center gap-2 text-[12.5px] text-muted">
        <span>Tampilkan</span>
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className={miniSelect} aria-label="Baris per halaman">
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <Button icon={Download} onClick={onExport}>
          Export
        </Button>
        <Button size="icon" variant="ghost" onClick={onRefresh} aria-label="Muat ulang">
          <RefreshCw className="size-3.5" />
        </Button>
      </div>
      <div className="relative w-full sm:w-72">
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

export function Pager({ page, pageSize, total, onPage, noun, footnote }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[12px] text-subtle">
      <span>
        Menampilkan <span className="text-fg tabular">{from}–{to}</span> dari <span className="tabular">{total}</span> {noun}
        {footnote && <span className="hidden sm:inline"> · {footnote}</span>}
      </span>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Halaman sebelumnya">
          <ChevronLeft className="size-3.5" />
        </Button>
        <span className="px-1 tabular">
          {page} / {pages}
        </span>
        <Button size="icon" variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Halaman berikutnya">
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function useSelection(ids) {
  const [selected, setSelected] = useState(() => new Set());
  const live = ids.filter((id) => selected.has(id));
  const all = ids.length > 0 && live.length === ids.length;
  return {
    selected,
    count: selected.size,
    all,
    some: live.length > 0 && !all,
    has: (id) => selected.has(id),
    toggle: (id) =>
      setSelected((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    toggleAll: () =>
      setSelected((s) => {
        const n = new Set(s);
        if (all) ids.forEach((id) => n.delete(id));
        else ids.forEach((id) => n.add(id));
        return n;
      }),
    clear: () => setSelected(new Set()),
  };
}

export function qtyFmt(q) {
  return Number.isInteger(q) ? decimal(q, 0) : decimal(q, 2);
}

/** Line items + DPP/PPN/grand total, used by quotation & SO drawers. */
export function ItemsTable({ items, tax }) {
  return (
    <TableScroll className="rounded-lg border border-line">
      <table className="w-full">
        <thead className="bg-surface-2">
          <tr>
            <th className={th}>Uraian</th>
            <th className={cx(th, "text-right")}>Qty</th>
            <th className={th}>Sat.</th>
            <th className={cx(th, "text-right")}>Harga satuan</th>
            <th className={cx(th, "text-right")}>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.desc} className="border-t border-line">
              <td className={cx(td, "min-w-[220px] whitespace-normal")}>{i.desc}</td>
              <td className={cx(td, "text-right tabular")}>{qtyFmt(i.qty)}</td>
              <td className={cx(td, "text-muted")}>{i.unit}</td>
              <td className={cx(td, "text-right tabular")}>{rp(i.price)}</td>
              <td className={cx(td, "text-right font-medium tabular")}>{rp(i.qty * i.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <TaxSummary tax={tax} className="border-t border-line-strong bg-surface-2" />
    </TableScroll>
  );
}

export function TaxSummary({ tax, className }) {
  return (
    <dl className={cx("space-y-1 px-3 py-2.5 text-[12.5px]", className)}>
      <Row k="Subtotal (harga jual)" v={rp(tax.subtotal)} />
      <Row k="DPP nilai lain (11/12)" v={rp(tax.dpp)} muted />
      <Row k="PPN 12% × DPP" v={rp(tax.ppn)} />
      <div className="flex items-baseline justify-between border-t border-line pt-1.5">
        <dt className="font-semibold text-fg">Grand total</dt>
        <dd className="text-[14px] font-semibold text-fg tabular">{rp(tax.grand)}</dd>
      </div>
    </dl>
  );
}

function Row({ k, v, muted }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className={cx("tabular", muted ? "text-subtle" : "text-fg")}>{v}</dd>
    </div>
  );
}

export function Section({ title, aside, children }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[12.5px] font-semibold text-fg">{title}</h3>
        {aside && (typeof aside === "string" ? <span className="text-[12px] text-subtle">{aside}</span> : aside)}
      </div>
      {children}
    </section>
  );
}

export function Meta({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg">{children}</dd>
    </div>
  );
}

/* ═════════════════════ Quotations page ═════════════════════ */

const OPEN = ["Waiting Internal", "Approved Internal", "Waiting Customer"];
const statusOptions = ["Waiting Internal", "Approved Internal", "Waiting Customer", "Converted to SO", "Void"];

const grandOf = (q) => q.grand;
const isExpired = (q) => OPEN.includes(q.status) && q.validTo < TODAY;

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function QuotationsView() {
  const toast = useToast();
  const [rows, setRows] = useState(() => [...seed].sort((a, b) => (a.date < b.date ? 1 : -1)));
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [soSeq, setSoSeq] = useState(NEXT_SO_SEQ);
  const [creating, setCreating] = useState(false);
  const [openNo, setOpenNo] = useState(null);

  const filtered = useMemo(() => {
    const qq = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!qq || [r.no, r.subject, r.client, r.soNo ?? ""].some((s) => s.toLowerCase().includes(qq))),
    );
  }, [rows, status, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, pages);
  const visible = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);
  const sel = useSelection(visible.map((r) => r.no));

  const count = (s) => rows.filter((r) => r.status === s).length;
  const sum = (list) => list.reduce((a, r) => a + grandOf(r), 0);
  const openValue = sum(rows.filter((r) => OPEN.includes(r.status)));

  const setStatusFor = (nos, next) => setRows((rs) => rs.map((r) => (nos.includes(r.no) ? { ...r, status: next } : r)));

  const bulkApprove = () => {
    const picked = rows.filter((r) => sel.selected.has(r.no));
    const ok = picked.filter((r) => r.status === "Waiting Internal");
    setStatusFor(ok.map((r) => r.no), "Approved Internal");
    sel.clear();
    toast({
      title: `${ok.length} quotation disetujui internal`,
      description:
        picked.length - ok.length > 0
          ? `${picked.length - ok.length} baris dilewati — hanya status Waiting Internal yang bisa di-approve.`
          : "Siap dikirim ke customer atau dikonversi ke Sales Order.",
      tone: ok.length ? "success" : "warning",
    });
  };

  const bulkVoid = () => {
    const picked = rows.filter((r) => sel.selected.has(r.no));
    const ok = picked.filter((r) => OPEN.includes(r.status));
    setStatusFor(ok.map((r) => r.no), "Void");
    sel.clear();
    toast({
      title: `${ok.length} quotation di-void`,
      description:
        picked.length - ok.length > 0
          ? `${picked.length - ok.length} baris dilewati — quotation yang sudah jadi SO atau Void tidak bisa di-void.`
          : "Nomor referensi tetap tercatat untuk audit trail.",
      tone: ok.length ? "info" : "warning",
    });
  };

  const sendToCustomer = (r) => {
    setStatusFor([r.no], "Waiting Customer");
    toast({ title: `${r.no} terkirim ke customer`, description: `PDF penawaran dikirim ke ${r.client} via email.`, tone: "info" });
  };

  const approveOne = (r) => {
    setStatusFor([r.no], "Approved Internal");
    toast({ title: `${r.no} disetujui internal`, description: "Siap dikirim ke customer atau dikonversi ke Sales Order." });
  };

  const convert = (r) => {
    const soNo = `SO-202610-${String(soSeq).padStart(4, "0")}`;
    setSoSeq((n) => n + 1);
    setRows((rs) => rs.map((x) => (x.no === r.no ? { ...x, status: "Converted to SO", soNo } : x)));
    toast({
      title: `${soNo} dibuat dari ${r.no}`,
      description: `${r.client} · ${rp(r.grand)} — menunggu approval Direktur di Sales Orders.`,
    });
  };

  const create = (q) => {
    const nextRef = String(Math.max(...rows.map((r) => Number(r.ref))) + 1).padStart(3, "0");
    const no = `${nextRef}-${q.code}-Rev00`;
    setRows((rs) => [{ ...q, ref: nextRef, rev: "Rev00", no, status: "Waiting Internal" }, ...rs]);
    setCreating(false);
    setStatus("all");
    setPage(1);
    toast({ title: `Quotation ${no} dibuat`, description: `${q.client} · ${rp(q.grand)} — menunggu approval internal.` });
  };

  const selected = rows.find((r) => r.no === openNo) ?? null;

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Quotations"
        description={`Penawaran harga ${SELLER.name} — approval internal, kirim ke customer, lalu konversi ke Sales Order.`}
      />

      <h2 className="mb-2 text-[12.5px] font-semibold text-muted">Quotation Statistic</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Quotations" value={rows.length} hint={`${rpShort(openValue)} masih terbuka`} />
        <StatCard label="Waiting Internal" value={count("Waiting Internal")} hint={rpShort(sum(rows.filter((r) => r.status === "Waiting Internal")))} delta="●" deltaTone="amber" />
        <StatCard
          label="Waiting Customer"
          value={count("Waiting Customer")}
          hint={`${rows.filter((r) => r.status === "Waiting Customer" && isExpired(r)).length} kedaluwarsa`}
        />
        <StatCard label="Ready to SO" value={count("Approved Internal")} hint={rpShort(sum(rows.filter((r) => r.status === "Approved Internal")))} delta="●" deltaTone="green" />
        <StatCard label="Void" value={count("Void")} hint={`${count("Converted to SO")} sudah jadi SO`} />
      </div>

      <div className="mt-5 mb-3 flex flex-wrap items-center gap-2">
        <Button size="md" variant="primary" icon={Plus} onClick={() => setCreating(true)}>
          New Quotation
        </Button>
        <BulkMenu
          count={sel.count}
          items={[
            { label: "Approve internal", icon: Check, onClick: bulkApprove },
            { label: "Void", icon: Ban, onClick: bulkVoid, danger: true },
          ]}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-auto! min-w-[170px]"
          aria-label="Filter status"
        >
          <option value="all">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s} ({count(s)})
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <ListToolbar
          pageSize={pageSize}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          onExport={() => toast({ title: "Export Excel disiapkan", description: `${filtered.length} quotation sesuai filter aktif.`, tone: "info" })}
          onRefresh={() => toast({ title: "Data diperbarui", description: "Sinkron terakhir 8 Okt 2026 · baru saja.", tone: "info" })}
          query={query}
          onQuery={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Cari reff no., subject, client…"
        />
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={cx(th, "w-10 pr-0")}>
                  <Checkbox checked={sel.all} indeterminate={sel.some} onChange={sel.toggleAll} label="Pilih semua" />
                </th>
                <th className={th}>Reff No.</th>
                <th className={th}>Subject</th>
                <th className={th}>Client</th>
                <th className={th}>Date</th>
                <th className={th}>Valid To</th>
                <th className={th}>Status</th>
                <th className={cx(th, "text-right")}>Grand Total</th>
                <th className={cx(th, "text-right")}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const expired = isExpired(r);
                const sp = salesById[r.code];
                return (
                  <tr
                    key={r.no}
                    onClick={() => setOpenNo(r.no)}
                    className={cx(trHover, "cursor-pointer", sel.has(r.no) && "bg-surface-2")}
                  >
                    <td className={cx(td, "pr-0")}>
                      <Checkbox checked={sel.has(r.no)} onChange={() => sel.toggle(r.no)} label={`Pilih ${r.no}`} />
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-1.5" title={r.no}>
                        <span className="font-mono text-[12.5px] font-medium text-fg">
                          {r.ref}-{r.code}
                        </span>
                        <RevChip rev={r.rev} />
                      </div>
                    </td>
                    <td className={cx(td, "max-w-[320px]")}>
                      <div className="truncate">{r.subject}</div>
                      <div className="flex items-center gap-1.5 text-[12px] text-subtle">
                        {sp?.name}
                        {r.soNo && (
                          <>
                            · <Mono className="text-[11.5px]">{r.soNo}</Mono>
                          </>
                        )}
                      </div>
                    </td>
                    <td className={cx(td, "max-w-[240px] truncate")}>{r.client}</td>
                    <td className={cx(td, "tabular text-muted")}>{date(r.date)}</td>
                    <td className={cx(td, "tabular")}>
                      <span className={expired ? "font-medium text-red-600 dark:text-red-400" : "text-muted"}>{date(r.validTo)}</span>
                      {expired && <div className="text-[11px] text-red-600/80 dark:text-red-400/80">Kedaluwarsa</div>}
                    </td>
                    <td className={td}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={cx(td, "text-right font-medium tabular")}>{rp(grandOf(r))}</td>
                    <td className={cx(td, "text-right")} onClick={(e) => e.stopPropagation()}>
                      <RowAction r={r} onApprove={approveOne} onSend={sendToCustomer} onConvert={convert} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <EmptyState icon={FileText} title="Tidak ada quotation" description="Ubah filter status atau kata kunci pencarian." />
          )}
        </TableScroll>
        <Pager
          page={curPage}
          pageSize={pageSize}
          total={filtered.length}
          onPage={setPage}
          noun="quotation"
          footnote={sel.count > 0 ? `${sel.count} dipilih` : "Grand total sudah termasuk PPN 12% × DPP 11/12"}
        />
      </Card>

      {creating && <NewQuotationModal onClose={() => setCreating(false)} onCreate={create} />}
      {selected && (
        <QuotationDrawer
          key={selected.no}
          q={selected}
          onClose={() => setOpenNo(null)}
          onApprove={() => approveOne(selected)}
          onSend={() => sendToCustomer(selected)}
          onConvert={() => convert(selected)}
        />
      )}
    </div>
  );
}

function RevChip({ rev }) {
  return (
    <span
      className={cx(
        "rounded px-1 py-px font-mono text-[10.5px] font-medium ring-1 ring-inset",
        rev === "Rev00" ? "bg-surface-3 text-muted ring-line" : "bg-violet-500/10 text-violet-700 ring-violet-600/20 dark:text-violet-300",
      )}
    >
      {rev}
    </span>
  );
}

function RowAction({ r, onApprove, onSend, onConvert }) {
  if (r.status === "Approved Internal")
    return (
      <div className="flex justify-end gap-1">
        <Button size="xs" variant="ghost" icon={Send} onClick={() => onSend(r)}>
          Kirim
        </Button>
        <Button size="xs" variant="primary" icon={ArrowRightLeft} onClick={() => onConvert(r)}>
          Convert to SO
        </Button>
      </div>
    );
  if (r.status === "Waiting Internal")
    return (
      <Button size="xs" icon={Check} onClick={() => onApprove(r)}>
        Approve
      </Button>
    );
  if (r.status === "Waiting Customer")
    return (
      <Button size="xs" icon={ArrowRightLeft} onClick={() => onConvert(r)}>
        Convert to SO
      </Button>
    );
  return <span className="text-[12px] text-subtle">–</span>;
}

/* ───────────────────────── Drawer ───────────────────────── */

function QuotationDrawer({ q, onClose, onApprove, onSend, onConvert }) {
  const sp = salesById[q.code];
  const tax = taxFromGrand(q.grand);
  const expired = isExpired(q);
  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-2xl"
      title={`${q.no} · ${q.subject}`}
      subtitle={
        <>
          <StatusBadge status={q.status} />
          <RevChip rev={q.rev} />
          <span className="text-[12px] text-subtle">{q.client}</span>
        </>
      }
      footer={
        <>
          {q.status === "Waiting Internal" && (
            <Button variant="success" icon={Check} onClick={onApprove}>
              Approve internal
            </Button>
          )}
          {q.status === "Approved Internal" && (
            <Button icon={Send} onClick={onSend}>
              Kirim ke customer
            </Button>
          )}
          {(q.status === "Approved Internal" || q.status === "Waiting Customer") && (
            <Button variant="primary" icon={ArrowRightLeft} onClick={onConvert}>
              Convert to SO
            </Button>
          )}
          {!OPEN.includes(q.status) && <Button onClick={onClose}>Tutup</Button>}
        </>
      }
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3">
          <Meta label="Penjual">{SELLER.name}</Meta>
          <Meta label="Client">{q.client}</Meta>
          <Meta label="Sales">
            <span className="flex items-center gap-1.5">
              <Avatar initials={sp?.initials} tone={sp?.tone} className="size-5 text-[9px]" />
              {sp?.name}
            </span>
          </Meta>
          <Meta label="Tanggal">
            <span className="tabular">{date(q.date)}</span>
          </Meta>
          <Meta label="Berlaku s/d">
            <span className={cx("tabular", expired && "font-medium text-red-600 dark:text-red-400")}>{date(q.validTo)}</span>
            {expired && <span className="block text-[11.5px] text-red-600/80 dark:text-red-400/80">Kedaluwarsa — perlu revisi Rev{String(Number(q.rev.slice(3)) + 1).padStart(2, "0")}</span>}
          </Meta>
          <Meta label="Sales Order">{q.soNo ? <Mono>{q.soNo}</Mono> : <span className="text-subtle">Belum</span>}</Meta>
        </dl>
        <Section title="Rincian penawaran" aside={`${q.items.length} item`}>
          <ItemsTable items={q.items} tax={tax} />
        </Section>
        <Section title="Syarat & ketentuan">
          <ul className="list-disc space-y-1 pl-4 text-[12.5px] text-muted">
            <li>Harga sudah termasuk PPN 12% (DPP nilai lain 11/12 × harga jual).</li>
            <li>Penawaran berlaku 30 hari kalender sejak tanggal quotation.</li>
            <li>Pembayaran: uang muka 20%, termin sesuai progres, retensi 5% selama 180 hari.</li>
          </ul>
        </Section>
      </div>
    </Drawer>
  );
}

/* ───────────────────────── New quotation modal ───────────────────────── */

const units = ["ls", "m²", "m³", "m'", "unit", "titik", "bh", "ton"];

function NewQuotationModal({ onClose, onCreate }) {
  const [client, setClient] = useState(customers[0]);
  const [code, setCode] = useState(salesTeam[0].id);
  const [subject, setSubject] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [seq, setSeq] = useState(3);
  const [items, setItems] = useState([
    { id: 1, desc: "Pekerjaan persiapan & mobilisasi", qty: 1, unit: "ls", price: 45_000_000 },
    { id: 2, desc: "", qty: 1, unit: "m²", price: 0 },
  ]);

  const clean = items.filter((i) => i.desc.trim() && i.qty > 0 && i.price > 0);
  const tax = taxFromSubtotal(itemsSubtotal(clean));
  const valid = subject.trim() && clean.length > 0;

  const patch = (id, field, value) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  const addRow = () => {
    setItems((xs) => [...xs, { id: seq, desc: "", qty: 1, unit: "ls", price: 0 }]);
    setSeq((n) => n + 1);
  };

  const submit = () =>
    onCreate({
      code,
      client,
      subject: subject.trim(),
      date: TODAY,
      validTo: addDays(TODAY, validDays),
      grand: tax.grand,
      items: clean.map(({ desc, qty, unit, price }) => ({ desc: desc.trim(), qty, unit, price })),
    });

  const cellInput =
    "h-8 w-full rounded-md border border-line bg-surface px-2 text-[13px] text-fg outline-none placeholder:text-subtle hover:border-line-strong focus:border-line-strong";

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="New Quotation"
      description={`Penjual: ${SELLER.name} · nomor referensi dibuat otomatis (Rev00).`}
      footer={
        <>
          <span className="mr-auto text-[12px] text-subtle">
            Status awal <Badge tone="amber">Waiting Internal</Badge>
          </span>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" icon={Check} disabled={!valid} onClick={submit}>
            Simpan quotation
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Client">
          <Select value={client} onChange={(e) => setClient(e.target.value)}>
            {customers.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sales">
            <Select value={code} onChange={(e) => setCode(e.target.value)}>
              {salesTeam.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Masa berlaku">
            <Select value={validDays} onChange={(e) => setValidDays(Number(e.target.value))}>
              {[14, 30, 60].map((d) => (
                <option key={d} value={d}>
                  {d} hari
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Subject" className="sm:col-span-2">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="mis. Supply & pasang U-Ditch 80×80 kawasan gudang" />
        </Field>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[12.5px] font-medium text-muted">Item penawaran</span>
          <Button size="xs" variant="ghost" icon={Plus} onClick={addRow}>
            Tambah baris
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="hidden grid-cols-[1fr_80px_84px_150px_130px_32px] gap-2 bg-surface-2 px-2.5 py-1.5 text-[11px] font-medium tracking-wide text-subtle uppercase sm:grid">
            <span>Uraian</span>
            <span className="text-right">Qty</span>
            <span>Satuan</span>
            <span className="text-right">Harga satuan</span>
            <span className="text-right">Jumlah</span>
            <span />
          </div>
          {items.map((i) => (
            <div key={i.id} className="grid grid-cols-2 gap-2 border-t border-line px-2.5 py-2 first:border-t-0 sm:grid-cols-[1fr_80px_84px_150px_130px_32px] sm:items-center sm:first:border-t">
              <input className={cx(cellInput, "col-span-2 sm:col-span-1")} value={i.desc} onChange={(e) => patch(i.id, "desc", e.target.value)} placeholder="Uraian pekerjaan / material" />
              <input
                className={cx(cellInput, "text-right tabular")}
                type="number"
                min={0}
                value={i.qty}
                onChange={(e) => patch(i.id, "qty", Number(e.target.value))}
                aria-label="Qty"
              />
              <select className={cellInput} value={i.unit} onChange={(e) => patch(i.id, "unit", e.target.value)} aria-label="Satuan">
                {units.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <input
                className={cx(cellInput, "text-right tabular")}
                type="number"
                min={0}
                step={1000}
                value={i.price}
                onChange={(e) => patch(i.id, "price", Number(e.target.value))}
                aria-label="Harga satuan"
              />
              <span className="text-right text-[13px] font-medium text-fg tabular">{rp(i.qty * i.price)}</span>
              <Button
                size="icon"
                variant="ghost"
                disabled={items.length === 1}
                onClick={() => setItems((xs) => xs.filter((x) => x.id !== i.id))}
                aria-label="Hapus baris"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <p className="flex max-w-xs items-start gap-1.5 text-[12px] text-subtle">
          <Clock className="mt-0.5 size-3.5 shrink-0" />
          Baris tanpa uraian atau harga diabaikan. Perhitungan pajak mengikuti PMK 131/2024 (DPP nilai lain 11/12).
        </p>
        <TaxSummary tax={tax} className="w-full rounded-lg border border-line bg-surface-2 sm:w-80" />
      </div>
    </Modal>
  );
}
