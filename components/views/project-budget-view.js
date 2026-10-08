"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, LoaderCircle, PiggyBank, RefreshCw, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import { projectBudgets } from "@/lib/data/budget";
import { projects, TODAY } from "@/lib/data/org";
import { Badge, Button, Callout, Card, CardHeader, Mono, PageHeader, Segmented, StatusBadge, td, th, trHover } from "@/components/ui";
import { useToast } from "@/components/toast";
import { cx, date, decimal, pct, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const hatch = { backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 2px, transparent 2px 5px)" };

function statusOf(ratio) {
  if (ratio > 95) return "Kritis";
  if (ratio >= 80) return "Waspada";
  return "Aman";
}

const toneBar = {
  Aman: { solid: "bg-emerald-500", hatch: "text-emerald-500/60 bg-emerald-500/10" },
  Waspada: { solid: "bg-amber-500", hatch: "text-amber-500/70 bg-amber-500/10" },
  Kritis: { solid: "bg-red-500", hatch: "text-red-500/70 bg-red-500/10" },
};

function BudgetBar({ pagu, realized, commitment, status, className }) {
  const r = Math.min(100, (realized / pagu) * 100);
  const c = Math.min(100 - r, (commitment / pagu) * 100);
  const t = toneBar[status];
  return (
    <div className={cx("flex h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div className={cx("h-full transition-[width] duration-500", t.solid)} style={{ width: `${r}%` }} />
      <div className={cx("h-full transition-[width] duration-500", t.hatch)} style={{ width: `${c}%`, ...hatch }} />
    </div>
  );
}

export function ProjectBudgetView() {
  const toast = useToast();
  const [code, setCode] = useState("PRJ-TRT-2026-004");
  const [synced, setSynced] = useState({});
  const [syncing, setSyncing] = useState(false);

  const project = projects.find((p) => p.code === code);
  const budget = projectBudgets[code];

  const rows = useMemo(
    () =>
      budget.categories.map((c) => {
        const absorbed = ((c.realized + c.commitment) / c.pagu) * 100;
        return { ...c, absorbed, remaining: c.pagu - c.realized - c.commitment, status: statusOf(absorbed) };
      }),
    [budget],
  );

  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  const pagu = sum("pagu");
  const commitment = sum("commitment");
  const realized = sum("realized");
  const eac = sum("eac");
  const remaining = pagu - commitment - realized;
  const totalAbsorbed = ((realized + commitment) / pagu) * 100;
  const warnings = rows.filter((r) => r.status !== "Aman").sort((a, b) => b.absorbed - a.absorbed);

  const marginRab = project.contract - pagu;
  const marginEac = project.contract - eac;
  const costProgress = (realized / pagu) * 100;
  const variances = rows
    .map((r) => ({ name: r.name, delta: r.eac - r.pagu }))
    .filter((v) => v.delta !== 0)
    .sort((a, b) => b.delta - a.delta);
  const maxVar = Math.max(...variances.map((v) => Math.abs(v.delta)), 1);

  const pull = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced((s) => ({ ...s, [code]: true }));
      toast({
        title: `Pagu ${project.short} disinkronkan dari RAB ${budget.rabRevision}`,
        description: `${budget.rabItems} item RAB dipetakan ke ${rows.length} kategori. Tidak ada perubahan nilai pagu.`,
      });
    }, 900);
  };

  return (
    <div>
      <PageHeader
        icon={PiggyBank}
        title="Project Budget"
        description="Pagu biaya per proyek diturunkan dari RAB — realisasi & commitment PO/SPK dipantau terhadap pagu secara real-time."
        actions={
          <Button size="md" icon={syncing ? LoaderCircle : RefreshCw} onClick={pull} disabled={syncing} className={syncing ? "[&>svg]:animate-spin" : ""}>
            {syncing ? "Menarik data RAB…" : "Tarik ulang dari RAB"}
          </Button>
        }
      />

      <Segmented
        value={code}
        onChange={setCode}
        items={projects.map((p) => ({ value: p.code, label: p.short }))}
      />

      {/* Header card */}
      <Card className="mt-3">
        <div className="flex flex-wrap items-start justify-between gap-4 px-4 pt-4 pb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-fg">{project.name}</h2>
              <Mono>{project.code}</Mono>
            </div>
            <p className="mt-0.5 text-[12.5px] text-subtle">{project.location}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="indigo">
                <FileSpreadsheet className="size-3" />
                {budget.rabSource}
              </Badge>
              <span className="text-[12px] text-subtle">
                {budget.rabItems} item RAB · sinkron terakhir {date(synced[code] ? TODAY : budget.lastSync)}
              </span>
            </div>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <div className="text-[11.5px] font-medium text-subtle">Nilai kontrak</div>
              <div className="text-[17px] font-semibold tracking-tight text-fg tabular">{rp(project.contract)}</div>
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-subtle">Progres fisik</div>
              <div className="text-[17px] font-semibold tracking-tight text-fg tabular">{project.progress}%</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line lg:grid-cols-4">
          <Figure label="Pagu (RAB biaya)" value={rpShort(pagu)} hint={`${pct((pagu / project.contract) * 100)} dari kontrak`} />
          <Figure label="Commitment (PO/SPK)" value={rpShort(commitment)} hint={`${pct((commitment / pagu) * 100)} pagu`} swatch="hatch" />
          <Figure label="Realisasi" value={rpShort(realized)} hint={`${pct((realized / pagu) * 100)} pagu`} swatch="solid" />
          <Figure label="Sisa pagu" value={rpShort(remaining)} hint={`${pct((remaining / pagu) * 100)} tersedia`} />
        </div>
        <div className="border-t border-line px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between text-[12px] text-subtle">
            <span>Terserap (realisasi + commitment)</span>
            <span className="font-medium text-fg tabular">{pct(totalAbsorbed)}</span>
          </div>
          <BudgetBar pagu={pagu} realized={realized} commitment={commitment} status={statusOf(totalAbsorbed)} className="h-2.5" />
        </div>
      </Card>

      {warnings.length > 0 && (
        <Callout tone="amber" icon={TriangleAlert} title="Peringatan pagu" className="mt-3">
          {warnings.map((w, i) => (
            <span key={w.name}>
              {i > 0 && "; "}
              <span className="font-medium">{w.name}</span> sudah terserap{" "}
              <span className="font-semibold tabular">{decimal(w.absorbed, 1)}%</span> (sisa {rpShort(w.remaining)})
            </span>
          ))}
          . PO/SPK baru di kategori ini membutuhkan approval Direksi (L3).
        </Callout>
      )}

      {/* Category table */}
      <Card className="mt-3 overflow-hidden">
        <CardHeader
          title="Pagu per kategori pekerjaan"
          description="Batang solid = realisasi, arsir = commitment PO/SPK yang belum ditagih."
          actions={
            <span className="hidden items-center gap-3 text-[11.5px] text-subtle sm:flex">
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-emerald-500" />Realisasi</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-emerald-500/10 text-emerald-500/60" style={hatch} />Commitment</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-surface-3" />Sisa</span>
            </span>
          }
        />
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>Kategori pekerjaan</th>
                <th className={cx(th, "text-right")}>Pagu</th>
                <th className={cx(th, "text-right")}>Commitment</th>
                <th className={cx(th, "text-right")}>Realisasi</th>
                <th className={cx(th, "text-right")}>Sisa</th>
                <th className={cx(th, "w-[200px]")}>Penyerapan</th>
                <th className={cx(th, "text-right")}>% Terserap</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className={trHover}>
                  <td className={td}>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-[12px] text-subtle">{r.items} item RAB</div>
                  </td>
                  <td className={cx(td, "text-right tabular")}>{rpShort(r.pagu)}</td>
                  <td className={cx(td, "text-right tabular text-muted")}>{r.commitment ? rpShort(r.commitment) : "–"}</td>
                  <td className={cx(td, "text-right tabular")}>{r.realized ? rpShort(r.realized) : "–"}</td>
                  <td className={cx(td, "text-right font-medium tabular")}>{rpShort(r.remaining)}</td>
                  <td className={td}>
                    <BudgetBar pagu={r.pagu} realized={r.realized} commitment={r.commitment} status={r.status} />
                  </td>
                  <td
                    className={cx(
                      td,
                      "text-right font-medium tabular",
                      r.status === "Kritis" && "text-red-600 dark:text-red-400",
                      r.status === "Waspada" && "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {decimal(r.absorbed, 1)}%
                  </td>
                  <td className={td}>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line-strong bg-surface-2">
                <td className={cx(td, "font-semibold")}>Total</td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rpShort(pagu)}</td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rpShort(commitment)}</td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rpShort(realized)}</td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rpShort(remaining)}</td>
                <td className={td}></td>
                <td className={cx(td, "text-right font-semibold tabular")}>{decimal(totalAbsorbed, 1)}%</td>
                <td className={td}></td>
              </tr>
            </tfoot>
          </table>
        </TableScroll>
      </Card>

      {/* RAB vs Realisasi */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="RAB vs Realisasi — estimasi margin"
            description="Estimate at completion (EAC) dari realisasi + sisa pekerjaan berdasarkan harga satuan terkini."
            icon={marginEac >= marginRab ? TrendingUp : TrendingDown}
          />
          <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
            <MarginBox label="Margin rencana (RAB)" value={marginRab} contract={project.contract} />
            <MarginBox label="Estimasi margin at completion" value={marginEac} contract={project.contract} delta={marginEac - marginRab} />
          </div>
          <div className="space-y-2.5 border-t border-line px-4 py-3.5">
            <CompareRow label="Nilai kontrak" value={project.contract} max={project.contract} className="bg-fg/80" />
            <CompareRow label="Biaya RAB (pagu)" value={pagu} max={project.contract} className="bg-indigo-500" />
            <CompareRow
              label="Biaya EAC"
              value={eac}
              max={project.contract}
              className={eac > pagu ? "bg-amber-500" : "bg-emerald-500"}
            />
          </div>
          <div className="border-t border-line px-4 py-3 text-[12.5px] text-muted">
            Biaya terserap <span className="font-semibold text-fg tabular">{pct(costProgress)}</span> dari pagu vs progres fisik{" "}
            <span className="font-semibold text-fg tabular">{project.progress}%</span>
            {" — "}
            {costProgress > project.progress + 3 ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">biaya mendahului progres, periksa produktivitas.</span>
            ) : (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">sejalan dengan progres fisik.</span>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Deviasi EAC per kategori" description="Positif = proyeksi biaya melebihi pagu RAB." />
          <div className="border-t border-line px-4 py-3">
            {variances.length === 0 && <p className="py-6 text-center text-[12.5px] text-subtle">Belum ada deviasi terhadap RAB.</p>}
            <ul className="space-y-2.5">
              {variances.map((v) => {
                const w = (Math.abs(v.delta) / maxVar) * 50;
                return (
                  <li key={v.name} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_84px] items-center gap-3">
                    <span className="truncate text-[12.5px] text-fg">{v.name}</span>
                    <div className="relative h-4">
                      <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                      <div
                        className={cx(
                          "absolute top-1/2 h-2 -translate-y-1/2 rounded-sm",
                          v.delta > 0 ? "left-1/2 bg-red-500/80" : "right-1/2 bg-emerald-500/80",
                        )}
                        style={{ width: `${w}%` }}
                      />
                    </div>
                    <span
                      className={cx(
                        "text-right text-[12.5px] font-medium tabular",
                        v.delta > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {v.delta > 0 ? "+" : ""}
                      {rpShort(v.delta)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-center justify-between border-t border-line bg-surface-2 px-4 py-2.5 text-[12.5px]">
            <span className="text-muted">Net deviasi</span>
            <span className={cx("font-semibold tabular", eac > pagu ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
              {eac > pagu ? "+" : ""}
              {rp(eac - pagu)}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Figure({ label, value, hint, swatch }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-subtle">
        {swatch === "solid" && <span className="h-2 w-3 rounded-sm bg-emerald-500" />}
        {swatch === "hatch" && <span className="h-2 w-3 rounded-sm bg-emerald-500/10 text-emerald-500/60" style={hatch} />}
        {label}
      </div>
      <div className="mt-0.5 text-[18px] font-semibold tracking-tight text-fg tabular">{value}</div>
      <div className="mt-0.5 text-[11.5px] text-subtle">{hint}</div>
    </div>
  );
}

function MarginBox({ label, value, contract, delta }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="text-[11.5px] font-medium text-subtle">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="text-[18px] font-semibold tracking-tight text-fg tabular">{rpShort(value)}</span>
        <span className="text-[12.5px] text-muted tabular">{pct((value / contract) * 100)}</span>
      </div>
      {delta != null && delta !== 0 && (
        <div className={cx("mt-0.5 text-[11.5px] font-medium tabular", delta < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
          {delta > 0 ? "+" : ""}
          {rpShort(delta)} vs RAB
        </div>
      )}
      {delta === 0 && <div className="mt-0.5 text-[11.5px] text-subtle">sesuai RAB</div>}
    </div>
  );
}

function CompareRow({ label, value, max, className }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)_88px] items-center gap-3">
      <span className="text-[12.5px] text-muted">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-surface-3">
        <div className={cx("h-full rounded-full transition-[width] duration-500", className)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-right text-[12.5px] font-medium text-fg tabular">{rpShort(value)}</span>
    </div>
  );
}
