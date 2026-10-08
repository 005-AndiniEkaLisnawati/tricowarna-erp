"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  CircleCheck,
  ClipboardSignature,
  FilePlus2,
  Package,
  PackageCheck,
  Plus,
  Printer,
  Truck,
  User,
} from "lucide-react";
import { billingSOs, clients, deliveries as seed, soByNo, vehicles } from "@/lib/data/sales-billing";
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
  Progress,
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
import { cx, date, decimal, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";
import { Checkbox, ListToolbar, Pager, SectionLabel } from "@/components/views/sales-invoice-view";

const typeFilters = ["Semua", "Supply", "BAST Progres"];

// Who signs on the client side when a DO / BAST is closed from this screen.
const signers = {
  "SO-202609-0041": { name: "Hendra Wijaya", title: "Site Supervisor, Cakrawala Indopac" },
  "SO-202610-0043": { name: "Dimas Saputra", title: "Staf Logistik, Artha Envirotama" },
  "SO-202609-0042": { name: "Rudi Hartono, S.T.", title: "PPK Jalan, Dinas PUPR Kubu Raya" },
  "SO-202610-0044": { name: "Ir. Yohanes Kristianto", title: "PPK Jembatan, Dinas PUPR" },
  "SO-202608-0039": { name: "Andi Saputro, S.Pi.", title: "PPK Kampung Nelayan, DJPT KKP" },
  "SO-202608-0040": { name: "Bimo Adhitama", title: "Manajer Depo & Fasilitas, LRT Jakarta" },
};

const vehicleByPlate = Object.fromEntries(vehicles.map((v) => [v.plate, v]));

function lineDetail(d) {
  const so = soByNo[d.so];
  return (d.lines ?? []).map((l) => ({ ...so.lines.find((x) => x.id === l.id), qtyKirim: l.qty }));
}

function summary(d) {
  if (d.type === "BAST Progres") return `Progres ${d.progress}%`;
  return lineDetail(d)
    .map((l) => `${decimal(l.qtyKirim, 0)} ${l.unit} ${l.short}`)
    .join(" · ");
}

/** Qty already shipped per SO line (Void excluded). */
function shippedBySo(rows, soNo) {
  const out = {};
  for (const d of rows) {
    if (d.so !== soNo || d.status === "Void" || !d.lines) continue;
    for (const l of d.lines) out[l.id] = (out[l.id] ?? 0) + l.qty;
  }
  return out;
}

function nextDoNo(rows) {
  const seq = rows
    .filter((r) => r.no.startsWith("DO-202610-"))
    .map((r) => Number(r.no.slice(-4)))
    .reduce((a, b) => Math.max(a, b), 0);
  return `DO-202610-${String(seq + 1).padStart(4, "0")}`;
}

export function DeliveryView() {
  const toast = useToast();
  const [rows, setRows] = useState(seed);
  const [type, setType] = useState("Semua");
  const [status, setStatus] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [openNo, setOpenNo] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const list = useMemo(
    () =>
      rows
        .map((d) => ({ ...d, soData: soByNo[d.so], client: clients[soByNo[d.so].client] }))
        .sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no)),
    [rows],
  );

  const count = (s) => list.filter((d) => d.status === s).length;
  const stats = [
    { label: "Total DO & BAST", value: list.length, hint: `${list.filter((d) => d.type === "Supply").length} DO · ${list.filter((d) => d.type !== "Supply").length} BAST`, icon: Package },
    { label: "In Transit", value: count("In Transit"), hint: "armada di jalan", icon: Truck, s: "In Transit" },
    { label: "Delivered", value: count("Delivered"), hint: "diterima di lokasi", icon: PackageCheck, s: "Delivered" },
    { label: "BAST Signed", value: count("BAST Signed"), hint: `${count("Draft")} draft menunggu TTD`, icon: ClipboardSignature, s: "BAST Signed" },
    { label: "Void", value: count("Void"), hint: "dibatalkan", icon: Ban, s: "Void" },
  ];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(
      (d) =>
        (type === "Semua" || d.type === type) &&
        (!status || d.status === status) &&
        (!q ||
          d.no.toLowerCase().includes(q) ||
          d.so.toLowerCase().includes(q) ||
          d.client.name.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          (d.vehicle ?? "").toLowerCase().includes(q)),
    );
  }, [list, type, status, query]);

  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const curPage = Math.min(page, pages);
  const paged = visible.slice((curPage - 1) * pageSize, curPage * pageSize);
  const allChecked = paged.length > 0 && paged.every((d) => selected.has(d.no));
  const current = list.find((d) => d.no === openNo);
  const toBill = list.filter((d) => (d.status === "Delivered" || d.status === "BAST Signed") && !d.invoice);

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
      if (allChecked) paged.forEach((d) => n.delete(d.no));
      else paged.forEach((d) => n.add(d.no));
      return n;
    });

  const patch = (no, fn) => setRows((rs) => rs.map((r) => (r.no === no ? fn(r) : r)));

  const markDone = (d) => {
    const signer = signers[d.so];
    const nextStatus = d.type === "Supply" ? "Delivered" : "BAST Signed";
    patch(d.no, (r) => ({ ...r, status: nextStatus, note: null, receiver: { ...signer, at: TODAY } }));
    toast({
      title: `${d.no} → ${nextStatus}`,
      description:
        d.type === "Supply"
          ? `Diterima ${signer.name} (${signer.title}). Siap dibuatkan invoice.`
          : `BAST ditandatangani ${signer.name}. Termin progres ${d.progress}% siap ditagih.`,
    });
  };

  const makeInvoice = (d) => {
    patch(d.no, (r) => ({ ...r, invoice: "Draft" }));
    toast({
      title: `Draft invoice dibuat dari ${d.no}`,
      description: `${d.client.short} · ${rp(d.value)} excl. PPN. Review & posting di Sales Invoice.`,
    });
  };

  const create = (doc) => {
    const no = nextDoNo(rows);
    setRows((rs) => [...rs, { ...doc, no }]);
    setCreating(false);
    setType("Semua");
    setStatus(null);
    toast({ title: `${no} dibuat · In Transit`, description: `${summary(doc)} ke ${clients[soByNo[doc.so].client].short} · ${doc.vehicle}.` });
  };

  return (
    <div>
      <PageHeader
        icon={Truck}
        title="Delivery Order"
        description="Surat jalan untuk penjualan supply (precast, paving) dan BAST progres per termin kontrak — dasar penagihan Sales Invoice."
      />

      <SectionLabel>Delivery Order Statistic</SectionLabel>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const active = s.s && status === s.s;
          return (
            <button
              key={s.label}
              onClick={() => {
                setStatus(active || !s.s ? null : s.s);
                setPage(1);
              }}
              className={cx("rounded-xl text-left", active && "ring-1 ring-fg")}
            >
              <StatCard label={s.label} icon={s.icon} value={<span className="tabular">{s.value}</span>} hint={s.hint} />
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="md" variant="primary" icon={Plus} onClick={() => setCreating(true)}>
          New Delivery Order
        </Button>
        <Button
          size="md"
          icon={ClipboardSignature}
          onClick={() => toast({ title: "BAST progres dari opname", description: "Tarik progres mingguan dari modul Proyek, lalu kirim ke PPK untuk ditandatangani.", tone: "info" })}
        >
          Buat BAST Progres
        </Button>
        <Button
          size="md"
          icon={Printer}
          disabled={selected.size === 0}
          onClick={() => toast({ title: `${selected.size} dokumen dicetak`, description: "Surat jalan / BAST rangkap 3 (penerima, gudang, keuangan).", tone: "info" })}
        >
          Cetak terpilih{selected.size > 0 ? ` (${selected.size})` : ""}
        </Button>
      </div>

      {toBill.length > 0 && (
        <Callout tone="indigo" icon={FilePlus2} className="mt-4">
          <span className="font-semibold">{toBill.length} dokumen siap ditagih:</span>{" "}
          {toBill.map((d, i) => (
            <span key={d.no}>
              {i > 0 && ", "}
              <button className="font-medium underline decoration-indigo-500/40 underline-offset-2 hover:decoration-indigo-500" onClick={() => setOpenNo(d.no)}>
                {d.no}
              </button>{" "}
              <span className="tabular">({rpShort(d.value)})</span>
            </span>
          ))}
          . Buat invoice dari panel detail.
        </Callout>
      )}

      <Card className="mt-4 overflow-hidden">
        <ListToolbar
          pageSize={pageSize}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          onExport={() => toast({ title: `${visible.length} dokumen diekspor`, description: "Delivery Order & BAST beserta qty per item (.xlsx).", tone: "info" })}
          onRefresh={() => toast({ title: "Posisi armada diperbarui", description: "GPS B 9123 KYU: Tol Cikampek Km 21, ETA 16:30.", tone: "info" })}
          query={query}
          onQuery={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Cari DO/BAST, SO, klien, nopol…"
        >
          <Segmented
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            items={typeFilters.map((t) => ({ value: t, label: t, count: t === "Semua" ? list.length : list.filter((d) => d.type === t).length }))}
          />
          {status && (
            <button onClick={() => setStatus(null)} className="flex h-7 items-center gap-1 rounded-md border border-line px-2 text-[12px] text-muted hover:text-fg">
              {status} ×
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
                <th className={th}>DO / BAST No</th>
                <th className={th}>SO Ref</th>
                <th className={th}>Client</th>
                <th className={th}>Tipe</th>
                <th className={th}>Tanggal kirim</th>
                <th className={th}>Lokasi tujuan</th>
                <th className={th}>Item / Progres</th>
                <th className={th}>Status</th>
                <th className={cx(th, "text-right")}>Nilai (excl. PPN)</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((d) => {
                const checked = selected.has(d.no);
                return (
                  <tr
                    key={d.no}
                    onClick={() => setOpenNo(d.no)}
                    className={cx(trHover, "cursor-pointer", checked && "bg-indigo-500/[0.05] hover:bg-indigo-500/[0.08]")}
                  >
                    <td className={cx(td, "pr-0")} onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked} onChange={() => toggle(d.no)} label={`Pilih ${d.no}`} />
                    </td>
                    <td className={td}>
                      <div className={cx("font-medium", d.status === "Void" ? "text-muted line-through" : "text-fg")}>{d.no}</div>
                      {d.vehicle && <div className="text-[12px] text-subtle">{d.vehicle}</div>}
                    </td>
                    <td className={td}>
                      <Mono className="text-[11.5px]">{d.so}</Mono>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-1.5 text-fg">
                        {d.client.short}
                        {d.soData.shipper && <Badge tone="violet">via afiliasi</Badge>}
                      </div>
                    </td>
                    <td className={td}>
                      <Badge tone={d.type === "Supply" ? "blue" : "indigo"}>{d.type}</Badge>
                    </td>
                    <td className={cx(td, "tabular")}>{date(d.date)}</td>
                    <td className={cx(td, "max-w-[260px]")}>
                      <span className="block truncate text-muted" title={d.location}>
                        {d.location}
                      </span>
                    </td>
                    <td className={td}>
                      <div className="text-fg">{summary(d)}</div>
                      {d.type === "BAST Progres" && <div className="text-[11.5px] text-subtle tabular">+{d.progress - d.prevProgress}% periode ini</div>}
                    </td>
                    <td className={td}>
                      <StatusBadge status={d.status} />
                    </td>
                    <td className={cx(td, "text-right font-medium tabular", d.status === "Void" && "text-muted line-through")}>{rp(d.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState icon={Truck} title="Tidak ada dokumen" description="Ubah filter tipe, status, atau kata kunci." />}
        </TableScroll>
        <Pager page={curPage} pageSize={pageSize} total={visible.length} onPage={setPage}>
          Belum ditagih <span className="font-medium text-fg tabular">{rp(toBill.reduce((s, d) => s + d.value, 0))}</span> dari {toBill.length} DO/BAST
        </Pager>
      </Card>

      {current && <DeliveryDrawer d={current} rows={rows} onClose={() => setOpenNo(null)} onDone={markDone} onInvoice={makeInvoice} />}
      {creating && <NewDoModal rows={rows} onClose={() => setCreating(false)} onCreate={create} />}
    </div>
  );
}

/* ───────────────────────── Drawer ───────────────────────── */

function DeliveryDrawer({ d, rows, onClose, onDone, onInvoice }) {
  const toast = useToast();
  const company = useCompany();
  const isSupply = d.type === "Supply";
  const v = d.vehicle ? vehicleByPlate[d.vehicle] : null;
  const shipped = isSupply ? shippedBySo(rows, d.so) : null;
  const canClose = d.status === "In Transit" || d.status === "Draft";
  const canInvoice = (d.status === "Delivered" || d.status === "BAST Signed") && !d.invoice;

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-2xl"
      title={d.no}
      subtitle={
        <>
          <StatusBadge status={d.status} />
          <Badge tone={isSupply ? "blue" : "indigo"}>{d.type}</Badge>
          <span className="text-[12.5px] text-muted">{d.client.name}</span>
        </>
      }
      footer={
        <>
          <Button
            icon={Printer}
            className="mr-auto"
            onClick={() => toast({ title: `${isSupply ? "Surat jalan" : "BAST"} ${d.no} dicetak`, description: `Kop ${company.name}, rangkap 3.`, tone: "info" })}
          >
            Cetak {isSupply ? "surat jalan" : "BAST"}
          </Button>
          {canClose && (
            <Button variant="success" icon={CircleCheck} onClick={() => onDone(d)}>
              {isSupply ? "Tandai Delivered" : "Tandai BAST Signed"}
            </Button>
          )}
          {canInvoice && (
            <Button variant="primary" icon={FilePlus2} onClick={() => onInvoice(d)}>
              Buat Invoice
            </Button>
          )}
          {d.invoice && (
            <Link href="/sales/invoices" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-fg px-2.5 text-[13px] font-medium text-surface hover:opacity-90">
              {d.invoice === "Draft" ? "Buka draft invoice" : `Lihat ${d.invoice}`}
            </Link>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {d.note && (
          <Callout tone={d.status === "Void" ? "red" : "amber"} icon={d.status === "Void" ? Ban : ClipboardSignature}>
            {d.note}
          </Callout>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-line px-3.5 py-3 text-[13px] sm:grid-cols-3">
          <Meta label="SO Ref" value={<Mono>{d.so}</Mono>} />
          <Meta label={isSupply ? "Tanggal kirim" : "Tanggal BAST"} value={date(d.date)} />
          <Meta label="Nilai (excl. PPN)" value={<span className="font-medium tabular">{rp(d.value)}</span>} />
          <Meta label="Lingkup" value={d.soData.scope} className="col-span-2 sm:col-span-3" />
          <Meta label="Lokasi tujuan" value={d.location} className="col-span-2 sm:col-span-3" />
          {d.soData.shipper && <Meta label="Dikirim oleh" value={d.soData.shipper} className="col-span-2 sm:col-span-3" />}
          {d.invoice && <Meta label="Invoice" value={d.invoice === "Draft" ? "Draft dibuat" : <Mono>{d.invoice}</Mono>} />}
        </dl>

        {isSupply ? (
          <div>
            <h3 className="mb-2 text-[12.5px] font-semibold text-fg">Item dikirim</h3>
            <TableScroll className="rounded-lg border border-line" maxHeight="">
              <table className="w-full">
                <thead className="bg-surface-2">
                  <tr>
                    <th className={th}>Item</th>
                    <th className={cx(th, "text-right")}>Qty kirim</th>
                    <th className={cx(th, "text-right")}>Qty SO</th>
                    <th className={cx(th, "text-right")}>Sisa SO</th>
                    <th className={th}>Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {lineDetail(d).map((l) => (
                    <tr key={l.id} className="border-t border-line">
                      <td className={cx(td, "whitespace-normal")}>{l.item}</td>
                      <td className={cx(td, "text-right font-medium tabular")}>{decimal(l.qtyKirim, 0)}</td>
                      <td className={cx(td, "text-right text-muted tabular")}>{decimal(l.qty, 0)}</td>
                      <td className={cx(td, "text-right tabular")}>{decimal(l.qty - (shipped[l.id] ?? 0), 0)}</td>
                      <td className={cx(td, "text-muted")}>{l.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[12.5px] font-semibold text-fg">Opname progres</h3>
              <span className="text-[12px] text-subtle tabular">
                {d.prevProgress}% → <span className="font-semibold text-fg">{d.progress}%</span>
              </span>
            </div>
            <Progress value={d.progress} tone="indigo" size="md" className="mb-3" />
            <TableScroll className="rounded-lg border border-line" maxHeight="">
              <table className="w-full">
                <thead className="bg-surface-2">
                  <tr>
                    <th className={th}>Uraian pekerjaan</th>
                    <th className={cx(th, "text-right")}>Bobot</th>
                    <th className={cx(th, "text-right")}>s.d. lalu</th>
                    <th className={cx(th, "text-right")}>s.d. kini</th>
                    <th className={cx(th, "text-right")}>Periode ini</th>
                  </tr>
                </thead>
                <tbody>
                  {d.works.map((w) => (
                    <tr key={w.item} className="border-t border-line">
                      <td className={cx(td, "whitespace-normal")}>{w.item}</td>
                      <td className={cx(td, "text-right text-muted tabular")}>{decimal(w.bobot, 2)}%</td>
                      <td className={cx(td, "text-right tabular")}>{decimal(w.lalu, 2)}%</td>
                      <td className={cx(td, "text-right font-medium tabular")}>{decimal(w.kini, 2)}%</td>
                      <td className={cx(td, "text-right tabular", w.kini - w.lalu > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-subtle")}>
                        {w.kini - w.lalu > 0 ? `+${decimal(w.kini - w.lalu, 2)}%` : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {isSupply && (
            <div className="rounded-xl border border-line px-3.5 py-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-subtle uppercase">
                <Truck className="size-3.5" /> Armada
              </div>
              {v ? (
                <>
                  <div className="text-[13px] font-medium text-fg">
                    {v.plate} <span className="font-normal text-subtle">· {v.type}</span>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted">
                    Sopir {v.driver} · <span className="tabular">{v.phone}</span>
                  </div>
                  {d.status === "In Transit" && d.eta && <div className="mt-1 text-[12px] text-sky-700 tabular dark:text-sky-400">ETA {d.eta.slice(11)} · {date(d.eta.slice(0, 10))}</div>}
                </>
              ) : (
                <span className="text-[12.5px] text-subtle">–</span>
              )}
            </div>
          )}
          <div className={cx("rounded-xl border border-line px-3.5 py-3", !d.receiver && "border-dashed")}>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-subtle uppercase">
              <User className="size-3.5" /> {isSupply ? "Diterima oleh" : "Ditandatangani"}
            </div>
            {d.receiver ? (
              <>
                <div className="text-[13px] font-medium text-fg">{d.receiver.name}</div>
                <div className="mt-0.5 text-[12.5px] text-muted">{d.receiver.title}</div>
                <div className="mt-1 text-[12px] text-emerald-600 tabular dark:text-emerald-400">{date(d.receiver.at)} · tanda tangan digital</div>
              </>
            ) : (
              <div className="text-[12.5px] text-subtle">{d.status === "Void" ? "Dokumen dibatalkan" : `Menunggu ${signers[d.so].name} (${signers[d.so].title})`}</div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function Meta({ label, value, className }) {
  return (
    <div className={cx("min-w-0", className)}>
      <dt className="text-[11.5px] text-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg">{value}</dd>
    </div>
  );
}

/* ───────────────────────── New DO ───────────────────────── */

function NewDoModal({ rows, onClose, onCreate }) {
  const supplySOs = billingSOs
    .filter((s) => s.lines)
    .map((s) => {
      const shipped = shippedBySo(rows, s.no);
      const lines = s.lines.map((l) => ({ ...l, shipped: shipped[l.id] ?? 0, open: l.qty - (shipped[l.id] ?? 0) }));
      return { ...s, lines, outstanding: lines.some((l) => l.open > 0) };
    })
    .filter((s) => s.outstanding);

  const [soNo, setSoNo] = useState(supplySOs[0]?.no ?? "");
  const so = supplySOs.find((s) => s.no === soNo);
  const [qty, setQty] = useState({});
  const [vehicle, setVehicle] = useState(vehicles[0].plate);
  const [shipDate, setShipDate] = useState(TODAY);
  const [location, setLocation] = useState(so?.site ?? "");

  if (!so) {
    return (
      <Modal open onClose={onClose} title="New Delivery Order" footer={<Button onClick={onClose}>Tutup</Button>}>
        <EmptyState icon={Package} title="Tidak ada SO dengan sisa qty" description="Semua item supply sudah terkirim penuh." />
      </Modal>
    );
  }

  const errors = {};
  for (const l of so.lines) {
    const q = Number(qty[l.id] || 0);
    if (q < 0) errors[l.id] = "Tidak boleh negatif";
    else if (!Number.isInteger(q)) errors[l.id] = "Harus bilangan bulat";
    else if (q > l.open) errors[l.id] = `Melebihi sisa ${decimal(l.open, 0)} ${l.unit}`;
  }
  const filled = so.lines.filter((l) => Number(qty[l.id] || 0) > 0);
  const value = so.lines.reduce((s, l) => s + Number(qty[l.id] || 0) * l.price, 0);
  const valid = filled.length > 0 && Object.keys(errors).length === 0 && shipDate && location.trim();

  const pickSo = (no) => {
    setSoNo(no);
    setQty({});
    setLocation(supplySOs.find((s) => s.no === no)?.site ?? "");
  };

  const submit = () =>
    onCreate({
      type: "Supply",
      so: so.no,
      date: shipDate,
      location: location.trim(),
      lines: filled.map((l) => ({ id: l.id, qty: Number(qty[l.id]) })),
      value,
      vehicle,
      status: "In Transit",
      eta: `${shipDate} 17:00`,
      invoice: null,
    });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="New Delivery Order"
      description="Pilih SO supply yang masih punya sisa qty, isi qty kirim per item. DO dibuat berstatus In Transit."
      footer={
        <>
          <span className="mr-auto text-[12.5px] text-subtle">
            Nilai DO <span className="font-semibold text-fg tabular">{rp(value)}</span> excl. PPN
          </span>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" icon={Truck} disabled={!valid} onClick={submit}>
            Buat DO & kirim
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
          <Field label="Sales Order" hint={clients[so.client].name}>
            <Select value={soNo} onChange={(e) => pickSo(e.target.value)}>
              {supplySOs.map((s) => (
                <option key={s.no} value={s.no}>
                  {s.no} — {clients[s.client].short} · {s.scope}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal kirim">
            <Input type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)} />
          </Field>
        </div>

        <TableScroll className="rounded-lg border border-line" maxHeight="">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>Item</th>
                <th className={cx(th, "text-right")}>Qty SO</th>
                <th className={cx(th, "text-right")}>Terkirim</th>
                <th className={cx(th, "text-right")}>Sisa</th>
                <th className={cx(th, "text-right")}>Qty kirim</th>
                <th className={th}>Satuan</th>
              </tr>
            </thead>
            <tbody>
              {so.lines.map((l) => (
                <tr key={l.id} className="border-t border-line align-top">
                  <td className={cx(td, "whitespace-normal")}>
                    <div className="text-fg">{l.item}</div>
                    <div className="text-[11.5px] text-subtle tabular">
                      {rp(l.price)} / {l.unit}
                    </div>
                  </td>
                  <td className={cx(td, "text-right text-muted tabular")}>{decimal(l.qty, 0)}</td>
                  <td className={cx(td, "text-right text-muted tabular")}>{decimal(l.shipped, 0)}</td>
                  <td className={cx(td, "text-right font-medium tabular")}>{decimal(l.open, 0)}</td>
                  <td className={cx(td, "w-36 text-right")}>
                    <Input
                      type="number"
                      min={0}
                      max={l.open}
                      inputMode="numeric"
                      value={qty[l.id] ?? ""}
                      placeholder="0"
                      disabled={l.open === 0}
                      onChange={(e) => setQty((q) => ({ ...q, [l.id]: e.target.value }))}
                      className={cx("h-8 text-right tabular", errors[l.id] && "border-red-500/60")}
                      aria-label={`Qty kirim ${l.short}`}
                    />
                    {errors[l.id] ? (
                      <div className="mt-1 text-[11px] whitespace-nowrap text-red-600 dark:text-red-400">{errors[l.id]}</div>
                    ) : (
                      l.open > 0 && (
                        <button className="mt-1 text-[11px] text-subtle hover:text-fg" onClick={() => setQty((q) => ({ ...q, [l.id]: String(l.open) }))}>
                          kirim semua sisa
                        </button>
                      )
                    )}
                  </td>
                  <td className={cx(td, "text-muted")}>{l.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Armada & sopir">
            <Select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              {vehicles.map((v) => (
                <option key={v.plate} value={v.plate}>
                  {v.plate} — {v.type} · {v.driver}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lokasi tujuan">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        </div>

        {so.shipper && (
          <Callout tone="indigo" icon={Truck}>
            Barang dikirim langsung oleh {so.shipper}. Transaksi antar-afiliasi tercatat sebagai pembelian intercompany.
          </Callout>
        )}
      </div>
    </Modal>
  );
}
