"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FilePlus2,
  Kanban,
  List,
  Mail,
  MapPin,
  Phone,
  Plus,
  SlidersHorizontal,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { leads as seed, leadSources, leadStatuses, salesById, salesTeam } from "@/lib/data/sales";
import { TODAY } from "@/lib/data/org";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  Drawer,
  EmptyState,
  Field,
  Input,
  Modal,
  Mono,
  PageHeader,
  Select,
  StatusBadge,
  td,
  th,
  trHover,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { TableScroll } from "@/components/table-scroll";
import { cx, date, pct, rp, rpShort } from "@/lib/format";
import { ListToolbar, Meta, Pager, Section } from "@/components/views/quotations-view";

const pillTone = {
  "Follow-up": "border-amber-500/30 bg-amber-500/[0.07] text-amber-800 dark:text-amber-300",
  "Data Baru": "border-sky-500/30 bg-sky-500/[0.07] text-sky-800 dark:text-sky-300",
  Customer: "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-800 dark:text-emerald-300",
  Lost: "border-red-500/30 bg-red-500/[0.07] text-red-800 dark:text-red-300",
};

const statusSelectTone = {
  "Data Baru": "text-sky-700 dark:text-sky-400",
  "Follow-up": "text-amber-700 dark:text-amber-400",
  Customer: "text-emerald-700 dark:text-emerald-400",
  Lost: "text-red-700 dark:text-red-400",
};

const sourceTone = { INAPROC: "indigo", Referral: "green", Website: "blue", Pameran: "violet" };

export function LeadsView() {
  const toast = useToast();
  const router = useRouter();
  const [rows, setRows] = useState(seed);
  const [view, setView] = useState("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [source, setSource] = useState("all");
  const [owner, setOwner] = useState("all");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (source === "all" || r.source === source) &&
        (owner === "all" || r.assigned === owner) &&
        (!q || [r.name, r.company, r.email, r.phone, ...r.tags].some((s) => s.toLowerCase().includes(q))),
    );
  }, [rows, statusFilter, source, owner, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, pages);
  const visible = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);

  const count = (s) => rows.filter((r) => r.status === s).length;
  const lostPct = rows.length ? (count("Lost") / rows.length) * 100 : 0;
  const activeFilters = (source !== "all") + (owner !== "all");

  const changeStatus = (id, status) => {
    const lead = rows.find((r) => r.id === id);
    if (!lead || lead.status === status) return;
    setRows((rs) =>
      rs.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              activities: [{ date: TODAY, type: "Status", by: "YUN", text: `Status diubah ${r.status} → ${status}.` }, ...r.activities],
            }
          : r,
      ),
    );
    toast({ title: `${lead.company} → ${status}`, description: `Lead ${lead.name} diperbarui.`, tone: status === "Lost" ? "info" : "success" });
  };

  const logActivity = (id, text) =>
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, activities: [{ date: TODAY, type: "Catatan", by: "YUN", text }, ...r.activities] } : r)),
    );

  const create = (lead) => {
    const id = `LD-${String(Math.max(...rows.map((r) => Number(r.id.slice(3)))) + 1).padStart(4, "0")}`;
    setRows((rs) => [
      {
        ...lead,
        id,
        created: TODAY,
        activities: [{ date: TODAY, type: "Lead masuk", by: lead.assigned, text: `Lead dibuat manual · sumber ${lead.source}.` }],
      },
      ...rs,
    ]);
    setCreating(false);
    setPage(1);
    toast({ title: `Lead ${id} ditambahkan`, description: `${lead.company} · estimasi ${rpShort(lead.value)} — assigned ke ${salesById[lead.assigned].name}.` });
  };

  const toQuotation = (lead) => {
    toast({ title: "Draft quotation disiapkan", description: `${lead.company} — lanjutkan isi item di halaman Quotations.` });
    router.push("/sales/quotations");
  };

  const selected = rows.find((r) => r.id === openId) ?? null;

  return (
    <div>
      <PageHeader
        icon={UserPlus}
        title="Leads"
        description="Prospek proyek & supply — dari paket INAPROC, referral, website dan pameran sampai jadi customer."
      />

      {/* Pill counters */}
      <div className="flex flex-wrap items-center gap-2">
        {["Follow-up", "Data Baru", "Customer"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter((f) => (f === s ? "all" : s))}
            className={cx(
              "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors",
              pillTone[s],
              statusFilter === s && "ring-2 ring-[var(--ring)]",
            )}
          >
            {s}
            <span className="rounded-full bg-surface px-1.5 text-[11.5px] text-fg tabular ring-1 ring-line">{count(s)}</span>
          </button>
        ))}
        <button
          onClick={() => setStatusFilter((f) => (f === "Lost" ? "all" : "Lost"))}
          className={cx(
            "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors",
            pillTone.Lost,
            statusFilter === "Lost" && "ring-2 ring-[var(--ring)]",
          )}
        >
          Lost Leads
          <span className="rounded-full bg-surface px-1.5 text-[11.5px] text-fg tabular ring-1 ring-line">{count("Lost")}</span>
          <span className="rounded-full bg-red-600 px-1.5 text-[11px] text-white tabular">{pct(lostPct, 1)}</span>
        </button>
        <span className="ml-auto hidden text-[12.5px] text-subtle md:block">
          Pipeline aktif{" "}
          <span className="font-medium text-fg tabular">
            {rpShort(rows.filter((r) => r.status === "Follow-up" || r.status === "Data Baru").reduce((s, r) => s + r.value, 0))}
          </span>
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 mb-3 flex flex-wrap items-center gap-2">
        <Button size="md" variant="primary" icon={Plus} onClick={() => setCreating(true)}>
          New Lead
        </Button>
        <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface-3 p-0.5" role="group" aria-label="Tampilan">
          {[
            { v: "list", icon: List, label: "Tabel" },
            { v: "kanban", icon: Kanban, label: "Kanban" },
          ].map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cx(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-all",
                view === v ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-muted hover:text-fg",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
        <Button
          size="md"
          icon={Upload}
          onClick={() => toast({ title: "Import leads", description: "Unggah template Excel (.xlsx) — kolom nama, perusahaan, email, telepon, nilai, sumber.", tone: "info" })}
        >
          Import Leads
        </Button>
        <Button size="md" icon={SlidersHorizontal} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
          Filters
          {activeFilters > 0 && <span className="rounded bg-fg px-1.5 text-[11px] leading-[18px] text-surface tabular">{activeFilters}</span>}
        </Button>
        {statusFilter !== "all" && (
          <button
            onClick={() => setStatusFilter("all")}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-surface-3 px-2 text-[12px] text-muted hover:text-fg"
          >
            Status: {statusFilter}
            <X className="size-3" />
          </button>
        )}
      </div>

      {showFilters && (
        <Card className="mb-3 flex flex-wrap items-end gap-3 px-3 py-3">
          <Field label="Source" className="w-44">
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="all">Semua source</option>
              {leadSources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Assigned" className="w-52">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">Semua sales</option>
              {salesTeam.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            variant="ghost"
            onClick={() => {
              setSource("all");
              setOwner("all");
            }}
          >
            Reset
          </Button>
        </Card>
      )}

      {view === "list" ? (
        <Card className="overflow-hidden">
          <ListToolbar
            pageSize={pageSize}
            onPageSize={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            onExport={() => toast({ title: "Export Excel disiapkan", description: `${filtered.length} lead sesuai filter aktif.`, tone: "info" })}
            onRefresh={() => toast({ title: "Data diperbarui", description: "3 paket baru INAPROC dicek — tidak ada yang cocok kualifikasi.", tone: "info" })}
            query={query}
            onQuery={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Cari nama, perusahaan, email, tag…"
          />
          <TableScroll>
            <table className="w-full">
              <thead className="bg-surface-2">
                <tr>
                  <th className={cx(th, "w-10")}>#</th>
                  <th className={th}>Name</th>
                  <th className={th}>Company</th>
                  <th className={th}>Email</th>
                  <th className={th}>Phone</th>
                  <th className={cx(th, "text-right")}>Value</th>
                  <th className={th}>Source</th>
                  <th className={th}>Tags</th>
                  <th className={th}>Assigned</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => {
                  const sp = salesById[r.assigned];
                  return (
                    <tr key={r.id} onClick={() => setOpenId(r.id)} className={cx(trHover, "cursor-pointer", openId === r.id && "bg-surface-2")}>
                      <td className={cx(td, "text-subtle tabular")}>{(curPage - 1) * pageSize + i + 1}</td>
                      <td className={td}>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-[12px] text-subtle">{r.title}</div>
                      </td>
                      <td className={cx(td, "max-w-[220px] truncate")}>{r.company}</td>
                      <td className={cx(td, "text-muted")}>{r.email}</td>
                      <td className={cx(td, "text-muted tabular")}>{r.phone}</td>
                      <td className={cx(td, "text-right font-medium tabular")}>{rp(r.value)}</td>
                      <td className={td}>
                        <Badge tone={sourceTone[r.source]}>{r.source}</Badge>
                      </td>
                      <td className={td}>
                        <div className="flex gap-1">
                          {r.tags.map((t) => (
                            <Badge key={t}>{t}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className={td}>
                        <span className="flex items-center gap-1.5" title={sp.name}>
                          <Avatar initials={sp.initials} tone={sp.tone} />
                          <span className="text-[12.5px] text-muted">{sp.name.split(" ")[0]}</span>
                        </span>
                      </td>
                      <td className={td} onClick={(e) => e.stopPropagation()}>
                        <StatusSelect value={r.status} onChange={(s) => changeStatus(r.id, s)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visible.length === 0 && <EmptyState icon={UserPlus} title="Tidak ada lead" description="Ubah filter atau kata kunci pencarian." />}
          </TableScroll>
          <Pager page={curPage} pageSize={pageSize} total={filtered.length} onPage={setPage} noun="lead" footnote="Value = estimasi nilai proyek" />
        </Card>
      ) : (
        <KanbanBoard rows={filtered} onOpen={setOpenId} onMove={changeStatus} />
      )}

      {creating && <NewLeadModal onClose={() => setCreating(false)} onCreate={create} />}
      {selected && (
        <LeadDrawer
          key={selected.id}
          lead={selected}
          onClose={() => setOpenId(null)}
          onStatus={(s) => changeStatus(selected.id, s)}
          onLog={(t) => logActivity(selected.id, t)}
          onQuote={() => toQuotation(selected)}
        />
      )}
    </div>
  );
}

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Ubah status"
      className={cx(
        "h-7 cursor-pointer rounded-md border border-line bg-surface pr-1 pl-1.5 text-[12.5px] font-medium outline-none hover:border-line-strong focus:border-line-strong",
        statusSelectTone[value],
      )}
    >
      {leadStatuses.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

/* ───────────────────────── Kanban ───────────────────────── */

function KanbanBoard({ rows, onOpen, onMove }) {
  const [over, setOver] = useState(null);
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {leadStatuses.map((s) => {
        const col = rows.filter((r) => r.status === s);
        return (
          <div
            key={s}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(s);
            }}
            onDragLeave={() => setOver((o) => (o === s ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              onMove(e.dataTransfer.getData("text/plain"), s);
            }}
            className={cx(
              "flex min-h-[260px] flex-col rounded-xl border bg-surface-2 transition-colors",
              over === s ? "border-line-strong bg-surface-3" : "border-line",
            )}
          >
            <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={s} />
                <span className="text-[12px] text-subtle tabular">{col.length}</span>
              </div>
              <span className="text-[12px] font-medium text-muted tabular">{rpShort(col.reduce((a, r) => a + r.value, 0))}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
              {col.map((r) => {
                const sp = salesById[r.assigned];
                return (
                  <button
                    key={r.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", r.id)}
                    onClick={() => onOpen(r.id)}
                    className="rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-fg">{r.company}</p>
                        <p className="truncate text-[12px] text-subtle">{r.name}</p>
                      </div>
                      <Avatar initials={sp.initials} tone={sp.tone} />
                    </div>
                    <p className="mt-2 text-[13px] font-semibold text-fg tabular">{rpShort(r.value)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <Badge tone={sourceTone[r.source]}>{r.source}</Badge>
                      {r.tags.slice(0, 1).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                      <span className="ml-auto text-[11px] text-subtle tabular">{date(r.activities[0]?.date ?? r.created)}</span>
                    </div>
                  </button>
                );
              })}
              {col.length === 0 && (
                <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line px-3 py-6 text-center text-[12px] text-subtle">
                  Seret kartu ke sini
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Drawer ───────────────────────── */

const activityDot = {
  "Lead masuk": "bg-sky-500",
  "Sales Order": "bg-emerald-500",
  Lost: "bg-red-500",
  Status: "bg-amber-500",
};

function LeadDrawer({ lead, onClose, onStatus, onLog, onQuote }) {
  const [note, setNote] = useState("");
  const sp = salesById[lead.assigned];
  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-xl"
      title={lead.company}
      subtitle={
        <>
          <StatusBadge status={lead.status} />
          <Mono>{lead.id}</Mono>
          <span className="text-[12px] text-subtle">masuk {date(lead.created)}</span>
        </>
      }
      footer={
        <>
          {lead.status !== "Lost" && (
            <Button variant="danger" className="mr-auto" onClick={() => onStatus("Lost")}>
              Tandai Lost
            </Button>
          )}
          <Button variant="primary" icon={FilePlus2} onClick={onQuote} disabled={lead.status === "Lost"}>
            Buat Quotation
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-2 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[12px] font-semibold text-muted">
            {lead.name
              .replace(/^(Ir\.|Drs\.)\s*/, "")
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="font-medium text-fg">{lead.name}</p>
            <p className="text-[12px] text-subtle">{lead.title}</p>
            <div className="mt-2 grid gap-1 text-[12.5px] text-muted">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-subtle" /> {lead.email}
              </span>
              <span className="flex items-center gap-1.5 tabular">
                <Phone className="size-3.5 text-subtle" /> {lead.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-subtle" /> {lead.location}
              </span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3">
          <Meta label="Estimasi nilai">
            <span className="font-semibold tabular">{rp(lead.value)}</span>
          </Meta>
          <Meta label="Source">
            <Badge tone={sourceTone[lead.source]}>{lead.source}</Badge>
          </Meta>
          <Meta label="Assigned">
            <span className="flex items-center gap-1.5">
              <Avatar initials={sp.initials} tone={sp.tone} className="size-5 text-[9px]" />
              {sp.name}
            </span>
          </Meta>
          <Meta label="Status">
            <StatusSelect value={lead.status} onChange={onStatus} />
          </Meta>
          <Meta label="Tags">
            <span className="flex flex-wrap gap-1">
              {lead.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </span>
          </Meta>
        </dl>

        <Section title="Kebutuhan">
          <p className="flex gap-2 text-[13px] leading-relaxed text-muted">
            <Building2 className="mt-0.5 size-3.5 shrink-0 text-subtle" />
            {lead.need}
          </p>
          {lead.status === "Lost" && lead.lostReason && (
            <Callout tone="red" className="mt-2.5" title="Alasan lost:">
              {lead.lostReason}
            </Callout>
          )}
        </Section>

        <Section title="Aktivitas" aside={`${lead.activities.length} catatan`}>
          <div className="mb-3 flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && note.trim()) {
                  onLog(note.trim());
                  setNote("");
                }
              }}
              placeholder="Catat call, meeting, atau follow-up…"
              className="h-8 min-w-0 flex-1 rounded-md border border-line bg-surface px-2.5 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
            <Button
              disabled={!note.trim()}
              onClick={() => {
                onLog(note.trim());
                setNote("");
              }}
            >
              Simpan
            </Button>
          </div>
          <ol className="relative space-y-3.5 border-l border-line pl-5">
            {lead.activities.map((a, i) => {
              const by = salesById[a.by];
              return (
                <li key={`${a.date}-${i}`} className="relative">
                  <span className={cx("absolute top-1.5 -left-[24.5px] size-2 rounded-full ring-4 ring-surface", activityDot[a.type] ?? "bg-fg")} />
                  <p className="text-[13px] text-muted">
                    <Badge className="mr-1.5">{a.type}</Badge>
                    {a.text}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-subtle">
                    {date(a.date)} · {by?.name ?? a.by}
                  </p>
                </li>
              );
            })}
          </ol>
        </Section>
      </div>
    </Drawer>
  );
}

/* ───────────────────────── New lead modal ───────────────────────── */

function NewLeadModal({ onClose, onCreate }) {
  const [f, setF] = useState({
    name: "",
    title: "",
    company: "",
    email: "",
    phone: "",
    value: "",
    source: "Referral",
    assigned: salesTeam[0].id,
    tags: "",
    location: "",
    need: "",
    status: "Data Baru",
  });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const valid = f.name.trim() && f.company.trim() && Number(f.value) > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="New Lead"
      description="Lead baru masuk ke pipeline dengan status Data Baru kecuali diubah."
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
              onCreate({
                ...f,
                name: f.name.trim(),
                company: f.company.trim(),
                title: f.title.trim() || "–",
                email: f.email.trim() || "–",
                phone: f.phone.trim() || "–",
                location: f.location.trim() || "–",
                need: f.need.trim() || "Belum ada catatan kebutuhan.",
                value: Number(f.value),
                tags: f.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .slice(0, 3),
              })
            }
          >
            Simpan lead
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama kontak">
          <Input value={f.name} onChange={set("name")} placeholder="mis. Hendra Wijaya" autoFocus />
        </Field>
        <Field label="Jabatan">
          <Input value={f.title} onChange={set("title")} placeholder="mis. PPK / Procurement Manager" />
        </Field>
        <Field label="Perusahaan / instansi" className="sm:col-span-2">
          <Input value={f.company} onChange={set("company")} placeholder="mis. Kawasan Industri Ketapang" />
        </Field>
        <Field label="Email">
          <Input type="email" value={f.email} onChange={set("email")} placeholder="nama@perusahaan.co.id" />
        </Field>
        <Field label="Telepon">
          <Input value={f.phone} onChange={set("phone")} placeholder="0812-…" />
        </Field>
        <Field label="Estimasi nilai proyek (Rp)" hint={Number(f.value) > 0 ? rp(Number(f.value)) : "Wajib diisi"}>
          <Input type="number" min={0} step={1_000_000} value={f.value} onChange={set("value")} className="tabular" />
        </Field>
        <Field label="Lokasi">
          <Input value={f.location} onChange={set("location")} placeholder="Kab./Kota, Provinsi" />
        </Field>
        <Field label="Source">
          <Select value={f.source} onChange={set("source")}>
            {leadSources.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Assigned">
          <Select value={f.assigned} onChange={set("assigned")}>
            {salesTeam.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={f.status} onChange={set("status")}>
            {leadStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tags" hint="Pisahkan dengan koma, maks. 3">
          <Input value={f.tags} onChange={set("tags")} placeholder="Pemerintah, Jembatan" />
        </Field>
        <Field label="Kebutuhan" className="sm:col-span-2">
          <Input value={f.need} onChange={set("need")} placeholder="Ringkasan lingkup pekerjaan yang dibutuhkan" />
        </Field>
      </div>
    </Modal>
  );
}
