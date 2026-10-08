"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, Clock3, Coins, Gauge, GitMerge, Landmark, Plus, Wallet } from "lucide-react";
import {
  arCoa,
  banks,
  calcBill,
  clientList,
  clients,
  monthlyCashIn,
  receipts as seed,
  salesInvoices,
} from "@/lib/data/sales-billing";
import { TODAY } from "@/lib/data/org";
import {
  AiBadge,
  Badge,
  Button,
  Callout,
  Card,
  CardHeader,
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
import { cx, date, daysBetween, decimal, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";
import { Checkbox, JournalTable, ListToolbar, Pager, SectionLabel } from "@/components/views/sales-invoice-view";

const postedInvoices = salesInvoices.filter((i) => !i.draft).map((i) => ({ ...i, ...calcBill(i.bill) }));
const invByNo = Object.fromEntries(postedInvoices.map((i) => [i.no, i]));

/** Withholdings that travel with a cash allocation, pro rata to the invoice's neto. */
function cutsFor(invNo, cash) {
  const inv = invByNo[invNo];
  const share = inv.neto ? cash / inv.neto : 0;
  const pph = Math.round(inv.pph * share);
  const ppn = Math.round(inv.ppnDipungut * share);
  const retensi = Math.round(inv.retensi * share);
  return { pph, ppn, retensi, clears: cash + pph + ppn };
}

function receiptJournal(bankId, allocations, unapplied = 0) {
  const bank = banks[bankId];
  const cuts = allocations.map((a) => cutsFor(a.inv, a.amount));
  const cash = allocations.reduce((s, a) => s + a.amount, 0) + unapplied;
  const pph = cuts.reduce((s, c) => s + c.pph, 0);
  const ppn = cuts.reduce((s, c) => s + c.ppn, 0);
  const clears = cuts.reduce((s, c) => s + c.clears, 0);
  return [
    { coa: bank.coa, name: bank.coaName, debit: cash },
    { ...arCoa.umPph, debit: pph },
    { ...arCoa.ppnDipungut, debit: ppn },
    { ...arCoa.piutang, credit: clears },
    { ...arCoa.umPelanggan, credit: unapplied },
  ];
}

function nextRcvNo(rows) {
  const seq = rows
    .filter((r) => r.no.startsWith("RCV-202610-"))
    .map((r) => Number(r.no.slice(-4)))
    .reduce((a, b) => Math.max(a, b), 0);
  return `RCV-202610-${String(seq + 1).padStart(4, "0")}`;
}

const statusFilters = ["Semua", "Reconciled", "Pending Match"];

export function PaymentsView() {
  const toast = useToast();
  const [rows, setRows] = useState(seed);
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [matching, setMatching] = useState(null);
  const [recording, setRecording] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  // Open AR per invoice, driven by the receipts state on this page.
  const openInvoices = useMemo(() => {
    const paid = {};
    for (const r of rows) if (r.status === "Reconciled") for (const a of r.applied) paid[a.inv] = (paid[a.inv] ?? 0) + a.amount;
    return postedInvoices
      .map((i) => ({ ...i, outstanding: Math.max(0, i.neto - (paid[i.no] ?? 0)), days: daysBetween(TODAY, i.due) }))
      .filter((i) => i.outstanding >= 1);
  }, [rows]);

  const list = useMemo(() => [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no)), [rows]);
  const pending = list.filter((r) => r.status === "Pending Match");
  const receivedOct = list.filter((r) => r.status === "Reconciled" && r.date >= "2026-10-01");
  const unapplied = list.filter((r) => r.status === "Reconciled").reduce((s, r) => s + (r.unapplied ?? 0), 0);
  const arOpen = openInvoices.reduce((s, i) => s + i.outstanding, 0);
  const billed90 = postedInvoices.filter((i) => daysBetween(i.date, TODAY) <= 90).reduce((s, i) => s + i.neto, 0);
  const dso = billed90 ? Math.round((arOpen / billed90) * 90) : 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(
      (r) =>
        (filter === "Semua" || r.status === filter) &&
        (!q ||
          r.no.toLowerCase().includes(q) ||
          clients[r.client].name.toLowerCase().includes(q) ||
          r.mutation.toLowerCase().includes(q) ||
          r.applied.some((a) => a.inv.toLowerCase().includes(q)) ||
          (r.ai?.inv ?? "").toLowerCase().includes(q)),
    );
  }, [list, filter, query]);

  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const curPage = Math.min(page, pages);
  const paged = visible.slice((curPage - 1) * pageSize, curPage * pageSize);
  const allChecked = paged.length > 0 && paged.every((r) => selected.has(r.no));

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
      if (allChecked) paged.forEach((r) => n.delete(r.no));
      else paged.forEach((r) => n.add(r.no));
      return n;
    });

  const applyMatch = (r) => {
    const inv = openInvoices.find((i) => i.no === r.ai.inv);
    const amount = Math.min(r.amount, inv?.outstanding ?? r.amount);
    const rest = r.amount - amount;
    setRows((rs) =>
      rs.map((x) =>
        x.no === r.no ? { ...x, status: "Reconciled", applied: [{ inv: r.ai.inv, amount }], unapplied: rest || undefined, matchedBy: "AI" } : x,
      ),
    );
    setMatching(null);
    const cuts = cutsFor(r.ai.inv, amount);
    toast({
      title: `${r.no} di-match ke ${r.ai.inv}`,
      description: `${rp(r.amount)} masuk ${banks[r.bank].label}. Piutang berkurang ${rp(cuts.clears)}${cuts.pph ? ` · bukti potong PPh 4(2) ${rp(cuts.pph)} ditunggu dari klien` : ""}.`,
    });
  };

  const record = (rc) => {
    const no = nextRcvNo(rows);
    setRows((rs) => [...rs, { ...rc, no }]);
    setRecording(false);
    toast({
      title: `${no} dicatat · ${rp(rc.amount)}`,
      description: `${clients[rc.client].short} → ${rc.applied.length} invoice${rc.unapplied ? ` · ${rp(rc.unapplied)} sebagai uang muka pelanggan` : ""}.`,
    });
  };

  const maxBar = Math.max(...monthlyCashIn.map((m) => m.value));

  return (
    <div>
      <PageHeader
        icon={Landmark}
        title="Payments"
        description="Uang masuk dari klien — rekonsiliasi mutasi bank ke invoice, termasuk potongan PPh 4(2) dan PPN yang dipungut bendahara."
      />

      <SectionLabel>Payments Statistic</SectionLabel>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Diterima bulan ini"
          icon={ArrowDownLeft}
          value={<span className="tabular">{rpShort(receivedOct.reduce((s, r) => s + r.amount, 0))}</span>}
          hint={`${receivedOct.length} penerimaan · Oktober 2026`}
        />
        <StatCard
          label="Pending match"
          icon={Clock3}
          value={<span className="tabular text-amber-600 dark:text-amber-400">{rpShort(pending.reduce((s, r) => s + r.amount, 0))}</span>}
          delta={`${pending.length} mutasi`}
          deltaTone="amber"
          hint="belum dicocokkan ke invoice"
        />
        <StatCard label="Unapplied cash" icon={Coins} value={<span className="tabular">{rpShort(unapplied)}</span>} hint="uang muka pelanggan, belum ada invoice" />
        <StatCard
          label="DSO"
          icon={Gauge}
          value={
            <span className="tabular">
              {dso} <span className="text-[14px] font-medium text-subtle">hari</span>
            </span>
          }
          hint={`piutang ${rpShort(arOpen)} / penagihan 90 hari`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="md" variant="primary" icon={Plus} onClick={() => setRecording(true)}>
          Record Payment
        </Button>
        <Button
          size="md"
          icon={GitMerge}
          disabled={pending.length === 0}
          onClick={() => {
            const first = pending.find((r) => r.ai);
            if (first) setMatching(first.no);
          }}
        >
          Review pending match ({pending.length})
        </Button>
        <Button
          size="md"
          icon={Landmark}
          onClick={() => toast({ title: "Mutasi bank ditarik", description: "BCA ··· 1234 & Mandiri ··· 5678 tersinkron s.d. 08:15. Tidak ada mutasi kredit baru.", tone: "info" })}
        >
          Tarik mutasi bank
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="Mutasi bank menunggu match" description="Disarankan AI dari nominal, nama pengirim dan berita transfer." icon={GitMerge} />
          {pending.length === 0 ? (
            <p className="px-4 pb-4 text-[13px] text-subtle">Semua mutasi kredit sudah direkonsiliasi.</p>
          ) : (
            <div className="space-y-2 px-4 pb-4">
              {pending.map((r) => (
                <div key={r.no} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[13px]">
                      <span className="font-semibold text-fg tabular">{rp(r.amount)}</span>
                      <span className="text-subtle">
                        {banks[r.bank].label} · {date(r.date)}
                      </span>
                    </div>
                    <Mono className="mt-0.5 block truncate text-[11px]">{r.mutation}</Mono>
                    {r.ai && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                        <AiBadge label="Cocok" confidence={r.ai.confidence} />
                        <span>
                          → <span className="font-medium text-fg">{r.ai.inv}</span> · {clients[invByNo[r.ai.inv].client.id].short}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button variant="primary" icon={GitMerge} onClick={() => setMatching(r.no)}>
                    Match
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Cash-in bulanan 2026" description={`Jan–Sep · total ${rpShort(monthlyCashIn.reduce((s, m) => s + m.value, 0))}`} />
          <div className="flex h-36 items-end justify-between gap-1 px-4 pb-1">
            {monthlyCashIn.map((m) => (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end" title={`${m.month} 2026 · ${rp(m.value)}`}>
                <div className="w-full max-w-[24px] rounded-t-[4px] bg-[var(--series-1)]" style={{ height: `${(m.value / maxBar) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-1 border-t border-line px-4 pt-1.5 pb-3">
            {monthlyCashIn.map((m) => (
              <span key={m.month} className="flex-1 text-center text-[10.5px] text-subtle">
                {m.month}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <ListToolbar
          pageSize={pageSize}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          onExport={() => toast({ title: `${visible.length} penerimaan diekspor`, description: "Receipt, alokasi invoice dan potongan (.xlsx).", tone: "info" })}
          onRefresh={() => toast({ title: "Data diperbarui", description: "Mutasi bank terakhir 08:15.", tone: "info" })}
          query={query}
          onQuery={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Cari receipt, klien, invoice, berita…"
        >
          <Segmented
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            items={statusFilters.map((s) => ({ value: s, label: s, count: s === "Semua" ? list.length : list.filter((r) => r.status === s).length }))}
          />
        </ListToolbar>
        <TableScroll>
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                <th className={cx(th, "w-9 pr-0")}>
                  <Checkbox checked={allChecked} disabled={paged.length === 0} onChange={toggleAll} label="Pilih semua" />
                </th>
                <th className={th}>Receipt No</th>
                <th className={th}>Tanggal</th>
                <th className={th}>Dari</th>
                <th className={th}>Bank</th>
                <th className={cx(th, "text-right")}>Nominal diterima</th>
                <th className={th}>Applied to</th>
                <th className={cx(th, "text-right")}>Potongan</th>
                <th className={th}>Status</th>
                <th className={th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => {
                const checked = selected.has(r.no);
                const cuts = r.applied.map((a) => cutsFor(a.inv, a.amount));
                const pph = cuts.reduce((s, c) => s + c.pph, 0);
                const ppn = cuts.reduce((s, c) => s + c.ppn, 0);
                const ret = cuts.reduce((s, c) => s + c.retensi, 0);
                return (
                  <tr
                    key={r.no}
                    onClick={() => toggle(r.no)}
                    className={cx(trHover, "cursor-pointer", checked && "bg-indigo-500/[0.05] hover:bg-indigo-500/[0.08]", r.status === "Pending Match" && !checked && "bg-amber-500/[0.03]")}
                  >
                    <td className={cx(td, "pr-0")} onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked} onChange={() => toggle(r.no)} label={`Pilih ${r.no}`} />
                    </td>
                    <td className={cx(td, "font-medium text-fg")}>{r.no}</td>
                    <td className={cx(td, "tabular")}>{date(r.date)}</td>
                    <td className={cx(td, "max-w-[280px]")}>
                      <div className="flex items-center gap-1.5 text-fg">
                        {clients[r.client].short}
                        {clients[r.client].gov && <Badge tone="violet">Pemerintah</Badge>}
                      </div>
                      <Mono className="block truncate text-[11px] text-subtle" title={r.mutation}>
                        {r.mutation}
                      </Mono>
                    </td>
                    <td className={cx(td, "text-muted")}>{banks[r.bank].label}</td>
                    <td className={cx(td, "text-right font-semibold tabular")}>{rp(r.amount)}</td>
                    <td className={td}>
                      {r.applied.length > 0 &&
                        r.applied.map((a) => (
                          <div key={a.inv} className="flex items-center gap-1.5">
                            <Mono className="text-[11.5px] text-fg">{a.inv}</Mono>
                            {r.applied.length > 1 && <span className="text-[11.5px] text-subtle tabular">{rpShort(a.amount)}</span>}
                            {r.matchedBy === "AI" && <Badge tone="green">AI match</Badge>}
                          </div>
                        ))}
                      {r.unapplied > 0 && <div className="text-[12px] text-amber-700 dark:text-amber-400">Unapplied {rpShort(r.unapplied)}</div>}
                      {r.note && r.applied.length === 0 && <div className="text-[11.5px] text-subtle">{r.note}</div>}
                      {r.status === "Pending Match" && r.ai && (
                        <div className="flex items-center gap-1.5">
                          <AiBadge label="Cocok" confidence={r.ai.confidence} />
                          <Mono className="text-[11.5px]">{r.ai.inv}</Mono>
                        </div>
                      )}
                    </td>
                    <td className={cx(td, "text-right tabular")}>
                      {pph + ppn > 0 ? (
                        <>
                          <div>({rp(pph + ppn)})</div>
                          <div className="text-[11.5px] text-subtle">
                            {pph > 0 && "PPh 4(2)"}
                            {pph > 0 && ppn > 0 && " + "}
                            {ppn > 0 && "PPN dipungut"}
                          </div>
                          {ret > 0 && <div className="text-[11.5px] text-subtle">retensi ditahan {rpShort(ret)}</div>}
                        </>
                      ) : (
                        <span className="text-subtle">–</span>
                      )}
                    </td>
                    <td className={td}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={td} onClick={(e) => e.stopPropagation()}>
                      {r.status === "Pending Match" ? (
                        <Button size="xs" variant="primary" icon={GitMerge} onClick={() => setMatching(r.no)}>
                          Match
                        </Button>
                      ) : (
                        <span className="text-[12px] text-subtle">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState icon={Wallet} title="Tidak ada penerimaan" description="Ubah filter status atau kata kunci." />}
        </TableScroll>
        <Pager page={curPage} pageSize={pageSize} total={visible.length} onPage={setPage}>
          Piutang terbuka <span className="font-medium text-fg tabular">{rp(arOpen)}</span> di {openInvoices.length} invoice
        </Pager>
      </Card>

      {matching && <MatchModal r={rows.find((x) => x.no === matching)} openInvoices={openInvoices} onClose={() => setMatching(null)} onConfirm={applyMatch} />}
      {recording && <RecordModal openInvoices={openInvoices} onClose={() => setRecording(false)} onConfirm={record} />}
    </div>
  );
}

/* ───────────────────────── Match ───────────────────────── */

function MatchModal({ r, openInvoices, onClose, onConfirm }) {
  const toast = useToast();
  const inv = openInvoices.find((i) => i.no === r.ai?.inv);
  if (!inv) return null;
  const amount = Math.min(r.amount, inv.outstanding);
  const rest = r.amount - amount;
  const exact = Math.abs(r.amount - inv.outstanding) < 1;
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Match ${r.no} → ${inv.no}`}
      description={`${clients[r.client].name} · ${banks[r.bank].label} · ${date(r.date)}`}
      footer={
        <>
          <Button
            className="mr-auto"
            variant="ghost"
            onClick={() => {
              toast({ title: "Saran ditolak", description: "Mutasi tetap Pending Match — alokasikan manual lewat Record Payment.", tone: "warning" });
              onClose();
            }}
          >
            Bukan invoice ini
          </Button>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" icon={GitMerge} onClick={() => onConfirm(r)}>
            Match & reconcile
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Mono className="block rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px]">{r.mutation}</Mono>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Fig label="Mutasi masuk" value={rp(r.amount)} />
          <Fig label={`Sisa ${inv.no}`} value={rp(inv.outstanding)} hint={`${inv.billable.label} · jatuh tempo ${date(inv.due)}`} />
          <Fig label="Selisih" value={exact ? "Rp0" : rp(r.amount - inv.outstanding)} tone={exact ? "green" : "amber"} />
        </div>
        <Callout tone="green">
          <span className="mr-1.5 inline-block align-middle">
            <AiBadge label="Cocok" confidence={r.ai.confidence} />
          </span>
          {r.ai.reason}
        </Callout>
        <JournalTable title="Jurnal penerimaan (preview)" dateIso={r.date} rows={receiptJournal(r.bank, [{ inv: inv.no, amount }], rest)} />
      </div>
    </Modal>
  );
}

function Fig({ label, value, hint, tone }) {
  return (
    <div className="rounded-xl border border-line px-3.5 py-2.5">
      <div className="text-[11.5px] text-subtle">{label}</div>
      <div className={cx("mt-0.5 text-[15px] font-semibold tabular", tone === "green" ? "text-emerald-600 dark:text-emerald-400" : tone === "amber" ? "text-amber-600 dark:text-amber-400" : "text-fg")}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11.5px] text-subtle">{hint}</div>}
    </div>
  );
}

/* ───────────────────────── Record payment ───────────────────────── */

/** Spread cash over invoices in order until it runs out. */
function allocate(amount, invoices) {
  const out = [];
  let left = amount;
  for (const i of invoices) {
    const a = Math.min(left, i.outstanding);
    if (a > 0) out.push({ inv: i.no, amount: a });
    left -= a;
  }
  return out;
}

function RecordModal({ openInvoices, onClose, onConfirm }) {
  const withOpen = clientList.filter((c) => openInvoices.some((i) => i.client.id === c.id));
  const [clientId, setClientId] = useState(withOpen[0]?.id ?? clientList[0].id);
  const [bank, setBank] = useState("BCA");
  const [payDate, setPayDate] = useState(TODAY);
  const [amountStr, setAmountStr] = useState("");
  const [picked, setPicked] = useState(() => new Set());

  const invs = openInvoices.filter((i) => i.client.id === clientId).sort((a, b) => a.due.localeCompare(b.due));
  const amount = Math.max(0, Math.round(Number(amountStr.replace(/\D/g, "")) || 0));

  // Oldest due first.
  const alloc = allocate(
    amount,
    invs.filter((i) => picked.has(i.no)),
  );
  const remaining = amount - alloc.reduce((s, a) => s + a.amount, 0);
  const pickedTotal = invs.filter((i) => picked.has(i.no)).reduce((s, i) => s + i.outstanding, 0);

  const pickClient = (id) => {
    setClientId(id);
    setPicked(new Set());
    setAmountStr("");
  };
  const togglePick = (no) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(no)) n.delete(no);
      else n.add(no);
      return n;
    });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Record Payment"
      description="Catat uang masuk dan alokasikan ke invoice terbuka (jatuh tempo terlama lebih dulu). Sisa dicatat sebagai uang muka pelanggan."
      footer={
        <>
          <span className="mr-auto text-[12.5px] text-subtle">
            Teralokasi <span className="font-semibold text-fg tabular">{rp(amount - remaining)}</span> · sisa{" "}
            <span className={cx("tabular", remaining > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-fg")}>{rp(remaining)}</span>
          </span>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={Wallet}
            disabled={amount <= 0 || !payDate}
            onClick={() =>
              onConfirm({
                date: payDate,
                client: clientId,
                bank,
                mutation: `TRSF CR ${payDate.slice(8, 10)}${payDate.slice(5, 7)} ${clients[clientId].payer.toUpperCase()}`,
                amount,
                applied: alloc,
                unapplied: remaining || undefined,
                note: remaining && !alloc.length ? "Uang muka pelanggan" : undefined,
                status: "Reconciled",
              })
            }
          >
            Simpan penerimaan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Klien">
            <Select value={clientId} onChange={(e) => pickClient(e.target.value)}>
              {clientList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rekening tujuan">
            <Select value={bank} onChange={(e) => setBank(e.target.value)}>
              {Object.values(banks).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} — {b.coaName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal terima">
            <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </Field>
          <Field
            label="Nominal diterima (Rp)"
            aside={
              pickedTotal > 0 && (
                <button className="text-[11.5px] text-subtle hover:text-fg" onClick={() => setAmountStr(String(pickedTotal))}>
                  isi = sisa terpilih
                </button>
              )
            }
          >
            <Input
              inputMode="numeric"
              value={amount ? decimal(amount, 0) : amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0"
              className="text-right tabular"
            />
          </Field>
        </div>

        <TableScroll className="rounded-lg border border-line" maxHeight="">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={cx(th, "w-9 pr-0")}>Pilih</th>
                <th className={th}>Invoice</th>
                <th className={th}>Termin</th>
                <th className={th}>Jatuh tempo</th>
                <th className={cx(th, "text-right")}>Sisa neto</th>
                <th className={cx(th, "text-right")}>Alokasi</th>
              </tr>
            </thead>
            <tbody>
              {invs.map((i) => {
                const a = alloc.find((x) => x.inv === i.no)?.amount ?? 0;
                return (
                  <tr key={i.no} className={cx(trHover, "cursor-pointer")} onClick={() => togglePick(i.no)}>
                    <td className={cx(td, "pr-0")} onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={picked.has(i.no)} onChange={() => togglePick(i.no)} label={`Pilih ${i.no}`} />
                    </td>
                    <td className={cx(td, "font-medium")}>{i.no}</td>
                    <td className={cx(td, "text-muted")}>{i.billable.label}</td>
                    <td className={td}>
                      <span className="tabular">{date(i.due)}</span>
                      {i.days < 0 && <span className="ml-1.5 text-[11.5px] text-red-600 tabular dark:text-red-400">lewat {-i.days} hari</span>}
                    </td>
                    <td className={cx(td, "text-right tabular")}>{rp(i.outstanding)}</td>
                    <td className={cx(td, "text-right font-medium tabular", a > 0 ? "text-fg" : "text-subtle")}>
                      {a > 0 ? rp(a) : "–"}
                      {a > 0 && a < i.outstanding && <div className="text-[11px] font-normal text-subtle">sebagian</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {invs.length === 0 && <EmptyState icon={Wallet} title="Tidak ada invoice terbuka" description="Penerimaan akan dicatat sebagai uang muka pelanggan." />}
        </TableScroll>

        {amount > 0 && <JournalTable title="Jurnal penerimaan (preview)" dateIso={payDate || TODAY} rows={receiptJournal(bank, alloc, remaining)} />}
        {remaining > 0 && amount > 0 && (
          <Callout tone="amber">
            Sisa {rp(remaining)} belum teralokasi — dicatat sebagai {arCoa.umPelanggan.name} dan muncul di Unapplied cash.
          </Callout>
        )}
      </div>
    </Modal>
  );
}
