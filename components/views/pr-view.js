"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ClipboardList,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  Monitor,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { approverRoles, prStats, purchaseRequests as seed } from "@/lib/data/procurement";
import { costCenters, projectByCode } from "@/lib/data/org";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  Drawer,
  EmptyState,
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
import { useToast } from "@/components/toast";
import { cx, date, decimal, pct, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const statusFilters = ["Semua", "Draft", "Menunggu Approval", "Disetujui", "Ditolak"];
const ccName = Object.fromEntries(costCenters.map((c) => [c.code, c.name]));
const NOW_LABEL = "8 Okt 2026 · baru saja";

function prValue(pr) {
  return pr.items.reduce((s, i) => s + i.qty * i.price, 0);
}

function budgetCheck(pr) {
  const value = prValue(pr);
  const { pagu, commitment, realisasi } = pr.budget;
  const sisa = pagu - commitment - realisasi;
  const after = sisa - value;
  const afterPct = (after / pagu) * 100;
  const level = after < 0 || afterPct < 5 ? "Kritis" : afterPct < 15 ? "Waspada" : "Aman";
  const tone = level === "Kritis" ? "red" : level === "Waspada" ? "amber" : "green";
  const usedPct = ((commitment + realisasi + value) / pagu) * 100;
  return { value, sisa, after, afterPct, usedPct, level, tone };
}

function qtyFmt(q) {
  return Number.isInteger(q) ? decimal(q, 0) : decimal(q, 1);
}

export function PrView() {
  const toast = useToast();
  const [rows, setRows] = useState(seed);
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [openNo, setOpenNo] = useState(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "Semua" || r.status === filter) &&
        (!q ||
          r.no.toLowerCase().includes(q) ||
          r.requester.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.items.some((i) => i.material.toLowerCase().includes(q)) ||
          (r.project && projectByCode[r.project]?.short.toLowerCase().includes(q))),
    );
  }, [rows, filter, query]);

  const monthRows = rows.filter((r) => r.date >= "2026-10-01");
  const pending = rows.filter((r) => r.status === "Menunggu Approval");
  const committed = rows.filter((r) => r.status === "Disetujui").reduce((s, r) => s + prValue(r), 0);
  const avgDelta = ((prStats.avgApprovalHours - prStats.prevAvgApprovalHours) / prStats.prevAvgApprovalHours) * 100;

  const selected = rows.find((r) => r.no === openNo) ?? null;

  const update = (no, fn) => setRows((rs) => rs.map((r) => (r.no === no ? fn(r) : r)));

  const approve = (pr) => {
    const idx = pr.approvals.findIndex((a) => a.status === "pending");
    if (idx < 0) return;
    const level = pr.approvals[idx];
    const next = pr.approvals[idx + 1];
    update(pr.no, (r) => ({
      ...r,
      status: next ? "Menunggu Approval" : "Disetujui",
      approvals: r.approvals.map((a, i) =>
        i === idx
          ? { ...a, status: "approved", at: NOW_LABEL, channel: "sistem" }
          : i === idx + 1
            ? { ...a, status: "pending" }
            : a,
      ),
    }));
    if (next) {
      toast({
        title: `${pr.no} · ${level.level} disetujui`,
        description: `Diteruskan ke ${next.level} ${next.name} — link approve one-click terkirim via email.`,
      });
    } else {
      toast({
        title: `${pr.no} disetujui penuh`,
        description: `Commitment ${rp(prValue(pr))} dicatat di budget ${pr.category}. PR siap dikonversi ke PO.`,
      });
    }
  };

  const reject = (pr, note) => {
    const idx = pr.approvals.findIndex((a) => a.status === "pending");
    if (idx < 0) return;
    update(pr.no, (r) => ({
      ...r,
      status: "Ditolak",
      approvals: r.approvals.map((a, i) =>
        i === idx ? { ...a, status: "rejected", at: NOW_LABEL, channel: "sistem", note: note || "Ditolak tanpa catatan." } : a,
      ),
    }));
    toast({
      title: `${pr.no} ditolak`,
      description: `${pr.requester.name} menerima notifikasi email & WhatsApp beserta catatan penolakan.`,
      tone: "info",
    });
  };

  const submit = (pr) => {
    update(pr.no, (r) => ({
      ...r,
      status: "Menunggu Approval",
      approvals: r.approvals.map((a, i) => (i === 0 ? { ...a, status: "pending" } : a)),
    }));
    toast({
      title: `${pr.no} diajukan`,
      description: `Menunggu approval L1 ${pr.approvals[0].name} — email one-click terkirim.`,
    });
  };

  return (
    <div>
      <PageHeader
        icon={ClipboardList}
        title="Purchase Request"
        description="Permintaan material & jasa dari lapangan — dicek ke sisa budget kategori sebelum masuk approval berjenjang."
        actions={
          <>
            <Button size="md" icon={Download} onClick={() => toast({ title: "Ekspor Excel disiapkan", description: `${visible.length} PR sesuai filter aktif.`, tone: "info" })}>
              Export
            </Button>
            <Button
              size="md"
              variant="primary"
              icon={FileSpreadsheet}
              onClick={() =>
                toast({
                  title: "Draft PR dari BOQ dibuat",
                  description: "PR-2026-0190 · 14 item material minggu 42 Jembatan A ditarik dari BOQ & jadwal pelaksanaan.",
                })
              }
            >
              Buat PR dari BOQ
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="PR bulan ini" value={monthRows.length} hint={`${rpShort(monthRows.reduce((s, r) => s + prValue(r), 0))} · Oktober 2026`} />
        <StatCard
          label="Menunggu approval"
          value={pending.length}
          hint={rpShort(pending.reduce((s, r) => s + prValue(r), 0))}
          delta="●"
          deltaTone="amber"
        />
        <StatCard label="Nilai committed" value={rpShort(committed)} hint="PR disetujui → commitment budget" />
        <StatCard
          label="Rata-rata waktu approval"
          value={`${decimal(prStats.avgApprovalHours, 1)} jam`}
          delta={`${decimal(avgDelta, 0)}%`}
          deltaTone="green"
          hint={`vs Sep · ${prStats.emailOneClickShare}% via email one-click`}
        />
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
          <Segmented
            value={filter}
            onChange={setFilter}
            items={statusFilters.map((s) => ({
              value: s,
              label: s,
              count: s === "Semua" ? rows.length : rows.filter((r) => r.status === s).length,
            }))}
          />
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari no. PR, pemohon, material…"
              className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </div>
        </div>
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>No. PR / Tanggal</th>
                <th className={th}>Proyek / CC</th>
                <th className={th}>Pemohon</th>
                <th className={th}>Ringkasan item</th>
                <th className={cx(th, "text-right")}>Nilai</th>
                <th className={th}>Budget check</th>
                <th className={th}>Approval</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const b = budgetCheck(r);
                return (
                  <tr
                    key={r.no}
                    onClick={() => setOpenNo(r.no)}
                    className={cx(trHover, "cursor-pointer", openNo === r.no && "bg-surface-2")}
                  >
                    <td className={td}>
                      <div className="font-medium">{r.no}</div>
                      <div className="text-[12px] text-subtle">{date(r.date)}</div>
                    </td>
                    <td className={td}>
                      <ProjectCell pr={r} />
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <Avatar initials={r.requester.initials} />
                        <div>
                          <div>{r.requester.name}</div>
                          <div className="text-[12px] text-subtle">{r.requester.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className={cx(td, "max-w-[260px]")}>
                      <div className="truncate">{r.items[0].material}</div>
                      <div className="truncate text-[12px] text-subtle">
                        {r.items.length > 1 ? `+${r.items.length - 1} item lain · ` : ""}
                        {r.category}
                      </div>
                    </td>
                    <td className={cx(td, "text-right font-medium tabular")}>{rp(b.value)}</td>
                    <td className={td}>
                      <div className="w-[150px]">
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge status={b.level} />
                          <span className="text-[11.5px] text-subtle tabular">{pct(Math.min(b.usedPct, 999), 0)}</span>
                        </div>
                        <Progress value={b.usedPct} tone={b.tone} className="mt-1.5" />
                        <div className="mt-1 text-[11px] text-subtle tabular">sisa {rpShort(b.after)}</div>
                      </div>
                    </td>
                    <td className={td}>
                      <ApprovalSteps approvals={r.approvals} />
                    </td>
                    <td className={td}>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <EmptyState icon={ClipboardList} title="Tidak ada PR" description="Ubah filter status atau kata kunci pencarian." />
          )}
        </TableScroll>
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[12px] text-subtle">
          <span>
            Menampilkan <span className="text-fg tabular">{visible.length}</span> dari <span className="tabular">{rows.length}</span> PR
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <ShieldCheck className="size-3.5" />
            Matriks approval: &gt; Rp50 jt wajib sampai Direktur (L3)
          </span>
        </div>
      </Card>

      {selected && (
        <PrDrawer
          key={selected.no}
          pr={selected}
          onClose={() => setOpenNo(null)}
          onApprove={() => approve(selected)}
          onReject={(note) => reject(selected, note)}
          onSubmit={() => submit(selected)}
        />
      )}
    </div>
  );
}

function ProjectCell({ pr }) {
  return pr.project ? (
    <>
      <Mono>{pr.project}</Mono>
      <div className="text-[12px] text-subtle">{projectByCode[pr.project]?.short}</div>
    </>
  ) : (
    <>
      <Mono>{pr.costCenter}</Mono>
      <div className="text-[12px] text-subtle">{ccName[pr.costCenter]}</div>
    </>
  );
}

/* ───────────────────────── Approval step dots ───────────────────────── */

const stepStyle = {
  approved: "bg-emerald-500 text-white ring-emerald-500",
  pending: "bg-amber-500/15 text-amber-700 ring-amber-500 dark:text-amber-300",
  rejected: "bg-red-500 text-white ring-red-500",
  waiting: "bg-surface-2 text-subtle ring-line",
};

const stepLabel = {
  approved: "disetujui",
  pending: "menunggu",
  rejected: "menolak",
  waiting: "belum giliran",
};

function ApprovalSteps({ approvals }) {
  const done = approvals.filter((a) => a.status === "approved").length;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {approvals.map((a, i) => (
          <div key={a.level} className="flex items-center">
            {i > 0 && (
              <span
                className={cx(
                  "h-px w-2.5",
                  approvals[i - 1].status === "approved" ? "bg-emerald-500" : "bg-line-strong",
                )}
              />
            )}
            <span
              title={`${a.level} · ${a.name} — ${stepLabel[a.status]}`}
              className={cx(
                "relative inline-flex size-6 items-center justify-center rounded-full text-[9.5px] font-semibold ring-1",
                stepStyle[a.status],
              )}
            >
              {a.initials}
              {a.status === "pending" && (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border-2 border-surface bg-amber-500" />
              )}
            </span>
          </div>
        ))}
      </div>
      <span className="text-[11.5px] text-subtle tabular">
        {done}/{approvals.length}
      </span>
    </div>
  );
}

/* ───────────────────────── Drawer ───────────────────────── */

function PrDrawer({ pr, onClose, onApprove, onReject, onSubmit }) {
  const [note, setNote] = useState("");
  const b = budgetCheck(pr);
  const pendingStep = pr.approvals.find((a) => a.status === "pending");
  const rejectedStep = pr.approvals.find((a) => a.status === "rejected");

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-2xl"
      title={`${pr.no} · ${pr.purpose}`}
      subtitle={
        <>
          <StatusBadge status={pr.status} />
          <Mono>{pr.project ?? pr.costCenter}</Mono>
          <span className="text-[12px] text-subtle">
            {pr.project ? projectByCode[pr.project]?.short : ccName[pr.costCenter]} · dibuat {date(pr.date)}
          </span>
        </>
      }
      footer={
        pr.status === "Menunggu Approval" && pendingStep ? (
          <>
            <span className="mr-auto hidden text-[12px] text-subtle sm:block">
              Giliran <span className="font-medium text-fg">{pendingStep.level} · {pendingStep.name}</span>
            </span>
            <Button variant="danger" icon={X} onClick={() => onReject(note.trim())}>
              Tolak
            </Button>
            <Button variant="success" icon={Check} onClick={onApprove}>
              Approve {pendingStep.level}
            </Button>
          </>
        ) : pr.status === "Draft" ? (
          <>
            <span className="mr-auto text-[12px] text-subtle">Draft belum diajukan — budget belum di-reserve.</span>
            <Button variant="primary" icon={Send} onClick={onSubmit}>
              Ajukan approval
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Tutup</Button>
        )
      }
    >
      <div className="space-y-5">
        {/* Header info */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3">
          <Meta label="Pemohon">
            {pr.requester.name}
            <span className="block text-[12px] text-subtle">{pr.requester.role}</span>
          </Meta>
          <Meta label="Kategori budget">{pr.category}</Meta>
          <Meta label="Dibutuhkan">
            <span className="tabular">{date(pr.needBy)}</span>
          </Meta>
          <Meta label="Nilai estimasi">
            <span className="font-semibold tabular">{rp(b.value)}</span>
          </Meta>
          <Meta label="Level approval">{pr.approvals.length} level</Meta>
          <Meta label="Sumber">BOQ + input lapangan</Meta>
        </dl>

        {/* Items */}
        <Section title="Item permintaan" aside={`${pr.items.length} item`}>
          <TableScroll className="rounded-lg border border-line">
            <table className="w-full">
              <thead className="bg-surface-2">
                <tr>
                  <th className={th}>Material / jasa</th>
                  <th className={cx(th, "text-right")}>Qty</th>
                  <th className={th}>Sat.</th>
                  <th className={cx(th, "text-right")}>Harga est.</th>
                  <th className={cx(th, "text-right")}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pr.items.map((i) => (
                  <tr key={i.material} className="border-t border-line">
                    <td className={cx(td, "whitespace-normal")}>{i.material}</td>
                    <td className={cx(td, "text-right tabular")}>{qtyFmt(i.qty)}</td>
                    <td className={cx(td, "text-muted")}>{i.unit}</td>
                    <td className={cx(td, "text-right tabular")}>{rp(i.price)}</td>
                    <td className={cx(td, "text-right font-medium tabular")}>{rp(i.qty * i.price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-line-strong bg-surface-2">
                <tr>
                  <td className={cx(td, "font-semibold")} colSpan={4}>
                    Total estimasi <span className="font-normal text-subtle">(belum termasuk PPN)</span>
                  </td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{rp(b.value)}</td>
                </tr>
              </tfoot>
            </table>
          </TableScroll>
        </Section>

        {/* Budget impact */}
        <Section title="Dampak ke budget" aside={<StatusBadge status={b.level} />}>
          <div className="rounded-lg border border-line">
            <div className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
              {[
                ["Pagu", pr.budget.pagu],
                ["Commitment (PO)", pr.budget.commitment],
                ["Realisasi", pr.budget.realisasi],
                ["Sisa", b.sisa],
              ].map(([k, v]) => (
                <div key={k} className="px-3.5 py-2.5">
                  <p className="text-[11.5px] text-subtle">{k}</p>
                  <p className="mt-0.5 text-[13.5px] font-medium text-fg tabular">{rpShort(v)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-line px-3.5 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-[12.5px]">
                <span className="text-muted">
                  Sisa setelah PR ini{" "}
                  <span
                    className={cx(
                      "font-semibold tabular",
                      b.tone === "red" && "text-red-600 dark:text-red-400",
                      b.tone === "amber" && "text-amber-600 dark:text-amber-400",
                      b.tone === "green" && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {rpShort(b.sisa)} → {rpShort(b.after)}
                  </span>
                </span>
                <span className="text-subtle tabular">{pct(b.usedPct, 1)} pagu terpakai</span>
              </div>
              <StackedBudget pr={pr} b={b} />
            </div>
          </div>
          {b.level === "Kritis" && (
            <Callout tone="red" icon={TriangleAlert} className="mt-2.5">
              {b.after < 0
                ? `Nilai PR melebihi sisa budget ${rpShort(-b.after)}. Approval L3 wajib disertai revisi budget (CCO) atau realokasi antar kategori.`
                : "Sisa budget kategori di bawah 5% pagu setelah PR ini. Pertimbangkan realokasi sebelum approve."}
            </Callout>
          )}
        </Section>

        {/* Timeline */}
        <Section title="Riwayat approval">
          <ol className="relative space-y-3.5 border-l border-line pl-5">
            <TimelineItem
              dot="bg-fg"
              title={
                <>
                  <span className="font-medium text-fg">{pr.requester.name}</span> membuat PR
                </>
              }
              meta={`${date(pr.date)} · via sistem`}
            />
            {pr.approvals.map((a) => (
              <TimelineItem
                key={a.level}
                dot={
                  a.status === "approved"
                    ? "bg-emerald-500"
                    : a.status === "rejected"
                      ? "bg-red-500"
                      : a.status === "pending"
                        ? "bg-amber-500"
                        : "bg-line-strong"
                }
                title={
                  <>
                    <Badge className="mr-1.5">{a.level}</Badge>
                    <span className={cx("font-medium", a.status === "waiting" ? "text-subtle" : "text-fg")}>{a.name}</span>
                    <span className="text-subtle"> · {approverRoles[a.level]}</span>
                  </>
                }
                meta={
                  a.status === "approved" || a.status === "rejected" ? (
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className={a.status === "approved" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {a.status === "approved" ? "Menyetujui" : "Menolak"}
                      </span>
                      · {a.at} ·
                      <ChannelTag channel={a.channel} />
                    </span>
                  ) : a.status === "pending" ? (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Clock className="size-3" /> Menunggu keputusan · link one-click terkirim ke email
                    </span>
                  ) : (
                    "Belum giliran"
                  )
                }
                note={a.note}
              />
            ))}
          </ol>
          {rejectedStep && pr.status === "Ditolak" && (
            <p className="mt-3 text-[12px] text-subtle">PR ditolak di {rejectedStep.level}; pemohon dapat merevisi dan mengajukan ulang sebagai PR baru.</p>
          )}
        </Section>

        {/* Attachments */}
        <Section title="Lampiran" aside={`${pr.attachments.length} berkas`}>
          {pr.attachments.length === 0 ? (
            <p className="text-[12.5px] text-subtle">Tidak ada lampiran.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {pr.attachments.map((f) => (
                <li key={f.name} className="flex items-center gap-3 px-3 py-2">
                  {f.name.endsWith(".pdf") ? (
                    <FileText className="size-4 shrink-0 text-red-500" />
                  ) : (
                    <FileSpreadsheet className="size-4 shrink-0 text-emerald-600" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{f.name}</span>
                  <span className="text-[11.5px] text-subtle tabular">{f.size}</span>
                  <Paperclip className="size-3.5 text-subtle" />
                </li>
              ))}
            </ul>
          )}
        </Section>

        {pr.status === "Menunggu Approval" && (
          <Section title="Catatan approval">
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opsional — wajib diisi bila menolak agar pemohon tahu alasannya."
              className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </Section>
        )}
      </div>
    </Drawer>
  );
}

function StackedBudget({ pr, b }) {
  const { pagu, commitment, realisasi } = pr.budget;
  const w = (v) => `${Math.max(0, Math.min(100, (v / pagu) * 100))}%`;
  const room = Math.max(0, b.sisa);
  return (
    <>
      <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-surface-3">
        <span className="h-full bg-slate-500 dark:bg-slate-400" style={{ width: w(realisasi) }} />
        <span className="h-full bg-indigo-500" style={{ width: w(commitment) }} />
        <span
          className={cx("h-full", b.tone === "red" ? "bg-red-500" : b.tone === "amber" ? "bg-amber-500" : "bg-emerald-500")}
          style={{ width: w(Math.min(b.value, room)) }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-subtle">
        <Legend className="bg-slate-500 dark:bg-slate-400">Realisasi</Legend>
        <Legend className="bg-indigo-500">Commitment</Legend>
        <Legend className={b.tone === "red" ? "bg-red-500" : b.tone === "amber" ? "bg-amber-500" : "bg-emerald-500"}>PR ini</Legend>
      </div>
    </>
  );
}

function Legend({ className, children }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cx("size-2 rounded-sm", className)} />
      {children}
    </span>
  );
}

function ChannelTag({ channel }) {
  const Icon = channel === "email" ? Mail : Monitor;
  return (
    <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-1.5 py-px text-[11px] text-muted">
      <Icon className="size-3" />
      {channel === "email" ? "via email one-click" : "via sistem"}
    </span>
  );
}

function TimelineItem({ dot, title, meta, note }) {
  return (
    <li className="relative">
      <span className={cx("absolute top-1.5 -left-[24.5px] size-2 rounded-full ring-4 ring-surface", dot)} />
      <p className="text-[13px] text-muted">{title}</p>
      <div className="mt-0.5 text-[11.5px] text-subtle">{meta}</div>
      {note && (
        <p className="mt-1.5 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[12.5px] text-fg">“{note}”</p>
      )}
    </li>
  );
}

function Section({ title, aside, children }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[12.5px] font-semibold text-fg">{title}</h3>
        {aside && (typeof aside === "string" ? <span className="text-[12px] text-subtle">{aside}</span> : aside)}
      </div>
      {children}
    </section>
  );
}

function Meta({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg">{children}</dd>
    </div>
  );
}
