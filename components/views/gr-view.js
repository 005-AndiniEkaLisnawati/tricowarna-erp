"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Bot,
  Check,
  ChevronRight,
  FileWarning,
  PackageCheck,
  PackagePlus,
  Search,
  Sparkles,
} from "lucide-react";
import { goodsReceipts as seedGr, matchStatus, purchaseOrders as seedPo, vendors } from "@/lib/data/procurement";
import { costCenters, projectByCode } from "@/lib/data/org";
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
  StatCard,
  StatusBadge,
  td,
  th,
  trHover,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { cx, date, decimal, pct, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const filters = ["Semua", "Match", "Selisih Qty", "Selisih Harga", "Menunggu Tagihan"];
const ccName = Object.fromEntries(costCenters.map((c) => [c.code, c.name]));

function qtyFmt(q) {
  if (q == null) return "–";
  return Number.isInteger(q) ? decimal(q, 0) : decimal(q, 1);
}

function grValue(gr) {
  return gr.lines.reduce((s, l) => s + l.qtyGr * l.pricePo, 0);
}

function lineVariance(l) {
  if (l.qtyBill == null) return null;
  return l.qtyBill * l.priceBill - l.qtyGr * l.pricePo;
}

function grVariance(gr) {
  return gr.lines.reduce((s, l) => s + (lineVariance(l) ?? 0), 0);
}

export function GrView() {
  const toast = useToast();
  const [pos, setPos] = useState(seedPo);
  const [grs, setGrs] = useState(seedGr);
  const [expanded, setExpanded] = useState(() => new Set([seedGr[0].no]));
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [receiving, setReceiving] = useState(false);
  const [resolved, setResolved] = useState(false);

  const poByNo = useMemo(() => Object.fromEntries(pos.map((p) => [p.no, p])), [pos]);

  const rows = useMemo(() => grs.map((g) => ({ ...g, match: matchStatus(g.lines) })), [grs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((g) => {
      const po = poByNo[g.po];
      return (
        (filter === "Semua" || g.match === filter) &&
        (!q ||
          g.no.toLowerCase().includes(q) ||
          g.po.toLowerCase().includes(q) ||
          (g.bill ?? "").toLowerCase().includes(q) ||
          (po && vendors[po.vendor].name.toLowerCase().includes(q)) ||
          g.lines.some((l) => l.material.toLowerCase().includes(q)))
      );
    });
  }, [rows, filter, query, poByNo]);

  const billed = rows.filter((g) => g.match !== "Menunggu Tagihan");
  const matched = billed.filter((g) => g.match === "Match").length;
  const exceptions = rows.filter((g) => g.match === "Selisih Qty" || g.match === "Selisih Harga");
  const monthRows = rows.filter((g) => g.date >= "2026-10-01");

  // The biggest price anomaly feeds the AI callout.
  const anomaly = useMemo(() => {
    let best = null;
    for (const g of rows) {
      for (const l of g.lines) {
        if (l.priceBill != null && l.priceBill !== l.pricePo) {
          const diff = ((l.priceBill - l.pricePo) / l.pricePo) * 100;
          if (!best || Math.abs(diff) > Math.abs(best.diff)) best = { gr: g, line: l, diff };
        }
      }
    }
    return best;
  }, [rows]);

  const toggle = (no) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(no)) n.delete(no);
      else n.add(no);
      return n;
    });

  const record = ({ poNo, date: d, sj, qty }) => {
    const po = poByNo[poNo];
    const no = `GR-2026-${String(220 + grs.length - seedGr.length).padStart(4, "0")}`;
    const lines = po.lines
      .map((l, i) => ({ l, q: qty[i] }))
      .filter(({ q }) => q > 0)
      .map(({ l, q }) => ({
        material: l.material,
        unit: l.unit,
        qtyPo: l.qty,
        qtyGr: q,
        qtyBill: null,
        pricePo: l.price,
        priceBill: null,
      }));
    const newLines = po.lines.map((l, i) => ({ ...l, received: l.received + (qty[i] || 0) }));
    const full = newLines.every((l) => l.received >= l.qty);
    setPos((ps) => ps.map((p) => (p.no === poNo ? { ...p, lines: newLines, status: full ? "Diterima Penuh" : "Diterima Sebagian" } : p)));
    const gr = { no, date: d, po: poNo, sj, receivedBy: "Rina Kartikasari", bill: null, lines, fresh: true };
    setGrs((gs) => [gr, ...gs]);
    setExpanded((s) => new Set(s).add(no));
    setFilter("Semua");
    setReceiving(false);
    const value = grValue(gr);
    toast({
      title: `${no} dicatat · ${poNo} ${full ? "diterima penuh" : "diterima sebagian"}`,
      description: `Realisasi budget & jurnal Persediaan/WIP dibentuk — Dr Persediaan Material ${rp(value)} / Cr Utang Belum Ditagih.`,
    });
  };

  const openPos = pos.filter((p) => p.status === "Terkirim" || p.status === "Diterima Sebagian");

  return (
    <div>
      <PageHeader
        icon={PackageCheck}
        title="Goods Receipt"
        description="Penerimaan barang di site dicocokkan otomatis PO ↔ GR ↔ tagihan sebelum AP boleh dibayar."
        actions={
          <Button size="md" variant="primary" icon={PackagePlus} onClick={() => setReceiving(true)}>
            Terima barang
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="GR bulan ini" value={monthRows.length} hint={`${rpShort(monthRows.reduce((s, g) => s + grValue(g), 0))} nilai diterima`} />
        <StatCard
          label="3-way match rate"
          value={pct(billed.length ? (matched / billed.length) * 100 : 0, 0)}
          hint={`${matched} dari ${billed.length} GR bertagihan`}
        />
        <StatCard
          label="Perlu klarifikasi"
          value={exceptions.length}
          delta="●"
          deltaTone="red"
          hint={`${rpShort(exceptions.reduce((s, g) => s + Math.max(0, grVariance(g)), 0))} kelebihan tagih`}
        />
        <StatCard label="Menunggu tagihan" value={rows.filter((g) => g.match === "Menunggu Tagihan").length} hint={`${openPos.length} PO masih terbuka`} />
      </div>

      {anomaly && !resolved && (
        <Callout tone="amber" icon={Bot} className="mt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p>
                <span className="font-semibold">Agent Hermes mendeteksi anomali harga.</span> Harga{" "}
                {anomaly.line.material.toLowerCase().replace(" – 12 m", "")} di tagihan <Mono className="text-current">{anomaly.gr.bill}</Mono>{" "}
                <span className="font-semibold tabular">
                  {anomaly.diff > 0 ? "+" : ""}
                  {decimal(anomaly.diff, 1)}%
                </span>{" "}
                dari <Mono className="text-current">{anomaly.gr.po}</Mono> ({rp(anomaly.line.priceBill)} vs {rp(anomaly.line.pricePo)}/{anomaly.line.unit}) — kelebihan{" "}
                <span className="font-semibold tabular">{rp(anomaly.line.qtyBill * (anomaly.line.priceBill - anomaly.line.pricePo))}</span>.
                Pembayaran ditahan otomatis sampai ada nota kredit atau addendum harga.
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] opacity-80">
                <Sparkles className="size-3" /> Harga besi D13 rata-rata 5 PO terakhir: Rp139.200–Rp141.500/btg · tidak ada addendum tercatat.
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button
                size="xs"
                onClick={() =>
                  toast({ title: "Permintaan nota kredit terkirim", description: `${vendors.MJU.name} · ref ${anomaly.gr.bill} via email & WA.`, tone: "info" })
                }
              >
                Minta nota kredit
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setResolved(true);
                  toast({ title: "Anomali ditandai sudah diklarifikasi", description: "Tercatat di audit log oleh Rina Kartikasari.", tone: "info" });
                }}
              >
                Abaikan
              </Button>
            </div>
          </div>
        </Callout>
      )}

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
          <Segmented
            value={filter}
            onChange={setFilter}
            items={filters.map((s) => ({
              value: s,
              label: s,
              count: s === "Semua" ? rows.length : rows.filter((g) => g.match === s).length,
            }))}
          />
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari no. GR/PO/bill, vendor…"
              className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </div>
        </div>
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={cx(th, "w-8 pr-0")}></th>
                <th className={th}>No. GR / Tanggal</th>
                <th className={th}>PO ↔ GR ↔ Bill</th>
                <th className={th}>Vendor</th>
                <th className={th}>Proyek / CC</th>
                <th className={cx(th, "text-right")}>Nilai diterima</th>
                <th className={cx(th, "text-right")}>Selisih tagih</th>
                <th className={th}>3-way match</th>
                <th className={th}>Penerima</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((g) => {
                const po = poByNo[g.po];
                const v = po ? vendors[po.vendor] : null;
                const open = expanded.has(g.no);
                const variance = grVariance(g);
                return (
                  <Fragment key={g.no}>
                    <tr
                      onClick={() => toggle(g.no)}
                      className={cx(trHover, "cursor-pointer", open && "bg-surface-2/60", g.fresh && "bg-emerald-500/[0.04]")}
                    >
                      <td className={cx(td, "pr-0")}>
                        <ChevronRight className={cx("size-4 text-subtle transition-transform", open && "rotate-90 text-fg")} />
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-1.5 font-medium">
                          {g.no}
                          {g.fresh && <Badge tone="green">Baru</Badge>}
                        </div>
                        <div className="text-[12px] text-subtle">
                          {date(g.date)} · <span className="font-mono text-[11px]">{g.sj}</span>
                        </div>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-1 text-[11.5px]">
                          <Mono className="text-[11.5px]">{g.po.replace("PO-2026-", "PO-")}</Mono>
                          <span className="text-subtle">↔</span>
                          <Mono className="text-[11.5px] text-fg">{g.no.replace("GR-2026-", "GR-")}</Mono>
                          <span className="text-subtle">↔</span>
                          {g.bill ? (
                            <Mono className="text-[11.5px]">{g.bill.replace("BILL-2026-", "BILL-")}</Mono>
                          ) : (
                            <span className="text-subtle italic">belum ada</span>
                          )}
                        </div>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-1.5">
                          {v?.name}
                          {v?.affiliate && <Badge tone="violet">Afiliasi</Badge>}
                        </div>
                      </td>
                      <td className={td}>
                        <Mono>{po?.project ?? po?.costCenter}</Mono>
                        <div className="text-[12px] text-subtle">{po?.project ? projectByCode[po.project]?.short : ccName[po?.costCenter]}</div>
                      </td>
                      <td className={cx(td, "text-right font-medium tabular")}>{rp(grValue(g))}</td>
                      <td
                        className={cx(
                          td,
                          "text-right tabular",
                          g.match === "Menunggu Tagihan" ? "text-subtle" : variance > 0 ? "font-medium text-red-600 dark:text-red-400" : variance < 0 ? "text-amber-600 dark:text-amber-400" : "text-subtle",
                        )}
                      >
                        {g.match === "Menunggu Tagihan" ? "–" : variance === 0 ? "Rp0" : `${variance > 0 ? "+" : ""}${rp(variance)}`}
                      </td>
                      <td className={td}>
                        <StatusBadge status={g.match} />
                      </td>
                      <td className={cx(td, "text-muted")}>{g.receivedBy}</td>
                    </tr>
                    {open && (
                      <tr className="bg-surface-2/60">
                        <td colSpan={9} className="px-3 pt-0 pb-3">
                          <MatchTable gr={g} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState icon={PackageCheck} title="Tidak ada GR" description="Ubah filter match atau kata kunci." />}
        </TableScroll>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[12px] text-subtle">
          <span>
            Toleransi match: qty 0% · harga ±0,5%. Selisih di atasnya memblokir pembayaran di Vendor Bill.
          </span>
          <span className="flex items-center gap-3">
            <Legend className="bg-amber-500/25 ring-amber-500/40">selisih qty</Legend>
            <Legend className="bg-red-500/20 ring-red-500/40">selisih harga</Legend>
          </span>
        </div>
      </Card>

      {receiving && <ReceiveModal pos={openPos} preselect={openPos[0]?.no} onClose={() => setReceiving(false)} onSubmit={record} />}
    </div>
  );
}

function Legend({ className, children }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cx("size-2.5 rounded-sm ring-1 ring-inset", className)} />
      {children}
    </span>
  );
}

/* ───────────────────────── Expanded line comparison ───────────────────────── */

const qtyBad = "bg-amber-500/15 text-amber-800 font-semibold dark:text-amber-300";
const priceBad = "bg-red-500/12 text-red-700 font-semibold dark:text-red-300";

function MatchTable({ gr }) {
  return (
    <TableScroll className="rounded-lg border border-line bg-surface animate-fade-in">
      <table className="w-full">
        <thead>
          <tr className="border-b border-line">
            <th className={th}>Material</th>
            <th className={cx(th, "text-right")}>Qty PO</th>
            <th className={cx(th, "text-right")}>Qty GR</th>
            <th className={cx(th, "text-right")}>Qty Bill</th>
            <th className={cx(th, "text-right")}>Harga PO</th>
            <th className={cx(th, "text-right")}>Harga Bill</th>
            <th className={cx(th, "text-right")}>Selisih</th>
          </tr>
        </thead>
        <tbody>
          {gr.lines.map((l) => {
            const pending = l.qtyBill == null;
            const qBad = !pending && l.qtyBill !== l.qtyGr;
            const pBad = !pending && l.priceBill !== l.pricePo;
            const v = lineVariance(l);
            const pDiff = pBad ? ((l.priceBill - l.pricePo) / l.pricePo) * 100 : 0;
            return (
              <tr key={l.material} className="border-t border-line first:border-t-0">
                <td className={cx(td, "py-2")}>
                  {l.material}
                  {(qBad || pBad) && (
                    <Badge tone={pBad ? "red" : "amber"} className="ml-2">
                      Exception
                    </Badge>
                  )}
                </td>
                <td className={cx(td, "py-2 text-right tabular text-muted")}>
                  {qtyFmt(l.qtyPo)} <span className="text-subtle">{l.unit}</span>
                </td>
                <td className={cx(td, "py-2 text-right tabular", l.qtyGr < l.qtyPo && "text-muted")}>{qtyFmt(l.qtyGr)}</td>
                <td className={cx(td, "py-2 text-right tabular", qBad && qtyBad, pending && "text-subtle")}>{qtyFmt(l.qtyBill)}</td>
                <td className={cx(td, "py-2 text-right tabular")}>{rp(l.pricePo)}</td>
                <td className={cx(td, "py-2 text-right tabular", pBad && priceBad, pending && "text-subtle")}>
                  {pending ? "–" : rp(l.priceBill)}
                  {pBad && (
                    <span className="ml-1 text-[11px] font-medium">
                      ({pDiff > 0 ? "+" : ""}
                      {decimal(pDiff, 1)}%)
                    </span>
                  )}
                </td>
                <td
                  className={cx(
                    td,
                    "py-2 text-right font-medium tabular",
                    v > 0 ? "text-red-600 dark:text-red-400" : v < 0 ? "text-amber-600 dark:text-amber-400" : "text-subtle",
                  )}
                >
                  {v == null ? "menunggu tagihan" : v === 0 ? "–" : `${v > 0 ? "+" : ""}${rp(v)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScroll>
  );
}

/* ───────────────────────── Modal: Terima barang ───────────────────────── */

function ReceiveModal({ pos, preselect, onClose, onSubmit }) {
  const [poNo, setPoNo] = useState(preselect ?? "");
  const [d, setD] = useState("2026-10-08");
  const [sj, setSj] = useState("");
  const [qty, setQty] = useState({});

  const po = pos.find((p) => p.no === poNo);

  const parsed = po
    ? po.lines.map((l, i) => {
        const raw = qty[i] ?? "";
        const n = raw === "" ? 0 : Number(String(raw).replace(",", "."));
        const outstanding = l.qty - l.received;
        let error = null;
        if (Number.isNaN(n) || n < 0) error = "Qty tidak valid";
        else if (n > outstanding) error = `Melebihi sisa PO (maks. ${qtyFmt(outstanding)})`;
        return { l, n: Number.isNaN(n) ? 0 : n, outstanding, error };
      })
    : [];

  const hasError = parsed.some((p) => p.error);
  const totalQty = parsed.reduce((s, p) => s + (p.error ? 0 : p.n), 0);
  const value = parsed.reduce((s, p) => s + (p.error ? 0 : p.n * p.l.price), 0);
  const canSubmit = po && !hasError && totalQty > 0 && sj.trim() && d;

  const fillAll = () => setQty(Object.fromEntries(parsed.map((p, i) => [i, String(p.outstanding)])));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Terima barang"
      description="Catat penerimaan di site terhadap PO terbuka. Qty tidak boleh melebihi sisa PO."
      footer={
        <>
          <span className="mr-auto text-[12.5px] text-subtle">
            Nilai diterima <span className="font-semibold text-fg tabular">{rp(value)}</span>
          </span>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={Check}
            disabled={!canSubmit}
            onClick={() => onSubmit({ poNo, date: d, sj: sj.trim(), qty: parsed.map((p) => p.n) })}
          >
            Simpan GR
          </Button>
        </>
      }
    >
      {pos.length === 0 ? (
        <EmptyState icon={PackageCheck} title="Tidak ada PO terbuka" description="Semua PO terkirim sudah diterima penuh." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px_180px]">
            <Field label="Purchase Order">
              <Select
                value={poNo}
                onChange={(e) => {
                  setPoNo(e.target.value);
                  setQty({});
                }}
              >
                {pos.map((p) => (
                  <option key={p.no} value={p.no}>
                    {p.no} · {vendors[p.vendor].name} · {p.project ? projectByCode[p.project]?.short : p.costCenter}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tanggal terima">
              <Input type="date" value={d} onChange={(e) => setD(e.target.value)} />
            </Field>
            <Field label="No. surat jalan">
              <Input value={sj} onChange={(e) => setSj(e.target.value)} placeholder="SJ/…" className="font-mono text-[13px]" />
            </Field>
          </div>

          {po && (
            <div className="overflow-x-auto rounded-lg border border-line">
              <div className="flex items-center justify-between border-b border-line bg-surface-2 px-3 py-2">
                <span className="text-[12.5px] font-semibold text-fg">Baris PO</span>
                <Button size="xs" variant="ghost" onClick={fillAll}>
                  Isi semua sisa
                </Button>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={th}>Material</th>
                    <th className={cx(th, "text-right")}>Qty PO</th>
                    <th className={cx(th, "text-right")}>Sudah diterima</th>
                    <th className={cx(th, "text-right")}>Sisa</th>
                    <th className={cx(th, "w-[170px]")}>Diterima sekarang</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((p, i) => (
                    <tr key={p.l.material} className="border-t border-line align-top">
                      <td className={cx(td, "whitespace-normal")}>{p.l.material}</td>
                      <td className={cx(td, "text-right tabular text-muted")}>{qtyFmt(p.l.qty)}</td>
                      <td className={cx(td, "text-right tabular text-muted")}>{qtyFmt(p.l.received)}</td>
                      <td className={cx(td, "text-right font-medium tabular")}>
                        {qtyFmt(p.outstanding)} <span className="font-normal text-subtle">{p.l.unit}</span>
                      </td>
                      <td className={cx(td, "py-2")}>
                        {p.outstanding <= 0 ? (
                          <span className="text-[12px] text-emerald-600 dark:text-emerald-400">Lengkap</span>
                        ) : (
                          <>
                            <div className="relative">
                              <input
                                inputMode="decimal"
                                value={qty[i] ?? ""}
                                onChange={(e) => setQty((q) => ({ ...q, [i]: e.target.value.replace(/[^\d.,]/g, "") }))}
                                placeholder="0"
                                className={cx(
                                  "h-8 w-full rounded-md border bg-surface pr-10 pl-2.5 text-right text-[13px] text-fg tabular outline-none",
                                  p.error ? "border-red-500/60 bg-red-500/[0.04]" : "border-line focus:border-line-strong",
                                )}
                              />
                              <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[11.5px] text-subtle">{p.l.unit}</span>
                            </div>
                            {p.error && <p className="mt-1 text-[11.5px] whitespace-normal text-red-600 dark:text-red-400">{p.error}</p>}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Callout tone="indigo" icon={FileWarning}>
            Saat disimpan: realisasi budget proyek diperbarui dan jurnal <span className="font-medium">Dr Persediaan Material / WIP</span> ·{" "}
            <span className="font-medium">Cr Utang Belum Ditagih (GR/IR)</span> dibentuk otomatis. Tagihan vendor nanti dicocokkan ke GR ini.
          </Callout>
        </div>
      )}
    </Modal>
  );
}
