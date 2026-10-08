"use client";

import { useMemo, useState } from "react";
import { Building2, Gauge, Layers, TriangleAlert, Wallet } from "lucide-react";
import { costCenterBudgets, OPEX_MONTHS } from "@/lib/data/budget";
import { costCenters } from "@/lib/data/org";
import {
  Avatar,
  Badge,
  Callout,
  Card,
  Mono,
  PageHeader,
  Progress,
  Segmented,
  StatCard,
  StatusBadge,
  td,
  th,
  trHover,
} from "@/components/ui";
import { cx, decimal, pct, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const ccName = Object.fromEntries(costCenters.map((c) => [c.code, c.name]));
const ELAPSED = 9; // Jan–Sep 2026 closed
const PACE = (ELAPSED / 12) * 100;

function statusOf(ratio) {
  if (ratio > 95) return "Kritis";
  if (ratio >= 80) return "Waspada";
  return "Aman";
}
const toneOf = { Aman: "green", Waspada: "amber", Kritis: "red" };

const rowsAll = costCenterBudgets.map((c) => {
  const ratio = (c.used / c.pagu) * 100;
  const projection = (c.used / ELAPSED) * 12;
  const hotGroups = c.mode === "Group" ? c.groups.filter((g) => g.pagu && (g.used / g.pagu) * 100 >= 80) : [];
  const projRatio = (projection / c.pagu) * 100;
  const status = projRatio > 105 ? "Kritis" : projRatio > 98 ? "Waspada" : "Aman";
  return { ...c, name: ccName[c.code], ratio, projection, hotGroups, status };
});

function ModeBadge({ mode }) {
  return mode === "Group" ? (
    <Badge tone="indigo">Group</Badge>
  ) : (
    <Badge tone="violet">Lumpsum (berbasis pemakaian)</Badge>
  );
}

export function CostCenterView() {
  const [mode, setMode] = useState("Semua");
  const [selected, setSelected] = useState("CC-100");

  const rows = useMemo(() => rowsAll.filter((r) => mode === "Semua" || r.mode === mode), [mode]);
  const cc = rowsAll.find((r) => r.code === selected);

  const pagu = rowsAll.reduce((s, r) => s + r.pagu, 0);
  const used = rowsAll.reduce((s, r) => s + r.used, 0);
  const projection = rowsAll.reduce((s, r) => s + r.projection, 0);
  const atRisk = rowsAll.filter((r) => r.status !== "Aman" || r.hotGroups.length > 0);

  return (
    <div>
      <PageHeader
        icon={Building2}
        title="Cost Center & OPEX"
        description="Anggaran operasional kantor pusat per cost center tahun 2026 — dikontrol per kelompok biaya atau lumpsum berbasis pemakaian."
        meta={
          <>
            <Badge>Periode Jan – Sep 2026 ditutup</Badge>
            <span className="text-[12px] text-subtle">Laju wajar s/d Sep: {pct(PACE, 0)} dari pagu tahunan</span>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pagu OPEX 2026" icon={Wallet} value={rpShort(pagu)} hint={`${rowsAll.length} cost center`} />
        <StatCard label="Terpakai s/d Sep" value={rpShort(used)} hint={`${pct((used / pagu) * 100)} dari pagu`} />
        <StatCard
          label="Proyeksi s/d Des"
          icon={Gauge}
          value={rpShort(projection)}
          delta={projection > pagu ? `+${rpShort(projection - pagu)}` : `${rpShort(projection - pagu)}`}
          deltaTone={projection > pagu ? "red" : "green"}
          hint="vs pagu, berdasarkan run-rate"
        />
        <StatCard
          label="Perlu perhatian"
          icon={TriangleAlert}
          value={atRisk.length}
          delta="●"
          deltaTone="amber"
          hint="proyeksi > 98% atau kelompok ≥ 80%"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="h-fit overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
            <Segmented
              value={mode}
              onChange={setMode}
              items={["Semua", "Group", "Lumpsum"].map((m) => ({
                value: m,
                label: m,
                count: m === "Semua" ? rowsAll.length : rowsAll.filter((r) => r.mode === m).length,
              }))}
            />
            <span className="text-[12px] text-subtle">Pilih baris untuk melihat rincian</span>
          </div>
          <TableScroll>
            <table className="w-full">
              <thead className="bg-surface-2">
                <tr>
                  <th className={th}>Cost center</th>
                  <th className={th}>Mode</th>
                  <th className={cx(th, "text-right")}>Pagu tahunan</th>
                  <th className={cx(th, "text-right")}>Terpakai</th>
                  <th className={cx(th, "text-right")}>Sisa</th>
                  <th className={cx(th, "w-40")}>Pemakaian</th>
                  <th className={th}>Proyeksi Des</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const active = r.code === selected;
                  return (
                    <tr
                      key={r.code}
                      onClick={() => setSelected(r.code)}
                      className={cx(trHover, "cursor-pointer", active && "bg-surface-2")}
                    >
                      <td className={cx(td, "relative")}>
                        {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-fg" />}
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={r.initials} />
                          <div>
                            <div className="font-medium">
                              <Mono className="mr-1.5 text-fg">{r.code}</Mono>
                              {r.name}
                            </div>
                            <div className="text-[12px] text-subtle">PIC {r.pic}</div>
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <ModeBadge mode={r.mode} />
                      </td>
                      <td className={cx(td, "text-right tabular")}>{rpShort(r.pagu)}</td>
                      <td className={cx(td, "text-right tabular")}>{rpShort(r.used)}</td>
                      <td className={cx(td, "text-right font-medium tabular")}>{rpShort(r.pagu - r.used)}</td>
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Progress value={r.ratio} tone={r.ratio > PACE + 5 ? "amber" : "fg"} />
                            <span className="absolute -top-0.5 h-2.5 w-px bg-red-500/70" style={{ left: `${PACE}%` }} title="Laju wajar s/d Sep" />
                          </div>
                          <span className="w-11 text-right text-[12px] text-muted tabular">{decimal(r.ratio, 1)}%</span>
                        </div>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={r.status} />
                          <span className="text-[12px] text-subtle tabular">{pct((r.projection / r.pagu) * 100, 0)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        </Card>

        {cc && <DetailPanel key={cc.code} cc={cc} />}
      </div>
    </div>
  );
}

function DetailPanel({ cc }) {
  const max = Math.max(...cc.monthly);
  const target = cc.pagu / 12;
  const top = Math.max(max, target) * 1.1;
  const avg = cc.used / ELAPSED;
  const sorted = [...cc.groups].sort((a, b) => b.used - a.used);

  return (
    <Card className="h-fit overflow-hidden">
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[14px] font-semibold text-fg">
            <Mono className="mr-1.5 text-[13px] text-fg">{cc.code}</Mono>
            {cc.name}
          </h3>
          <ModeBadge mode={cc.mode} />
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-subtle">
          {cc.mode === "Group"
            ? "Pagu dikunci per kelompok biaya — pengajuan ditolak otomatis bila kelompoknya habis, walau total CC masih tersedia."
            : "Satu pagu lumpsum untuk seluruh pemakaian — kelompok biaya dicatat untuk analisis, tidak membatasi pengajuan."}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Mini label="Pagu" value={rpShort(cc.pagu)} />
          <Mini label="Terpakai" value={rpShort(cc.used)} />
          <Mini label="Rata-rata/bln" value={rpShort(avg)} />
        </div>
      </div>

      {/* Monthly bars */}
      <div className="border-t border-line px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-fg">Pemakaian bulanan 2026</span>
          <span className="flex items-center gap-1.5 text-[11.5px] text-subtle">
            <span className="w-3 border-t border-dashed border-red-500" />
            pagu/bulan {rpShort(target)}
          </span>
        </div>
        <div className="relative h-36">
          <div
            className="absolute inset-x-0 z-10 border-t border-dashed border-red-500/70"
            style={{ bottom: `${(target / top) * 100}%` }}
          />
          <div className="flex h-full items-end gap-1.5">
            {cc.monthly.map((v, i) => (
              <div key={OPEX_MONTHS[i]} className="group relative flex h-full flex-1 flex-col justify-end">
                <span className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 -translate-y-full rounded bg-fg px-1.5 py-0.5 text-[10.5px] whitespace-nowrap text-surface opacity-0 transition-opacity group-hover:opacity-100 tabular" style={{ bottom: `${(v / top) * 100}%` }}>
                  {rp(v)}
                </span>
                <div
                  className={cx(
                    "w-full rounded-t-[3px] transition-[height,background-color] duration-500",
                    v > target ? "bg-amber-500/85 group-hover:bg-amber-500" : "bg-fg/70 group-hover:bg-fg",
                  )}
                  style={{ height: `${(v / top) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {OPEX_MONTHS.map((m) => (
            <span key={m} className="flex-1 text-center text-[10.5px] text-subtle">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="border-t border-line">
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-fg">
            <Layers className="size-3.5 text-subtle" />
            Kelompok OPEX
          </span>
          <span className="text-[11.5px] text-subtle">{cc.mode === "Group" ? "terpakai / pagu" : "porsi pemakaian"}</span>
        </div>
        <ul className="px-4 pb-3">
          {sorted.map((g) => {
            const ratio = cc.mode === "Group" ? (g.used / g.pagu) * 100 : (g.used / cc.used) * 100;
            const status = cc.mode === "Group" ? statusOf(ratio) : null;
            return (
              <li key={g.name} className="border-t border-line py-2 first:border-t-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[12.5px] text-fg">
                    {g.name} <Mono className="ml-1 text-[11px]">{g.coa}</Mono>
                  </span>
                  {status && status !== "Aman" ? <StatusBadge status={status} /> : null}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress value={ratio} tone={status ? toneOf[status] : "indigo"} className="flex-1" />
                  <span className="w-[132px] text-right text-[11.5px] text-muted tabular">
                    {cc.mode === "Group" ? (
                      <>
                        {rpShort(g.used)} / {rpShort(g.pagu)}
                      </>
                    ) : (
                      <>
                        {rpShort(g.used)} · {decimal(ratio, 0)}%
                      </>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {cc.hotGroups.length > 0 && (
        <div className="border-t border-line px-4 py-3">
          <Callout tone="amber" icon={TriangleAlert}>
            {cc.hotGroups.map((g) => g.name).join(", ")} mendekati batas pagu dengan sisa 3 bulan. Ajukan realokasi antar kelompok
            atau revisi pagu sebelum pengajuan berikutnya.
          </Callout>
        </div>
      )}
    </Card>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-lg bg-surface-2 px-2.5 py-2 ring-1 ring-line ring-inset">
      <div className="text-[11px] text-subtle">{label}</div>
      <div className="text-[13.5px] font-semibold text-fg tabular">{value}</div>
    </div>
  );
}
