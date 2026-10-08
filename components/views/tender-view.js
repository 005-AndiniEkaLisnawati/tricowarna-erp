"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  Clock,
  FileSpreadsheet,
  FileText,
  Gavel,
  ListChecks,
  LoaderCircle,
  MessageSquare,
  Package,
  PanelLeft,
  Plus,
  Search,
  Send,
  Star,
  Tag,
  Trash2,
  Truck,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { tenders as seedTenders, tenderStatuses } from "@/lib/data/tenders";
import {
  AiBadge,
  Avatar,
  Badge,
  Button,
  Callout,
  DragScroll,
  Card,
  EmptyState,
  Modal,
  Mono,
  Progress,
  Segmented,
  StatusBadge,
  Tabs,
  td,
  th,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { countdown, cx, date, dateLong, decimal, pct, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const DAY = 86_400_000;

function useNow(intervalMs = 1000) {
  // null until mounted so server and client render the same markup.
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now()); // eslint-disable-line react-hooks/set-state-in-effect
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function deadlineInfo(deadline, now) {
  if (now == null) return { label: date(deadline), tone: "neutral", past: false };
  const diff = new Date(deadline).getTime() - now;
  const days = Math.ceil(Math.abs(diff) / DAY);
  if (diff < 0) return { label: `lewat ${days}h`, tone: "red", past: true, days };
  if (days <= 5) return { label: `${days} hari`, tone: "amber", past: false, days };
  return { label: `${days} hari`, tone: "neutral", past: false, days };
}

function readiness(reqs) {
  const mandatory = reqs.filter((r) => r.mandatory);
  const missing = mandatory.filter((r) => !r.done).length;
  const notReady = reqs.filter((r) => !r.done).length;
  let label = "SIAP KIRIM";
  let tone = "green";
  if (missing > 0 && missing <= 3) {
    label = "SIAP DENGAN KONFIRMASI";
    tone = "amber";
  } else if (missing > 3) {
    label = "BELUM SIAP";
    tone = "red";
  }
  return { mandatory: mandatory.length, missing, notReady, label, tone };
}

const toneText = {
  green: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  neutral: "text-subtle",
};

export function TenderView() {
  const toast = useToast();
  const now = useNow();
  const [list, setList] = useState(seedTenders);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");
  const [selectedId, setSelectedId] = useState(seedTenders[1].id);
  const [listHidden, setListHidden] = useState(false);
  const [tab, setTab] = useState("ringkasan");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(
      (t) =>
        (status === "Semua" || t.status === status) &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.agency.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q)),
    );
  }, [list, query, status]);

  const counts = useMemo(() => {
    const c = { Semua: list.length };
    for (const t of list) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [list]);

  const selected = list.find((t) => t.id === selectedId) ?? null;
  const index = filtered.findIndex((t) => t.id === selectedId);

  const select = (id) => {
    setSelectedId(id);
    setTab("ringkasan");
  };

  const updateTender = (id, patch) =>
    setList((l) => l.map((t) => (t.id === id ? { ...t, ...patch(t) } : t)));

  const toggleRequirement = (reqId) =>
    updateTender(selectedId, (t) => ({
      requirements: t.requirements.map((r) => (r.id === reqId ? { ...r, done: !r.done } : r)),
    }));

  const remove = () => {
    const next = filtered[index + 1] ?? filtered[index - 1] ?? null;
    setList((l) => l.filter((t) => t.id !== selectedId));
    setSelectedId(next?.id ?? null);
    setConfirmDelete(false);
    toast({ title: "Tender dihapus", description: selected.title, tone: "info" });
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5">
        <div>
          <h1 className="flex items-center gap-2.5 text-[22px] font-semibold tracking-tight text-fg">
            <Gavel className="size-5" strokeWidth={2} />
            Tender
          </h1>
          <p className="mt-1 text-sm text-muted">
            Pantau kompetisi, uraikan persyaratan, siapkan penawaran
          </p>
        </div>
        <Link href="/tender/upload">
          <Button variant="primary" size="md" icon={Plus}>
            Tender Baru
          </Button>
        </Link>
      </div>

      <div className="flex min-h-[calc(100dvh-220px)] gap-4">
        {/* ─────────── Left: list ─────────── */}
        {!listHidden && (
          <Card
            className={cx(
              "w-full shrink-0 flex-col overflow-hidden lg:w-[380px]",
              selected ? "hidden lg:flex" : "flex",
            )}
          >
            <div className="space-y-2.5 border-b border-line p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setListHidden(true)}
                  className="hidden size-9 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-3 hover:text-fg lg:flex"
                  aria-label="Sembunyikan daftar"
                >
                  <PanelLeft className="size-4" />
                </button>
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari tender…"
                    className="h-9 w-full rounded-lg border border-line bg-surface-2 pr-3 pl-9 text-[13.5px] text-fg outline-none transition-colors placeholder:text-subtle focus:border-line-strong focus:bg-surface"
                  />
                </div>
              </div>
              <DragScroll className="flex gap-1">
                {tenderStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cx(
                      "flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-colors",
                      status === s
                        ? "border-fg bg-fg text-surface"
                        : "border-line text-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {s}
                    <span className="tabular opacity-60">{counts[s] ?? 0}</span>
                  </button>
                ))}
              </DragScroll>
            </div>

            <ul className="flex-1 overflow-y-auto scroll-thin">
              {filtered.length === 0 && (
                <EmptyState icon={Search} title="Tidak ada tender" description="Ubah kata kunci atau filter status." />
              )}
              {filtered.map((t) => {
                const active = t.id === selectedId;
                const dl = deadlineInfo(t.deadline, now);
                const r = readiness(t.requirements);
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => select(t.id)}
                      className={cx(
                        "relative w-full border-b border-line px-4 py-3.5 text-left transition-colors",
                        active ? "bg-surface-2" : "hover:bg-surface-2/60",
                      )}
                    >
                      {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-fg" />}
                      <div className="flex items-start gap-3">
                        <p className="line-clamp-2 flex-1 text-[14px] leading-snug font-medium text-fg">
                          {t.title}
                        </p>
                        <StatusBadge status={t.status} />
                        <ChevronRight
                          className={cx("mt-0.5 size-4 shrink-0", active ? "text-fg" : "text-line-strong")}
                        />
                      </div>
                      <p className="mt-1 truncate pr-6 text-[12.5px] text-subtle">{t.agency}</p>
                      <div className="mt-2 flex items-center gap-3 text-[12.5px]">
                        <span className="font-semibold text-fg tabular">{rp(t.hps)}</span>
                        <span className={cx("flex items-center gap-1 tabular", toneText[dl.tone])}>
                          <Clock className="size-3.5" />
                          {dl.label}
                        </span>
                        {r.notReady > 0 ? (
                          <span className="text-amber-600 tabular dark:text-amber-400">
                            {r.notReady} belum siap
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">lengkap</span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line px-4 py-2.5 text-[12px] text-subtle">
              Total HPS pipeline aktif{" "}
              <span className="font-medium text-fg tabular">
                {rpShort(
                  list
                    .filter((t) => t.status === "Disiapkan" || t.status === "Dianalisis")
                    .reduce((s, t) => s + t.hps, 0),
                )}
              </span>
            </div>
          </Card>
        )}

        {/* ─────────── Right: detail ─────────── */}
        <Card className={cx("min-w-0 flex-1 flex-col overflow-hidden", selected ? "flex" : "hidden lg:flex")}>
          {!selected ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={Gavel}
                title="Pilih tender"
                description="Pilih paket di daftar untuk melihat persyaratan, produk, distributor, dan simulasi penawaran."
              />
            </div>
          ) : (
            <>
              <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-3">
                {listHidden && (
                  <Button variant="ghost" size="icon" onClick={() => setListHidden(false)} aria-label="Tampilkan daftar">
                    <PanelLeft className="size-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedId(null)}
                  aria-label="Tutup detail"
                  className="hidden lg:flex"
                >
                  <X className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ArrowLeft}
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden"
                >
                  Daftar
                </Button>
                <div className="mx-1 h-5 w-px bg-line" />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={index <= 0}
                  onClick={() => select(filtered[index - 1].id)}
                  aria-label="Tender sebelumnya"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={index < 0 || index >= filtered.length - 1}
                  onClick={() => select(filtered[index + 1].id)}
                  aria-label="Tender berikutnya"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <span className="ml-1 text-[12.5px] text-subtle tabular">
                  {index >= 0 ? index + 1 : "–"} dari {filtered.length}
                </span>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="ml-auto flex size-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-500/10"
                  aria-label="Hapus tender"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scroll-thin">
                <TenderHeader
                  tender={selected}
                  now={now}
                  open={headerOpen}
                  onToggle={() => setHeaderOpen((o) => !o)}
                />
                <div className="sticky top-0 z-10 bg-surface px-3 sm:px-5">
                  <Tabs
                    value={tab}
                    onChange={setTab}
                    items={[
                      { value: "ringkasan", label: "Ringkasan", icon: FileText },
                      { value: "persyaratan", label: "Persyaratan", icon: ListChecks, count: selected.requirements.length },
                      { value: "produk", label: "Produk", icon: Package, count: selected.products.length },
                      { value: "distributor", label: "Distributor", icon: Truck },
                      { value: "penawaran", label: "Penawaran", icon: Tag },
                      { value: "diskusi", label: "Diskusi", icon: MessageSquare, count: selected.discussions.length },
                    ]}
                  />
                </div>
                <div key={selected.id + tab} className="p-3 animate-fade-in sm:p-5">
                  {tab === "ringkasan" && <SummaryTab tender={selected} onGoto={setTab} />}
                  {tab === "persyaratan" && (
                    <RequirementsTab tender={selected} onToggle={toggleRequirement} />
                  )}
                  {tab === "produk" && <ProductsTab tender={selected} />}
                  {tab === "distributor" && (
                    <DistributorTab
                      tender={selected}
                      onToggle={(name) =>
                        updateTender(selected.id, (t) => ({
                          distributors: t.distributors.map((d) =>
                            d.name === name ? { ...d, chosen: !d.chosen } : d,
                          ),
                        }))
                      }
                    />
                  )}
                  {tab === "penawaran" && <OfferTab tender={selected} />}
                  {tab === "diskusi" && (
                    <DiscussionTab
                      tender={selected}
                      onPost={(text) =>
                        updateTender(selected.id, (t) => ({
                          discussions: [
                            ...t.discussions,
                            { who: "Rina Kartikasari", initials: "RK", when: "baru saja", text },
                          ],
                        }))
                      }
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title="Hapus tender ini?"
        description="Persyaratan, berkas KAK, dan diskusi pada paket ini ikut terhapus."
        footer={
          <>
            <Button onClick={() => setConfirmDelete(false)}>Batal</Button>
            <Button variant="danger" icon={Trash2} onClick={remove}>
              Hapus tender
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-fg">{selected?.title}</p>
        <p className="mt-1">
          <Mono>{selected?.code}</Mono>
        </p>
      </Modal>
    </div>
  );
}

/* ───────────────────────── Header block ───────────────────────── */

function TenderHeader({ tender, now, open, onToggle }) {
  const dl = deadlineInfo(tender.deadline, now);
  const r = readiness(tender.requirements);
  const live = now != null ? countdown(tender.deadline, now) : null;

  return (
    <div className="border-b border-line px-5 pt-5 pb-5 sm:px-6">
      <div className="flex items-start gap-3">
        <h2 className="flex-1 text-[19px] leading-snug font-semibold tracking-tight text-fg">
          {tender.title}
        </h2>
        <Badge className="mt-0.5 px-2.5 py-1 text-[12px]">{tender.status}</Badge>
        <button
          onClick={onToggle}
          className="mt-0.5 flex size-7 items-center justify-center rounded-md text-subtle hover:bg-surface-3 hover:text-fg"
          aria-label={open ? "Ciutkan detail" : "Bentangkan detail"}
        >
          <ChevronUp className={cx("size-4 transition-transform", !open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
          <Meta label="Nomor">
            <span className="font-mono text-[13px] tracking-tight">{tender.inaproc}</span>
          </Meta>
          <Meta label="Instansi">{tender.agency}</Meta>
          <Meta label="Lokasi">{tender.location}</Meta>
          <Meta label="Kualifikasi">{tender.qualification}</Meta>
          <Meta label="Jenis penawaran">{tender.offerType}</Meta>
          <Meta label="Jenis pekerjaan">{tender.workType}</Meta>
        </dl>
      )}

      <div className="mt-5 grid grid-cols-1 items-end gap-4 border-t border-line pt-4 sm:grid-cols-[auto_auto_1fr]">
        <div className="pr-6">
          <p className="text-[12.5px] text-subtle">HPS</p>
          <p className="text-[24px] leading-tight font-semibold tracking-tight text-fg tabular">
            {rp(tender.hps)}
          </p>
        </div>
        <div>
          <p className="text-[12.5px] text-subtle">Tenggat penawaran</p>
          <p className={cx("text-[17px] font-semibold", dl.past ? toneText.red : dl.tone === "amber" ? toneText.amber : "text-fg")}>
            {date(tender.deadline)}
          </p>
          <p className={cx("flex items-center gap-1 text-[12.5px] tabular", toneText[dl.tone])}>
            {dl.past ? (
              `lewat ${dl.days} hari`
            ) : live ? (
              <>
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-current" />
                </span>
                sisa {live}
              </>
            ) : (
              " "
            )}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[12.5px] text-subtle">Kesiapan berkas</p>
          <p className={cx("text-[15px] font-bold tracking-wide", toneText[r.tone])}>{r.label}</p>
          <p className="text-[12.5px] text-muted">
            {r.missing > 0
              ? `${r.missing} dari ${r.mandatory} persyaratan wajib belum dipastikan.`
              : `Semua ${r.mandatory} persyaratan wajib terpenuhi.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12.5px] text-subtle">{label}</dt>
      <dd className="mt-0.5 truncate text-[14px] text-fg">{children}</dd>
    </div>
  );
}

/* ───────────────────────── Ringkasan ───────────────────────── */

function SummaryTab({ tender, onGoto }) {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfs.length === 0) {
      toast({ title: "Hanya file PDF", description: "KAK dan dokumen pemilihan harus berformat PDF.", tone: "warning" });
      return;
    }
    const added = pdfs.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      state: "parsing",
    }));
    setFiles((cur) => [...cur, ...added]);
    added.forEach((f, i) => {
      setTimeout(() => {
        setFiles((cur) => cur.map((x) => (x.id === f.id ? { ...x, state: "done", found: 3 + ((i * 5) % 7) } : x)));
        toast({ title: "KAK selesai diurai", description: `${f.name} — persyaratan baru ditambahkan untuk ditinjau.` });
      }, 1600 + i * 700);
    });
  };

  const schedule = useMemo(() => {
    const d = new Date(tender.deadline).getTime();
    return [
      ["Pengumuman & download dokumen", d - 14 * DAY],
      ["Pemberian penjelasan (aanwijzing)", d - 8 * DAY],
      ["Upload dokumen penawaran", d],
      ["Pembukaan & evaluasi penawaran", d + 2 * DAY],
      ["Pengumuman pemenang", d + 12 * DAY],
    ].map(([label, t]) => ({ label, iso: new Date(t).toISOString() }));
  }, [tender.deadline]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cx(
            "rounded-xl border px-5 py-4 transition-colors",
            dragging ? "border-dashed border-indigo-400 bg-indigo-500/5" : "border-line",
          )}
        >
          <h3 className="text-[15px] font-semibold text-fg">Dokumen KAK</h3>
          <p className="mt-1 text-[13px] text-muted">
            {tender.requirements.length} persyaratan sudah diuraikan. Unggah ulang bila ada dokumen tambahan.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md" icon={Upload} onClick={() => inputRef.current?.click()}>
              Unggah KAK (bisa beberapa PDF)
            </Button>
            <span className="text-[12.5px] text-subtle">atau seret berkas PDF ke area ini</span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          {files.length > 0 && (
            <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                  <FileText className="size-4 shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-fg">{f.name}</p>
                    <p className="text-[11.5px] text-subtle tabular">{decimal(f.size / 1024 / 1024, 2)} MB</p>
                  </div>
                  {f.state === "parsing" ? (
                    <span className="flex items-center gap-1.5 text-[12px] text-indigo-600 dark:text-indigo-400">
                      <LoaderCircle className="size-3.5 animate-spin" />
                      Agent Hermes mengurai…
                    </span>
                  ) : (
                    <AiBadge label={`${f.found} persyaratan ditemukan`} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-indigo-600 text-white">
              <Bot className="size-3.5" />
            </span>
            <h3 className="text-[14px] font-semibold text-fg">Ringkasan Agent Hermes</h3>
            <span className="text-[11.5px] text-subtle">dari KAK & dokumen pemilihan</span>
          </div>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg">{tender.aiSummary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="xs" onClick={() => onGoto("persyaratan")}>Tinjau persyaratan</Button>
            <Button size="xs" onClick={() => onGoto("penawaran")}>Simulasi penawaran</Button>
          </div>
        </div>

        <div className="rounded-xl border border-line px-5 py-4">
          <h3 className="text-[15px] font-semibold text-fg">Target penyelesaian pekerjaan</h3>
          <p className="mt-1 text-[13.5px] text-muted">{dateLong(tender.finishTarget)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-line px-4 py-3.5">
          <h3 className="text-[13px] font-semibold text-fg">Informasi paket</h3>
          <dl className="mt-2.5 space-y-2.5 text-[13px]">
            {[
              ["Kode SPSE", <Mono key="c">{tender.code}</Mono>],
              ["Satker", tender.satker],
              ["Metode", tender.method],
              ["Sumber dana", tender.fund],
              ["Estimator", tender.estimator],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="shrink-0 text-subtle">{k}</dt>
                <dd className="text-right text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-xl border border-line px-4 py-3.5">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-fg">
            <CalendarDays className="size-4 text-subtle" /> Jadwal pemilihan
          </h3>
          <ol className="relative mt-3 space-y-3 border-l border-line pl-4">
            {schedule.map((s) => (
              <li key={s.label} className="relative">
                <span className="absolute top-1.5 -left-[20.5px] size-2 rounded-full border-2 border-surface bg-line-strong" />
                <p className="text-[12.5px] text-fg">{s.label}</p>
                <p className="text-[11.5px] text-subtle tabular">{date(s.iso)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Persyaratan ───────────────────────── */

function RequirementsTab({ tender, onToggle }) {
  const [onlyOpen, setOnlyOpen] = useState(false);
  const r = readiness(tender.requirements);
  const done = tender.requirements.filter((x) => x.done).length;
  const groups = useMemo(() => {
    const m = new Map();
    for (const req of tender.requirements) {
      if (onlyOpen && req.done) continue;
      if (!m.has(req.group)) m.set(req.group, []);
      m.get(req.group).push(req);
    }
    return [...m.entries()];
  }, [tender.requirements, onlyOpen]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line px-4 py-3">
        <div className="min-w-[200px] flex-1">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-muted">
              <span className="font-semibold text-fg tabular">{done}</span> dari {tender.requirements.length} persyaratan siap
            </span>
            <span className={cx("font-semibold", toneText[r.tone])}>{r.label}</span>
          </div>
          <Progress value={(done / tender.requirements.length) * 100} tone={r.tone === "green" ? "green" : r.tone === "amber" ? "amber" : "red"} className="mt-2" />
        </div>
        <Segmented
          value={onlyOpen ? "open" : "all"}
          onChange={(v) => setOnlyOpen(v === "open")}
          items={[
            { value: "all", label: "Semua" },
            { value: "open", label: "Belum siap", count: r.notReady },
          ]}
        />
      </div>

      {groups.length === 0 && (
        <EmptyState icon={CircleCheck} title="Semua persyaratan siap" description="Tidak ada berkas yang perlu dikonfirmasi lagi." />
      )}

      {groups.map(([group, items]) => (
        <div key={group}>
          <p className="mb-1.5 px-1 text-[11.5px] font-medium tracking-wide text-subtle uppercase">{group}</p>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {items.map((req) => (
              <li key={req.id}>
                <label className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                  <input type="checkbox" className="peer sr-only" checked={req.done} onChange={() => onToggle(req.id)} />
                  <span
                    className={cx(
                      "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)]",
                      req.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-line-strong bg-surface",
                    )}
                  >
                    {req.done && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cx("block text-[13.5px]", req.done ? "text-muted" : "text-fg")}>
                      {req.title}
                    </span>
                    {req.note && (
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] text-amber-600 dark:text-amber-400">
                        <TriangleAlert className="size-3" /> {req.note}
                      </span>
                    )}
                  </span>
                  {req.mandatory ? <Badge tone={req.done ? "neutral" : "amber"}>Wajib</Badge> : <Badge>Opsional</Badge>}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Produk ───────────────────────── */

function ProductsTab({ tender }) {
  const total = tender.products.reduce((s, p) => s + p.qty * p.price, 0);
  const tkdn = total ? tender.products.reduce((s, p) => s + p.qty * p.price * p.tkdn, 0) / total : 0;
  if (tender.products.length === 0)
    return <EmptyState icon={Package} title="Belum ada item" description="Unggah BOQ atau KAK agar AI mengekstrak item pekerjaan." />;
  return (
    <div className="space-y-3">
      <TableScroll className="rounded-xl border border-line">
        <table className="w-full">
          <thead className="bg-surface-2">
            <tr>
              <th className={th}>Item pekerjaan / produk</th>
              <th className={th}>Sat.</th>
              <th className={cx(th, "text-right")}>Volume</th>
              <th className={cx(th, "text-right")}>Harga satuan</th>
              <th className={cx(th, "text-right")}>Jumlah</th>
              <th className={cx(th, "text-right")}>TKDN</th>
            </tr>
          </thead>
          <tbody>
            {tender.products.map((p) => (
              <tr key={p.name} className="border-t border-line">
                <td className={cx(td, "whitespace-normal")}>{p.name}</td>
                <td className={cx(td, "text-muted")}>{p.unit}</td>
                <td className={cx(td, "text-right tabular")}>{decimal(p.qty, 0)}</td>
                <td className={cx(td, "text-right tabular")}>{rp(p.price)}</td>
                <td className={cx(td, "text-right font-medium tabular")}>{rp(p.qty * p.price)}</td>
                <td className={cx(td, "text-right tabular text-muted")}>{pct(p.tkdn)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-line-strong bg-surface-2">
            <tr>
              <td className={cx(td, "font-semibold")} colSpan={4}>Total biaya langsung</td>
              <td className={cx(td, "text-right font-semibold tabular")}>{rp(total)}</td>
              <td className={cx(td, "text-right font-semibold tabular")}>{pct(tkdn)}</td>
            </tr>
          </tfoot>
        </table>
      </TableScroll>
      <p className="px-1 text-[12px] text-subtle">
        Harga satuan = Σ(koefisien AHSP × harga master). Lihat rincian di{" "}
        <Link href="/tender/boq" className="font-medium text-fg underline-offset-2 hover:underline">
          Rekap BOQ & Margin
        </Link>
        .
      </p>
    </div>
  );
}

/* ───────────────────────── Distributor ───────────────────────── */

function DistributorTab({ tender, onToggle }) {
  const toast = useToast();
  if (tender.distributors.length === 0)
    return (
      <EmptyState
        icon={Truck}
        title="Belum ada distributor"
        description="Kirim RFQ ke vendor terdaftar untuk mendapatkan harga pembanding."
        action={<Button icon={Send} onClick={() => toast({ title: "RFQ dikirim ke 6 vendor terdaftar", tone: "info" })}>Kirim RFQ</Button>}
      />
    );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {tender.distributors.map((d) => (
          <div
            key={d.name}
            className={cx(
              "rounded-xl border px-4 py-3.5 transition-colors",
              d.chosen ? "border-line-strong bg-surface" : "border-line bg-surface-2/50",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[14px] font-medium text-fg">
                  <Building2 className="size-4 shrink-0 text-subtle" />
                  <span className="truncate">{d.name}</span>
                </p>
                <p className="mt-0.5 text-[12.5px] text-subtle">
                  {d.scope} · {d.city}
                </p>
              </div>
              {d.affiliate && <Badge tone="violet">Afiliasi grup</Badge>}
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[11.5px] text-subtle">Penawaran vendor</p>
                <p className="text-[15px] font-semibold text-fg tabular">{rp(d.quote)}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
                  <span>Lead time {d.lead}</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {decimal(d.rating, 1)}
                  </span>
                </p>
              </div>
              <Button
                size="xs"
                variant={d.chosen ? "success" : "secondary"}
                icon={d.chosen ? Check : Plus}
                onClick={() => onToggle(d.name)}
              >
                {d.chosen ? "Dipakai" : "Pakai"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Penawaran ───────────────────────── */

function OfferTab({ tender }) {
  const toast = useToast();
  const direct = tender.products.reduce((s, p) => s + p.qty * p.price, 0) || tender.hps * 0.78;
  const [margin, setMargin] = useState(10);
  const subtotal = direct * (1 + margin / 100);
  const rounded = Math.floor(subtotal / 1000) * 1000;
  const ppn = Math.round(rounded * (11 / 12) * 0.12);
  const total = rounded + ppn;
  const ratio = (total / tender.hps) * 100;

  let state = { tone: "green", text: "Dalam rentang wajar (80–100% HPS)." };
  if (ratio > 100) state = { tone: "red", text: "Melebihi HPS — penawaran akan gugur." };
  else if (ratio < 80) state = { tone: "amber", text: "Di bawah 80% HPS — wajib klarifikasi kewajaran harga & jaminan pelaksanaan tambahan." };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
      <div className="rounded-xl border border-line">
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center justify-between">
            <label htmlFor="margin" className="text-[13.5px] font-medium text-fg">
              Overhead & keuntungan
            </label>
            <span className="text-[15px] font-semibold text-fg tabular">{pct(margin)}</span>
          </div>
          <input
            id="margin"
            type="range"
            min={0}
            max={25}
            step={0.5}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="mt-3 w-full accent-slate-900 dark:accent-slate-100"
          />
          <div className="mt-1 flex justify-between text-[11px] text-subtle tabular">
            <span>0%</span>
            <span>Permen PUPR maks. 15%</span>
            <span>25%</span>
          </div>
        </div>
        <dl className="divide-y divide-line text-[13.5px]">
          {[
            ["Biaya langsung (Σ BOQ)", rp(direct)],
            [`Overhead & keuntungan ${pct(margin)}`, rp(subtotal - direct)],
            ["Jumlah (dibulatkan ribuan)", rp(rounded)],
            ["PPN 12% × DPP 11/12", rp(ppn)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between px-5 py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd className="text-fg tabular">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between bg-surface-2 px-5 py-3">
            <dt className="font-semibold text-fg">Nilai penawaran</dt>
            <dd className="text-[16px] font-semibold text-fg tabular">{rp(total)}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-line px-4 py-4">
          <p className="text-[12.5px] text-subtle">Terhadap HPS {rpShort(tender.hps)}</p>
          <p className={cx("mt-1 text-[28px] leading-none font-semibold tracking-tight tabular", toneText[state.tone])}>
            {pct(ratio)}
          </p>
          <div className="relative mt-4 h-2 rounded-full bg-gradient-to-r from-amber-400/60 via-emerald-500/60 via-[75%] to-red-500/60">
            <span className="absolute top-0 left-[80%] h-2 w-px bg-surface" />
            <span
              className="absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-surface bg-fg shadow transition-[left] duration-300"
              style={{ left: `${Math.min(100, Math.max(0, ((ratio - 60) / 50) * 100))}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10.5px] text-subtle tabular">
            <span>60%</span>
            <span>80%</span>
            <span>100%</span>
            <span>110%</span>
          </div>
          <Callout tone={state.tone === "green" ? "green" : state.tone} className="mt-3">
            {state.text}
          </Callout>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="md"
            icon={Check}
            onClick={() => toast({ title: "Revisi R-2 disimpan", description: `Nilai penawaran ${rp(total)} · ${pct(ratio)} HPS` })}
          >
            Simpan sebagai revisi R-2
          </Button>
          <Button
            size="md"
            icon={FileSpreadsheet}
            onClick={() =>
              toast({ title: "Excel format SPSE disiapkan", description: "Resume, Sub Resume, BOQ, Analisa, Bahan & Upah — 6 sheet.", tone: "info" })
            }
          >
            Export Excel format SPSE
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Diskusi ───────────────────────── */

function DiscussionTab({ tender, onPost }) {
  const [text, setText] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onPost(text.trim());
    setText("");
  };
  return (
    <div className="max-w-3xl space-y-4">
      {tender.discussions.length === 0 && (
        <EmptyState icon={MessageSquare} title="Belum ada diskusi" description="Catat temuan aanwijzing atau koordinasi tim di sini." />
      )}
      <ul className="space-y-4">
        {tender.discussions.map((d, i) => (
          <li key={i} className="flex gap-3">
            <Avatar initials={d.initials} tone={d.ai ? "indigo" : "zinc"} className="size-8" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px]">
                <span className="font-medium text-fg">{d.who}</span>
                {d.ai && <Badge tone="indigo" className="ml-2">AI</Badge>}
                <span className="ml-2 text-subtle">{d.when}</span>
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-fg">{d.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="flex items-end gap-2 rounded-xl border border-line p-2 focus-within:border-line-strong">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
          }}
          placeholder="Tulis catatan… (Ctrl+Enter untuk kirim)"
          className="flex-1 resize-none bg-transparent px-2 py-1 text-[13.5px] text-fg outline-none placeholder:text-subtle"
        />
        <Button type="submit" variant="primary" icon={Send} disabled={!text.trim()}>
          Kirim
        </Button>
      </form>
    </div>
  );
}
