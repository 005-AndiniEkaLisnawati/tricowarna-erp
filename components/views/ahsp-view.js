"use client";

import { useMemo, useState } from "react";
import { Copy, Library, Search, Upload } from "lucide-react";
import {
  analyses as seedAnalyses,
  coefficientSets,
  costAnalysis,
  historyLabels,
  master,
} from "@/lib/data/estimasi";
import {
  Badge,
  Button,
  Callout,
  Card,
  Mono,
  PageHeader,
  Segmented,
  Select,
  Tabs,
  td,
  th,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { cx, decimal, pct, rp } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const typeLabel = { tenaga: "A. Tenaga", bahan: "B. Bahan", alat: "C. Peralatan" };

export function AhspView() {
  const [tab, setTab] = useState("analisa");
  return (
    <div>
      <PageHeader
        icon={Library}
        title="Master AHSP & Koefisien"
        description="Analisa harga satuan per kode & tahun acuan. Sumber tunggal angka RAB — volume × koefisien × harga master."
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: "analisa", label: "Analisa AHSP", count: seedAnalyses.length },
          { value: "master", label: "Bahan & Upah", count: master.length },
        ]}
      />
      {tab === "analisa" ? <AnalysisPane /> : <MasterPane />}
    </div>
  );
}

function AnalysisPane() {
  const toast = useToast();
  const [list, setList] = useState(seedAnalyses);
  const [setId, setSetId] = useState("PUPR-2025");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("A.4.1.1.7");
  const [op, setOp] = useState(10);

  const set = coefficientSets.find((s) => s.id === setId);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return list.filter((a) => !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [list, query]);

  const analysis = list.find((a) => a.code === selected);
  const cost = costAnalysis(analysis, set);
  const hsp = cost.direct * (1 + op / 100);

  const duplicate = () => {
    const code = `AS.${String(list.filter((a) => a.custom).length + 1).padStart(2, "0")}`;
    const copy = { ...analysis, code, name: `${analysis.name} (Analisa Sendiri)`, custom: true, usedIn: 0, lines: analysis.lines.map((l) => [...l]) };
    setList((l) => [...l, copy]);
    setSelected(code);
    toast({ title: `Analisa Sendiri ${code} dibuat`, description: "Koefisien kini bisa diubah. Perubahan tercatat di audit log." });
  };

  const editKoef = (idx, value) =>
    setList((l) =>
      l.map((a) =>
        a.code === selected ? { ...a, lines: a.lines.map((ln, i) => (i === idx ? [ln[0], value] : ln)) } : a,
      ),
    );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
      <Card className="flex flex-col overflow-hidden lg:max-h-[calc(100dvh-260px)]">
        <div className="space-y-2 border-b border-line p-3">
          <Select value={setId} onChange={(e) => setSetId(e.target.value)}>
            {coefficientSets.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </Select>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode / uraian…"
              className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto scroll-thin">
          {filtered.map((a) => {
            const c = costAnalysis(a, set);
            const active = a.code === selected;
            return (
              <li key={a.code}>
                <button
                  onClick={() => setSelected(a.code)}
                  className={cx(
                    "relative w-full border-b border-line px-3.5 py-2.5 text-left transition-colors",
                    active ? "bg-surface-2" : "hover:bg-surface-2/60",
                  )}
                >
                  {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-fg" />}
                  <div className="flex items-center gap-2">
                    <Mono className="text-[11.5px] text-fg">{a.code}</Mono>
                    {a.custom && <Badge tone="violet">Analisa Sendiri</Badge>}
                    <span className="ml-auto text-[12px] text-fg tabular">{rp(c.direct * (1 + op / 100))}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-muted">
                    {a.name} <span className="text-subtle">/ {a.unit}</span>
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-line px-3.5 py-2 text-[11.5px] text-subtle">
          6.339 baris analisa diimpor dari Excel · {set.note}
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Mono className="text-[12.5px] text-fg">{analysis.code}</Mono>
              <Badge>{set.label}</Badge>
            </div>
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-fg">
              {analysis.name} <span className="font-normal text-subtle">per 1 {analysis.unit}</span>
            </h2>
            <p className="mt-0.5 text-[12.5px] text-subtle">
              {analysis.custom ? "Koefisien dapat diedit" : `Dipakai di ${analysis.usedIn} BOQ tender`}
            </p>
          </div>
          {!analysis.custom && (
            <Button icon={Copy} onClick={duplicate}>
              Duplikat sebagai Analisa Sendiri
            </Button>
          )}
        </div>

        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>Kode</th>
                <th className={th}>Uraian</th>
                <th className={th}>Sat.</th>
                <th className={cx(th, "text-right")}>Koefisien</th>
                <th className={cx(th, "text-right")}>Harga satuan</th>
                <th className={cx(th, "text-right")}>Jumlah</th>
                <th className={cx(th, "text-right")}>TKDN</th>
              </tr>
            </thead>
            {["tenaga", "bahan", "alat"].map((type) => {
              const rows = cost.rows.map((r, i) => ({ ...r, idx: i })).filter((r) => r.type === type);
              if (!rows.length) return null;
              return (
                <tbody key={type}>
                  <tr className="border-t border-line bg-surface-2/50">
                    <td colSpan={5} className="px-3 py-1.5 text-[12px] font-semibold text-fg">{typeLabel[type]}</td>
                    <td className="px-3 py-1.5 text-right text-[12px] font-semibold text-fg tabular">{rp(cost[type])}</td>
                    <td />
                  </tr>
                  {rows.map((r) => (
                    <tr key={r.code} className="border-t border-line">
                      <td className={td}><Mono>{r.code}</Mono></td>
                      <td className={td}>{r.name}</td>
                      <td className={cx(td, "text-muted")}>{r.unit}</td>
                      <td className={cx(td, "text-right tabular")}>
                        {analysis.custom ? (
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={analysis.lines[r.idx][1]}
                            onChange={(e) => editKoef(r.idx, Number(e.target.value))}
                            className="h-7 w-24 rounded-md border border-violet-500/40 bg-violet-500/5 px-2 text-right text-[13px] text-fg tabular outline-none focus:border-violet-500"
                          />
                        ) : (
                          decimal(r.koef, r.koef < 0.01 ? 4 : 3)
                        )}
                      </td>
                      <td className={cx(td, "text-right tabular")}>{rp(r.price)}</td>
                      <td className={cx(td, "text-right tabular")}>{rp(r.total)}</td>
                      <td className={cx(td, "text-right text-muted tabular")}>{pct(r.tkdn, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
            <tfoot className="border-t border-line-strong">
              <tr>
                <td colSpan={5} className={cx(td, "font-medium")}>D. Jumlah (A + B + C)</td>
                <td className={cx(td, "text-right font-medium tabular")}>{rp(cost.direct)}</td>
                <td className={cx(td, "text-right font-medium tabular")}>{pct(cost.tkdn)}</td>
              </tr>
              <tr className="border-t border-line">
                <td colSpan={5} className={td}>
                  <span className="flex items-center gap-3">
                    E. Biaya umum & keuntungan
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={0.5}
                      value={op}
                      onChange={(e) => setOp(Number(e.target.value))}
                      className="w-32 accent-slate-900 dark:accent-slate-100"
                      aria-label="Overhead dan keuntungan"
                    />
                    <span className="text-muted tabular">{pct(op)} × D</span>
                  </span>
                </td>
                <td className={cx(td, "text-right tabular")}>{rp(cost.direct * (op / 100))}</td>
                <td />
              </tr>
              <tr className="border-t border-line bg-surface-2">
                <td colSpan={5} className={cx(td, "font-semibold")}>F. Harga Satuan Pekerjaan (D + E)</td>
                <td className={cx(td, "text-right text-[15px] font-semibold tabular")}>{rp(hsp)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </TableScroll>
        <div className="p-4">
          <Callout tone="indigo" title="Deterministik.">
            Angka ini dihitung mesin dari koefisien set <b>{set.label}</b> × harga master Kalbar 2026 — bukan perkiraan AI. Ganti set
            koefisien di kiri untuk melihat dampaknya ke seluruh BOQ.
          </Callout>
        </div>
      </Card>
    </div>
  );
}

function Sparkline({ values }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 60},${18 - ((v - min) / (max - min || 1)) * 14}`)
    .join(" ");
  return (
    <svg viewBox="0 0 60 20" className="h-5 w-[60px] overflow-visible" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="60" cy={pts.split(" ").at(-1).split(",")[1]} r="2" fill="currentColor" />
    </svg>
  );
}

function MasterPane() {
  const toast = useToast();
  const [type, setType] = useState("all");
  const rows = master.filter((m) => type === "all" || m.type === type);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
        <Segmented
          value={type}
          onChange={setType}
          items={[
            { value: "all", label: "Semua", count: master.length },
            { value: "tenaga", label: "Upah", count: master.filter((m) => m.type === "tenaga").length },
            { value: "bahan", label: "Bahan", count: master.filter((m) => m.type === "bahan").length },
            { value: "alat", label: "Sewa alat", count: master.filter((m) => m.type === "alat").length },
          ]}
        />
        <Button icon={Upload} onClick={() => toast({ title: "Pilih file Excel 'Bahan & Upah'", description: "Format sheet existing tim didukung apa adanya.", tone: "info" })}>
          Import Excel
        </Button>
      </div>
      <TableScroll>
        <table className="w-full">
          <thead className="bg-surface-2">
            <tr>
              <th className={th}>Kode</th>
              <th className={th}>Uraian</th>
              <th className={th}>Sat.</th>
              <th className={cx(th, "text-right")}>Harga master 2026</th>
              <th className={th}>History tender</th>
              <th className={cx(th, "text-right")}>Δ 1 th</th>
              <th className={cx(th, "text-right")}>TKDN</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const prev = m.history.at(-2);
              const delta = ((m.price - prev) / prev) * 100;
              return (
                <tr key={m.code} className="border-t border-line hover:bg-surface-2">
                  <td className={td}><Mono>{m.code}</Mono></td>
                  <td className={td}>{m.name}</td>
                  <td className={cx(td, "text-muted")}>{m.unit}</td>
                  <td className={cx(td, "text-right font-medium tabular")}>{rp(m.price)}</td>
                  <td className={td} title={m.history.map((v, i) => `${historyLabels[i]}: ${rp(v)}`).join("\n")}>
                    <span className="flex items-center gap-2 text-subtle">
                      <Sparkline values={m.history} />
                      <span className="text-[11.5px]">4 tender</span>
                    </span>
                  </td>
                  <td className={cx(td, "text-right tabular", delta > 5 ? "text-amber-600 dark:text-amber-400" : "text-muted")}>
                    +{pct(delta)}
                  </td>
                  <td className={cx(td, "text-right text-muted tabular")}>{pct(m.tkdn)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}
