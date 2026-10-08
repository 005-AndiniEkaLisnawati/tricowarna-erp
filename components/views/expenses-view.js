"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleCheck,
  Download,
  FileImage,
  Paperclip,
  Plus,
  ReceiptText,
  RotateCcw,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { advances, categoryByName, expenseCategories, expenses as seed, ocrResult } from "@/lib/data/finance";
import { costCenters, projectByCode, projects } from "@/lib/data/org";
import {
  AiBadge,
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
import { cx, date, decimal, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const statusFilters = ["Semua", "Menunggu Approval", "Disetujui", "Posted", "Ditolak"];

export function ExpensesView() {
  const toast = useToast();
  const [rows, setRows] = useState(seed);
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // null | "manual" | "scan"

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "Semua" || r.status === filter) &&
        (!q || r.vendor.toLowerCase().includes(q) || r.no.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)),
    );
  }, [rows, filter, query]);

  const monthTotal = rows.filter((r) => r.date >= "2026-10-01" && r.status !== "Ditolak").reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter((r) => r.status === "Menunggu Approval");
  const aiShare = rows.filter((r) => r.ai != null).length / rows.length;

  const setStatus = (no, status) => {
    setRows((rs) => rs.map((r) => (r.no === no ? { ...r, status } : r)));
    toast({
      title: status === "Disetujui" ? `${no} disetujui` : `${no} ditolak`,
      description: status === "Disetujui" ? "Realisasi budget & jurnal beban dibentuk otomatis." : "Pemohon menerima notifikasi email & WhatsApp.",
      tone: status === "Disetujui" ? "success" : "info",
    });
  };

  const submit = (entry) => {
    setRows((rs) => [entry, ...rs]);
    setModal(null);
    setFilter("Semua");
    toast({ title: `${entry.no} diajukan`, description: `${entry.vendor} · ${rp(entry.amount)} — menunggu approval L1.` });
  };

  return (
    <div>
      <PageHeader
        icon={Wallet}
        title="Expenses"
        description="Realisasi biaya proyek & kantor — nota dibaca AI Vision, langsung terhubung ke budget dan COA."
        actions={
          <>
            <Button size="md" icon={Download} onClick={() => toast({ title: "Ekspor Excel disiapkan", tone: "info" })}>
              Export
            </Button>
            <Button size="md" icon={Plus} onClick={() => setModal("manual")}>
              Ajukan Nota
            </Button>
            <Button size="md" variant="ai" icon={ScanLine} onClick={() => setModal("scan")}>
              Scan Nota via AI Vision
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Realisasi Oktober" value={rpShort(monthTotal)} hint="semua proyek & kantor" />
        <StatCard
          label="Menunggu approval"
          value={pending.length}
          hint={rpShort(pending.reduce((s, r) => s + r.amount, 0))}
          delta="●"
          deltaTone="amber"
        />
        <StatCard label="Dibaca AI Vision" value={`${decimal(aiShare * 100, 0)}%`} hint="nota tanpa input manual" />
        <StatCard
          label="Kasbon belum settle"
          value={rpShort(advances.filter((a) => a.status !== "Settled").reduce((s, a) => s + a.amount - a.realized, 0))}
          hint={`${advances.filter((a) => a.status !== "Settled").length} kasbon aktif`}
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
              placeholder="Cari vendor, nomor, kategori…"
              className="h-8 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-line-strong"
            />
          </div>
        </div>
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>No. / Tanggal</th>
                <th className={th}>Vendor</th>
                <th className={th}>Kategori · COA</th>
                <th className={th}>Proyek / CC</th>
                <th className={th}>Kasbon</th>
                <th className={cx(th, "text-right")}>Nominal</th>
                <th className={th}>Sumber</th>
                <th className={th}>Status</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const cat = categoryByName[r.category];
                return (
                  <tr key={r.no} className={cx(trHover, r.fresh && "bg-emerald-500/[0.04]")}>
                    <td className={td}>
                      <div className="font-medium">{r.no}</div>
                      <div className="text-[12px] text-subtle">{date(r.date)}</div>
                    </td>
                    <td className={td}>
                      <div>{r.vendor}</div>
                      <div className="text-[12px] text-subtle">oleh {r.by}</div>
                    </td>
                    <td className={td}>
                      <div>{r.category}</div>
                      <Mono className="text-[11.5px]">{cat?.coa} {cat?.coaName}</Mono>
                    </td>
                    <td className={td}>
                      {r.project ? (
                        <>
                          <Mono>{r.project}</Mono>
                          <div className="text-[12px] text-subtle">{projectByCode[r.project]?.short}</div>
                        </>
                      ) : (
                        <>
                          <Mono>{r.costCenter}</Mono>
                          <div className="text-[12px] text-subtle">Pusat</div>
                        </>
                      )}
                    </td>
                    <td className={td}>{r.advance ? <Mono>{r.advance}</Mono> : <span className="text-subtle">–</span>}</td>
                    <td className={cx(td, "text-right font-medium tabular")}>{rp(r.amount)}</td>
                    <td className={td}>
                      {r.ai != null ? (
                        <AiBadge label="AI Vision" confidence={r.ai} />
                      ) : (
                        <Badge>Manual</Badge>
                      )}
                    </td>
                    <td className={td}>
                      <StatusBadge status={r.status} />
                      {r.note && <div className="mt-0.5 text-[11.5px] text-red-600 dark:text-red-400">{r.note}</div>}
                    </td>
                    <td className={cx(td, "text-right")}>
                      {r.status === "Menunggu Approval" && (
                        <div className="flex justify-end gap-1">
                          <Button size="xs" variant="ghost" onClick={() => setStatus(r.no, "Ditolak")} aria-label="Tolak">
                            <X className="size-3.5" />
                          </Button>
                          <Button size="xs" variant="success" icon={Check} onClick={() => setStatus(r.no, "Disetujui")}>
                            Approve
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState icon={ReceiptText} title="Tidak ada expense" description="Ubah filter atau ajukan nota baru." />}
        </TableScroll>
      </Card>

      {modal && (
        <ExpenseModal
          autoScan={modal === "scan"}
          nextNo={`EXP-2026-${1288 + rows.length - seed.length}`}
          onClose={() => setModal(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Modal: Pengajuan Nota ───────────────────────── */

const scanSteps = [
  [0, "Mengunggah gambar nota…"],
  [22, "Agent Hermes reading OCR receipt data…"],
  [58, "Mencocokkan vendor & kategori ke master COA…"],
  [84, "Validasi NPWP, total & cek nota ganda…"],
];

const SCAN_MS = 1500;

function formatDigits(n) {
  return n ? new Intl.NumberFormat("id-ID").format(n) : "";
}

function ExpenseModal({ autoScan, nextNo, onClose, onSubmit }) {
  const [source, setSource] = useState(autoScan ? "sample" : null); // null | "sample" | {url,name}
  const [phase, setPhase] = useState(autoScan ? "scanning" : "idle"); // idle | scanning | done
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    vendor: "",
    date: "2026-10-08",
    amount: 0,
    category: "",
    invoiceNo: "",
    npwp: "",
    project: "PRJ-TRT-2026-001",
    advance: "",
    note: "",
  });
  const [aiFields, setAiFields] = useState({}); // field -> confidence
  const fileRef = useRef(null);
  const timer = useRef(null);

  // Animation loop only — every setState happens inside rAF callbacks.
  const runScan = () => {
    const started = performance.now();
    const tick = () => {
      const p = Math.min(100, ((performance.now() - started) / SCAN_MS) * 100);
      setProgress(p);
      if (p < 100) {
        timer.current = requestAnimationFrame(tick);
      } else {
        setPhase("done");
        setForm((f) => ({
          ...f,
          vendor: ocrResult.vendor.value,
          date: ocrResult.date.value,
          amount: ocrResult.amount.value,
          category: ocrResult.category.value,
          invoiceNo: ocrResult.invoiceNo.value,
          npwp: ocrResult.npwp.value,
          advance: "ADV-2026-0421",
        }));
        setAiFields({
          vendor: ocrResult.vendor.confidence,
          date: ocrResult.date.confidence,
          amount: ocrResult.amount.confidence,
          category: ocrResult.category.confidence,
          invoiceNo: ocrResult.invoiceNo.confidence,
          npwp: ocrResult.npwp.confidence,
          advance: null,
        });
      }
    };
    cancelAnimationFrame(timer.current);
    timer.current = requestAnimationFrame(tick);
  };

  const startScan = () => {
    setPhase("scanning");
    setProgress(0);
    setAiFields({});
    runScan();
  };

  // "Scan Nota via AI Vision" from the page header starts immediately.
  useEffect(() => {
    if (autoScan) runScan();
    return () => cancelAnimationFrame(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => source?.url && URL.revokeObjectURL(source.url), [source]);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    // A human edit replaces the AI value — drop the badge, keep an audit hint.
    setAiFields((a) => (key in a ? { ...a, [key]: "edited" } : a));
  };

  const onFile = (file) => {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    setSource(isImage ? { url: URL.createObjectURL(file), name: file.name } : { name: file.name, pdf: true });
    startScan();
  };

  const cat = categoryByName[form.category];
  const projectAdvances = advances.filter((a) => a.project === form.project && a.status !== "Settled");
  const advance = advances.find((a) => a.no === form.advance);
  const budgetLeft = { "PRJ-TRT-2026-001": 412_600_000, "PRJ-TRT-2026-002": 96_300_000, "PRJ-TRT-2026-004": 1_284_000_000 }[form.project] ?? 0;
  const canSubmit = form.vendor && form.amount > 0 && form.category && phase !== "scanning";

  const aside = (key) => {
    const v = aiFields[key];
    if (v === undefined) return null;
    if (v === "edited") return <Badge className="text-[10.5px]">Diedit manual</Badge>;
    if (v === null) return <AiBadge label="AI disarankan" />;
    return <AiBadge confidence={v} />;
  };
  const hl = (key) => typeof aiFields[key] === "number" || aiFields[key] === null;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Pengajuan Nota / Realisasi Biaya"
      description={`${nextNo} · Upload nota, biarkan AI Vision mengisi, lalu periksa sebelum diajukan.`}
      footer={
        <>
          <span className="mr-auto hidden items-center gap-1.5 text-[12px] text-subtle sm:flex">
            <ShieldCheck className="size-3.5" />
            Semua aksi AI tercatat di audit log. Approval tetap oleh manusia.
          </span>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            icon={Check}
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                no: nextNo,
                date: form.date,
                vendor: form.vendor,
                category: form.category,
                project: form.project || null,
                costCenter: form.project ? null : "CC-100",
                amount: form.amount,
                advance: form.advance || null,
                status: "Menunggu Approval",
                ai: typeof aiFields.amount === "number" ? aiFields.amount : null,
                by: "Rina Kartikasari",
                fresh: true,
              })
            }
          >
            Ajukan untuk approval
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* ── Receipt pane ── */}
        <div>
          <div className="relative overflow-hidden rounded-xl border border-line bg-surface-3">
            {!source ? (
              <div
                className="flex min-h-[460px] flex-col items-center justify-center p-6 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFile(e.dataTransfer.files[0]);
                }}
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
                  <ScanLine className="size-6" />
                </div>
                <p className="mt-4 text-[15px] font-semibold text-fg">Scan Nota via AI Vision</p>
                <p className="mt-1 max-w-[280px] text-[13px] text-muted">
                  Foto nota, kuitansi, atau faktur. Agent Hermes membaca vendor, tanggal, nominal, dan menyarankan kategori & akun.
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button variant="ai" size="md" icon={Sparkles} onClick={() => { setSource("sample"); startScan(); }}>
                    Scan contoh nota
                  </Button>
                  <Button size="md" icon={Upload} onClick={() => fileRef.current?.click()}>
                    Unggah foto / PDF
                  </Button>
                </div>
                <p className="mt-3 text-[11.5px] text-subtle">JPG, PNG, HEIC atau PDF · maks. 10 MB</p>
              </div>
            ) : (
              <div className="relative flex min-h-[460px] items-center justify-center p-5">
                {source === "sample" ? (
                  <SampleReceipt revealed={phase === "done"} />
                ) : source.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={source.url} alt={source.name} className="max-h-[520px] rounded-md object-contain shadow-md" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted">
                    <FileImage className="size-10" strokeWidth={1.4} />
                    <span className="text-[13px]">{source.name}</span>
                  </div>
                )}

                {phase === "scanning" && (
                  <div className="absolute inset-0 bg-slate-950/30 animate-fade-in">
                    <div className="absolute inset-x-0 h-0.5 animate-scan bg-indigo-400" />
                    <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white shadow-lg">
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-indigo-400" />
                          </span>
                          {[...scanSteps].reverse().find(([at]) => progress >= at)[1]}
                        </span>
                        <span className="font-mono text-[11.5px] text-slate-400">{Math.round(progress)}%</span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            hidden
            onChange={(e) => {
              onFile(e.target.files[0]);
              e.target.value = "";
            }}
          />
          {source && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-subtle">
                <Paperclip className="size-3.5 shrink-0" />
                <span className="truncate">{source === "sample" ? "nota-material-jaya-0817.jpg" : source.name}</span>
              </span>
              <div className="flex gap-1">
                <Button size="xs" variant="ghost" icon={RotateCcw} disabled={phase === "scanning"} onClick={startScan}>
                  Scan ulang
                </Button>
                <Button size="xs" variant="ghost" icon={Upload} disabled={phase === "scanning"} onClick={() => fileRef.current?.click()}>
                  Ganti berkas
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Form pane ── */}
        <div className="space-y-4">
          {phase === "done" && (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5 animate-pop">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="text-[13px] leading-relaxed text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">6 field terisi otomatis</span> dalam 1,5 detik. Rata-rata keyakinan{" "}
                <span className="font-semibold tabular">96,6%</span> — periksa sebelum mengajukan.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Vendor / Supplier" aside={aside("vendor")} className="sm:col-span-2">
              <Input value={form.vendor} highlight={hl("vendor")} onChange={(e) => update("vendor", e.target.value)} placeholder="Nama vendor" />
            </Field>
            <Field label="Tanggal nota" aside={aside("date")}>
              <Input type="date" value={form.date} highlight={hl("date")} onChange={(e) => update("date", e.target.value)} />
            </Field>
            <Field label="Nominal" aside={aside("amount")}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13.5px] text-subtle">Rp</span>
                <Input
                  inputMode="numeric"
                  value={formatDigits(form.amount)}
                  highlight={hl("amount")}
                  onChange={(e) => update("amount", Number(e.target.value.replace(/\D/g, "")) || 0)}
                  className="pl-9 font-medium tabular"
                  placeholder="0"
                />
              </div>
            </Field>
            <Field label="Kategori biaya" aside={aside("category")} className="sm:col-span-2">
              <Select value={form.category} highlight={hl("category")} onChange={(e) => update("category", e.target.value)}>
                <option value="">Pilih kategori…</option>
                {expenseCategories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="No. faktur / nota" aside={aside("invoiceNo")}>
              <Input value={form.invoiceNo} highlight={hl("invoiceNo")} onChange={(e) => update("invoiceNo", e.target.value)} className="font-mono text-[13px]" />
            </Field>
            <Field label="NPWP vendor" aside={aside("npwp")}>
              <Input value={form.npwp} highlight={hl("npwp")} onChange={(e) => update("npwp", e.target.value)} className="font-mono text-[13px]" />
            </Field>
            <Field label="Proyek">
              <Select
                value={form.project}
                onChange={(e) => setForm((f) => ({ ...f, project: e.target.value, advance: "" }))}
              >
                {projects.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} · {p.short}
                  </option>
                ))}
                <option value="">Pusat ({costCenters[0].code})</option>
              </Select>
            </Field>
            <Field label="Potong dari kasbon" aside={aside("advance")}>
              <Select value={form.advance} highlight={hl("advance")} onChange={(e) => update("advance", e.target.value)}>
                <option value="">Tidak — dibayar via AP</option>
                {projectAdvances.map((a) => (
                  <option key={a.no} value={a.no}>
                    {a.no} · sisa {rpShort(a.amount - a.realized)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Auto-coding preview */}
          <div className="rounded-xl border border-line">
            <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
              <span className="text-[12.5px] font-semibold text-fg">Jurnal otomatis (preview)</span>
              {cat && <AiBadge label="Auto-coding COA" />}
            </div>
            {cat && form.amount > 0 ? (
              <table className="w-full text-[12.5px]">
                <tbody>
                  <tr>
                    <td className="px-3.5 py-2 text-fg">
                      <Mono>{cat.coa}</Mono> {cat.coaName}
                      {form.project && <span className="ml-1 text-subtle">· {form.project}</span>}
                    </td>
                    <td className="px-3.5 py-2 text-right text-fg tabular">Dr {rp(form.amount)}</td>
                  </tr>
                  <tr className="border-t border-line">
                    <td className="py-2 pr-3.5 pl-8 text-fg">
                      {advance ? (
                        <><Mono>1-1401</Mono> Uang Muka Kerja · {advance.no}</>
                      ) : (
                        <><Mono>2-1101</Mono> Utang Usaha · {form.vendor || "vendor"}</>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-right text-fg tabular">Cr {rp(form.amount)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="px-3.5 py-3 text-[12.5px] text-subtle">Pilih kategori & nominal untuk melihat jurnal yang akan dibentuk.</p>
            )}
          </div>

          {/* Guards */}
          {form.amount > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-line px-3 py-2.5">
                <p className="text-[11.5px] text-subtle">Sisa budget kategori {form.project ? projectByCode[form.project]?.short : "Pusat"}</p>
                <p className="mt-0.5 text-[13px] font-medium text-fg tabular">
                  {rpShort(budgetLeft)} → {rpShort(budgetLeft - form.amount)}
                </p>
                <Progress
                  value={(form.amount / Math.max(budgetLeft, 1)) * 100}
                  tone={form.amount > budgetLeft * 0.5 ? "amber" : "green"}
                  className="mt-2"
                />
              </div>
              <div className="rounded-lg border border-line px-3 py-2.5">
                <p className="text-[11.5px] text-subtle">Cek nota ganda & NPWP</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CircleCheck className="size-3.5" />
                  {form.npwp ? "Tidak ada duplikat · NPWP valid" : "Tidak ada duplikat"}
                </p>
                <p className="mt-1 text-[11.5px] text-subtle">Dibandingkan dengan 1.284 nota 12 bulan terakhir</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ───────────────────────── Sample receipt ───────────────────────── */

function Hl({ on, label, children, className }) {
  return (
    <span
      className={cx(
        "relative rounded-[3px] transition-[background-color,box-shadow] duration-300",
        on && "bg-emerald-400/20 shadow-[0_0_0_1.5px_rgba(16,185,129,0.9)]",
        className,
      )}
    >
      {on && (
        <span className="absolute -top-4 left-0 rounded-sm bg-emerald-500 px-1 font-sans text-[8.5px] leading-[13px] font-semibold tracking-wide text-white uppercase animate-pop">
          {label}
        </span>
      )}
      {children}
    </span>
  );
}

function SampleReceipt({ revealed }) {
  const total = ocrResult.lines.reduce((s, l) => s + l.qty * l.price, 0);
  return (
    <div className="w-full max-w-[340px] rotate-[-0.6deg] bg-[#fdfcf8] px-5 py-6 font-mono text-[11px] leading-[1.55] text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.18)] [background-image:repeating-linear-gradient(0deg,transparent,transparent_23px,rgba(0,0,0,0.018)_24px)]">
      <div className="text-center">
        <Hl on={revealed} label="Vendor">
          <span className="text-[13px] font-bold tracking-wide">PT MATERIAL JAYA UTAMA</span>
        </Hl>
        <p className="mt-1">Jl. Adisucipto Km 7,5 Sungai Raya</p>
        <p>Kubu Raya – Kalimantan Barat</p>
        <p>
          NPWP <Hl on={revealed} label="NPWP">0213 4478 1092 8000</Hl>
        </p>
      </div>
      <div className="my-3 border-t border-dashed border-slate-400" />
      <div className="flex justify-between">
        <span>No</span>
        <Hl on={revealed} label="No. faktur">INV/MJU/X/2026/0817</Hl>
      </div>
      <div className="flex justify-between">
        <span>Tgl</span>
        <Hl on={revealed} label="Tanggal">08/10/2026 10:42</Hl>
      </div>
      <div className="flex justify-between">
        <span>Kepada</span>
        <span className="text-right">PT Tricowarna K.N.</span>
      </div>
      <div className="flex justify-between">
        <span>Kirim</span>
        <span className="text-right">Proyek Jbt Sei Ambawang</span>
      </div>
      <div className="my-3 border-t border-dashed border-slate-400" />
      {ocrResult.lines.map((l) => (
        <div key={l.desc} className="mb-1.5">
          <Hl on={revealed} label="Item" className="block">
            {l.desc}
          </Hl>
          <div className="flex justify-between pl-2">
            <span>
              {l.qty} {l.unit} × {formatDigits(l.price)}
            </span>
            <span>{formatDigits(l.qty * l.price)}</span>
          </div>
        </div>
      ))}
      <div className="my-3 border-t border-dashed border-slate-400" />
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatDigits(total)}</span>
      </div>
      <div className="flex justify-between">
        <span>Diskon</span>
        <span>0</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[13px] font-bold">
        <span>TOTAL</span>
        <Hl on={revealed} label="Total">Rp {formatDigits(total)}</Hl>
      </div>
      <div className="mt-1 flex justify-between">
        <span>Bayar</span>
        <span>TRANSFER BCA</span>
      </div>
      <div className="my-3 border-t border-dashed border-slate-400" />
      <p className="text-center">Harga sudah termasuk PPN</p>
      <p className="text-center">Barang yang sudah dibeli tidak dapat ditukar</p>
      <p className="mt-2 text-center tracking-[0.3em]">*** TERIMA KASIH ***</p>
    </div>
  );
}
