"use client";

import { useMemo, useState } from "react";
import { Bot, CircleCheck, FileSpreadsheet, FileText, Layers, LineChart, Scale, TriangleAlert } from "lucide-react";
import {
  bsLayout,
  buildBS,
  buildLR,
  buildTB,
  consolColumns,
  lrLayout,
  rabMargin,
  reportPeriods,
  segmentColumns,
} from "@/lib/data/accounting";
import { companies, projects } from "@/lib/data/org";
import { Badge, Button, Callout, Card, Mono, PageHeader, Progress, Segmented, Select, Tabs } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useCompany } from "@/components/shell/app-shell";
import { amount, cx, decimal, pct, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const tabs = [
  { value: "lr", label: "Laba Rugi" },
  { value: "bs", label: "Neraca" },
  { value: "tb", label: "Neraca Saldo" },
];

const titles = { lr: "Laporan Laba Rugi", bs: "Laporan Posisi Keuangan (Neraca)", tb: "Neraca Saldo" };

const stickyCell = "sticky left-0 z-10 bg-surface";

export function ReportsView() {
  const toast = useToast();
  const company = useCompany();
  const [tab, setTab] = useState("lr");
  const [period, setPeriod] = useState("ytd");
  const [mode, setMode] = useState("entity");

  const periodInfo = reportPeriods.find((p) => p.value === period);
  const segmented = mode === "entity" && company.id === "TKN";
  const dataMode = segmented ? "entity" : "consol";

  // Kolom: per proyek (TKN), per perusahaan (konsolidasi), atau satu kolom entitas afiliasi.
  const columns = useMemo(() => {
    if (segmented) return [...segmentColumns, { key: "TOTAL", code: "Total", short: "Entitas", total: true }];
    if (mode === "consol") return [...consolColumns, { key: "KONS", code: "Konsolidasi", short: "Tricowarna Group", total: true }];
    return [{ key: company.id, code: company.id, short: "Total entitas", total: true }];
  }, [segmented, mode, company.id]);

  // Untuk entitas afiliasi (TBK/TBP) ambil kolomnya dari data konsolidasi.
  const pick = useMemo(() => {
    if (segmented || mode === "consol") return null;
    return consolColumns.findIndex((c) => c.key === company.id);
  }, [segmented, mode, company.id]);

  const project = (arr) => (pick == null ? arr : [arr[pick]]);

  const lr = useMemo(() => buildLR(period, dataMode), [period, dataMode]);
  const lrYtd = useMemo(() => buildLR("ytd", dataMode), [dataMode]);
  const bs = useMemo(() => buildBS(dataMode), [dataMode]);
  const tb = useMemo(() => buildTB(dataMode), [dataMode]);
  const segLr = useMemo(() => buildLR(period, "entity"), [period]);

  const entityName = mode === "consol" ? "Tricowarna Group — Konsolidasi" : company.name;
  const asOf = tab === "lr" ? `Periode ${periodInfo.short}` : "Per 30 September 2026";

  const exportReport = (fmt) =>
    toast({
      title: `${titles[tab]} — ${fmt} disiapkan`,
      description: `${entityName} · ${tab === "lr" ? periodInfo.label : "per 30 Sep 2026"} · ${columns.length} kolom.`,
      tone: "info",
    });

  return (
    <div>
      <PageHeader
        icon={LineChart}
        title="Laporan Keuangan"
        description="Laba rugi, neraca, dan neraca saldo kolumnar per kode proyek — dengan konsolidasi & eliminasi intercompany grup."
        meta={
          <>
            <Badge tone="green" dot>
              Closing September terkunci
            </Badge>
            <Badge>PSAK 72 · metode persentase penyelesaian</Badge>
          </>
        }
        actions={
          <>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 w-52">
              {reportPeriods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
            <Button size="md" icon={FileSpreadsheet} onClick={() => exportReport("Excel")}>
              Excel
            </Button>
            <Button size="md" icon={FileText} onClick={() => exportReport("PDF")}>
              PDF
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Tabs items={tabs} value={tab} onChange={setTab} className="flex-1 border-b-0" />
        <Segmented
          value={mode}
          onChange={setMode}
          items={[
            { value: "entity", label: "Entitas" },
            { value: "consol", label: "Konsolidasi grup" },
          ]}
        />
      </div>

      {mode === "entity" && company.id !== "TKN" && (
        <Callout tone="amber" icon={TriangleAlert} className="mt-3">
          Kode proyek PRJ-TRT dicatat di buku {companies[0].name}. {company.name} ditampilkan sebagai satu kolom entitas —
          pilih <span className="font-semibold">Konsolidasi grup</span> untuk melihat seluruh perusahaan.
        </Callout>
      )}

      <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 overflow-hidden">
          <div className="border-b border-line px-4 py-3.5 text-center">
            <p className="text-[12px] font-medium tracking-wide text-subtle uppercase">{entityName}</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-fg">{titles[tab]}</h2>
            <p className="text-[12.5px] text-muted">
              {asOf} · dalam Rupiah{tab === "tb" && " · saldo kredit dalam kurung"}
            </p>
          </div>

          <TableScroll>
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={cx(stickyCell, "z-20 min-w-[300px] border-b border-line bg-surface-2 px-4 py-2 text-left text-[11.5px] font-medium tracking-wide text-subtle uppercase")}>
                    {tab === "tb" ? "Akun" : "Keterangan"}
                  </th>
                  {columns.map((c) => (
                    <ColHead key={c.key} col={c} />
                  ))}
                  {tab === "tb" && (
                    <>
                      <th className="min-w-[130px] border-b border-l border-line bg-surface-2 px-3 py-2 text-right text-[11.5px] font-medium tracking-wide text-subtle uppercase">Debit</th>
                      <th className="min-w-[130px] border-b border-line bg-surface-2 px-3 py-2 text-right text-[11.5px] font-medium tracking-wide text-subtle uppercase">Kredit</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {tab === "lr" && <LayoutRows layout={lrLayout} values={lr} columns={columns} project={project} consol={mode === "consol"} />}
                {tab === "bs" && (
                  <>
                    <LayoutRows layout={bsLayout} values={bs} columns={columns} project={project} consol={mode === "consol"} />
                    <CheckRow
                      label="Selisih aset − (liabilitas + ekuitas)"
                      values={project(bs.aset.map((a, i) => a - bs.le[i]))}
                      columns={columns}
                    />
                  </>
                )}
                {tab === "tb" && <TrialRows rows={tb} columns={columns} project={project} />}
              </tbody>
            </table>
          </TableScroll>

          {tab === "bs" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-surface-2 px-4 py-2.5 text-[12px] text-muted">
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <CircleCheck className="size-3.5" />
                Laba tahun berjalan = laba bersih L/R Jan–Sep 2026 ({rp(project(lrYtd.net).at(-1))})
              </span>
              {segmented && <span>RK Pusat–Proyek saling hapus di kolom Total.</span>}
              {period !== "ytd" && <span>Neraca disajikan per akhir periode terpilih (30 Sep 2026).</span>}
            </div>
          )}
          {tab === "tb" && (
            <div className="border-t border-line bg-surface-2 px-4 py-2.5 text-[12px] text-muted">
              Saldo per 30 Sep 2026 sebelum jurnal penutup — akun pendapatan & beban YTD masih terbuka, sehingga laba tahun
              berjalan belum dipindahkan ke ekuitas.
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <HermesCard lr={segLr} periodLabel={periodInfo.label} />
          {mode === "consol" && <EliminationCard />}
        </div>
      </div>
    </div>
  );
}

function ColHead({ col }) {
  return (
    <th
      className={cx(
        "min-w-[150px] border-b border-line px-3 py-2 text-right align-bottom",
        col.total ? "border-l bg-surface-3" : col.elim ? "bg-violet-500/[0.06]" : "bg-surface-2",
      )}
    >
      <div className={cx("font-mono text-[11.5px] font-semibold", col.elim ? "text-violet-700 dark:text-violet-300" : "text-fg")}>
        {col.code}
      </div>
      <div className="text-[11px] font-normal text-subtle normal-case">{col.short}</div>
    </th>
  );
}

function valueCellClass(col, extra) {
  return cx(
    "px-3 text-right text-[13px] whitespace-nowrap tabular",
    col.total && "border-l border-line bg-surface-2/60",
    col.elim && "bg-violet-500/[0.04] text-violet-700 dark:text-violet-300",
    extra,
  );
}

function LayoutRows({ layout, values, columns, project, consol }) {
  return layout.map((row, idx) => {
    if (row.type === "section") {
      return (
        <tr key={`s${idx}`}>
          <td className={cx(stickyCell, "bg-surface px-4 pt-4 pb-1.5 text-[11.5px] font-semibold tracking-wide text-muted uppercase")}>
            {row.label}
          </td>
          {columns.map((c) => (
            <td key={c.key} className={cx(c.total && "border-l border-line bg-surface-2/60", c.elim && "bg-violet-500/[0.04]")} />
          ))}
        </tr>
      );
    }

    const vals = project(values[row.key]);

    if (row.type === "margin") {
      return (
        <tr key={row.key}>
          <td className={cx(stickyCell, "px-4 pt-0.5 pb-2 text-[12px] text-subtle italic")}>{row.label}</td>
          {columns.map((c, i) => (
            <td key={c.key} className={valueCellClass(c, "pt-0.5 pb-2 text-[12px] text-subtle italic")}>
              {c.elim || vals[i] == null ? "–" : pct(vals[i])}
            </td>
          ))}
        </tr>
      );
    }

    const isSub = row.type === "subtotal";
    const isTotal = row.type === "total";
    const isGrand = row.type === "grand";
    const rowCls = isGrand
      ? "py-2.5 font-semibold border-t border-line-strong border-b-[3px] border-b-line [border-bottom-style:double]"
      : isTotal
        ? "py-2 font-semibold border-t border-line-strong"
        : isSub
          ? "py-1.5 font-semibold border-t border-line"
          : "py-1.5";

    return (
      <tr key={row.key} className="group">
        <td className={cx(stickyCell, "px-4 text-[13px] text-fg group-hover:bg-surface-2", rowCls, (isTotal || isGrand) && "bg-surface-2")}>
          {row.type ? (
            row.label
          ) : (
            <span className="flex items-center gap-2 pl-3">
              <Mono className="w-[50px] shrink-0 text-[11px] text-subtle">{row.coa}</Mono>
              <span className="truncate">{row.label}</span>
              {consol && row.ic && (
                <Badge tone="violet" className="px-1 py-0 text-[10px]">
                  IC
                </Badge>
              )}
            </span>
          )}
        </td>
        {columns.map((c, i) => (
          <td key={c.key} className={valueCellClass(c, cx(rowCls, "text-fg", (isTotal || isGrand) && !c.total && !c.elim && "bg-surface-2/50"))}>
            {amount(vals[i])}
          </td>
        ))}
      </tr>
    );
  });
}

function CheckRow({ label, values, columns }) {
  return (
    <tr>
      <td className={cx(stickyCell, "px-4 py-2 text-[12px] text-subtle")}>{label}</td>
      {columns.map((c, i) => (
        <td key={c.key} className={valueCellClass(c, "py-2 text-[12px]")}>
          {values[i] === 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <Scale className="size-3" />0 ✓
            </span>
          ) : (
            <span className="font-medium text-red-600 dark:text-red-400">{amount(values[i])}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

function TrialRows({ rows, columns, project }) {
  const n = columns.length;
  const totalIdx = n - 1;
  const sums = Array.from({ length: n }, (_, i) => rows.reduce((s, r) => s + project(r.values)[i], 0));
  const debit = rows.reduce((s, r) => s + Math.max(0, project(r.values)[totalIdx]), 0);
  const credit = rows.reduce((s, r) => s + Math.max(0, -project(r.values)[totalIdx]), 0);
  const groupName = { 1: "Aset", 2: "Liabilitas", 3: "Ekuitas & RK", 4: "Pendapatan", 5: "Beban pokok pendapatan", 6: "Beban adm & umum", 7: "Lain-lain", 8: "Pajak final" };

  return (
    <>
      {rows.map((r, idx) => {
        const vals = project(r.values);
        const g = r.coa[0];
        const header = idx === 0 || rows[idx - 1].coa[0] !== g;
        const total = vals[totalIdx];
        return [
          header && (
            <tr key={`g${g}`}>
              <td className={cx(stickyCell, "px-4 pt-3.5 pb-1 text-[11.5px] font-semibold tracking-wide text-muted uppercase")}>
                {groupName[g]}
              </td>
              {columns.map((c) => (
                <td key={c.key} className={cx(c.total && "border-l border-line bg-surface-2/60", c.elim && "bg-violet-500/[0.04]")} />
              ))}
              <td className="border-l border-line" />
              <td />
            </tr>
          ),
          <tr key={r.coa} className="group">
            <td className={cx(stickyCell, "px-4 py-1.5 text-[13px] text-fg group-hover:bg-surface-2")}>
              <span className="flex items-center gap-2 pl-3">
                <Mono className="w-[50px] shrink-0 text-[11px] text-subtle">{r.coa}</Mono>
                <span className="truncate">{r.label}</span>
              </span>
            </td>
            {columns.map((c, i) => (
              <td key={c.key} className={valueCellClass(c, "py-1.5 text-fg")}>
                {amount(vals[i])}
              </td>
            ))}
            <td className="border-l border-line px-3 py-1.5 text-right text-[13px] text-fg tabular">{total > 0 ? amount(total) : ""}</td>
            <td className="px-3 py-1.5 text-right text-[13px] text-fg tabular">{total < 0 ? amount(-total) : ""}</td>
          </tr>,
        ];
      })}
      <tr>
        <td className={cx(stickyCell, "border-t border-line-strong bg-surface-2 px-4 py-2.5 text-[13px] font-semibold text-fg")}>
          Jumlah (debit − kredit)
        </td>
        {columns.map((c, i) => (
          <td key={c.key} className={valueCellClass(c, "border-t border-line-strong bg-surface-2 py-2.5 font-semibold")}>
            {sums[i] === 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Scale className="size-3" />0 ✓
              </span>
            ) : (
              <span className="text-red-600">{amount(sums[i])}</span>
            )}
          </td>
        ))}
        <td className="border-t border-l border-line-strong bg-surface-2 px-3 py-2.5 text-right text-[13px] font-semibold text-fg tabular">{amount(debit)}</td>
        <td className="border-t border-line-strong bg-surface-2 px-3 py-2.5 text-right text-[13px] font-semibold text-fg tabular">{amount(credit)}</td>
      </tr>
    </>
  );
}

/* ───────────────────────── Analisis Agent Hermes ───────────────────────── */

function HermesCard({ lr, periodLabel }) {
  const items = projects.map((p, k) => {
    const i = k + 1;
    const rev = lr.revT[i];
    const gm = lr.gpm[i];
    const rab = rabMargin[p.code];
    const alat = rev ? (-lr.alat[i] / rev) * 100 : 0;
    return { p, gm, rab, delta: gm - rab, alat, net: lr.net[i] };
  });
  const worst = [...items].sort((a, b) => a.delta - b.delta)[0];

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-indigo-600 text-white">
          <Bot className="size-3.5" />
        </span>
        <h3 className="text-[13.5px] font-semibold text-fg">Analisis Agent Hermes</h3>
      </div>
      <p className="mt-1 text-[11.5px] text-subtle">Margin kotor per proyek vs RAB · {periodLabel}</p>

      <div className="mt-3 space-y-3">
        {items.map(({ p, gm, rab, delta, net }) => (
          <div key={p.code}>
            <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
              <span className="min-w-0 truncate font-medium text-fg">{p.short}</span>
              <span className="shrink-0 tabular">
                <span className="font-semibold text-fg">{pct(gm)}</span>
                <span className="text-subtle"> / RAB {pct(rab)}</span>
              </span>
            </div>
            <div className="relative mt-1.5">
              <Progress value={(gm / 30) * 100} tone={delta >= 0 ? "green" : delta > -1 ? "amber" : "red"} />
              <span className="absolute -top-0.5 h-2.5 w-px bg-fg/60" style={{ left: `${(rab / 30) * 100}%` }} title={`RAB ${pct(rab)}`} />
            </div>
            <div className="mt-1 flex justify-between text-[11.5px] text-subtle tabular">
              <span className={delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                {delta >= 0 ? "+" : "−"}
                {decimal(Math.abs(delta), 1)} poin vs RAB
              </span>
              <span>laba bersih {rpShort(net)}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3.5 text-[12.5px] leading-relaxed text-fg">
        <span className="font-semibold">Jembatan A</span> di atas RAB berkat harga kontrak subkon pemancangan yang dikunci awal.{" "}
        <span className="font-semibold">{worst.p.short}</span> paling tertekan: sewa alat berat mencapai{" "}
        <span className="font-semibold tabular">{pct(worst.alat)}</span> dari pendapatan vs asumsi RAB 8,5% — excavator PC200 masih
        disewa harian. Rekomendasi: konversi ke sewa bulanan atau mobilisasi unit milik dari Jembatan A setelah pekerjaan galian
        selesai.
      </p>
      <p className="mt-2 text-[11.5px] text-subtle">Dihitung dari jurnal terposting. Keputusan tetap pada manajemen proyek.</p>
    </div>
  );
}

function EliminationCard() {
  const elim = [
    ["Penjualan girder precast TBP → TKN", "Pendapatan vs HPP material", 1_264_000_000],
    ["Bunga pinjaman TBK → TKN", "Pendapatan vs beban bunga", 37_500_000],
    ["Pinjaman & bunga terutang TKN ke TBK", "Piutang vs utang afiliasi", 1_537_500_000],
    ["Tagihan precast belum dibayar", "Piutang vs utang usaha", 418_600_000],
  ];
  return (
    <Card className="px-4 py-3.5">
      <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-fg">
        <Layers className="size-4 text-violet-600 dark:text-violet-400" />
        Eliminasi intercompany
      </h3>
      <p className="mt-0.5 text-[11.5px] text-subtle">Dicocokkan otomatis dari jurnal cermin · YTD</p>
      <ul className="mt-2.5 divide-y divide-line">
        {elim.map(([label, pair, value]) => (
          <li key={label} className="flex items-start justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="text-[12.5px] text-fg">{label}</p>
              <p className="text-[11.5px] text-subtle">{pair}</p>
            </div>
            <span className="shrink-0 text-[12.5px] font-medium text-violet-700 tabular dark:text-violet-300">{rpShort(value)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
        <CircleCheck className="size-3.5" />
        Semua pasangan cocok · selisih Rp0
      </p>
    </Card>
  );
}
