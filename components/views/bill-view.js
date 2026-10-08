"use client";

import { useMemo, useState } from "react";
import { Check, Download, Landmark, Lock, Receipt, Search, Upload, X } from "lucide-react";
import { bankAccounts, ppnOf, vendorBills as seed, vendors } from "@/lib/data/procurement";
import { TODAY } from "@/lib/data/org";
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Mono,
  PageHeader,
  Segmented,
  Select,
  StatusBadge,
  td,
  th,
  trHover,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { cx, date, daysBetween, decimal, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const buckets = [
  { id: "current", label: "Belum jatuh tempo", tone: "neutral" },
  { id: "1-30", label: "1–30 hari", tone: "amber" },
  { id: "31-60", label: "31–60 hari", tone: "red" },
  { id: "60+", label: "> 60 hari", tone: "red" },
];

const pphCoa = {
  "4(2)": { coa: "2-1306", name: "Utang PPh Final 4(2) Jasa Konstruksi" },
  23: { coa: "2-1304", name: "Utang PPh 23" },
};

function enrich(b) {
  const v = vendors[b.vendor];
  const ppn = ppnOf(b.base);
  const gross = b.base + ppn;
  const pph = b.pph ? Math.round((b.base * b.pph.rate) / 100) : 0;
  const net = gross - pph;
  const d = daysBetween(TODAY, b.due);
  let status;
  let bucket = null;
  if (b.paidOn) status = "Lunas";
  else {
    status = d < 0 ? "Overdue" : d <= 7 ? "Jatuh Tempo" : "Belum Jatuh Tempo";
    bucket = d >= 0 ? "current" : -d <= 30 ? "1-30" : -d <= 60 ? "31-60" : "60+";
  }
  const blocked = !b.paidOn && b.match !== "Match";
  return { ...b, v, ppn, gross, pphMeta: b.pph, pph, net, days: d, status, bucket, blocked };
}

function percent(rate) {
  return `${decimal(rate, rate % 1 ? 2 : 0)}%`;
}

export function BillView() {
  const toast = useToast();
  const [rows, setRows] = useState(seed);
  const [bucket, setBucket] = useState(null);
  const [view, setView] = useState("open");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [paying, setPaying] = useState(false);

  const bills = useMemo(() => rows.map(enrich), [rows]);

  const aging = useMemo(
    () =>
      buckets.map((bk) => {
        const items = bills.filter((b) => b.bucket === bk.id);
        return { ...bk, count: items.length, total: items.reduce((s, b) => s + b.net, 0) };
      }),
    [bills],
  );
  const openTotal = aging.reduce((s, a) => s + a.total, 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bills.filter(
      (b) =>
        (view === "all" || (view === "open" ? !b.paidOn : b.paidOn)) &&
        (!bucket || b.bucket === bucket) &&
        (!q ||
          b.no.toLowerCase().includes(q) ||
          b.faktur.includes(q) ||
          b.v.name.toLowerCase().includes(q) ||
          b.po.toLowerCase().includes(q) ||
          b.gr.toLowerCase().includes(q)),
    );
  }, [bills, view, bucket, query]);

  const payable = visible.filter((b) => !b.paidOn && !b.blocked);
  const chosen = bills.filter((b) => selected.has(b.no));
  const chosenNet = chosen.reduce((s, b) => s + b.net, 0);
  const allChecked = payable.length > 0 && payable.every((b) => selected.has(b.no));

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
      if (allChecked) payable.forEach((b) => n.delete(b.no));
      else payable.forEach((b) => n.add(b.no));
      return n;
    });

  const pay = ({ bank, payDate }) => {
    const nos = new Set(chosen.map((b) => b.no));
    const acct = bankAccounts.find((a) => a.id === bank);
    setRows((rs) => rs.map((r) => (nos.has(r.no) ? { ...r, paidOn: payDate, paidFrom: bank } : r)));
    setSelected(new Set());
    setPaying(false);
    const withPph = chosen.filter((b) => b.pph > 0).length;
    toast({
      title: `${nos.size} tagihan dibayar · ${rp(chosenNet)}`,
      description: `Dari ${acct.label.split(" — ")[0]} tgl ${date(payDate)}. Jurnal kas keluar diposting${withPph ? ` · ${withPph} bukti potong PPh disiapkan di Coretax` : ""}.`,
    });
  };

  return (
    <div className={cx(selected.size > 0 && "pb-20")}>
      <PageHeader
        icon={Receipt}
        title="Vendor Bill (AP)"
        description="Tagihan vendor yang sudah lolos 3-way match — PPN masukan, potongan PPh dan jadwal bayar dalam satu tempat."
        actions={
          <>
            <Button size="md" icon={Download} onClick={() => toast({ title: "Aging AP diekspor", description: "Per vendor & proyek, posisi 8 Okt 2026.", tone: "info" })}>
              Export aging
            </Button>
            <Button
              size="md"
              variant="primary"
              icon={Upload}
              onClick={() => toast({ title: "Impor faktur pajak masukan", description: "Sinkronisasi Coretax: 4 faktur baru menunggu dicocokkan ke GR.", tone: "info" })}
            >
              Impor faktur Coretax
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {aging.map((a) => {
          const active = bucket === a.id;
          return (
            <button
              key={a.id}
              onClick={() => {
                setBucket(active ? null : a.id);
                setView("open");
              }}
              className={cx(
                "rounded-xl border bg-surface px-4 py-3.5 text-left transition-colors",
                active ? "border-fg ring-1 ring-fg" : "border-line hover:border-line-strong",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">{a.label}</span>
                <Badge tone={a.count ? a.tone : "neutral"}>{a.count}</Badge>
              </div>
              <div
                className={cx(
                  "mt-1.5 text-[22px] leading-7 font-semibold tracking-tight tabular",
                  a.id === "current" || !a.total ? "text-fg" : a.tone === "amber" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400",
                )}
              >
                {rpShort(a.total)}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={cx("h-full rounded-full", a.id === "current" ? "bg-slate-400" : a.tone === "amber" ? "bg-amber-500" : "bg-red-500")}
                  style={{ width: `${openTotal ? (a.total / openTotal) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-subtle tabular">{openTotal ? decimal((a.total / openTotal) * 100, 0) : 0}% dari AP terbuka</div>
            </button>
          );
        })}
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={view}
              onChange={(v) => {
                setView(v);
                if (v === "paid") setBucket(null);
              }}
              items={[
                { value: "open", label: "Belum lunas", count: bills.filter((b) => !b.paidOn).length },
                { value: "paid", label: "Lunas", count: bills.filter((b) => b.paidOn).length },
                { value: "all", label: "Semua", count: bills.length },
              ]}
            />
            {bucket && (
              <button
                onClick={() => setBucket(null)}
                className="flex h-7 items-center gap-1 rounded-md border border-line px-2 text-[12px] text-muted hover:text-fg"
              >
                {buckets.find((b) => b.id === bucket).label} <X className="size-3" />
              </button>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari bill, faktur, vendor, PO…"
              className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </div>
        </div>
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={cx(th, "w-9 pr-0")}>
                  <Checkbox checked={allChecked} disabled={payable.length === 0} onChange={toggleAll} label="Pilih semua" />
                </th>
                <th className={th}>No. bill / Tgl</th>
                <th className={th}>No. faktur pajak</th>
                <th className={th}>Vendor</th>
                <th className={th}>Ref PO / GR</th>
                <th className={cx(th, "text-right")}>DPP</th>
                <th className={cx(th, "text-right")}>PPN masukan</th>
                <th className={cx(th, "text-right")}>PPh dipotong</th>
                <th className={cx(th, "text-right")}>Neto dibayar</th>
                <th className={th}>Jatuh tempo</th>
                <th className={th}>Match</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => {
                const checked = selected.has(b.no);
                const disabled = !!b.paidOn || b.blocked;
                return (
                  <tr
                    key={b.no}
                    onClick={() => !disabled && toggle(b.no)}
                    className={cx(trHover, !disabled && "cursor-pointer", checked && "bg-indigo-500/[0.05] hover:bg-indigo-500/[0.08]", b.paidOn && "text-muted")}
                  >
                    <td className={cx(td, "pr-0")} onClick={(e) => e.stopPropagation()}>
                      {b.blocked ? (
                        <span title="Diblokir: selesaikan selisih 3-way match dulu" className="flex size-4 items-center justify-center text-subtle">
                          <Lock className="size-3.5" />
                        </span>
                      ) : (
                        <Checkbox checked={checked} disabled={disabled} onChange={() => toggle(b.no)} label={`Pilih ${b.no}`} />
                      )}
                    </td>
                    <td className={td}>
                      <div className="font-medium text-fg">{b.no}</div>
                      <div className="text-[12px] text-subtle">{date(b.date)}</div>
                    </td>
                    <td className={td}>
                      <Mono className="tracking-tight">{b.faktur}</Mono>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-1.5 text-fg">
                        {b.v.name}
                        {b.v.affiliate && <Badge tone="violet">Afiliasi</Badge>}
                      </div>
                      <Mono className="text-[11px] text-subtle">{b.v.npwp}</Mono>
                    </td>
                    <td className={td}>
                      <Mono className="block text-[11.5px]">{b.po}</Mono>
                      <Mono className="block text-[11.5px] text-subtle">{b.gr}</Mono>
                    </td>
                    <td className={cx(td, "text-right tabular")}>{rp(b.base)}</td>
                    <td className={cx(td, "text-right tabular text-muted")}>{rp(b.ppn)}</td>
                    <td className={cx(td, "text-right tabular")}>
                      {b.pph ? (
                        <>
                          <div>({rp(b.pph)})</div>
                          <div className="text-[11.5px] text-subtle">
                            PPh {b.pphMeta.type} · {percent(b.pphMeta.rate)}
                          </div>
                        </>
                      ) : (
                        <span className="text-subtle">–</span>
                      )}
                    </td>
                    <td className={cx(td, "text-right font-semibold tabular", b.paidOn ? "text-muted" : "text-fg")}>{rp(b.net)}</td>
                    <td className={td}>
                      <div className="tabular">{date(b.due)}</div>
                      <div
                        className={cx(
                          "text-[12px] tabular",
                          b.paidOn
                            ? "text-emerald-600 dark:text-emerald-400"
                            : b.days < 0
                              ? "font-medium text-red-600 dark:text-red-400"
                              : b.days <= 7
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-subtle",
                        )}
                      >
                        {b.paidOn ? `dibayar ${date(b.paidOn)}` : b.days < 0 ? `lewat ${-b.days} hari` : b.days === 0 ? "hari ini" : `${b.days} hari lagi`}
                      </div>
                    </td>
                    <td className={td}>
                      <StatusBadge status={b.match} />
                    </td>
                    <td className={td}>
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState icon={Receipt} title="Tidak ada tagihan" description="Ubah filter aging, status, atau kata kunci." />}
        </TableScroll>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[12px] text-subtle">
          <span>
            AP terbuka <span className="font-medium text-fg tabular">{rp(openTotal)}</span> neto · PPN masukan dapat dikreditkan{" "}
            <span className="text-fg tabular">{rp(bills.filter((b) => !b.paidOn).reduce((s, b) => s + b.ppn, 0))}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="size-3" /> Tagihan dengan selisih 3-way match tidak dapat dibayar
          </span>
        </div>
      </Card>

      {/* Sticky bulk bar */}
      {selected.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-surface py-2 pr-2 pl-4 shadow-2xl shadow-slate-950/20 animate-pop">
            <span className="text-[13px] text-muted">
              <span className="font-semibold text-fg tabular">{selected.size}</span> tagihan · neto{" "}
              <span className="font-semibold text-fg tabular">{rp(chosenNet)}</span>
            </span>
            <Button variant="ghost" onClick={() => setSelected(new Set())}>
              Batal
            </Button>
            <Button variant="primary" icon={Landmark} onClick={() => setPaying(true)}>
              Bayar terpilih ({selected.size}) · {rpShort(chosenNet)}
            </Button>
          </div>
        </div>
      )}

      {paying && <PayModal bills={chosen} onClose={() => setPaying(false)} onConfirm={pay} />}
    </div>
  );
}

function Checkbox({ checked, disabled, onChange, label }) {
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

/* ───────────────────────── Payment modal ───────────────────────── */

function PayModal({ bills, onClose, onConfirm }) {
  const [bank, setBank] = useState(bankAccounts[0].id);
  const [payDate, setPayDate] = useState(TODAY);
  const acct = bankAccounts.find((a) => a.id === bank);

  const gross = bills.reduce((s, b) => s + b.gross, 0);
  const net = bills.reduce((s, b) => s + b.net, 0);
  const pphByType = {};
  for (const b of bills) {
    if (b.pphMeta) pphByType[b.pphMeta.type] = (pphByType[meta.type] ?? 0) + b.pph;
  }
  const after = acct.balance - net;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Bayar ${bills.length} tagihan vendor`}
      description="Pembayaran via transfer bank. PPh dipotong disetor terpisah paling lambat tanggal 15 bulan berikutnya."
      footer={
        <>
          <span className="mr-auto text-[12.5px] text-subtle">
            Total transfer <span className="font-semibold text-fg tabular">{rp(net)}</span>
          </span>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" icon={Check} disabled={after < 0 || !payDate} onClick={() => onConfirm({ bank, payDate })}>
            Konfirmasi pembayaran
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
          <Field label="Rekening sumber" hint={`Saldo ${rp(acct.balance)} → ${rp(after)}`}>
            <Select value={bank} onChange={(e) => setBank(e.target.value)}>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal bayar">
            <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </Field>
        </div>

        <TableScroll className="rounded-lg border border-line">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>Bill</th>
                <th className={th}>Vendor</th>
                <th className={cx(th, "text-right")}>Tagihan + PPN</th>
                <th className={cx(th, "text-right")}>PPh</th>
                <th className={cx(th, "text-right")}>Neto</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.no} className="border-t border-line">
                  <td className={cx(td, "py-2")}>
                    {b.no}
                    {b.status === "Overdue" && <span className="ml-1.5 text-[11.5px] text-red-600 dark:text-red-400">lewat {-b.days}h</span>}
                  </td>
                  <td className={cx(td, "py-2 text-muted")}>{b.v.name}</td>
                  <td className={cx(td, "py-2 text-right tabular")}>{rp(b.gross)}</td>
                  <td className={cx(td, "py-2 text-right tabular text-muted")}>{b.pph ? `(${rp(b.pph)})` : "–"}</td>
                  <td className={cx(td, "py-2 text-right font-medium tabular")}>{rp(b.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>

        <div className="rounded-xl border border-line">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <span className="text-[12.5px] font-semibold text-fg">Jurnal pembayaran (preview)</span>
            <span className="text-[11.5px] text-subtle tabular">{date(payDate || TODAY)}</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-subtle">
                <th className="px-3.5 py-1.5 text-left text-[11px] font-medium tracking-wide uppercase">Akun</th>
                <th className="px-3.5 py-1.5 text-right text-[11px] font-medium tracking-wide uppercase">Debit</th>
                <th className="px-3.5 py-1.5 text-right text-[11px] font-medium tracking-wide uppercase">Kredit</th>
              </tr>
            </thead>
            <tbody>
              <JournalRow coa="2-1101" name="Utang Usaha" debit={gross} />
              <JournalRow coa={acct.coa} name={acct.coaName} credit={net} indent />
              {Object.entries(pphByType).map(([type, amt]) => (
                <JournalRow key={type} coa={pphCoa[type].coa} name={pphCoa[type].name} credit={amt} indent />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line-strong bg-surface-2 font-semibold text-fg">
                <td className="px-3.5 py-2">Total</td>
                <td className="px-3.5 py-2 text-right tabular">{rp(gross)}</td>
                <td className="px-3.5 py-2 text-right tabular">{rp(net + Object.values(pphByType).reduce((s, v) => s + v, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {after < 0 ? (
          <Callout tone="red">Saldo {acct.label.split(" — ")[0]} tidak cukup. Pilih rekening lain atau kurangi tagihan.</Callout>
        ) : (
          Object.keys(pphByType).length > 0 && (
            <Callout tone="indigo">
              Bukti potong {Object.keys(pphByType).map((t) => `PPh ${t}`).join(" & ")} otomatis dibuat di Coretax dan dikirim ke email vendor setelah dikonfirmasi.
            </Callout>
          )
        )}
      </div>
    </Modal>
  );
}

function JournalRow({ coa, name, debit, credit, indent }) {
  return (
    <tr className="border-t border-line">
      <td className={cx("py-2 pr-3.5 text-fg", indent ? "pl-8" : "pl-3.5")}>
        <Mono>{coa}</Mono> {name}
      </td>
      <td className="px-3.5 py-2 text-right text-fg tabular">{debit ? rp(debit) : ""}</td>
      <td className="px-3.5 py-2 text-right text-fg tabular">{credit ? rp(credit) : ""}</td>
    </tr>
  );
}
