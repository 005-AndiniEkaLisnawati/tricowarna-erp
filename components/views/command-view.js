"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  FileCode2,
  Gavel,
  HandCoins,
  LayoutGrid,
  PackageCheck,
  PiggyBank,
  Receipt,
  RefreshCw,
  Scale,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react";
import { projects } from "@/lib/data/org";
import { tenders } from "@/lib/data/tenders";
import { AreaChart, ColumnChart, Sparkline } from "@/components/charts";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Mono,
  PageHeader,
  Progress,
  Segmented,
  StatusBadge,
  td,
  th,
} from "@/components/ui";
import { TableScroll } from "@/components/table-scroll";
import { useToast } from "@/components/toast";
import { useCompany } from "@/components/shell/app-shell";
import { cx, date, decimal, pct, rp, rpShort } from "@/lib/format";

/* ───────────────────────── Mock series ───────────────────────── */

// Weekly group cash & bank balance (Rp miliar), weeks starting Monday.
const cashValues = [
  14.2, 14.8, 15.1, 14.6, 15.9, 16.4, 15.8, 16.9, 17.3, 16.7, 15.9, 16.6, 17.8, 18.2, 17.1, 16.4, 17.0, 17.9, 18.6,
  19.4, 18.1, 17.5, 18.0, 18.9, 17.54, 18.74,
];
const WEEK = 7 * 86_400_000;
const cashSeries = cashValues.map((value, i) => {
  const iso = new Date(Date.UTC(2026, 9, 5) - (cashValues.length - 1 - i) * WEEK).toISOString();
  return { value, label: `Minggu ${date(iso)}`, short: date(iso).replace(/ 2026$/, "") };
});

// Monthly group realisasi (Rp miliar), Jan–Sep 2026, against average monthly pagu.
const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep"];
const realisasi = [3.1, 3.4, 4.2, 4.0, 4.8, 5.3, 5.9, 6.4, 6.1].map((value, i) => ({
  value,
  short: months[i],
  label: `${months[i]} 2026`,
}));
const PAGU_BULANAN = 5.2;

const mFmt = (v) => `Rp${decimal(v, 2)} M`;
const tickFmt = (v) => `${decimal(v, v % 1 ? 1 : 0)} M`;

/* ───────────────────────── Actions & activity ───────────────────────── */

const seedActions = [
  { id: 1, role: "approver", project: "PRJ-TRT-2026-001", icon: ShoppingCart, kind: "PR menunggu approval", title: "PR-2026-0187 · Besi beton D16 & D13 (18,2 ton)", meta: "Jembatan A · diajukan Hendra G.", amount: 342_860_000, age: 3, action: "Approve", href: "/procurement/pr", severity: "amber" },
  { id: 2, role: "approver", project: "PRJ-TRT-2026-004", icon: Wallet, kind: "Expense menunggu approval", title: "EXP-2026-1285 · CV Batu Alam Mempawah", meta: "Kampung Nelayan · dibaca AI Vision 95,2%", amount: 18_750_000, age: 2, action: "Approve", href: "/finance/expenses", severity: "amber" },
  { id: 3, role: "approver", project: "PRJ-TRT-2026-004", icon: ShoppingCart, kind: "PO menunggu approval", title: "PO-2026-0351 · Sewa crane 25T – 45 hari", meta: "Kampung Nelayan · PT Sarana Alat Berat Borneo", amount: 486_000_000, age: 1, action: "Approve", href: "/procurement/po", severity: "neutral" },
  { id: 4, role: "finance", project: "PRJ-TRT-2026-002", icon: HandCoins, kind: "Advance belum settlement", title: "ADV-2026-0398 · Aspal curah & pengiriman", meta: "Jalan B · Agus Salim · umur 57 hari", amount: 12_700_000, age: 57, action: "Settle", href: "/finance/settlement", severity: "red" },
  { id: 5, role: "finance", project: "PRJ-TRT-2026-001", icon: Receipt, kind: "Bill jatuh tempo", title: "BILL-2026-0441 · PT Material Jaya Utama", meta: "Jatuh tempo 10 Okt · 3-way match OK", amount: 214_380_000, age: 0, action: "Bayar", href: "/procurement/bill", severity: "amber" },
  { id: 6, role: "finance", project: "PRJ-TRT-2026-004", icon: PackageCheck, kind: "GR belum ditagih", title: "GR-2026-0211 · Spun pile Ø40 (afiliasi TBP)", meta: "Diterima 22 Sep · belum ada tagihan", amount: 642_500_000, age: 16, action: "Buat bill", href: "/procurement/gr", severity: "neutral" },
  { id: 7, role: "accountant", project: null, icon: FileCode2, kind: "Faktur belum export Coretax", title: "7 faktur keluaran masa Sep 2026", meta: "Batas lapor 31 Okt · 1 faktur NPWP kosong", amount: 1_946_200_000, age: 8, action: "Export", href: "/accounting/tax", severity: "amber" },
  { id: 8, role: "accountant", project: "PRJ-TRT-2026-002", icon: Scale, kind: "Jurnal belum balance", title: "JU-2026-09-14 · Reklas biaya mobilisasi", meta: "Selisih Rp250.000 · dibuat manual", amount: 250_000, age: 4, action: "Perbaiki", href: "/accounting/gl", severity: "red" },
  { id: 9, role: "estimator", project: null, icon: Gavel, kind: "Deadline tender mendekat", title: "Kampung Nelayan Merah Putih Sungai Burung", meta: "Tenggat 12 Okt · 3 persyaratan wajib belum siap", amount: 14_386_500_000, age: 0, action: "Buka", href: "/tender", severity: "red" },
  { id: 10, role: "estimator", project: null, icon: PiggyBank, kind: "Item RAB belum ada harga", title: "4 item BOQ Sungai Burung tanpa harga master", meta: "Geotextile non-woven, bollard 5T, fender karet…", amount: null, age: 1, action: "Lengkapi", href: "/tender/boq", severity: "amber" },
];

const seedActivity = [
  { id: "a1", who: "Hendra Gunawan", initials: "HG", what: "mengajukan expense", doc: "EXP-2026-1287", detail: "BBM Rp4,86 jt · AI Vision 97,8%", when: "08:42" },
  { id: "a2", who: "Agent Hermes", initials: "AH", ai: true, what: "selesai mengurai KAK", doc: "TDR-2026-031", detail: "12 persyaratan · 19 item BOQ", when: "08:15" },
  { id: "a3", who: "Bambang S.", initials: "BS", what: "menyetujui L2 via email one-click", doc: "PR-2026-0184", detail: "Semen PCC 1.200 sak", when: "07:58" },
  { id: "a4", who: "Sistem", initials: "SY", what: "memposting jurnal intercompany 2 sisi", doc: "BCA-02", detail: "Pinjaman dari TBK Rp1,5 M", when: "Kemarin" },
  { id: "a5", who: "Budget guard", initials: "BG", ai: true, what: "memperingatkan pagu", doc: "PRJ-TRT-2026-002", detail: "Aspal AC-WC 92% terserap", when: "Kemarin" },
  { id: "a6", who: "Dimas Prakoso", initials: "DP", what: "mengekspor faktur ke Coretax", doc: "XML 5 faktur", detail: "Masa Agu 2026", when: "Kemarin" },
];

const roles = [
  { value: "all", label: "Semua" },
  { value: "approver", label: "Approver" },
  { value: "finance", label: "Finance" },
  { value: "accountant", label: "Akuntan" },
  { value: "estimator", label: "Estimator" },
];

const severityBar = { red: "bg-red-500", amber: "bg-amber-500", neutral: "bg-line-strong" };

/* ───────────────────────── Project health ───────────────────────── */

const health = [
  { code: "PRJ-TRT-2026-001", pagu: 16_210_000_000, commit: 2_140_000_000, real: 8_960_000_000, rab: 16.0, margin: 14.2, status: "Waspada", note: "Harga besi +6,8% sejak Jul" },
  { code: "PRJ-TRT-2026-002", pagu: 9_820_000_000, commit: 1_310_000_000, real: 3_844_000_000, rab: 13.5, margin: 7.9, status: "Kritis", note: "Aspal 92% pagu · progres 38%" },
  { code: "PRJ-TRT-2026-004", pagu: 21_480_000_000, commit: 3_920_000_000, real: 1_612_000_000, rab: 15.2, margin: 17.6, status: "Aman", note: "Precast afiliasi 4% di bawah RAB" },
];

const statusIcon = { Aman: CircleCheck, Waspada: TriangleAlert, Kritis: CircleAlert };
const statusRing = {
  Aman: "ring-emerald-500/40",
  Waspada: "ring-amber-500/50",
  Kritis: "ring-red-500/50",
};

export function CommandView() {
  const toast = useToast();
  const company = useCompany();
  const [role, setRole] = useState("all");
  const [projectFilter, setProjectFilter] = useState(null);
  const [actions, setActions] = useState(seedActions);
  const [activity, setActivity] = useState(seedActivity);
  const [cashRange, setCashRange] = useState("13");
  const [realView, setRealView] = useState("chart");

  const visible = useMemo(
    () =>
      actions.filter(
        (a) => (role === "all" || a.role === role) && (!projectFilter || a.project === projectFilter),
      ),
    [actions, role, projectFilter],
  );

  const resolve = (item, verb) => {
    setActions((list) => list.filter((a) => a.id !== item.id));
    if (verb === "do") {
      setActivity((list) => [
        {
          id: `u${item.id}`,
          who: "Rina Kartikasari",
          initials: "RK",
          what: `${item.action.toLowerCase()} — ${item.kind.toLowerCase()}`,
          doc: item.title.split(" · ")[0],
          detail: item.amount != null ? rpShort(item.amount) : item.meta,
          when: "Baru saja",
          fresh: true,
        },
        ...list,
      ]);
    }
    toast({
      title: verb === "skip" ? "Ditunda 24 jam" : `${item.action}: selesai`,
      description: item.title,
      tone: verb === "skip" ? "info" : "success",
    });
  };

  const cash = cashRange === "13" ? cashSeries.slice(-13) : cashSeries;
  const cashNow = cashValues.at(-1);
  const cashDelta = cashNow - cashValues.at(-2);
  const pipeline = tenders.filter((t) => t.status === "Disiapkan" || t.status === "Dianalisis");
  const pendingApprovals = actions.filter((a) => a.role === "approver");
  const filteredProject = projects.find((p) => p.code === projectFilter);

  const kpis = [
    { label: "Nilai kontrak berjalan", value: rpShort(projects.reduce((s, p) => s + p.contract, 0)), delta: "3 proyek", tone: "neutral", trend: [38, 38, 41, 41, 47, 47, 47, 54.8, 54.8] },
    { label: "Pipeline tender", value: rpShort(pipeline.reduce((s, t) => s + t.hps, 0)), delta: `${pipeline.length} paket`, tone: "neutral", trend: [12, 18, 15, 22, 27, 24, 31, 29, 32.6] },
    { label: "Approval tertunda", value: String(pendingApprovals.length), delta: rpShort(pendingApprovals.reduce((s, a) => s + (a.amount ?? 0), 0)), tone: "amber", trend: [7, 5, 6, 8, 4, 6, 5, 4, pendingApprovals.length] },
    { label: "Piutang termin BAST", value: "Rp4,06 M", delta: "Jbt A termin 3 Rp2,79 M", tone: "neutral", trend: [2.1, 2.8, 1.9, 3.2, 3.6, 2.4, 3.1, 3.8, 4.06] },
  ];

  return (
    <div>
      <PageHeader
        icon={LayoutGrid}
        title="Command Center"
        description={`${company.name} · Kamis, 8 Oktober 2026 — apa yang perlu diputuskan hari ini.`}
        actions={
          <>
            <span className="text-[12px] text-subtle">Sinkron 10:58 WIB</span>
            <Button size="md" icon={RefreshCw} onClick={() => toast({ title: "Data disinkronkan", tone: "info" })}>
              Sinkronkan
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* ── Hero: cash position ── */}
        <Card className="overflow-hidden xl:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
            <div>
              <p className="text-[12.5px] font-medium text-muted">Posisi kas & bank grup</p>
              <p className="mt-1 text-[48px] leading-none font-semibold tracking-tight text-fg">
                Rp{decimal(cashNow, 2)} M
              </p>
              <p className="mt-2 text-[12.5px] text-subtle">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  +Rp{decimal(cashDelta, 2)} M
                </span>{" "}
                vs minggu lalu · cukup 41 hari operasional
              </p>
            </div>
            <Segmented
              value={cashRange}
              onChange={setCashRange}
              items={[
                { value: "13", label: "13 minggu" },
                { value: "26", label: "26 minggu" },
              ]}
            />
          </div>
          <div className="px-2 pt-3 pb-2">
            <AreaChart data={cash} height={210} baseline="auto" format={mFmt} tickFormat={tickFmt} label="Saldo kas & bank grup per minggu" />
          </div>
          <div className="grid grid-cols-3 border-t border-line">
            {[
              ["TKN", "Rp12,18 M"],
              ["TBK", "Rp4,91 M"],
              ["TBP", "Rp1,65 M"],
            ].map(([k, v]) => (
              <div key={k} className="border-r border-line px-5 py-2.5 last:border-r-0">
                <p className="text-[11px] font-medium tracking-wide text-subtle uppercase">{k}</p>
                <p className="text-[14px] font-semibold text-fg tabular">{v}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── KPI tiles ── */}
        <div className="grid grid-cols-2 gap-4 xl:col-span-5">
          {kpis.map((k) => (
            <Card key={k.label} className="flex flex-col justify-between px-4 py-3.5">
              <div>
                <p className="text-[12.5px] font-medium text-muted">{k.label}</p>
                <p className="mt-2 text-[26px] leading-none font-semibold tracking-tight whitespace-nowrap text-fg">{k.value}</p>
                <p
                  className={cx(
                    "mt-1.5 truncate text-[12px]",
                    k.tone === "amber" ? "font-medium text-amber-600 dark:text-amber-400" : "text-subtle",
                  )}
                >
                  {k.delta}
                </p>
              </div>
              <Sparkline values={k.trend} w={160} h={40} className="mt-3 h-10 w-full" />
            </Card>
          ))}
        </div>

        {/* ── Action items ── */}
        <Card className="overflow-hidden xl:col-span-7">
          <CardHeader
            title="Daftar Tindakan"
            description={`${actions.length} item belum dilakukan · aksi langsung tanpa cari menu`}
            className="flex-wrap"
            actions={
              <Segmented
                value={role}
                onChange={setRole}
                items={roles.map((r) => ({
                  ...r,
                  count: r.value === "all" ? actions.length : actions.filter((a) => a.role === r.value).length,
                }))}
              />
            }
          />
          {filteredProject && (
            <div className="flex items-center gap-2 border-t border-line bg-surface-2 px-4 py-2 text-[12.5px]">
              <span className="text-subtle">Difilter:</span>
              <button
                onClick={() => setProjectFilter(null)}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-0.5 font-medium text-fg hover:border-line-strong"
              >
                {filteredProject.short}
                <X className="size-3 text-subtle" />
              </button>
            </div>
          )}
          <ul className="max-h-[440px] overflow-y-auto border-t border-line scroll-thin">
            {visible.length === 0 && (
              <EmptyState icon={Check} title="Semua beres" description="Tidak ada tindakan tertunda untuk filter ini." />
            )}
            {visible.map((a) => {
              const Icon = a.icon;
              return (
                <li
                  key={a.id}
                  className="group relative flex items-center gap-3 border-b border-line px-4 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2"
                >
                  <span className={cx("absolute inset-y-2.5 left-0 w-[3px] rounded-r-full", severityBar[a.severity])} />
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface">
                    <Icon className="size-4 text-muted" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-medium text-subtle">{a.kind}</p>
                    <Link href={a.href} className="block truncate text-[13.5px] font-medium text-fg hover:underline">
                      {a.title}
                    </Link>
                    <p className="truncate text-[12px] text-subtle">{a.meta}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    {a.amount != null && <p className="text-[13px] font-medium text-fg tabular">{rpShort(a.amount)}</p>}
                    <p
                      className={cx(
                        "flex items-center justify-end gap-1 text-[11.5px] tabular",
                        a.age > 30 ? "text-red-600 dark:text-red-400" : "text-subtle",
                      )}
                    >
                      <Clock className="size-3" />
                      {a.age === 0 ? "hari ini" : `${a.age} hari`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => resolve(a, "skip")}
                      aria-label="Tunda"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <X className="size-3.5" />
                    </Button>
                    <Button size="xs" variant={a.action === "Approve" ? "success" : "secondary"} onClick={() => resolve(a, "do")}>
                      {a.action}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* ── Project health ── */}
        <Card className="overflow-hidden xl:col-span-5">
          <CardHeader
            title="Kesehatan proyek"
            description="Klik status untuk memfilter daftar tindakan"
            actions={
              <Link href="/budget/project" className="text-subtle hover:text-fg" aria-label="Buka project budget">
                <ArrowUpRight className="size-4" />
              </Link>
            }
          />
          <ul className="divide-y divide-line border-t border-line">
            {health.map((h) => {
              const p = projects.find((x) => x.code === h.code);
              const used = ((h.real + h.commit) / h.pagu) * 100;
              const Icon = statusIcon[h.status];
              const active = projectFilter === h.code;
              const open = actions.filter((a) => a.project === h.code).length;
              return (
                <li key={h.code} className={cx("px-4 py-3 transition-colors", active && "bg-surface-2")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-fg">{p.name}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-[11.5px] text-subtle">
                        <Mono className="text-[11px]">{h.code}</Mono>· {h.note}
                      </p>
                    </div>
                    <button
                      onClick={() => setProjectFilter(active ? null : h.code)}
                      aria-pressed={active}
                      title={active ? "Hapus filter" : `Tampilkan ${open} tindakan ${p.short}`}
                      className={cx("shrink-0 rounded-md transition-shadow", active ? `ring-2 ${statusRing[h.status]}` : "hover:ring-2 hover:ring-line")}
                    >
                      <StatusBadge status={h.status} />
                    </button>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-4 text-[11.5px]">
                    <div>
                      <p className="text-subtle">Progres fisik</p>
                      <p className="font-medium text-fg tabular">{p.progress}%</p>
                      <Progress value={p.progress} className="mt-1" />
                    </div>
                    <div>
                      <p className="text-subtle">Budget terserap</p>
                      <p className="font-medium text-fg tabular">{pct(used)}</p>
                      <Progress value={used} tone={used - p.progress > 25 ? "amber" : "fg"} className="mt-1" />
                    </div>
                    <div>
                      <p className="text-subtle">Margin vs RAB</p>
                      <p className="font-medium text-fg tabular">
                        {pct(h.margin)}{" "}
                        <span className={h.margin < h.rab ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                          <Icon className="inline size-3 align-[-2px]" />
                        </span>
                      </p>
                      <p className="mt-0.5 text-subtle tabular">RAB {pct(h.rab)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* ── Realisasi bulanan ── */}
        <Card className="overflow-hidden xl:col-span-7">
          <CardHeader
            title="Realisasi biaya grup per bulan"
            description="Expense + GR + bill terposting, Jan–Sep 2026 (Rp miliar)"
            actions={
              <Segmented
                value={realView}
                onChange={setRealView}
                items={[
                  { value: "chart", label: "Grafik" },
                  { value: "table", label: "Tabel" },
                ]}
              />
            }
          />
          {realView === "chart" ? (
            <div className="px-2 pb-3">
              <ColumnChart
                data={realisasi}
                height={220}
                format={mFmt}
                tickFormat={tickFmt}
                reference={{ value: PAGU_BULANAN, label: `Pagu rata-rata Rp${decimal(PAGU_BULANAN, 1)} M/bln` }}
                label="Realisasi biaya grup per bulan"
              />
            </div>
          ) : (
            <TableScroll className="border-t border-line" maxHeight="max-h-[236px]">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={th}>Bulan</th>
                    <th className={cx(th, "text-right")}>Realisasi</th>
                    <th className={cx(th, "text-right")}>Pagu</th>
                    <th className={cx(th, "text-right")}>Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  {realisasi.map((r) => (
                    <tr key={r.label} className="border-t border-line">
                      <td className={td}>{r.label}</td>
                      <td className={cx(td, "text-right tabular")}>{mFmt(r.value)}</td>
                      <td className={cx(td, "text-right tabular text-muted")}>{mFmt(PAGU_BULANAN)}</td>
                      <td className={cx(td, "text-right tabular", r.value > PAGU_BULANAN ? "text-amber-600 dark:text-amber-400" : "text-muted")}>
                        {r.value > PAGU_BULANAN ? "+" : "−"}
                        {mFmt(Math.abs(r.value - PAGU_BULANAN))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </Card>

        {/* ── Activity feed ── */}
        <Card className="overflow-hidden xl:col-span-5">
          <CardHeader title="Aktivitas terbaru" description="Semua aksi manusia & AI tercatat di audit log" />
          <ol className="max-h-[268px] overflow-y-auto border-t border-line px-4 py-3 scroll-thin">
            {activity.map((e, i) => (
              <li key={e.id} className={cx("relative flex gap-3 pb-3.5 last:pb-0", e.fresh && "animate-pop")}>
                {i < activity.length - 1 && <span className="absolute top-7 bottom-0 left-3 w-px bg-line" />}
                <Avatar initials={e.initials} tone={e.ai ? "indigo" : e.fresh ? "green" : "zinc"} className="relative" />
                <div className="min-w-0 flex-1 text-[12.5px] leading-snug">
                  <p className="text-fg">
                    <span className="font-medium">{e.who}</span> <span className="text-muted">{e.what}</span>{" "}
                    <Mono className="text-[11.5px] text-fg">{e.doc}</Mono>
                  </p>
                  <p className="mt-0.5 truncate text-subtle">{e.detail}</p>
                </div>
                <span className="shrink-0 text-[11.5px] text-subtle tabular">{e.when}</span>
              </li>
            ))}
          </ol>
        </Card>

        {/* ── AI summary ── */}
        <Card className="overflow-hidden xl:col-span-5">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="flex items-center gap-2 text-[13.5px] font-semibold text-fg">
              <span className="flex size-6 items-center justify-center rounded-md bg-fg text-surface">
                <Bot className="size-3.5" />
              </span>
              Ringkasan eksekutif
            </span>
            <Badge>Agent Hermes</Badge>
          </div>
          <ul className="space-y-2.5 px-4 py-3.5 text-[13px] leading-relaxed text-fg">
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-500" />
              <span>
                <b>Jalan B</b> margin 7,9% vs RAB 13,5% — aspal sudah 92% pagu di progres 38%. Ajukan CCO eskalasi sebelum progres 50%.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>
                Kunci harga besi sisa ±42 ton <b>Jembatan A</b> lewat PO kontrak — hemat ±Rp96 jt.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>
                Tagih termin 3 Jembatan A (Rp2,79 M, BAST 30 Sep) sebelum membayar bill non-kritis.
              </span>
            </li>
          </ul>
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <span className="text-[11.5px] text-subtle">Sumber: GL, budget, PO & history harga</span>
            <Link href="/command/insight" className="flex items-center gap-1 text-[12.5px] font-medium text-fg hover:underline">
              Tanya Hermes <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>

        {/* ── Pipeline tender ── */}
        <Card className="overflow-hidden xl:col-span-7">
          <CardHeader
            title="Pipeline tender berjalan"
            icon={Sparkles}
            actions={
              <Link href="/tender">
                <Button size="xs" iconRight={ArrowRight}>
                  Semua tender
                </Button>
              </Link>
            }
          />
          <div className="grid grid-cols-1 border-t border-line md:grid-cols-3">
            {pipeline.map((t) => {
              const total = t.requirements.length;
              const done = t.requirements.filter((r) => r.done).length;
              return (
                <Link
                  key={t.id}
                  href="/tender"
                  className="border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2 md:border-r md:border-b-0 md:last:border-r-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Mono className="text-[11px]">{t.code}</Mono>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug font-medium text-fg">{t.title}</p>
                  <p className="mt-1 text-[13px] font-semibold text-fg tabular">{rp(t.hps)}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Progress value={(done / total) * 100} tone={done === total ? "green" : "amber"} />
                    <span className="shrink-0 text-[11.5px] text-subtle tabular">
                      {done}/{total}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
