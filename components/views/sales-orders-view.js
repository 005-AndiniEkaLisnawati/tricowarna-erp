"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Ban,
  Check,
  ClipboardCheck,
  Download,
  FileText,
  ReceiptText,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { salesById, salesOrders as seed, taxFromGrand } from "@/lib/data/sales";
import { projectByCode } from "@/lib/data/org";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  Drawer,
  EmptyState,
  Mono,
  PageHeader,
  Progress,
  Select,
  StatCard,
  StatusBadge,
  td,
  th,
  trHover,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { TableScroll } from "@/components/table-scroll";
import { cx, date, pct, rp, rpShort } from "@/lib/format";
import { BulkMenu, Checkbox, ItemsTable, ListToolbar, Meta, Pager, Section, useSelection } from "@/components/views/quotations-view";

const statusOptions = ["Awaiting Approval", "Approved", "Ready for DO", "Ready for Invoice", "Closed", "Void"];
const VOIDISH = ["Void", "Ditolak"];

export function SalesOrdersView() {
  const toast = useToast();
  const [rows, setRows] = useState(seed);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [openNo, setOpenNo] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!q || [r.no, r.quoteRef, r.client, r.scope, r.project ?? ""].some((s) => s.toLowerCase().includes(q))),
    );
  }, [rows, status, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, pages);
  const visible = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);
  const sel = useSelection(visible.map((r) => r.no));

  const count = (s) => rows.filter((r) => r.status === s).length;
  const live = rows.filter((r) => !VOIDISH.includes(r.status));
  const omset = live.reduce((s, r) => s + r.grandTotal, 0);
  const invoiced = live.reduce((s, r) => s + (r.grandTotal * r.invoicedPct) / 100, 0);

  const setStatusFor = (nos, next) => setRows((rs) => rs.map((r) => (nos.includes(r.no) ? { ...r, status: next } : r)));

  const approve = (nos) => {
    const ok = rows.filter((r) => nos.includes(r.no) && r.status === "Awaiting Approval");
    setStatusFor(ok.map((r) => r.no), "Approved");
    toast({
      title: ok.length === 1 ? `${ok[0].no} disetujui` : `${ok.length} SO disetujui`,
      description: ok.length
        ? `Kontrak ${rpShort(ok.reduce((s, r) => s + r.grandTotal, 0))} masuk ke omset & jadwal penagihan dibuat.`
        : "Tidak ada SO berstatus Awaiting Approval di pilihan.",
      tone: ok.length ? "success" : "warning",
    });
  };

  const bulkVoid = () => {
    const ok = rows.filter((r) => sel.selected.has(r.no) && r.status === "Awaiting Approval");
    setStatusFor(ok.map((r) => r.no), "Void");
    sel.clear();
    toast({
      title: `${ok.length} SO di-void`,
      description: ok.length ? "Quotation terkait dikembalikan ke status Waiting Customer." : "Hanya SO berstatus Awaiting Approval yang bisa di-void.",
      tone: ok.length ? "info" : "warning",
    });
  };

  const createDO = (r) =>
    toast({
      title: `Draft Delivery Order untuk ${r.no}`,
      description: r.project ? `Berita acara progres ${projectByCode[r.project]?.short} disiapkan di menu Delivery Order.` : `Surat jalan ${r.client} disiapkan di menu Delivery Order.`,
    });

  const createInvoice = (r) => {
    const next = r.billing.find((b) => b.state !== "Ditagih");
    toast({
      title: `Draft invoice untuk ${r.no}`,
      description: next
        ? `${next.label} ${next.pct}% · ${rp((r.grandTotal * next.pct) / 100)} (incl. PPN) — faktur pajak dibuat otomatis.`
        : "Seluruh termin sudah ditagih.",
      tone: next ? "success" : "info",
    });
  };

  const selected = rows.find((r) => r.no === openNo) ?? null;

  return (
    <div>
      <PageHeader
        icon={ClipboardCheck}
        title="Sales Orders"
        description="Kontrak & pesanan yang sudah disepakati customer — dasar omset, pengiriman, dan penagihan termin."
      />

      <h2 className="mb-2 text-[12.5px] font-semibold text-muted">Sales Order Statistic</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total SO" value={rows.length} hint="Mei – Okt 2026" />
        <StatCard label="Awaiting Approval" value={count("Awaiting Approval")} hint={rpShort(rows.filter((r) => r.status === "Awaiting Approval").reduce((s, r) => s + r.grandTotal, 0))} delta="●" deltaTone="amber" />
        <StatCard label="Approved" value={count("Approved")} hint="sedang berjalan" />
        <StatCard label="Ready for DO" value={count("Ready for DO")} hint="menunggu pengiriman" />
        <StatCard label="Void / Rejected" value={rows.filter((r) => VOIDISH.includes(r.status)).length} hint="tidak dihitung omset" />
        <StatCard label="Nilai kontrak (omset)" value={rpShort(omset)} hint={`${pct((invoiced / omset) * 100, 0)} sudah ditagih`} />
      </div>

      <div className="mt-5 mb-3 flex flex-wrap items-center gap-2">
        <Button
          size="md"
          variant="primary"
          icon={FileText}
          onClick={() => toast({ title: "Buat SO dari quotation", description: "Pilih quotation berstatus Approved Internal di menu Quotations lalu klik Convert to SO.", tone: "info" })}
        >
          New Sales Order
        </Button>
        <BulkMenu
          count={sel.count}
          items={[
            { label: "Approve", icon: Check, onClick: () => { approve([...sel.selected]); sel.clear(); } },
            {
              label: "Export terpilih",
              icon: Download,
              onClick: () => toast({ title: "Export Excel disiapkan", description: `${sel.count} SO terpilih.`, tone: "info" }),
            },
            { label: "Void", icon: Ban, onClick: bulkVoid, danger: true },
          ]}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-auto min-w-[170px]"
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
          onExport={() => toast({ title: "Export Excel disiapkan", description: `${filtered.length} SO sesuai filter aktif.`, tone: "info" })}
          onRefresh={() => toast({ title: "Data diperbarui", description: "Status DO & invoice disinkronkan · baru saja.", tone: "info" })}
          query={query}
          onQuery={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Cari no. SO, quotation, client, proyek…"
        />
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={cx(th, "w-10 pr-0")}>
                  <Checkbox checked={sel.all} indeterminate={sel.some} onChange={sel.toggleAll} label="Pilih semua" />
                </th>
                <th className={th}>SO Number</th>
                <th className={th}>Quotation Ref</th>
                <th className={th}>Client</th>
                <th className={th}>Project</th>
                <th className={th}>Date</th>
                <th className={th}>Status</th>
                <th className={cx(th, "text-right")}>Grand Total</th>
                <th className={th}>Ditagih</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.no} onClick={() => setOpenNo(r.no)} className={cx(trHover, "cursor-pointer", (sel.has(r.no) || openNo === r.no) && "bg-surface-2")}>
                  <td className={cx(td, "pr-0")}>
                    <Checkbox checked={sel.has(r.no)} onChange={() => sel.toggle(r.no)} label={`Pilih ${r.no}`} />
                  </td>
                  <td className={cx(td, "font-medium")}>{r.no}</td>
                  <td className={td}>
                    <Mono>{r.quoteRef}</Mono>
                  </td>
                  <td className={cx(td, "max-w-[300px]")}>
                    <div className="truncate">{r.client}</div>
                    <div className="truncate text-[12px] text-subtle">{r.scope}</div>
                  </td>
                  <td className={td}>
                    <ProjectCell code={r.project} />
                  </td>
                  <td className={cx(td, "text-muted tabular")}>{date(r.date)}</td>
                  <td className={td}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className={cx(td, "text-right font-medium tabular")}>{rp(r.grandTotal)}</td>
                  <td className={td}>
                    <BillingBar value={r.invoicedPct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState icon={ClipboardCheck} title="Tidak ada Sales Order" description="Ubah filter status atau kata kunci pencarian." />}
        </TableScroll>
        <Pager
          page={curPage}
          pageSize={pageSize}
          total={filtered.length}
          onPage={setPage}
          noun="SO"
          footnote={sel.count > 0 ? `${sel.count} dipilih` : "Grand total termasuk PPN 12% × DPP 11/12"}
        />
      </Card>

      {selected && (
        <SoDrawer
          key={selected.no}
          so={selected}
          onClose={() => setOpenNo(null)}
          onApprove={() => approve([selected.no])}
          onDO={() => createDO(selected)}
          onInvoice={() => createInvoice(selected)}
        />
      )}
    </div>
  );
}

function ProjectCell({ code }) {
  if (!code) return <Badge>Supply</Badge>;
  return (
    <>
      <Mono>{code}</Mono>
      <div className="text-[12px] text-subtle">{projectByCode[code]?.short}</div>
    </>
  );
}

function BillingBar({ value }) {
  const tone = value >= 100 ? "green" : value > 0 ? "indigo" : "fg";
  return (
    <div className="w-[120px]">
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="text-subtle">{value >= 100 ? "Lunas tagih" : value > 0 ? "Sebagian" : "Belum"}</span>
        <span className="font-medium text-fg tabular">{pct(value, 0)}</span>
      </div>
      <Progress value={value} tone={tone} className="mt-1" />
    </div>
  );
}

/* ───────────────────────── Drawer ───────────────────────── */

function SoDrawer({ so, onClose, onApprove, onDO, onInvoice }) {
  const project = so.project ? projectByCode[so.project] : null;
  const sp = salesById[so.salesperson];
  const tax = taxFromGrand(so.grandTotal);
  const t = so.terms;
  const awaiting = so.status === "Awaiting Approval";
  const canOperate = ["Approved", "Ready for DO", "Ready for Invoice"].includes(so.status);

  const hasDelivery = so.invoicedPct > 0 || so.status === "Closed";
  const trail = [
    { label: "Quotation", doc: so.quoteRef, state: "done", icon: FileText, href: "/sales/quotations" },
    { label: "Sales Order", doc: so.no, state: awaiting ? "current" : "done", icon: ClipboardCheck },
    {
      label: so.project ? "BAST / Progres" : "Delivery Order",
      doc: hasDelivery ? (so.status === "Closed" ? "Selesai" : "Sebagian") : so.status === "Ready for DO" ? "Siap dibuat" : "Belum",
      state: so.status === "Closed" ? "done" : hasDelivery ? "partial" : so.status === "Ready for DO" ? "current" : "todo",
      icon: Truck,
      href: "/sales/delivery",
    },
    {
      label: "Invoice",
      doc: so.invoicedPct > 0 ? `${pct(so.invoicedPct, 0)} ditagih` : "Belum",
      state: so.invoicedPct >= 100 ? "done" : so.invoicedPct > 0 ? "partial" : "todo",
      icon: ReceiptText,
      href: "/sales/invoices",
    },
    {
      label: "Payment",
      doc: so.status === "Closed" ? "Lunas" : so.invoicedPct > 0 ? "Lihat penerimaan" : "Belum",
      state: so.status === "Closed" ? "done" : so.invoicedPct > 0 ? "partial" : "todo",
      icon: Wallet,
      href: "/sales/payments",
    },
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-2xl"
      title={`${so.no} · ${so.client}`}
      subtitle={
        <>
          <StatusBadge status={so.status} />
          <Mono>{so.quoteRef}</Mono>
          <span className="text-[12px] text-subtle">dibuat {date(so.date)}</span>
        </>
      }
      footer={
        awaiting ? (
          <>
            <span className="mr-auto hidden text-[12px] text-subtle sm:block">
              Nilai &gt; Rp5 M · wajib approval <span className="font-medium text-fg">Direktur Utama</span>
            </span>
            <Button variant="success" icon={Check} onClick={onApprove}>
              Approve SO
            </Button>
          </>
        ) : canOperate ? (
          <>
            <Button icon={Truck} onClick={onDO}>
              Buat Delivery Order
            </Button>
            <Button variant="primary" icon={ReceiptText} onClick={onInvoice} disabled={so.invoicedPct >= 100}>
              Buat Invoice
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Tutup</Button>
        )
      }
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3">
          <Meta label="Penjual">{so.seller}</Meta>
          <Meta label="Client">{so.client}</Meta>
          <Meta label="Sales">
            <span className="flex items-center gap-1.5">
              <Avatar initials={sp?.initials} tone={sp?.tone} className="size-5 text-[9px]" />
              {sp?.name}
            </span>
          </Meta>
          <Meta label="Lingkup">
            <span className="text-muted">{so.scope}</span>
          </Meta>
          <Meta label="Proyek">
            {project ? (
              <>
                <Mono>{project.code}</Mono>
                <span className="block text-[12px] text-subtle">
                  {project.short} · {project.location}
                </span>
              </>
            ) : (
              <Badge>Supply · non-proyek</Badge>
            )}
          </Meta>
          <Meta label="Grand total">
            <span className="font-semibold tabular">{rp(so.grandTotal)}</span>
          </Meta>
        </dl>

        {awaiting && (
          <Callout tone="amber" icon={ShieldCheck}>
            SO adendum menunggu approval Direktur. Setelah disetujui, nilai kontrak proyek {project?.short ?? ""} diperbarui dan jadwal penagihan aktif.
          </Callout>
        )}

        <Section title="Syarat pembayaran">
          <div className="grid grid-cols-2 divide-line rounded-lg border border-line sm:grid-cols-4 sm:divide-x">
            {[
              ["Uang muka", t.dp ? `${t.dp}%` : "Tidak ada"],
              ["Termin", t.termin],
              ["Retensi", t.retensi ? `${t.retensi}% · ${t.retensiDays} hari` : "Tidak ada"],
              ["Jatuh tempo", t.top],
            ].map(([k, v]) => (
              <div key={k} className="px-3.5 py-2.5">
                <p className="text-[11.5px] text-subtle">{k}</p>
                <p className="mt-0.5 text-[12.5px] font-medium text-fg">{v}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Rincian item" aside={`${so.items.length} item`}>
          <ItemsTable items={so.items} tax={tax} />
        </Section>

        <Section title="Jadwal penagihan" aside={<span className="text-[12px] text-subtle tabular">{pct(so.invoicedPct, 0)} ditagih</span>}>
          <Progress value={so.invoicedPct} tone={so.invoicedPct >= 100 ? "green" : "indigo"} className="mb-2.5" />
          <ul className="divide-y divide-line rounded-lg border border-line">
            {so.billing.map((b) => (
              <li key={b.label} className="flex items-center gap-3 px-3 py-2">
                <span className="w-10 shrink-0 text-right text-[12.5px] font-medium text-fg tabular">{b.pct}%</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-fg">{b.label}</p>
                  <p className="truncate text-[11.5px] text-subtle">{b.basis}</p>
                </div>
                <span className="text-[12.5px] text-fg tabular">{rp((so.grandTotal * b.pct) / 100)}</span>
                <Badge tone={b.state === "Ditagih" ? "green" : "neutral"} dot>
                  {b.state}
                </Badge>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Alur dokumen">
          <ol className="grid gap-2 sm:grid-cols-5">
            {trail.map((s, i) => {
              const Icon = s.icon;
              const body = (
                <>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cx(
                        "flex size-6 items-center justify-center rounded-full ring-1",
                        s.state === "done" && "bg-emerald-500/10 text-emerald-700 ring-emerald-600/25 dark:text-emerald-400",
                        s.state === "partial" && "bg-indigo-500/10 text-indigo-700 ring-indigo-600/25 dark:text-indigo-300",
                        s.state === "current" && "bg-amber-500/10 text-amber-700 ring-amber-600/25 dark:text-amber-400",
                        s.state === "todo" && "bg-surface-3 text-subtle ring-line",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="text-[10.5px] text-subtle tabular">{i + 1}</span>
                  </div>
                  <p className="mt-2 text-[12.5px] font-medium text-fg">{s.label}</p>
                  <p className="truncate text-[11.5px] text-subtle">{s.doc}</p>
                </>
              );
              return (
                <li key={s.label}>
                  {s.href ? (
                    <Link
                      href={s.href}
                      className="group relative block h-full rounded-lg border border-line bg-surface p-2.5 transition-colors hover:border-line-strong hover:bg-surface-2"
                    >
                      {body}
                      <ArrowUpRight className="absolute right-2 bottom-2 size-3 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ) : (
                    <div className="h-full rounded-lg border border-line-strong bg-surface-2 p-2.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </Section>
      </div>
    </Drawer>
  );
}
