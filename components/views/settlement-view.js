"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleCheck,
  Equal,
  FileCheck2,
  Plus,
  ReceiptText,
  Scale,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { advances, expenses } from "@/lib/data/finance";
import { realisasiLines, settledOn, settlementCategoryByName } from "@/lib/data/settlement";
import { costCenters, projectByCode, TODAY } from "@/lib/data/org";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  CardHeader,
  EmptyState,
  Input,
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
import { cx, date, daysBetween, decimal, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const ccName = Object.fromEntries(costCenters.map((c) => [c.code, c.name]));
const categoryNames = Object.keys(settlementCategoryByName);
const where = (a) => (a.project ? projectByCode[a.project]?.short : ccName[a.costCenter]);

// Linked expenses (from the Expenses module) + field receipts = advance.realized.
function seedLines() {
  const map = {};
  for (const a of advances) {
    const linked = expenses
      .filter((e) => e.advance === a.no)
      .map((e) => ({ ref: e.no, date: e.date, vendor: e.vendor, desc: null, category: e.category, amount: e.amount, source: "expense", status: e.status }));
    const field = (realisasiLines[a.no] ?? []).map((l) => ({ ...l, source: "nota" }));
    map[a.no] = [...linked, ...field].sort((x, y) => x.date.localeCompare(y.date));
  }
  return map;
}

function formatDigits(n) {
  return n ? new Intl.NumberFormat("id-ID").format(n) : "";
}

export function SettlementView() {
  const toast = useToast();
  const [lines, setLines] = useState(seedLines);
  const [posted, setPosted] = useState(() =>
    Object.fromEntries(advances.filter((a) => a.status === "Settled").map((a) => [a.no, { on: settledOn[a.no], mode: "pas", diff: 0 }])),
  );
  const openList = advances.filter((a) => !posted[a.no]).sort((a, b) => a.date.localeCompare(b.date));
  const doneList = advances.filter((a) => posted[a.no]);
  const [selected, setSelected] = useState(openList[0]?.no);

  const total = (no) => (lines[no] ?? []).reduce((s, l) => s + l.amount, 0);
  const pendingRefund = openList.reduce((s, a) => s + Math.max(0, a.amount - total(a.no)), 0);
  const adv = advances.find((a) => a.no === selected);

  const post = (a, mode, diff) => {
    setPosted((p) => ({ ...p, [a.no]: { on: TODAY, mode, diff } }));
    const next = openList.find((x) => x.no !== a.no);
    if (next) setSelected(next.no);
    toast({
      title: `Settlement ${a.no} diposting`,
      description:
        mode === "refund"
          ? `Sisa ${rp(diff)} dikembalikan ke kas. Kasbon ${a.pic} ditutup.`
          : mode === "reimburse"
            ? `Kekurangan ${rp(diff)} dijadwalkan reimburse ke ${a.pic}.`
            : `Realisasi pas dengan kasbon. Kasbon ${a.pic} ditutup.`,
    });
  };

  return (
    <div>
      <PageHeader
        icon={Scale}
        title="Settlement Kasbon"
        description="Pertanggungjawaban uang muka kerja — cocokkan nota realisasi, hitung selisih, dan posting jurnal penutup."
        actions={
          <Link
            href="/finance/advances"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            <ArrowLeft className="size-4" />
            Daftar kasbon
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Menunggu settlement" value={openList.length} hint={`${rpShort(openList.reduce((s, a) => s + a.amount, 0))} total kasbon`} />
        <StatCard label="Realisasi terkumpul" value={rpShort(openList.reduce((s, a) => s + total(a.no), 0))} hint="nota expense + nota lapangan" />
        <StatCard label="Potensi kembali ke kas" value={rpShort(pendingRefund)} hint="jika diposting hari ini" />
        <StatCard
          label="Selesai bulan ini"
          value={doneList.filter((a) => (posted[a.no].on ?? "") >= "2026-10-01").length}
          delta="●"
          deltaTone="green"
          hint="kasbon ditutup sejak 1 Okt"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* ── Left: queue ── */}
        <Card className="h-fit overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <span className="text-[12.5px] font-semibold text-fg">Belum settle</span>
            <span className="text-[12px] text-subtle tabular">{openList.length}</span>
          </div>
          {openList.length === 0 && (
            <p className="px-3.5 py-4 text-[12.5px] text-subtle">Semua kasbon sudah disettle.</p>
          )}
          <ul>
            {openList.map((a) => {
              const t = total(a.no);
              const ratio = (t / a.amount) * 100;
              const age = daysBetween(a.date, TODAY);
              const active = a.no === selected;
              return (
                <li key={a.no}>
                  <button
                    onClick={() => setSelected(a.no)}
                    className={cx(
                      "relative w-full border-t border-line px-3.5 py-2.5 text-left transition-colors first:border-t-0",
                      active ? "bg-surface-2" : "hover:bg-surface-2",
                    )}
                  >
                    {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-fg" />}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-fg">{a.no}</span>
                      <span
                        className={cx(
                          "text-[11.5px] tabular",
                          age > 30 ? "font-semibold text-red-600 dark:text-red-400" : "text-subtle",
                        )}
                      >
                        {age} hari
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                      <Avatar initials={a.initials} className="size-4! text-[8px]!" />
                      <span className="truncate">
                        {a.pic} · {where(a)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={ratio} tone={ratio > 100 ? "amber" : ratio === 100 ? "green" : "fg"} className="flex-1" />
                      <span className="text-[11.5px] text-subtle tabular">
                        {rpShort(t)} / {rpShort(a.amount)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-line bg-surface-2 px-3.5 py-2">
            <span className="text-[12px] font-semibold text-muted">Selesai</span>
            <span className="text-[12px] text-subtle tabular">{doneList.length}</span>
          </div>
          <ul>
            {doneList.map((a) => (
              <li key={a.no}>
                <button
                  onClick={() => setSelected(a.no)}
                  className={cx(
                    "flex w-full items-center justify-between gap-2 border-t border-line px-3.5 py-2 text-left transition-colors",
                    a.no === selected ? "bg-surface-2" : "hover:bg-surface-2",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CircleCheck className="size-3.5 shrink-0 text-emerald-500" />
                    <span className="text-[12.5px] text-muted">{a.no}</span>
                    <span className="truncate text-[12px] text-subtle">{a.pic}</span>
                  </span>
                  <span className="text-[11.5px] text-subtle">{posted[a.no].on ? date(posted[a.no].on) : ""}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* ── Right: detail ── */}
        {adv ? (
          <SettlementPanel
            key={adv.no}
            adv={adv}
            lines={lines[adv.no] ?? []}
            done={posted[adv.no]}
            onAddLine={(l) => setLines((m) => ({ ...m, [adv.no]: [...(m[adv.no] ?? []), l] }))}
            onRemoveLine={(ref) => setLines((m) => ({ ...m, [adv.no]: m[adv.no].filter((l) => l.ref !== ref) }))}
            onPost={post}
          />
        ) : (
          <Card>
            <EmptyState icon={Scale} title="Pilih kasbon" description="Pilih kasbon di kiri untuk mulai settlement." />
          </Card>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Detail panel ───────────────────────── */

function SettlementPanel({ adv, lines, done, onAddLine, onRemoveLine, onPost }) {
  const [draft, setDraft] = useState(null); // null | {category, vendor, amount}
  const realized = lines.reduce((s, l) => s + l.amount, 0);
  const diff = adv.amount - realized; // >0 refund, <0 reimburse
  const mode = diff > 0 ? "refund" : diff < 0 ? "reimburse" : "pas";
  const pendingExp = lines.filter((l) => l.source === "expense" && l.status === "Menunggu Approval");
  const age = daysBetween(adv.date, TODAY);
  const readOnly = Boolean(done);

  const journal = useMemo(() => {
    const byCat = {};
    for (const l of lines) {
      const c = settlementCategoryByName[l.category];
      byCat[c.coa] ??= { coa: c.coa, name: c.coaName, note: l.category, dr: 0, cr: 0 };
      byCat[c.coa].dr += l.amount;
    }
    const rows = Object.values(byCat).sort((a, b) => a.coa.localeCompare(b.coa));
    if (diff > 0) rows.push({ coa: "1-1101", name: "Kas", note: `Pengembalian sisa kasbon oleh ${adv.pic}`, dr: diff, cr: 0 });
    rows.push({ coa: "1-1401", name: "Uang Muka Kerja", note: `${adv.no} · ${adv.pic}`, dr: 0, cr: adv.amount });
    if (diff < 0) rows.push({ coa: "2-1104", name: "Utang Reimburse Karyawan", note: `Kekurangan dibayar ke ${adv.pic}`, dr: 0, cr: -diff });
    return rows;
  }, [lines, diff, adv]);

  const totalDr = journal.reduce((s, r) => s + r.dr, 0);
  const totalCr = journal.reduce((s, r) => s + r.cr, 0);

  const addLine = () => {
    onAddLine({
      ref: `NT-${adv.no.slice(-4)}-${String(lines.length + 1).padStart(2, "0")}`,
      date: TODAY,
      vendor: draft.vendor.trim(),
      desc: null,
      category: draft.category,
      amount: draft.amount,
      source: "nota",
      fresh: true,
    });
    setDraft(null);
  };

  return (
    <div className="min-w-0 space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-3.5 pb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-fg">{adv.no}</h2>
              <StatusBadge status={done ? "Settled" : adv.status} />
              {!done && age > 30 && <Badge tone="red">Lewat SOP · {age} hari</Badge>}
            </div>
            <p className="mt-1 text-[13px] text-muted">{adv.purpose}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-subtle">
              <span className="flex items-center gap-1.5">
                <Avatar initials={adv.initials} className="size-4! text-[8px]!" />
                {adv.pic}
              </span>
              <span>
                <Mono className="text-[11.5px]">{adv.project ?? adv.costCenter}</Mono> · {where(adv)}
              </span>
              <span>Dicairkan {date(adv.date)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-line sm:grid-cols-3">
          <Figure label="Kasbon dicairkan" value={rp(adv.amount)} />
          <Figure label="Total realisasi" value={rp(realized)} hint={`${lines.length} nota · ${decimal((realized / adv.amount) * 100, 1)}%`} border />
          <Figure
            label="Selisih"
            value={diff === 0 ? rp(0) : rp(Math.abs(diff))}
            hint={diff > 0 ? "kasbon > realisasi" : diff < 0 ? "realisasi > kasbon" : "seimbang"}
            tone={diff > 0 ? "green" : diff < 0 ? "amber" : null}
            border
          />
        </div>
      </Card>

      {/* Realisasi lines */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Rincian realisasi"
          description="Nota dari modul Expenses yang dipotong dari kasbon ini, ditambah nota lapangan yang diunggah PIC."
          icon={ReceiptText}
          actions={
            !readOnly && (
              <Button
                size="xs"
                icon={Plus}
                onClick={() => setDraft({ category: categoryNames[0], vendor: "", amount: 0 })}
                disabled={Boolean(draft)}
              >
                Tambah nota
              </Button>
            )
          }
        />
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>Ref / Tanggal</th>
                <th className={th}>Vendor · Uraian</th>
                <th className={th}>Kategori · COA</th>
                <th className={th}>Sumber</th>
                <th className={cx(th, "text-right")}>Nominal</th>
                {!readOnly && <th className={cx(th, "w-8")}></th>}
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const c = settlementCategoryByName[l.category];
                return (
                  <tr key={l.ref} className={cx(trHover, l.fresh && "bg-emerald-500/[0.04]")}>
                    <td className={td}>
                      <div className="font-medium">{l.ref}</div>
                      <div className="text-[12px] text-subtle">{date(l.date)}</div>
                    </td>
                    <td className={cx(td, "max-w-[260px] whitespace-normal")}>
                      <div className="leading-snug">{l.vendor}</div>
                      {l.desc && <div className="text-[12px] leading-snug text-subtle">{l.desc}</div>}
                    </td>
                    <td className={td}>
                      <div className="text-[12.5px]">{l.category}</div>
                      <Mono className="text-[11.5px]">
                        {c.coa} {c.coaName}
                      </Mono>
                    </td>
                    <td className={td}>
                      {l.source === "expense" ? (
                        <div className="flex flex-col items-start gap-1">
                          <Badge tone="blue">Expense</Badge>
                          {l.status === "Menunggu Approval" && <StatusBadge status={l.status} />}
                        </div>
                      ) : (
                        <Badge>Nota lapangan</Badge>
                      )}
                    </td>
                    <td className={cx(td, "text-right font-medium tabular")}>{rp(l.amount)}</td>
                    {!readOnly && (
                      <td className={cx(td, "pl-0")}>
                        {l.fresh && (
                          <Button size="icon" variant="ghost" className="size-7!" aria-label="Hapus nota" onClick={() => onRemoveLine(l.ref)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {draft && (
                <tr className="border-t border-line bg-surface-2">
                  <td className={cx(td, "text-subtle")}>{date(TODAY)}</td>
                  <td className={td}>
                    <Input
                      autoFocus
                      value={draft.vendor}
                      onChange={(e) => setDraft((d) => ({ ...d, vendor: e.target.value }))}
                      placeholder="Vendor / uraian"
                      className="h-8! min-w-[180px] text-[13px]!"
                    />
                  </td>
                  <td className={td}>
                    <Select
                      value={draft.category}
                      onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                      className="h-8! min-w-[200px] text-[13px]!"
                    >
                      {categoryNames.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className={td}>
                    <Badge>Nota lapangan</Badge>
                  </td>
                  <td className={td}>
                    <Input
                      inputMode="numeric"
                      value={formatDigits(draft.amount)}
                      onChange={(e) => setDraft((d) => ({ ...d, amount: Number(e.target.value.replace(/\D/g, "")) || 0 }))}
                      placeholder="0"
                      className="h-8! w-36! text-right text-[13px]! tabular"
                    />
                  </td>
                  <td className={cx(td, "pl-0")}>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="size-7!" aria-label="Batal" onClick={() => setDraft(null)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="primary"
                        className="size-7!"
                        aria-label="Simpan nota"
                        disabled={!draft.vendor.trim() || !draft.amount}
                        onClick={addLine}
                      >
                        <Check className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {lines.length > 0 && (
              <tfoot>
                <tr className="border-t border-line-strong bg-surface-2">
                  <td className={cx(td, "font-medium")} colSpan={4}>
                    Total realisasi
                  </td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{rp(realized)}</td>
                  {!readOnly && <td />}
                </tr>
              </tfoot>
            )}
          </table>
          {lines.length === 0 && !draft && (
            <EmptyState
              icon={ReceiptText}
              title="Belum ada nota realisasi"
              description="Tambahkan nota, atau posting untuk mengembalikan seluruh kasbon ke kas."
            />
          )}
        </TableScroll>
      </Card>

      {/* Decision + journal */}
      <Card className="overflow-hidden">
        <CardHeader title="Penyelesaian & jurnal" icon={FileCheck2} description="Jurnal dibentuk otomatis dari kategori realisasi dan arah selisih." />
        <div className="grid grid-cols-1 gap-2 px-4 pb-3 sm:grid-cols-2">
          <Decision
            active={mode === "refund"}
            icon={ArrowDownLeft}
            title="Kembalikan sisa ke kas"
            amount={mode === "refund" ? diff : 0}
            text={`${adv.pic} menyetor sisa kasbon ke kas proyek / rekening operasional.`}
            tone="green"
          />
          <Decision
            active={mode === "reimburse"}
            icon={ArrowUpRight}
            title="Tambah kekurangan (reimburse)"
            amount={mode === "reimburse" ? -diff : 0}
            text={`Perusahaan membayar kekurangan ke ${adv.pic} via transfer.`}
            tone="amber"
          />
        </div>
        {mode === "pas" && (
          <div className="px-4 pb-3">
            <Callout tone="green" icon={Equal}>
              Realisasi tepat sama dengan kasbon — tidak ada pengembalian maupun reimburse.
            </Callout>
          </div>
        )}
        {pendingExp.length > 0 && !readOnly && (
          <div className="px-4 pb-3">
            <Callout tone="amber" icon={TriangleAlert} title={`${pendingExp.length} nota masih menunggu approval.`}>
              {pendingExp.map((l) => l.ref).join(", ")} ikut dibukukan di settlement ini; approver akan melihatnya sebagai bagian paket settlement.
            </Callout>
          </div>
        )}
        <TableScroll className="border-t border-line">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>Akun</th>
                <th className={th}>Keterangan</th>
                <th className={cx(th, "text-right")}>Debit</th>
                <th className={cx(th, "text-right")}>Kredit</th>
              </tr>
            </thead>
            <tbody>
              {journal.map((r) => (
                <tr key={`${r.coa}-${r.dr ? "d" : "c"}`} className="border-t border-line">
                  <td className={cx(td, r.cr && "pl-8")}>
                    <Mono>{r.coa}</Mono> <span className="ml-1">{r.name}</span>
                  </td>
                  <td className={cx(td, "text-[12.5px] text-subtle")}>{r.note}</td>
                  <td className={cx(td, "text-right tabular")}>{r.dr ? rp(r.dr) : ""}</td>
                  <td className={cx(td, "text-right tabular")}>{r.cr ? rp(r.cr) : ""}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line-strong bg-surface-2">
                <td className={cx(td, "font-medium")} colSpan={2}>
                  <span className="flex items-center gap-2">
                    Total
                    {totalDr === totalCr && <Badge tone="green">Balance</Badge>}
                  </span>
                </td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rp(totalDr)}</td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rp(totalCr)}</td>
              </tr>
            </tfoot>
          </table>
        </TableScroll>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-surface-2 px-4 py-3">
          {readOnly ? (
            <span className="mr-auto flex items-center gap-1.5 text-[12.5px] text-emerald-700 dark:text-emerald-400">
              <CircleCheck className="size-4" />
              Settlement diposting{done.on ? ` ${date(done.on)}` : ""} — kasbon ditutup.
            </span>
          ) : (
            <>
              <span className="mr-auto text-[12px] text-subtle">
                Posting menutup {adv.no} dan membentuk jurnal di General Ledger periode Oktober 2026.
              </span>
              <Button variant="primary" size="md" icon={Check} disabled={totalDr !== totalCr} onClick={() => onPost(adv, mode, Math.abs(diff))}>
                Posting Settlement
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function Figure({ label, value, hint, tone, border }) {
  return (
    <div className={cx("px-4 py-3", border && "border-t border-line sm:border-t-0 sm:border-l")}>
      <div className="text-[11.5px] font-medium text-subtle">{label}</div>
      <div
        className={cx(
          "mt-0.5 text-[17px] font-semibold tracking-tight tabular",
          tone === "green" && "text-emerald-600 dark:text-emerald-400",
          tone === "amber" && "text-amber-600 dark:text-amber-400",
          !tone && "text-fg",
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11.5px] text-subtle">{hint}</div>}
    </div>
  );
}

function Decision({ active, icon: Icon, title, amount, text, tone }) {
  const on = {
    green: "border-emerald-500/40 bg-emerald-500/[0.06] ring-1 ring-emerald-500/20",
    amber: "border-amber-500/40 bg-amber-500/[0.07] ring-1 ring-amber-500/20",
  };
  const iconOn = { green: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400" };
  return (
    <div className={cx("rounded-lg border px-3 py-2.5 transition-colors", active ? on[tone] : "border-line opacity-55")}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-medium text-fg">
          <Icon className={cx("size-4", active ? iconOn[tone] : "text-subtle")} />
          {title}
        </span>
        {active && <span className="text-[13px] font-semibold text-fg tabular">{rp(amount)}</span>}
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-subtle">{text}</p>
    </div>
  );
}
