"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, HandCoins, Plus, Search, TriangleAlert, Trophy, Wallet, CircleCheck } from "lucide-react";
import { advances as seed } from "@/lib/data/finance";
import { plannedSettle as seedPlanned, settledOn } from "@/lib/data/settlement";
import { costCenters, projectByCode, projects, TODAY } from "@/lib/data/org";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Mono,
  PageHeader,
  Progress,
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

const people = [
  { name: "Hendra Gunawan", initials: "HG", role: "Site Manager · Jembatan A" },
  { name: "Yusuf Ramadhan", initials: "YR", role: "Pelaksana · Jalan B" },
  { name: "Maya Anggraini", initials: "MA", role: "Site Manager · Kampung Nelayan" },
  { name: "Agus Salim", initials: "AS", role: "Logistik · Jalan B" },
  { name: "Dimas Prakoso", initials: "DP", role: "Estimator · Tender" },
  { name: "Fitri Handayani", initials: "FH", role: "Staf Pengadaan" },
];

const filters = ["Semua", "Outstanding", "Settle Sebagian", "Menunggu Approval", "Lewat 30 hari", "Settled"];
const ccName = Object.fromEntries(costCenters.map((c) => [c.code, c.name]));
const isActive = (a) => a.status === "Outstanding" || a.status === "Settle Sebagian";
const ageOf = (a) => daysBetween(a.date, TODAY);
const matches = (r, f) =>
  f === "Semua" || (f === "Lewat 30 hari" ? isActive(r) && ageOf(r) > 30 : r.status === f);

function formatDigits(n) {
  return n ? new Intl.NumberFormat("id-ID").format(n) : "";
}

export function AdvancesView() {
  const toast = useToast();
  const [rows, setRows] = useState(() =>
    [...seed].sort((a, b) => b.date.localeCompare(a.date)).map((a) => ({ ...a, plannedSettle: seedPlanned[a.no] })),
  );
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        matches(r, filter) &&
        (!q || r.no.toLowerCase().includes(q) || r.pic.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q)),
    );
  }, [rows, filter, query]);

  const active = rows.filter(isActive);
  const outstanding = active.reduce((s, a) => s + a.amount - a.realized, 0);
  const overdue = active.filter((a) => ageOf(a) > 30);
  const settledMonth = rows.filter((a) => a.status === "Settled" && (settledOn[a.no] ?? "") >= "2026-10-01");

  const topPic = useMemo(() => {
    const by = {};
    for (const a of rows.filter(isActive)) {
      by[a.pic] ??= { name: a.pic, count: 0, open: 0 };
      by[a.pic].count += 1;
      by[a.pic].open += a.amount - a.realized;
    }
    return Object.values(by).sort((x, y) => y.count - x.count || y.open - x.open)[0];
  }, [rows]);

  // Aging buckets on the open (unsettled) balance.
  const buckets = [
    { label: "0–15 hari", test: (d) => d <= 15, className: "bg-emerald-500" },
    { label: "16–30 hari", test: (d) => d > 15 && d <= 30, className: "bg-amber-400" },
    { label: "31–60 hari", test: (d) => d > 30 && d <= 60, className: "bg-red-500" },
    { label: "> 60 hari", test: (d) => d > 60, className: "bg-red-700" },
  ].map((b) => ({ ...b, value: active.filter((a) => b.test(ageOf(a))).reduce((s, a) => s + a.amount - a.realized, 0) }));

  const approve = (no) => {
    setRows((rs) => rs.map((r) => (r.no === no ? { ...r, status: "Outstanding", fresh: false } : r)));
    toast({ title: `${no} disetujui & dicairkan`, description: "Jurnal Dr 1-1401 Uang Muka Kerja / Cr 1-1102 Bank diposting." });
  };

  const submit = (entry) => {
    setRows((rs) => [entry, ...rs]);
    setOpen(false);
    setFilter("Semua");
    toast({ title: `${entry.no} diajukan`, description: `${entry.pic} · ${rp(entry.amount)} — menunggu approval Finance Controller.` });
  };

  return (
    <div>
      <PageHeader
        icon={HandCoins}
        title="Advances (Kasbon Proyek)"
        description="Uang muka kerja untuk kas lapangan — dipantau umur & realisasinya sampai settle. SOP: settle maks. 30 hari."
        actions={
          <>
            <Link
              href="/finance/settlement"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              Ke Settlement
              <ArrowRight className="size-4" />
            </Link>
            <Button size="md" variant="primary" icon={Plus} onClick={() => setOpen(true)}>
              Ajukan Kasbon
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Outstanding" icon={Wallet} value={rpShort(outstanding)} hint={`${active.length} kasbon aktif belum settle`} />
        <StatCard
          label="Lewat 30 hari"
          icon={TriangleAlert}
          value={overdue.length}
          delta={overdue.length ? "●" : null}
          deltaTone="red"
          hint={`${rpShort(overdue.reduce((s, a) => s + a.amount - a.realized, 0))} sisa belum dipertanggungjawabkan`}
        />
        <StatCard
          label="Settled bulan ini"
          icon={CircleCheck}
          value={settledMonth.length}
          hint={`${rpShort(settledMonth.reduce((s, a) => s + a.amount, 0))} ditutup sejak 1 Okt`}
        />
        <StatCard
          label="PIC terbanyak"
          icon={Trophy}
          value={<span className="text-[18px]">{topPic?.name ?? "–"}</span>}
          hint={topPic ? `${topPic.count} kasbon aktif · sisa ${rpShort(topPic.open)}` : "Tidak ada kasbon aktif"}
        />
      </div>

      <Card className="mt-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">Aging saldo kasbon</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {buckets.map((b) => (
              <span key={b.label} className="flex items-center gap-1.5 text-[12px] text-subtle">
                <span className={cx("size-2 rounded-sm", b.className)} />
                {b.label}
                <span className="font-medium text-fg tabular">{rpShort(b.value)}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="mt-2.5 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-surface-3">
          {buckets.map(
            (b) =>
              b.value > 0 && (
                <div
                  key={b.label}
                  className={cx("h-full transition-[width] duration-500", b.className)}
                  style={{ width: `${(b.value / Math.max(outstanding, 1)) * 100}%` }}
                  title={`${b.label}: ${rp(b.value)}`}
                />
              ),
          )}
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
          <Segmented
            value={filter}
            onChange={setFilter}
            items={filters.map((f) => ({ value: f, label: f, count: rows.filter((r) => matches(r, f)).length }))}
          />
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nomor, PIC, keperluan…"
              className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </div>
        </div>
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>No. / Tanggal</th>
                <th className={th}>PIC</th>
                <th className={th}>Proyek / CC</th>
                <th className={th}>Keperluan</th>
                <th className={cx(th, "text-right")}>Nominal</th>
                <th className={cx(th, "text-right")}>Terealisasi</th>
                <th className={cx(th, "text-right")}>Sisa</th>
                <th className={cx(th, "text-right")}>Umur</th>
                <th className={cx(th, "w-32")}>Realisasi</th>
                <th className={th}>Status</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const age = ageOf(r);
                const late = isActive(r) && age > 30;
                const ratio = (r.realized / r.amount) * 100;
                const person = people.find((p) => p.name === r.pic);
                return (
                  <tr key={r.no} className={cx(trHover, r.fresh && "bg-emerald-500/[0.04]")}>
                    <td className={td}>
                      <div className="font-medium">{r.no}</div>
                      <div className="text-[12px] text-subtle">{date(r.date)}</div>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <Avatar initials={r.initials} tone={late ? "amber" : "zinc"} />
                        <div>
                          <div>{r.pic}</div>
                          {person && <div className="text-[11.5px] text-subtle">{person.role.split(" · ")[0]}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <Mono>{r.project ?? r.costCenter}</Mono>
                      <div className="text-[12px] text-subtle">
                        {r.project ? projectByCode[r.project]?.short : ccName[r.costCenter]}
                      </div>
                    </td>
                    <td className={cx(td, "max-w-[260px] whitespace-normal")}>
                      <div className="line-clamp-2 leading-snug">{r.purpose}</div>
                      {r.plannedSettle && isActive(r) && (
                        <div className="mt-0.5 text-[11.5px] text-subtle">Rencana settle {date(r.plannedSettle)}</div>
                      )}
                    </td>
                    <td className={cx(td, "text-right font-medium tabular")}>{rp(r.amount)}</td>
                    <td className={cx(td, "text-right tabular text-muted")}>{r.realized ? rp(r.realized) : "–"}</td>
                    <td className={cx(td, "text-right font-medium tabular")}>
                      {r.status === "Settled" ? <span className="text-subtle">–</span> : rp(r.amount - r.realized)}
                    </td>
                    <td className={cx(td, "text-right tabular")}>
                      {r.status === "Menunggu Approval" ? (
                        <span className="text-subtle">belum cair</span>
                      ) : r.status === "Settled" ? (
                        <span className="text-subtle">{age} hari</span>
                      ) : (
                        <span
                          className={cx(
                            "inline-flex items-center gap-1",
                            late ? "font-semibold text-red-600 dark:text-red-400" : age > 20 ? "text-amber-600 dark:text-amber-400" : "text-fg",
                          )}
                        >
                          {late && <Clock className="size-3" />}
                          {age} hari
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <Progress value={ratio} tone={ratio >= 100 ? "green" : late ? "red" : "fg"} className="w-20" />
                        <span className="w-9 text-right text-[11.5px] text-subtle tabular">{decimal(ratio, 0)}%</span>
                      </div>
                    </td>
                    <td className={td}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={cx(td, "text-right")}>
                      {isActive(r) && (
                        <Link
                          href="/finance/settlement"
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface px-2 text-xs font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface-2"
                        >
                          Settle
                          <ArrowRight className="size-3" />
                        </Link>
                      )}
                      {r.status === "Menunggu Approval" && (
                        <Button size="xs" variant="success" icon={Check} onClick={() => approve(r.no)}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <EmptyState icon={HandCoins} title="Tidak ada kasbon" description="Ubah filter atau ajukan kasbon baru." />
          )}
        </TableScroll>
      </Card>

      {open && (
        <AdvanceModal
          nextNo={`ADV-2026-${String(442 + rows.length - seed.length).padStart(4, "0")}`}
          openByPic={rows.filter(isActive)}
          onClose={() => setOpen(false)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Modal: Ajukan Kasbon ───────────────────────── */

function AdvanceModal({ nextNo, openByPic, onClose, onSubmit }) {
  const [form, setForm] = useState({
    pic: people[0].name,
    loc: projects[0].code,
    amount: 0,
    purpose: "",
    plannedSettle: "2026-10-31",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const person = people.find((p) => p.name === form.pic);
  const picOpen = openByPic.filter((a) => a.pic === form.pic);
  const picOverdue = picOpen.filter((a) => ageOf(a) > 30);
  const span = form.plannedSettle ? daysBetween(TODAY, form.plannedSettle) : 0;
  const isProject = form.loc.startsWith("PRJ");
  const valid = form.amount > 0 && form.purpose.trim().length > 3 && form.plannedSettle && span >= 0;

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Ajukan Kasbon"
      description={`${nextNo} · Uang muka kerja dicairkan setelah approval Finance Controller.`}
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={Check}
            disabled={!valid}
            onClick={() =>
              onSubmit({
                no: nextNo,
                date: TODAY,
                pic: form.pic,
                initials: person.initials,
                project: isProject ? form.loc : null,
                costCenter: isProject ? undefined : form.loc,
                purpose: form.purpose.trim(),
                amount: form.amount,
                realized: 0,
                status: "Menunggu Approval",
                plannedSettle: form.plannedSettle,
                fresh: true,
              })
            }
          >
            Ajukan untuk approval
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="PIC penerima">
          <Select value={form.pic} onChange={(e) => set("pic", e.target.value)}>
            {people.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} — {p.role}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Proyek / Cost center">
          <Select value={form.loc} onChange={(e) => set("loc", e.target.value)}>
            <optgroup label="Proyek">
              {projects.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} · {p.short}
                </option>
              ))}
            </optgroup>
            <optgroup label="Cost center">
              {costCenters.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <Field label="Nominal">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13.5px] text-subtle">Rp</span>
            <Input
              inputMode="numeric"
              value={formatDigits(form.amount)}
              onChange={(e) => set("amount", Number(e.target.value.replace(/\D/g, "")) || 0)}
              className="pl-9 font-medium tabular"
              placeholder="0"
            />
          </div>
        </Field>
        <Field
          label="Rencana settle"
          hint={form.plannedSettle && span >= 0 ? `${span} hari dari pencairan` : "Tanggal tidak boleh sebelum hari ini"}
          aside={span > 30 && <Badge tone="amber">Lewat SOP 30 hari</Badge>}
        >
          <Input type="date" value={form.plannedSettle} min={TODAY} onChange={(e) => set("plannedSettle", e.target.value)} />
        </Field>
        <Field label="Keperluan" className="sm:col-span-2">
          <Input
            value={form.purpose}
            onChange={(e) => set("purpose", e.target.value)}
            placeholder="mis. Kas lapangan Oktober – upah harian & material kecil"
          />
        </Field>
      </div>

      {picOpen.length > 0 && (
        <div
          className={cx(
            "mt-4 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[12.5px]",
            picOverdue.length
              ? "border-red-500/20 bg-red-500/[0.06] text-red-900 dark:text-red-200"
              : "border-line bg-surface-2 text-muted",
          )}
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 opacity-80" />
          <div>
            {form.pic} masih memiliki <span className="font-semibold">{picOpen.length} kasbon aktif</span> dengan sisa{" "}
            <span className="font-semibold tabular">{rp(picOpen.reduce((s, a) => s + a.amount - a.realized, 0))}</span>
            {picOverdue.length > 0 && <> — {picOverdue.map((a) => a.no).join(", ")} sudah lewat 30 hari.</>}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-line">
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <span className="text-[12.5px] font-semibold text-fg">Jurnal pencairan (preview)</span>
          <span className="text-[11.5px] text-subtle">diposting saat approval</span>
        </div>
        <table className="w-full text-[12.5px]">
          <tbody>
            <tr>
              <td className="px-3.5 py-2 text-fg">
                <Mono>1-1401</Mono> Uang Muka Kerja · {form.pic}
                <span className="ml-1 text-subtle">· {form.loc}</span>
              </td>
              <td className="px-3.5 py-2 text-right text-fg tabular">Dr {rp(form.amount)}</td>
            </tr>
            <tr className="border-t border-line">
              <td className="py-2 pr-3.5 pl-8 text-fg">
                <Mono>1-1102</Mono> Bank · BCA Operasional 0298
              </td>
              <td className="px-3.5 py-2 text-right text-fg tabular">Cr {rp(form.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
