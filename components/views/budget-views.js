"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  Check,
  ChevronDown,
  CircleCheck,
  FilePenLine,
  FileSpreadsheet,
  Infinity as InfinityIcon,
  Layers,
  LoaderCircle,
  PiggyBank,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  TriangleAlert,
  Wrench,
  X,
} from "lucide-react";
import {
  CURRENT_MONTH,
  MONTHS,
  budgetTotals,
  costCategories,
  departmentBudgetById,
  departmentBudgetList,
  groupTotals,
  itemTotals,
  projectBudgetById,
  projectBudgetList,
} from "@/lib/data/budgeting";
import {
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
  Select,
  StatusBadge,
  Tabs,
  td,
  th,
} from "@/components/ui";
import { TableScroll } from "@/components/table-scroll";
import { useToast } from "@/components/toast";
import { cx, decimal, pct, rp, rpShort } from "@/lib/format";

const KINDS = {
  project: {
    title: "Project Budget",
    statTitle: "Budgeting Statistic",
    icon: PiggyBank,
    base: "/budget/project",
    list: projectBudgetList,
    byId: projectBudgetById,
    newLabel: "New Project Budget",
    tabs: ["On Going", "Multi Years", "Closed", "Draft"],
    nameHeader: "Budget Name",
    refHeader: "Project",
  },
  department: {
    title: "Cost Center",
    statTitle: "Department Budgets",
    icon: Building2,
    base: "/budget/cost-center",
    list: departmentBudgetList,
    byId: departmentBudgetById,
    newLabel: "New Department Budget",
    tabs: ["On Going", "Closed", "Draft"],
    nameHeader: "Budget Owner",
    refHeader: "Cost Center",
  },
};

const tabIcon = { "On Going": TrendingUp, "Multi Years": InfinityIcon, Closed: CircleCheck, Draft: FilePenLine };

// The client's system highlights its maintenance actions in amber; keep that cue, muted.
const amberButton =
  "border-amber-500/40 bg-amber-500/10 text-amber-800 hover:border-amber-500/60 hover:bg-amber-500/15 dark:text-amber-300";

const hatch = { backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 2px, transparent 2px 5px)" };

function UsageBar({ budget, realization, commitment, over, className }) {
  const r = budget ? Math.min(100, (realization / budget) * 100) : 0;
  const c = budget ? Math.min(100 - r, (commitment / budget) * 100) : 0;
  return (
    <div className={cx("flex h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div className={cx("h-full transition-[width] duration-500", over ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${r}%` }} />
      <div
        className={cx("h-full transition-[width] duration-500", over ? "bg-red-500/10 text-red-500/70" : "bg-emerald-500/10 text-emerald-500/60")}
        style={{ width: `${c}%`, ...hatch }}
      />
    </div>
  );
}

/* ═════════════════════════ LIST ═════════════════════════ */

export function BudgetListView({ kind }) {
  const cfg = KINDS[kind];
  const toast = useToast();
  const router = useRouter();
  const [rows, setRows] = useState(() => cfg.list.map((b) => ({ ...b, totals: budgetTotals(b) })));
  const [tab, setTab] = useState("On Going");
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);

  const count = (s) => rows.filter((r) => r.status === s).length;
  const active = rows.filter((r) => r.status !== "Draft");
  const sum = (k) => active.reduce((s, r) => s + r.totals[k], 0);
  const anomalies = rows.filter((r) => r.anomaly).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.status === tab &&
        (!q || [r.name, r.project, r.projectCode, r.costCenter, r.owner].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [rows, tab, query]);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast({ title: "Budget disinkronkan", description: "Commitment PR/PO dan realisasi expense/bill diperbarui hingga hari ini." });
    }, 900);
  };

  const fixAnomalies = () => {
    setRows((rs) => rs.map((r) => ({ ...r, anomaly: undefined })));
    toast({ title: `${anomalies} anomali multi years diperbaiki`, description: "Carry-over realisasi & pagu antar periode diselaraskan." });
  };

  return (
    <div>
      {/* Statistic */}
      <Card className="p-5">
        <h1 className="flex items-center gap-2.5 text-[20px] font-semibold tracking-tight text-fg">
          <cfg.icon className="size-5" strokeWidth={2} />
          {cfg.statTitle}
        </h1>
        <div className={cx("mt-4 grid grid-cols-2 gap-3", kind === "project" ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
          <CountTile icon={Layers} label="Total Budgets" value={rows.length} />
          <CountTile icon={FilePenLine} label="Draft" value={count("Draft")} />
          <CountTile icon={TrendingUp} label="On Going" value={count("On Going")} tone="green" />
          <CountTile icon={CircleCheck} label="Closed" value={count("Closed")} />
          {kind === "project" && <CountTile icon={InfinityIcon} label="Multi Years" value={count("Multi Years")} tone="violet" />}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <MoneyTile label="Total Budget" value={sum("budget")} hint={`${active.length} budget aktif & closed`} />
          <MoneyTile label="Realization" value={sum("realization")} hint={`${pct((sum("realization") / sum("budget")) * 100)} dari total budget`} swatch="solid" />
          <MoneyTile label="Commitment" value={sum("commitment")} hint="PR/PO disetujui, belum terealisasi" swatch="hatch" />
          <MoneyTile label="Remaining" value={sum("remaining")} hint="Budget − commitment − realisasi" />
        </div>
      </Card>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="md" icon={Plus} onClick={() => setCreating(true)}>
          {cfg.newLabel}
        </Button>
        <Button size="md" icon={syncing ? LoaderCircle : RefreshCw} disabled={syncing} onClick={sync} className={syncing ? "[&>svg]:animate-spin" : ""}>
          Sync Budget Data
        </Button>
        {kind === "project" ? (
          <Button size="md" icon={Wrench} className={amberButton} disabled={!anomalies} onClick={fixAnomalies}>
            Fix Multi Years Anomalies{anomalies ? ` (${anomalies})` : ""}
          </Button>
        ) : (
          <Button
            size="md"
            icon={ArrowLeftRight}
            className={amberButton}
            onClick={() => toast({ title: "Budget Migration disiapkan", description: "Sisa budget 2026 akan dibawa sebagai draft 2027 per departemen.", tone: "info" })}
          >
            Budget Migration
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="mt-4 overflow-hidden">
        <div className="px-3">
          <Tabs
            value={tab}
            onChange={setTab}
            className="border-b-0"
            items={cfg.tabs.map((t) => ({ value: t, label: t, icon: tabIcon[t], count: count(t) }))}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Button icon={FileSpreadsheet} onClick={() => toast({ title: "Export Excel disiapkan", tone: "info" })}>
              Export
            </Button>
            <Button variant="ghost" size="icon" aria-label="Muat ulang" onClick={sync}>
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </div>
        </div>
        <TableScroll className="border-t border-line">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>{cfg.nameHeader}</th>
                <th className={th}>{cfg.refHeader}</th>
                <th className={th}>Year</th>
                <th className={cx(th, "text-right")}>Total Commitment</th>
                <th className={cx(th, "text-right")}>Total Realization</th>
                <th className={cx(th, "text-right")}>Remaining</th>
                <th className={cx(th, "text-right")}>Total Budget</th>
                <th className={cx(th, "w-[150px]")}>Terserap</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const used = r.totals.budget ? ((r.totals.commitment + r.totals.realization) / r.totals.budget) * 100 : 0;
                const over = r.totals.remaining < 0;
                const open = () => (r.fresh ? toast({ title: "Draft baru belum punya item", description: "Tambahkan item & kategori biaya setelah draft disimpan ke server.", tone: "info" }) : router.push(`${cfg.base}/${r.id}`));
                return (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    onClick={open}
                    onKeyDown={(e) => e.key === "Enter" && open()}
                    className="cursor-pointer border-t border-line outline-none focus-visible:bg-surface-2"
                  >
                    <td className={cx(td, "whitespace-normal")}>
                      <div className="font-medium">{r.name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-subtle">
                        {r.owner}
                        {r.anomaly && (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400" title={r.anomaly}>
                            <TriangleAlert className="size-3" /> anomali
                          </span>
                        )}
                        {r.fresh && <Badge tone="blue">Baru</Badge>}
                      </div>
                    </td>
                    <td className={cx(td, "whitespace-normal")}>
                      {kind === "project" ? (
                        <>
                          <div>{r.project}</div>
                          <Mono className="text-[11.5px]">{r.projectCode}</Mono>
                        </>
                      ) : (
                        r.costCenter
                      )}
                    </td>
                    <td className={cx(td, "tabular")}>{r.year}</td>
                    <td className={cx(td, "text-right tabular text-muted")}>{rp(r.totals.commitment)}</td>
                    <td className={cx(td, "text-right tabular")}>{rp(r.totals.realization)}</td>
                    <td className={cx(td, "text-right font-medium tabular", over && "text-red-600 dark:text-red-400")}>{rp(r.totals.remaining)}</td>
                    <td className={cx(td, "text-right font-medium tabular")}>{rp(r.totals.budget)}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <UsageBar budget={r.totals.budget} realization={r.totals.realization} commitment={r.totals.commitment} over={over} />
                        <span className="w-11 shrink-0 text-right text-[12px] text-muted tabular">{decimal(used, 0)}%</span>
                      </div>
                    </td>
                    <td className={td}>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState icon={Layers} title={`Tidak ada budget ${tab}`} description="Ubah tab atau kata kunci pencarian." />}
        </TableScroll>
      </Card>

      {creating && (
        <NewBudgetModal
          kind={kind}
          onClose={() => setCreating(false)}
          onCreate={(b) => {
            setRows((rs) => [b, ...rs]);
            setTab("Draft");
            setCreating(false);
            toast({ title: `${b.name} dibuat sebagai Draft`, description: `Total budget ${rp(b.totals.budget)} — ajukan approval setelah item lengkap.` });
          }}
        />
      )}
    </div>
  );
}

function CountTile({ icon: Icon, label, value, tone }) {
  const color = { green: "text-emerald-600 dark:text-emerald-400", violet: "text-violet-600 dark:text-violet-400" }[tone] ?? "text-muted";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
      <Icon className={cx("size-4.5 shrink-0", color)} strokeWidth={2} />
      <span className="flex-1 text-[13.5px] text-muted">{label}</span>
      <span className="text-[22px] leading-none font-semibold tracking-tight text-fg tabular">{value}</span>
    </div>
  );
}

function MoneyTile({ label, value, hint, swatch }) {
  return (
    <div className="rounded-xl border border-line px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
        {swatch === "solid" && <span className="h-2 w-3 rounded-sm bg-emerald-500" />}
        {swatch === "hatch" && <span className="h-2 w-3 rounded-sm bg-emerald-500/10 text-emerald-500/60" style={hatch} />}
        {label}
      </div>
      <div className="mt-1 text-right text-[24px] leading-tight font-semibold tracking-tight text-fg">{rp(value)}</div>
      <div className="text-right text-[11.5px] text-subtle">{hint}</div>
    </div>
  );
}

function NewBudgetModal({ kind, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [ref, setRef] = useState("");
  const [year, setYear] = useState("2027");
  const [amount, setAmount] = useState(0);
  const valid = name.trim() && amount > 0;
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={KINDS[kind].newLabel}
      description="Budget dibuat sebagai Draft; item per kategori biaya ditambahkan di halaman detail."
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
              onCreate({
                id: `new-${name.toLowerCase().replace(/\W+/g, "-")}`,
                name: name.toUpperCase(),
                project: ref,
                projectCode: "—",
                costCenter: ref || name.toUpperCase(),
                year,
                status: "Draft",
                owner: "Rina Kartikasari",
                fresh: true,
                groups: [],
                totals: { budget: amount, commitment: 0, realization: 0, remaining: amount },
              })
            }
          >
            Buat draft
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label={kind === "project" ? "Nama budget" : "Budget owner"}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "project" ? "Mis. Jasa Pemeliharaan IPAL - 5" : "Mis. HRGA - 2027"} />
        </Field>
        <Field label={kind === "project" ? "Proyek" : "Cost center"}>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder={kind === "project" ? "Nama / kode proyek" : "HRGA, HSE, IT…"} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tahun">
            <Select value={year} onChange={(e) => setYear(e.target.value)}>
              <option>2026</option>
              <option>2027</option>
            </Select>
          </Field>
          <Field label="Total budget">
            <Input
              inputMode="numeric"
              value={amount ? new Intl.NumberFormat("id-ID").format(amount) : ""}
              onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)}
              className="tabular"
              placeholder="0"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* ═════════════════════════ DETAIL ═════════════════════════ */

const DPP_FACTOR = 1.11;

export function BudgetDetailView({ kind, id }) {
  const cfg = KINDS[kind];
  const toast = useToast();
  const source = cfg.byId[id];
  const [groups, setGroups] = useState(source.groups);
  const [query, setQuery] = useState("");
  const [dpp, setDpp] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const v = (n) => (dpp ? n / DPP_FACTOR : n);
  const reportYear = source.year.includes("2025") && !source.year.includes("2026") ? "2025" : "2026";
  const showMonths = reportYear === "2026" ? CURRENT_MONTH + 1 : 12;

  const computed = useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        totals: groupTotals(g),
        items: g.items.map((it) => ({ ...it, totals: itemTotals(it) })),
      })),
    [groups],
  );

  const totals = useMemo(() => {
    const t = { budget: 0, commitment: 0, realization: 0, remaining: 0 };
    for (const g of computed) for (const k in t) t[k] += g.totals[k];
    return t;
  }, [computed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return computed;
    return computed
      .map((g) => {
        const groupHit = `${g.coa} ${g.name}`.toLowerCase().includes(q);
        return { ...g, items: groupHit ? g.items : g.items.filter((it) => `${it.code} ${it.name}`.toLowerCase().includes(q)) };
      })
      .filter((g) => g.items.length);
  }, [computed, query]);

  const outOfBudget = computed.filter((g) => g.totals.status === "Out of Budget");
  const used = totals.budget ? ((totals.commitment + totals.realization) / totals.budget) * 100 : 0;
  const monthlyTotals = MONTHS.map((_, m) => computed.reduce((s, g) => s + g.items.reduce((a, it) => a + it.monthly[m], 0), 0));
  const hasCarry = computed.some((g) => g.items.some((it) => it.carry));

  const allCollapsed = computed.length > 0 && computed.every((g) => collapsed[g.coa]);
  const toggleAll = () => setCollapsed(allCollapsed ? {} : Object.fromEntries(computed.map((g) => [g.coa, true])));

  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast({ title: "Data budget disinkronkan", description: "Commitment & realisasi diperbarui dari PR/PO, expense dan bill." });
    }, 900);
  };

  const addItem = ({ coa, name, budget }) => {
    const code = `SE${(0xa3f10 + groups.reduce((s, g) => s + g.items.length, 0) * 37).toString(16).toUpperCase().slice(-5)}`;
    const item = { code, name, budget, commitment: 0, carry: 0, monthly: Array(12).fill(0), fresh: true };
    setGroups((gs) => {
      const exists = gs.some((g) => g.coa === coa);
      const next = exists
        ? gs.map((g) => (g.coa === coa ? { ...g, items: [...g.items, item] } : g))
        : [...gs, { coa, name: costCategories[coa] ?? coa, items: [item] }];
      return [...next].sort((a, b) => Number(a.coa) - Number(b.coa));
    });
    setCollapsed((c) => ({ ...c, [coa]: false }));
    setAdding(false);
    toast({ title: `${code} ditambahkan ke ${coa}`, description: `${name} · budget ${rp(budget)}` });
  };

  return (
    <div>
      <Link href={cfg.base} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-3.5" /> {cfg.title}
      </Link>

      {/* Header card */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-4 pb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[19px] font-semibold tracking-tight text-fg">{source.name}</h1>
              <StatusBadge status={source.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-subtle">
              {kind === "project" ? (
                <>
                  <Mono>{source.projectCode}</Mono>
                  <span>{source.location}</span>
                </>
              ) : (
                <span>Cost center {source.costCenter}</span>
              )}
              <span>Tahun {source.year}</span>
              <span>PIC {source.owner}</span>
            </div>
            <div className="mt-2">
              <Badge tone="indigo">
                <FileSpreadsheet className="size-3" />
                {source.source}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={syncing ? LoaderCircle : RefreshCw} disabled={syncing} onClick={sync} className={syncing ? "[&>svg]:animate-spin" : ""}>
              Sync Budget Data
            </Button>
            <Button icon={FileSpreadsheet} onClick={() => toast({ title: "Monthly Budget Report diekspor", description: `${source.name} · ${reportYear}`, tone: "info" })}>
              Export
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
              Add Item / Budget Group
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line lg:grid-cols-4">
          <Figure label="Total Budget" value={rp(v(totals.budget))} hint={`${computed.length} kategori biaya · ${computed.reduce((s, g) => s + g.items.length, 0)} item`} />
          <Figure label="Commitment" value={rp(v(totals.commitment))} hint={`${pct(totals.budget ? (totals.commitment / totals.budget) * 100 : 0)} budget`} swatch="hatch" />
          <Figure label="Realization" value={rp(v(totals.realization))} hint={`${pct(totals.budget ? (totals.realization / totals.budget) * 100 : 0)} budget`} swatch="solid" />
          <Figure label="Remaining" value={rp(v(totals.remaining))} hint={totals.remaining < 0 ? "melebihi budget" : "tersedia"} danger={totals.remaining < 0} />
        </div>
        <div className="border-t border-line px-5 py-3">
          <div className="mb-1.5 flex items-center justify-between text-[12px] text-subtle">
            <span>Terserap (realisasi + commitment)</span>
            <span className="font-medium text-fg tabular">{pct(used)}</span>
          </div>
          <UsageBar budget={totals.budget} realization={totals.realization} commitment={totals.commitment} over={used > 100} className="h-2.5" />
        </div>
      </Card>

      {outOfBudget.length > 0 && (
        <Callout tone="red" icon={TriangleAlert} title={`${outOfBudget.length} kategori biaya Out of Budget.`} className="mt-3">
          {outOfBudget.map((g, i) => (
            <span key={g.coa}>
              {i > 0 && "; "}
              <span className="font-medium">
                {g.coa} – {g.name}
              </span>{" "}
              lewat <span className="font-semibold tabular">{rp(v(-g.totals.remaining))}</span>
            </span>
          ))}
          . PR/PO baru di kategori ini butuh approval Direksi (L3).
        </Callout>
      )}

      {/* Category summary */}
      <Card className="mt-3 overflow-hidden">
        <CardHeader
          title="Ringkasan per Kategori Biaya"
          description="Status On / Out of Budget dihitung per kategori biaya: commitment + realisasi dibanding budget kategori."
          actions={
            <span className="hidden items-center gap-3 text-[11.5px] text-subtle sm:flex">
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-emerald-500" />Realisasi</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-emerald-500/10 text-emerald-500/60" style={hatch} />Commitment</span>
            </span>
          }
        />
        <TableScroll className="border-t border-line">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Kategori biaya</th>
                <th className={cx(th, "text-right")}>Budget</th>
                <th className={cx(th, "text-right")}>Commitment</th>
                <th className={cx(th, "text-right")}>Realization</th>
                <th className={cx(th, "text-right")}>Remaining</th>
                <th className={cx(th, "w-[180px]")}>Penyerapan</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((g) => {
                const absorbed = g.totals.budget ? ((g.totals.commitment + g.totals.realization) / g.totals.budget) * 100 : 0;
                const over = g.totals.status === "Out of Budget";
                return (
                  <tr key={g.coa} className="border-t border-line">
                    <td className={td}>
                      <Mono className="mr-2 text-fg">{g.coa}</Mono>
                      {g.name}
                    </td>
                    <td className={cx(td, "text-right tabular")}>{rp(v(g.totals.budget))}</td>
                    <td className={cx(td, "text-right tabular text-muted")}>{g.totals.commitment ? rp(v(g.totals.commitment)) : "–"}</td>
                    <td className={cx(td, "text-right tabular")}>{g.totals.realization ? rp(v(g.totals.realization)) : "–"}</td>
                    <td className={cx(td, "text-right font-medium tabular", over && "text-red-600 dark:text-red-400")}>{rp(v(g.totals.remaining))}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <UsageBar budget={g.totals.budget} realization={g.totals.realization} commitment={g.totals.commitment} over={over} />
                        <span className={cx("w-11 shrink-0 text-right text-[12px] tabular", over ? "font-medium text-red-600 dark:text-red-400" : "text-muted")}>
                          {decimal(absorbed, 0)}%
                        </span>
                      </div>
                    </td>
                    <td className={td}>
                      <StatusBadge status={g.totals.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      {/* Monthly budget report, grouped by cost category */}
      <Card className="mt-3 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3.5 pb-3">
          <div>
            <h3 className="text-[13.5px] font-semibold text-fg">Monthly Budget Report – {reportYear}</h3>
            <p className="mt-0.5 text-xs text-subtle">Item dikelompokkan per kategori biaya (COA). Klik baris kategori untuk buka/tutup.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-muted select-none">
              <span className="relative inline-flex">
                <input type="checkbox" checked={dpp} onChange={(e) => setDpp(e.target.checked)} className="peer sr-only" />
                <span className="h-5 w-9 rounded-full bg-surface-3 ring-1 ring-line transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)]" />
                <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </span>
              Show DPP (Exclude 11% PPN)
            </label>
            <Button size="xs" variant="ghost" onClick={toggleAll}>
              {allCollapsed ? "Buka semua" : "Tutup semua"}
            </Button>
            <div className="relative w-56">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search budget item / product…"
                className="h-8 w-full rounded-md border border-line bg-surface pr-7 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute top-1/2 right-2 -translate-y-1/2 text-subtle hover:text-fg" aria-label="Hapus pencarian">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <TableScroll className="border-t border-line" maxHeight="max-h-[min(78dvh,860px)]">
          <table className="w-full">
            <thead>
              <tr>
                <th className={cx(th, "min-w-[340px]")}>Budget Item</th>
                <th className={cx(th, "text-right")}>Budget</th>
                <th className={cx(th, "text-right")}>Commitment</th>
                <th className={cx(th, "text-right")}>Realization</th>
                <th className={cx(th, "text-right")}>Remaining</th>
                <th className={cx(th, "text-right")}>%</th>
                {hasCarry && <th className={cx(th, "text-right")}>s/d 2025</th>}
                {MONTHS.map((m, i) => (
                  <th key={m} className={cx(th, "text-right", i >= showMonths && "text-subtle/50")}>
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            {filtered.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={8 + MONTHS.length}>
                    <EmptyState icon={Search} title="Item tidak ditemukan" description="Cari dengan kode item (mis. SE3A1DA) atau nama." />
                  </td>
                </tr>
              </tbody>
            )}
            {filtered.map((g) => {
              const open = !collapsed[g.coa] || query;
              const over = g.totals.status === "Out of Budget";
              const gMonthly = MONTHS.map((_, m) => g.items.reduce((s, it) => s + it.monthly[m], 0));
              return (
                <tbody key={g.coa}>
                  <tr
                    onClick={() => setCollapsed((c) => ({ ...c, [g.coa]: !c[g.coa] }))}
                    className="cursor-pointer border-t border-sky-500/20 bg-sky-500/[0.07] dark:bg-sky-500/10"
                  >
                    <td className={cx(td, "font-semibold")}>
                      <span className="flex items-center gap-2">
                        <ChevronDown className={cx("size-3.5 shrink-0 text-subtle transition-transform", !open && "-rotate-90")} />
                        <span className="truncate">
                          {g.coa} - {g.name}
                        </span>
                        <StatusBadge status={g.totals.status} className="ml-auto" />
                      </span>
                    </td>
                    <td className={cx(td, "text-right font-semibold tabular")}>{rp(v(g.totals.budget))}</td>
                    <td className={cx(td, "text-right font-semibold tabular")}>{g.totals.commitment ? rp(v(g.totals.commitment)) : "–"}</td>
                    <td className={cx(td, "text-right font-semibold tabular")}>{g.totals.realization ? rp(v(g.totals.realization)) : "–"}</td>
                    <td className={cx(td, "text-right font-semibold tabular", over && "text-red-600 dark:text-red-400")}>{rp(v(g.totals.remaining))}</td>
                    <td className={cx(td, "text-right font-semibold tabular", over && "text-red-600 dark:text-red-400")}>
                      {g.totals.budget ? decimal(((g.totals.commitment + g.totals.realization) / g.totals.budget) * 100, 0) : 0}%
                    </td>
                    {hasCarry && <td className={cx(td, "text-right font-semibold tabular")}>{rp(v(g.items.reduce((s, it) => s + (it.carry ?? 0), 0)))}</td>}
                    {gMonthly.map((m, i) => (
                      <td key={i} className={cx(td, "text-right font-semibold tabular", i >= showMonths && "text-subtle/50")}>
                        {m ? rpShort(v(m)).replace("Rp", "") : "–"}
                      </td>
                    ))}
                  </tr>
                  {open &&
                    g.items.map((it) => {
                      const itOver = it.totals.remaining < 0;
                      const itPct = it.totals.budget ? ((it.totals.commitment + it.totals.realization) / it.totals.budget) * 100 : 0;
                      return (
                        <tr key={it.code + it.name} className={cx("border-t border-line", it.fresh && "bg-emerald-500/[0.05]")}>
                          <td className={cx(td, "pl-9")}>
                            <span className="flex items-center gap-2.5">
                              <span className="shrink-0 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11.5px] text-muted">{it.code}</span>
                              <span className="truncate text-sky-700 dark:text-sky-400">{it.name}</span>
                            </span>
                          </td>
                          <td className={cx(td, "text-right tabular")}>{rp(v(it.totals.budget))}</td>
                          <td className={cx(td, "text-right tabular text-muted")}>{it.totals.commitment ? rp(v(it.totals.commitment)) : "–"}</td>
                          <td className={cx(td, "text-right tabular")}>{it.totals.realization ? rp(v(it.totals.realization)) : "–"}</td>
                          <td className={cx(td, "text-right tabular", itOver && "font-medium text-red-600 dark:text-red-400")}>{rp(v(it.totals.remaining))}</td>
                          <td className={cx(td, "text-right tabular", itOver ? "text-red-600 dark:text-red-400" : "text-muted")}>{decimal(itPct, 0)}%</td>
                          {hasCarry && <td className={cx(td, "text-right tabular text-muted")}>{it.carry ? rp(v(it.carry)) : "–"}</td>}
                          {it.monthly.map((m, i) => (
                            <td key={i} className={cx(td, "text-right tabular", m ? "text-fg" : "text-subtle/60")}>
                              {m ? rpShort(v(m)).replace("Rp", "") : "–"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                </tbody>
              );
            })}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-line-strong bg-surface-2">
                  <td className={cx(td, "font-semibold")}>Total {dpp ? "(DPP)" : ""}</td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{rp(v(totals.budget))}</td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{rp(v(totals.commitment))}</td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{rp(v(totals.realization))}</td>
                  <td className={cx(td, "text-right font-semibold tabular", totals.remaining < 0 && "text-red-600 dark:text-red-400")}>{rp(v(totals.remaining))}</td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{decimal(used, 0)}%</td>
                  {hasCarry && <td className={cx(td, "text-right font-semibold tabular")}>{rp(v(computed.reduce((s, g) => s + g.items.reduce((a, it) => a + (it.carry ?? 0), 0), 0)))}</td>}
                  {monthlyTotals.map((m, i) => (
                    <td key={i} className={cx(td, "text-right font-semibold tabular")}>
                      {m ? rpShort(v(m)).replace("Rp", "") : "–"}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </TableScroll>
      </Card>

      {adding && <AddItemModal groups={groups} onClose={() => setAdding(false)} onAdd={addItem} />}
    </div>
  );
}

function Figure({ label, value, hint, swatch, danger }) {
  return (
    <div className="bg-surface px-5 py-3">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-subtle">
        {swatch === "solid" && <span className="h-2 w-3 rounded-sm bg-emerald-500" />}
        {swatch === "hatch" && <span className="h-2 w-3 rounded-sm bg-emerald-500/10 text-emerald-500/60" style={hatch} />}
        {label}
      </div>
      <div className={cx("mt-0.5 text-[18px] font-semibold tracking-tight tabular", danger ? "text-red-600 dark:text-red-400" : "text-fg")}>{value}</div>
      <div className="mt-0.5 text-[11.5px] text-subtle">{hint}</div>
    </div>
  );
}

function AddItemModal({ groups, onClose, onAdd }) {
  const [coa, setCoa] = useState(groups[0]?.coa ?? "21010");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState(0);
  const used = new Set(groups.map((g) => g.coa));
  const valid = name.trim() && budget > 0;
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Add Item / Budget Group"
      description="Pilih kategori biaya yang ada, atau kategori baru untuk membuat budget group."
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" icon={Check} disabled={!valid} onClick={() => onAdd({ coa, name: name.trim(), budget })}>
            Tambah item
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Kategori biaya (COA)">
          <Select value={coa} onChange={(e) => setCoa(e.target.value)}>
            <optgroup label="Kategori di budget ini">
              {groups.map((g) => (
                <option key={g.coa} value={g.coa}>
                  {g.coa} - {g.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Budget group baru">
              {Object.entries(costCategories)
                .filter(([c]) => !used.has(c))
                .map(([c, n]) => (
                  <option key={c} value={c}>
                    {c} - {n}
                  </option>
                ))}
            </optgroup>
          </Select>
        </Field>
        <Field label="Nama item">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mis. Tiket pesawat tenaga kerja 6 orang CGK - SBY" />
        </Field>
        <Field label="Budget item (termasuk PPN)">
          <Input
            inputMode="numeric"
            value={budget ? new Intl.NumberFormat("id-ID").format(budget) : ""}
            onChange={(e) => setBudget(Number(e.target.value.replace(/\D/g, "")) || 0)}
            className="tabular"
            placeholder="0"
          />
        </Field>
      </div>
    </Modal>
  );
}
