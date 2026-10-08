"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleCheck,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { coa, coaByCode, glSources, isCashAccount, journals as seed } from "@/lib/data/accounting";
import { companies, projectByCode, projects } from "@/lib/data/org";
import {
  Badge,
  Button,
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
  td,
  th,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { useCompany } from "@/components/shell/app-shell";
import { amount, cx, date, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const sourceFilters = [
  { value: "semua", label: "Semua" },
  { value: "bank", label: "Bank" },
  { value: "kas", label: "Kas Kecil" },
  { value: "pembelian", label: "Pembelian" },
  { value: "expense", label: "Expense" },
  { value: "manual", label: "Manual/Penyesuaian" },
];

const matchesSource = (j, f) =>
  f === "semua" || j.source === f || (f === "manual" && j.source === "penyesuaian");

const cashflowTone = { Operasi: "blue", Investasi: "amber", Pendanaan: "violet" };

const sumDr = (lines) => lines.reduce((s, l) => s + (l.dr || 0), 0);
const sumCr = (lines) => lines.reduce((s, l) => s + (l.cr || 0), 0);

function counterAccount(entry, line) {
  const opposite = entry.lines.filter((l) => (line.dr ? l.cr : l.dr));
  const codes = [...new Set(opposite.map((l) => l.acc))];
  if (codes.length === 0) return null;
  return { code: codes[0], name: coaByCode[codes[0]]?.name, more: codes.length - 1 };
}

function DocChip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11.5px] text-sky-700 transition-colors hover:border-sky-500/40 hover:underline dark:text-sky-400"
    >
      <FileText className="size-3" strokeWidth={2} />
      {children}
    </button>
  );
}

export function GlView() {
  const toast = useToast();
  const company = useCompany();
  const [entries, setEntries] = useState(seed);
  const [source, setSource] = useState("semua");
  const [project, setProject] = useState("semua");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => new Set(["BCA-02"]));
  const [modalOpen, setModalOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((j) => {
      if (!matchesSource(j, source)) return false;
      if (project === "pusat" && !j.lines.some((l) => !l.project)) return false;
      if (project !== "semua" && project !== "pusat" && !j.lines.some((l) => l.project === project)) return false;
      if (!q) return true;
      return (
        j.no.toLowerCase().includes(q) ||
        j.desc.toLowerCase().includes(q) ||
        (j.doc ?? "").toLowerCase().includes(q) ||
        j.lines.some((l) => l.acc.includes(q) || coaByCode[l.acc]?.name.toLowerCase().includes(q))
      );
    });
  }, [entries, source, project, query]);

  const totals = useMemo(() => {
    const lines = visible.flatMap((j) => j.lines);
    return { dr: sumDr(lines), cr: sumCr(lines), lines: lines.length };
  }, [visible]);

  const stats = useMemo(() => {
    const auto = entries.filter((j) => j.source !== "manual" && j.source !== "penyesuaian").length;
    return {
      count: entries.length,
      mutasi: entries.reduce((s, j) => s + sumDr(j.lines), 0),
      autoPct: Math.round((auto / entries.length) * 100),
      ic: entries.filter((j) => j.intercompany).length,
    };
  }, [entries]);

  const toggle = (no) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });

  const nextNo = (prefix) => {
    const n = entries.filter((j) => j.no.startsWith(`${prefix}-`)).length + 1;
    return `${prefix}-${String(n).padStart(2, "0")}`;
  };

  const post = (entry) => {
    setEntries((es) => [...es, entry]);
    setModalOpen(false);
    setSource("semua");
    setProject("semua");
    setQuery("");
    setExpanded((s) => new Set(s).add(entry.no));
    toast({ title: `${entry.no} diposting`, description: `${entry.lines.length} baris · ${rp(sumDr(entry.lines))} — seimbang, masuk buku besar ${company.id}.` });
  };

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="General Ledger"
        description="Buku besar seluruh jurnal — otomatis dari bank, kas kecil proyek, pembelian & expense, plus jurnal manual dan penyesuaian."
        meta={
          <>
            <Badge>Periode 1 Sep – 8 Okt 2026</Badge>
            <Badge tone="indigo">{company.name}</Badge>
          </>
        }
        actions={
          <>
            <Button size="md" icon={Download} onClick={() => toast({ title: "Ekspor buku besar disiapkan", description: "Format Excel sama dengan template akuntansi grup.", tone: "info" })}>
              Export Excel
            </Button>
            <Button size="md" variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
              Jurnal manual
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Jurnal diposting" value={stats.count} hint="semua seimbang" delta="✓" />
        <StatCard label="Total mutasi" value={rpShort(stats.mutasi)} hint="debit = kredit" />
        <StatCard label="Jurnal otomatis" value={`${stats.autoPct}%`} hint="tanpa input manual" />
        <StatCard label="Intercompany" value={stats.ic} hint="jurnal cermin di afiliasi" />
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
          <Segmented
            value={source}
            onChange={setSource}
            items={sourceFilters.map((s) => ({
              ...s,
              count: entries.filter((j) => matchesSource(j, s.value)).length,
            }))}
          />
          <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Select value={project} onChange={(e) => setProject(e.target.value)} className="h-8 w-full text-[13px] sm:w-56">
              <option value="semua">Semua proyek & pusat</option>
              {projects.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} · {p.short}
                </option>
              ))}
              <option value="pusat">Pusat (tanpa kode proyek)</option>
            </Select>
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari no. jurnal, akun, dokumen…"
                className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
              />
            </div>
          </div>
        </div>

        <TableScroll>
          <table className="w-full min-w-[1240px]">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>Tanggal</th>
                <th className={th}>No. Jurnal</th>
                <th className={th}>Keterangan</th>
                <th className={th}>Akun</th>
                <th className={th}>Lawan Akun</th>
                <th className={th}>Project Code</th>
                <th className={cx(th, "text-right")}>Debit</th>
                <th className={cx(th, "text-right")}>Kredit</th>
                <th className={th}>Aliran Dana</th>
                <th className={th}>Sumber dokumen</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((j) => {
                const open = expanded.has(j.no);
                const dr = sumDr(j.lines);
                const balanced = dr === sumCr(j.lines);
                const src = glSources[j.source];
                return (
                  <Fragment key={j.no}>
                    <tr
                      className={cx(
                        "cursor-pointer border-t border-line bg-surface-2/70 transition-colors hover:bg-surface-3",
                        j.fresh && "bg-emerald-500/[0.06]",
                      )}
                      onClick={() => toggle(j.no)}
                    >
                      <td colSpan={10} className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px]">
                          <ChevronRight className={cx("size-3.5 text-subtle transition-transform", open && "rotate-90")} />
                          <span className="font-mono text-[12px] font-semibold text-fg">{j.no}</span>
                          <span className="text-subtle tabular">{date(j.date)}</span>
                          <Badge tone={src.tone}>{src.label}</Badge>
                          <span className="font-medium text-fg">{j.desc}</span>
                          {j.intercompany && (
                            <Badge tone="violet" dot>
                              Intercompany · 2 sisi
                            </Badge>
                          )}
                          {j.fresh && <Badge tone="green">Baru</Badge>}
                          <span className="ml-auto flex items-center gap-2">
                            <span className="text-subtle tabular">{rp(dr)}</span>
                            {balanced ? (
                              <Badge tone="green">Balance ✓</Badge>
                            ) : (
                              <Badge tone="red">Tidak seimbang</Badge>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {j.lines.map((l, i) => {
                      const acc = coaByCode[l.acc];
                      const lawan = counterAccount(j, l);
                      return (
                        <tr key={i} className="border-t border-line/60 transition-colors hover:bg-surface-2">
                          <td className={cx(td, "py-1.5 text-[12.5px] text-subtle tabular")}>{date(j.date)}</td>
                          <td className={cx(td, "py-1.5")}>
                            <Mono className="text-[11.5px]">{j.no}</Mono>
                          </td>
                          <td className={cx(td, "max-w-[260px] truncate py-1.5 text-[12.5px] text-muted")} title={l.memo ?? j.desc}>
                            {l.memo ?? j.desc}
                          </td>
                          <td className={cx(td, "py-1.5", l.cr && "pl-8")}>
                            <Mono className="text-fg">{l.acc}</Mono>{" "}
                            <span className="text-[12.5px]">{acc?.name}</span>
                          </td>
                          <td className={cx(td, "py-1.5 text-[12.5px] text-muted")}>
                            {lawan ? (
                              <>
                                <Mono>{lawan.code}</Mono> {lawan.name}
                                {lawan.more > 0 && <span className="text-subtle"> +{lawan.more}</span>}
                              </>
                            ) : (
                              "–"
                            )}
                          </td>
                          <td className={cx(td, "py-1.5")}>
                            {l.project ? (
                              <span title={projectByCode[l.project]?.name}>
                                <Mono className="text-[11.5px]">{l.project}</Mono>
                              </span>
                            ) : (
                              <span className="text-[12px] text-subtle">Pusat</span>
                            )}
                          </td>
                          <td className={cx(td, "py-1.5 text-right tabular")}>{l.dr ? amount(l.dr) : ""}</td>
                          <td className={cx(td, "py-1.5 text-right tabular")}>{l.cr ? amount(l.cr) : ""}</td>
                          <td className={cx(td, "py-1.5")}>
                            {j.cashflow && isCashAccount(l.acc) ? (
                              <Badge tone={cashflowTone[j.cashflow]}>{j.cashflow}</Badge>
                            ) : (
                              <span className="text-subtle">–</span>
                            )}
                          </td>
                          <td className={cx(td, "py-1.5")}>
                            {i === 0 && j.doc ? (
                              <DocChip onClick={() => toggle(j.no)}>{j.doc}</DocChip>
                            ) : i === 1 && j.ref ? (
                              <DocChip onClick={() => toggle(j.no)}>{j.ref}</DocChip>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                    {open && (
                      <tr className="border-t border-line/60">
                        <td colSpan={10} className="bg-surface-2/50 px-3 py-3">
                          <DrillDown entry={j} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            {visible.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-line-strong bg-surface-2">
                  <td colSpan={6} className={cx(td, "font-semibold")}>
                    Total · {visible.length} jurnal · {totals.lines} baris
                  </td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{amount(totals.dr)}</td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{amount(totals.cr)}</td>
                  <td colSpan={2} className={td}>
                    {totals.dr === totals.cr ? (
                      <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CircleCheck className="size-3.5" />
                        Debit = Kredit
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-red-600 dark:text-red-400">
                        <TriangleAlert className="size-3.5" />
                        Selisih {rp(totals.dr - totals.cr)}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
          {visible.length === 0 && (
            <EmptyState icon={BookOpen} title="Tidak ada jurnal" description="Ubah filter sumber, proyek, atau kata kunci pencarian." />
          )}
        </TableScroll>
      </Card>

      {modalOpen && <ManualJournalModal nextNo={nextNo} onClose={() => setModalOpen(false)} onPost={post} />}
    </div>
  );
}

/* ───────────────────────── Drill-down dokumen sumber ───────────────────────── */

function DrillDown({ entry }) {
  const d = entry.detail;
  const ic = entry.intercompany;
  const affiliate = ic && companies.find((c) => c.id === ic.company);
  return (
    <div className={cx("grid gap-3", ic ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,560px)]")}>
      <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
        <div className="flex items-center gap-2">
          <FileText className="size-3.5 text-subtle" />
          <span className="text-[12.5px] font-semibold text-fg">Dokumen sumber</span>
          {entry.doc && <Mono className="text-[11.5px]">{entry.doc}</Mono>}
        </div>
        {d ? (
          <dl className="mt-2 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
            <dt className="text-subtle">Jenis</dt>
            <dd className="text-fg">{d.type}</dd>
            <dt className="text-subtle">Pihak</dt>
            <dd className="text-fg">{d.party}</dd>
            <dt className="text-subtle">Otorisasi</dt>
            <dd className="text-fg">{d.approval}</dd>
            <dt className="text-subtle">Posting</dt>
            <dd className="text-fg">{d.posted}</dd>
            {entry.ref && (
              <>
                <dt className="text-subtle">Referensi</dt>
                <dd>
                  <Mono>{entry.ref}</Mono>
                </dd>
              </>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-[12.5px] text-subtle">Jurnal manual — tidak terhubung ke dokumen transaksi. Tercatat di audit log.</p>
        )}
      </div>
      {ic && (
        <div className="rounded-lg border border-violet-500/25 bg-violet-500/[0.04] px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <ArrowLeftRight className="size-3.5 text-violet-600 dark:text-violet-400" />
            <span className="text-[12.5px] font-semibold text-fg">Jurnal cermin di {affiliate?.name}</span>
            <Mono className="text-[11.5px]">{ic.mirror}</Mono>
            <Badge tone="green">Dibuat otomatis</Badge>
          </div>
          <table className="mt-2 w-full text-[12.5px]">
            <tbody>
              {ic.lines.map((l) => (
                <tr key={l.acc + (l.dr ? "d" : "c")} className="border-t border-violet-500/15">
                  <td className={cx("py-1.5 text-fg", l.cr && "pl-6")}>
                    <Mono>{l.acc}</Mono> {l.name}
                  </td>
                  <td className="py-1.5 text-right text-fg tabular">{l.dr ? `Dr ${amount(l.dr)}` : `Cr ${amount(l.cr)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11.5px] text-subtle">
            Saldo utang/piutang afiliasi dieliminasi otomatis pada laporan konsolidasi grup.
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Modal: Jurnal manual ───────────────────────── */

const emptyLine = () => ({ acc: "", project: "", dr: 0, cr: 0 });

function digits(n) {
  return n ? new Intl.NumberFormat("id-ID").format(n) : "";
}

function MoneyInput({ value, onChange, placeholder }) {
  return (
    <input
      inputMode="numeric"
      value={digits(value)}
      placeholder={placeholder}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
      className="h-8 w-full rounded-md border border-line bg-surface px-2 text-right text-[13px] text-fg tabular outline-none placeholder:text-subtle hover:border-line-strong focus:border-line-strong focus:ring-3 focus:ring-[var(--ring)]"
    />
  );
}

const compactSelect = "h-8 rounded-md px-2 text-[12.5px]";

function ManualJournalModal({ nextNo, onClose, onPost }) {
  const [kind, setKind] = useState("JU");
  const [form, setForm] = useState({ date: "2026-10-08", desc: "", doc: "" });
  const [lines, setLines] = useState([
    { acc: "6-1301", project: "", dr: 0, cr: 0 },
    { acc: "1-1101", project: "", dr: 0, cr: 0 },
  ]);

  const dr = sumDr(lines);
  const cr = sumCr(lines);
  const diff = dr - cr;
  const linesValid = lines.length >= 2 && lines.every((l) => l.acc && (l.dr > 0) !== (l.cr > 0));
  const canPost = linesValid && dr > 0 && diff === 0 && form.desc.trim().length > 0;
  const no = nextNo(kind);

  const setLine = (i, patch) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const submit = () =>
    onPost({
      no,
      date: form.date,
      source: kind === "JU" ? "manual" : "penyesuaian",
      desc: form.desc.trim(),
      doc: form.doc.trim() || `MEMO-${no}`,
      cashflow: lines.some((l) => isCashAccount(l.acc)) ? "Operasi" : null,
      detail: null,
      fresh: true,
      lines: lines.map((l) => ({
        acc: l.acc,
        project: l.project || null,
        ...(l.dr ? { dr: l.dr } : { cr: l.cr }),
      })),
    });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Jurnal manual"
      description={`${no} · Debit dan kredit harus seimbang sebelum dapat diposting.`}
      footer={
        <>
          <span className="mr-auto text-[12px] text-subtle">Jurnal manual memerlukan review Controller saat closing.</span>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" icon={Check} disabled={!canPost} onClick={submit}>
            Posting {no}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_150px_1fr]">
        <Field label="Jenis jurnal">
          <Segmented
            value={kind}
            onChange={setKind}
            items={[
              { value: "JU", label: "Jurnal umum" },
              { value: "AJP", label: "Penyesuaian" },
            ]}
          />
        </Field>
        <Field label="Tanggal">
          <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label="No. bukti / referensi" hint="Opsional">
          <Input value={form.doc} placeholder={`MEMO-${no}`} onChange={(e) => setForm((f) => ({ ...f, doc: e.target.value }))} className="font-mono text-[13px]" />
        </Field>
        <Field label="Keterangan" className="sm:col-span-3">
          <Input
            value={form.desc}
            placeholder="mis. Reklasifikasi biaya ATK ke proyek Jembatan A"
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
          />
        </Field>
      </div>

      <TableScroll className="mt-4 rounded-xl border border-line">
        <table className="w-full min-w-[680px]">
          <thead className="bg-surface-2">
            <tr>
              <th className={cx(th, "w-[36%]")}>Akun</th>
              <th className={th}>Proyek</th>
              <th className={cx(th, "w-[17%] text-right")}>Debit</th>
              <th className={cx(th, "w-[17%] text-right")}>Kredit</th>
              <th className={cx(th, "w-10")}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-2 py-1.5">
                  <Select value={l.acc} onChange={(e) => setLine(i, { acc: e.target.value })} className={compactSelect}>
                    <option value="">Pilih akun…</option>
                    {coa.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.code} · {a.name}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <Select value={l.project} onChange={(e) => setLine(i, { project: e.target.value })} className={compactSelect}>
                    <option value="">Pusat</option>
                    {projects.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} · {p.short}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <MoneyInput value={l.dr} placeholder="0" onChange={(v) => setLine(i, { dr: v, cr: v ? 0 : l.cr })} />
                </td>
                <td className="px-2 py-1.5">
                  <MoneyInput value={l.cr} placeholder="0" onChange={(v) => setLine(i, { cr: v, dr: v ? 0 : l.dr })} />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Hapus baris"
                    disabled={lines.length <= 2}
                    onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-surface-2">
              <td className="px-2 py-2" colSpan={2}>
                <Button size="xs" variant="ghost" icon={Plus} onClick={() => setLines((ls) => [...ls, emptyLine()])}>
                  Tambah baris
                </Button>
              </td>
              <td className="px-3 py-2 text-right text-[13px] font-semibold text-fg tabular">{amount(dr)}</td>
              <td className="px-3 py-2 text-right text-[13px] font-semibold text-fg tabular">{amount(cr)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </TableScroll>

      <div
        className={cx(
          "mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-medium",
          dr > 0 && diff === 0
            ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-300"
            : dr === 0 && cr === 0
              ? "border-line bg-surface-2 text-subtle"
              : "border-red-500/25 bg-red-500/[0.06] text-red-700 dark:text-red-300",
        )}
      >
        {dr > 0 && diff === 0 ? <CircleCheck className="size-4" /> : <TriangleAlert className="size-4" />}
        {dr === 0 && cr === 0
          ? "Isi nominal debit dan kredit."
          : diff === 0
            ? `Seimbang — debit dan kredit ${rp(dr)}.`
            : `Belum seimbang — selisih ${rp(Math.abs(diff))} di sisi ${diff > 0 ? "debit" : "kredit"}.`}
        {!linesValid && dr > 0 && diff === 0 && (
          <span className="ml-auto font-normal text-subtle">Setiap baris wajib berisi akun dan salah satu sisi.</span>
        )}
        {linesValid && diff === 0 && dr > 0 && !form.desc.trim() && (
          <span className="ml-auto font-normal text-subtle">Lengkapi keterangan.</span>
        )}
      </div>
    </Modal>
  );
}
