"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  Download,
  FileText,
  Link2,
  MapPin,
  Plus,
  Printer,
  Search,
  Send,
  ShoppingCart,
} from "lucide-react";
import { deliveryAddress, lineTotal, ppnOf, purchaseOrders as seed, vendors } from "@/lib/data/procurement";
import { TODAY, costCenters, projectByCode, projects } from "@/lib/data/org";
import {
  Badge,
  Button,
  Callout,
  Card,
  Drawer,
  EmptyState,
  Mono,
  PageHeader,
  Progress,
  Segmented,
  StatusBadge,
  td,
  th,
  trHover,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { cx, date, daysBetween, decimal, pct, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const statusFilters = ["Semua", "Draft", "Terkirim", "Diterima Sebagian", "Diterima Penuh"];
const ccName = Object.fromEntries(costCenters.map((c) => [c.code, c.name]));

function poCalc(po) {
  const dpp = lineTotal(po.lines);
  const ppn = ppnOf(dpp);
  const received = po.lines.reduce((s, l) => s + l.received * l.price, 0);
  return { dpp, ppn, total: dpp + ppn, received, receivedPct: dpp ? (received / dpp) * 100 : 0 };
}

function qtyFmt(q) {
  return Number.isInteger(q) ? decimal(q, 0) : decimal(q, 1);
}

function dueInfo(po) {
  if (po.status === "Diterima Penuh") return { label: "selesai", tone: "text-subtle" };
  const d = daysBetween(TODAY, po.deliveryDue);
  if (d < 0) return { label: `lewat ${-d} hari`, tone: "text-red-600 dark:text-red-400 font-medium" };
  if (d === 0) return { label: "hari ini", tone: "text-amber-600 dark:text-amber-400 font-medium" };
  if (d <= 3) return { label: `${d} hari lagi`, tone: "text-amber-600 dark:text-amber-400" };
  return { label: `${d} hari lagi`, tone: "text-subtle" };
}

export function PoView() {
  const toast = useToast();
  const [rows, setRows] = useState(seed);
  const [filter, setFilter] = useState("Semua");
  const [project, setProject] = useState("Semua");
  const [query, setQuery] = useState("");
  const [openNo, setOpenNo] = useState(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "Semua" || r.status === filter) &&
        (project === "Semua" || r.project === project) &&
        (!q ||
          r.no.toLowerCase().includes(q) ||
          r.pr.toLowerCase().includes(q) ||
          vendors[r.vendor].name.toLowerCase().includes(q) ||
          r.lines.some((l) => l.material.toLowerCase().includes(q))),
    );
  }, [rows, filter, project, query]);

  const summary = useMemo(
    () =>
      projects.map((p) => {
        const pos = rows.filter((r) => r.project === p.code && r.status !== "Draft");
        const dpp = pos.reduce((s, r) => s + poCalc(r).dpp, 0);
        const received = pos.reduce((s, r) => s + poCalc(r).received, 0);
        return { ...p, count: pos.length, dpp, received, open: dpp - received };
      }),
    [rows],
  );

  const selected = rows.find((r) => r.no === openNo) ?? null;

  const send = (po) => {
    const first = po.status === "Draft";
    if (first) setRows((rs) => rs.map((r) => (r.no === po.no ? { ...r, status: "Terkirim", sentVia: "Email & WA" } : r)));
    toast({
      title: first ? `${po.no} dikirim ke vendor` : `${po.no} dikirim ulang`,
      description: `${vendors[po.vendor].name} · PDF PO via email & WhatsApp ke ${vendors[po.vendor].contact.split(" · ")[0]}.${first ? " Commitment budget dibentuk." : ""}`,
    });
  };

  const print = (po) =>
    toast({ title: `${po.no}.pdf disiapkan`, description: "Kop PT Tricowarna Karya Nusantara · ditandatangani digital Manager Pengadaan.", tone: "info" });

  return (
    <div>
      <PageHeader
        icon={ShoppingCart}
        title="Purchase Order"
        description="PO ke vendor dari PR yang disetujui — status pengiriman dan penerimaan terpantau per baris."
        actions={
          <>
            <Button size="md" icon={Download} onClick={() => toast({ title: "Ekspor Excel disiapkan", tone: "info" })}>
              Export
            </Button>
            <Button
              size="md"
              variant="primary"
              icon={Plus}
              onClick={() => toast({ title: "Pilih PR yang disetujui", description: "3 PR siap dikonversi: PR-2026-0186, PR-2026-0184, PR-2026-0180.", tone: "info" })}
            >
              PO dari PR
            </Button>
          </>
        }
      />

      {/* Commitment per project */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {summary.map((p) => {
          const active = project === p.code;
          return (
            <button
              key={p.code}
              onClick={() => setProject(active ? "Semua" : p.code)}
              className={cx(
                "rounded-xl border bg-surface px-4 py-3.5 text-left transition-colors",
                active ? "border-fg ring-1 ring-fg" : "border-line hover:border-line-strong",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-muted">
                  {p.short} <Mono className="ml-1 text-[11px]">{p.code}</Mono>
                </span>
                <span className="text-[11.5px] text-subtle tabular">{p.count} PO</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-[20px] leading-7 font-semibold tracking-tight text-fg tabular">{rpShort(p.open)}</span>
                <span className="text-xs text-subtle">commitment terbuka</span>
              </div>
              <Progress value={p.dpp ? (p.received / p.dpp) * 100 : 0} tone="green" className="mt-2.5" />
              <div className="mt-1.5 flex justify-between text-[11.5px] text-subtle tabular">
                <span>Diterima {rpShort(p.received)}</span>
                <span>Total PO {rpShort(p.dpp)}</span>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={filter}
              onChange={setFilter}
              items={statusFilters.map((s) => ({
                value: s,
                label: s,
                count: s === "Semua" ? rows.length : rows.filter((r) => r.status === s).length,
              }))}
            />
            {project !== "Semua" && (
              <button
                onClick={() => setProject("Semua")}
                className="flex h-7 items-center gap-1.5 rounded-md border border-line px-2 text-[12px] text-muted hover:text-fg"
              >
                {projectByCode[project]?.short} ×
              </button>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari no. PO/PR, vendor, material…"
              className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </div>
        </div>
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>No. PO / Tanggal</th>
                <th className={th}>Ref PR</th>
                <th className={th}>Vendor</th>
                <th className={th}>Proyek / CC</th>
                <th className={cx(th, "text-right")}>DPP</th>
                <th className={cx(th, "text-right")}>PPN</th>
                <th className={cx(th, "text-right")}>Total</th>
                <th className={th}>Penerimaan</th>
                <th className={th}>Jatuh tempo kirim</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const c = poCalc(r);
                const v = vendors[r.vendor];
                const due = dueInfo(r);
                return (
                  <tr key={r.no} onClick={() => setOpenNo(r.no)} className={cx(trHover, "cursor-pointer", openNo === r.no && "bg-surface-2")}>
                    <td className={td}>
                      <div className="font-medium">{r.no}</div>
                      <div className="text-[12px] text-subtle">{date(r.date)}</div>
                    </td>
                    <td className={td}>
                      <Mono>{r.pr}</Mono>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-1.5">
                        <span>{v.name}</span>
                        {v.affiliate && <Badge tone="violet">Afiliasi</Badge>}
                      </div>
                      <Mono className="text-[11px] text-subtle">{v.npwp}</Mono>
                    </td>
                    <td className={td}>
                      <Mono>{r.project ?? r.costCenter}</Mono>
                      <div className="text-[12px] text-subtle">{r.project ? projectByCode[r.project]?.short : ccName[r.costCenter]}</div>
                    </td>
                    <td className={cx(td, "text-right tabular")}>{rp(c.dpp)}</td>
                    <td className={cx(td, "text-right tabular text-muted")}>{rp(c.ppn)}</td>
                    <td className={cx(td, "text-right font-medium tabular")}>{rp(c.total)}</td>
                    <td className={td}>
                      <div className="w-[120px]">
                        <div className="flex justify-between text-[11.5px] tabular">
                          <span className={c.receivedPct >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}>{pct(c.receivedPct, 0)}</span>
                          <span className="text-subtle">{rpShort(c.received)}</span>
                        </div>
                        <Progress value={c.receivedPct} tone={c.receivedPct >= 100 ? "green" : c.receivedPct > 0 ? "amber" : "fg"} className="mt-1" />
                      </div>
                    </td>
                    <td className={td}>
                      <div className="tabular">{date(r.deliveryDue)}</div>
                      <div className={cx("text-[12px] tabular", due.tone)}>{due.label}</div>
                    </td>
                    <td className={td}>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState icon={ShoppingCart} title="Tidak ada PO" description="Ubah filter status, proyek, atau kata kunci." />}
        </TableScroll>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[12px] text-subtle">
          <span>
            <span className="text-fg tabular">{visible.length}</span> PO · total{" "}
            <span className="font-medium text-fg tabular">{rp(visible.reduce((s, r) => s + poCalc(r).total, 0))}</span> termasuk PPN
          </span>
          <span>PPN 12% × DPP nilai lain 11/12</span>
        </div>
      </Card>

      {selected && <PoDrawer po={selected} onClose={() => setOpenNo(null)} onSend={() => send(selected)} onPrint={() => print(selected)} />}
    </div>
  );
}

function PoDrawer({ po, onClose, onSend, onPrint }) {
  const v = vendors[po.vendor];
  const c = poCalc(po);
  const due = dueInfo(po);
  const dppLain = Math.round(c.dpp * (11 / 12));

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-2xl"
      title={`${po.no} · ${v.name}`}
      subtitle={
        <>
          <StatusBadge status={po.status} />
          {v.affiliate && <Badge tone="violet">Afiliasi</Badge>}
          <span className="text-[12px] text-subtle">
            dari <Mono>{po.pr}</Mono> · terbit {date(po.date)}
          </span>
        </>
      }
      footer={
        <>
          {po.sentVia && <span className="mr-auto hidden text-[12px] text-subtle sm:block">Terakhir dikirim via {po.sentVia}</span>}
          <Button icon={Printer} onClick={onPrint}>
            Cetak PDF
          </Button>
          <Button variant="primary" icon={Send} onClick={onSend}>
            {po.status === "Draft" ? "Kirim ke vendor (Email/WA)" : "Kirim ulang (Email/WA)"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {v.affiliate && (
          <Callout tone="indigo" icon={Link2}>
            Transaksi pihak berelasi dengan entitas grup. Dieliminasi saat konsolidasi dan wajib didukung harga wajar (arm&apos;s length) di TP Doc.
          </Callout>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoBox icon={Building2} title="Vendor">
            <p className="font-medium text-fg">{v.name}</p>
            <p className="mt-0.5">
              NPWP <Mono>{v.npwp}</Mono>
            </p>
            <p className="mt-0.5">{v.contact}</p>
            <p className="mt-0.5">{v.city}</p>
          </InfoBox>
          <InfoBox icon={MapPin} title="Alamat pengiriman">
            <p className="text-fg">{deliveryAddress[po.project ?? po.costCenter]}</p>
            <p className="mt-1.5">
              <Mono>{po.project ?? po.costCenter}</Mono> · {po.project ? projectByCode[po.project]?.name : ccName[po.costCenter]}
            </p>
          </InfoBox>
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12.5px] font-semibold text-fg">Baris PO</h3>
            <span className="text-[12px] text-subtle tabular">diterima {pct(c.receivedPct, 0)}</span>
          </div>
          <TableScroll className="rounded-lg border border-line">
            <table className="w-full">
              <thead className="bg-surface-2">
                <tr>
                  <th className={th}>Material / jasa</th>
                  <th className={cx(th, "text-right")}>Qty</th>
                  <th className={cx(th, "text-right")}>Diterima</th>
                  <th className={cx(th, "text-right")}>Harga</th>
                  <th className={cx(th, "text-right")}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {po.lines.map((l) => (
                  <tr key={l.material} className="border-t border-line">
                    <td className={cx(td, "whitespace-normal")}>{l.material}</td>
                    <td className={cx(td, "text-right tabular")}>
                      {qtyFmt(l.qty)} <span className="text-subtle">{l.unit}</span>
                    </td>
                    <td
                      className={cx(
                        td,
                        "text-right tabular",
                        l.received >= l.qty ? "text-emerald-600 dark:text-emerald-400" : l.received > 0 ? "text-amber-600 dark:text-amber-400" : "text-subtle",
                      )}
                    >
                      {qtyFmt(l.received)}
                    </td>
                    <td className={cx(td, "text-right tabular")}>{rp(l.price)}</td>
                    <td className={cx(td, "text-right font-medium tabular")}>{rp(l.qty * l.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="divide-y divide-line border-t border-line-strong bg-surface-2 text-[13px]">
              {[
                ["DPP (harga jual)", rp(c.dpp)],
                ["DPP nilai lain 11/12", rp(dppLain)],
                ["PPN 12%", rp(c.ppn)],
              ].map(([k, val]) => (
                <div key={k} className="flex justify-between px-3 py-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-fg tabular">{val}</dd>
                </div>
              ))}
              <div className="flex justify-between px-3 py-2.5">
                <dt className="font-semibold text-fg">Total PO</dt>
                <dd className="text-[15px] font-semibold text-fg tabular">{rp(c.total)}</dd>
              </div>
            </dl>
          </TableScroll>
        </section>

        <section>
          <h3 className="mb-2 text-[12.5px] font-semibold text-fg">Syarat & ketentuan</h3>
          <dl className="divide-y divide-line rounded-lg border border-line text-[13px]">
            {[
              ["Termin pembayaran", `TOP ${v.top} hari setelah tagihan, faktur pajak & GR lengkap`],
              ["Jatuh tempo kirim", <span key="d" className="tabular">{date(po.deliveryDue)} · <span className={due.tone}>{due.label}</span></span>],
              ["Incoterm", "Franco lokasi proyek, termasuk bongkar"],
              ["Dokumen wajib", "Surat jalan, faktur pajak (Coretax), sertifikat mutu / mill certificate"],
              ["Retur & denda", "Barang tidak sesuai spek diretur ≤ 3 hari; denda keterlambatan 1‰/hari maks. 5%"],
            ].map(([k, val]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-3 py-2">
                <dt className="text-subtle">{k}</dt>
                <dd className="text-fg">{val}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-fg">
            <CalendarClock className="size-3.5 text-subtle" /> Jejak dokumen
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            <Mono className="rounded border border-line bg-surface-2 px-1.5 py-0.5">{po.pr}</Mono>
            <span className="text-subtle">→</span>
            <Mono className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-fg">{po.no}</Mono>
            <span className="text-subtle">→</span>
            <span className="rounded border border-dashed border-line px-1.5 py-0.5 text-subtle">
              {c.received > 0 ? "GR tercatat" : "Menunggu GR"}
            </span>
            <span className="text-subtle">→</span>
            <span className="rounded border border-dashed border-line px-1.5 py-0.5 text-subtle">Vendor bill</span>
            <FileText className="ml-1 size-3.5 text-subtle" />
          </div>
        </section>
      </div>
    </Drawer>
  );
}

function InfoBox({ icon: Icon, title, children }) {
  return (
    <div className="rounded-lg border border-line px-3.5 py-3 text-[12.5px] text-muted">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-medium tracking-wide text-subtle uppercase">
        <Icon className="size-3.5" /> {title}
      </p>
      {children}
    </div>
  );
}
