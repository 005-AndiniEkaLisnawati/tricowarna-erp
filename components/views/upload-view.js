"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleCheck,
  FileSpreadsheet,
  FileText,
  FileUp,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { analysisByCode, boqSections, coefficientSets } from "@/lib/data/estimasi";
import {
  AiBadge,
  Badge,
  Button,
  Callout,
  Card,
  Mono,
  PageHeader,
  Segmented,
  td,
  th,
} from "@/components/ui";
import { cx, decimal } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const steps = ["Dokumen tender", "Set koefisien", "Ekstraksi & matching", "Review hasil"];

const sampleFiles = [
  { name: "01_KAK_Kampung-Nelayan-Sungai-Burung.pdf", size: 8_412_000, pages: 64, kind: "pdf" },
  { name: "02_Gambar-Rencana_Revetment-Tambatan.pdf", size: 21_380_000, pages: 41, kind: "pdf" },
  { name: "03_BoQ-Kosong_SPSE.xlsx", size: 186_000, pages: 6, kind: "xlsx" },
];

const pipeline = [
  { label: "Membaca 3 dokumen (111 halaman)", detail: "9Router → model ekstraksi dokumen", ms: 900 },
  { label: "Mengenali struktur pekerjaan I / 1. / a", detail: "5 jenis pekerjaan · 19 item", ms: 800 },
  { label: "Matching item ke kode analisa", detail: "toleran typo & singkatan panitia", ms: 1000 },
  { label: "Menarik harga master + history Kalbar", detail: "4 tender terdekat · wilayah & tahun", ms: 700 },
  { label: "Kalkulasi Analisa → BOQ → Sub Resume → Resume", detail: "rumus asli file tim", ms: 600 },
  { label: "Rekap TKDN / KDN", detail: "per item & per jenis pekerjaan", ms: 400 },
];

export function UploadView() {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [setId, setSetId] = useState("PUPR-2025");
  const [done, setDone] = useState(0); // pipeline steps completed
  const inputRef = useRef(null);

  // Run the extraction pipeline when entering step 3.
  useEffect(() => {
    if (step !== 2) return;
    let i = 0;
    let timer;
    const next = () => {
      if (i >= pipeline.length) {
        timer = setTimeout(() => setStep(3), 500);
        return;
      }
      timer = setTimeout(() => {
        i += 1;
        setDone(i);
        next();
      }, pipeline[i].ms);
    };
    setDone(0); // eslint-disable-line react-hooks/set-state-in-effect
    next();
    return () => clearTimeout(timer);
  }, [step]);

  const addFiles = (list) =>
    setFiles((f) => [
      ...f,
      ...Array.from(list).map((x) => ({
        name: x.name,
        size: x.size,
        pages: Math.max(1, Math.round(x.size / 140_000)),
        kind: x.name.toLowerCase().endsWith(".pdf") ? "pdf" : "xlsx",
      })),
    ]);

  return (
    <div>
      <PageHeader
        icon={FileUp}
        title="Upload Dokumen Tender"
        description="PDF INAPROC/SPSE atau Excel BOQ → AI menyusun volume, analisa, harga satuan, BOQ hingga Resume. Estimator tetap memutuskan."
      />

      {/* Stepper */}
      <ol className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s}
            className={cx(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
              i === step ? "border-fg bg-surface" : i < step ? "border-line bg-surface" : "border-line bg-transparent",
            )}
          >
            <span
              className={cx(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold",
                i < step ? "bg-emerald-600 text-white" : i === step ? "bg-fg text-surface" : "bg-surface-3 text-subtle",
              )}
            >
              {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cx("text-[13px] font-medium", i <= step ? "text-fg" : "text-subtle")}>{s}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card className="p-5">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            className="flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface-2 px-6 py-10 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface">
              <Upload className="size-5 text-muted" />
            </div>
            <p className="mt-3 text-[15px] font-semibold text-fg">Seret KAK, gambar & BoQ ke sini</p>
            <p className="mt-1 text-[13px] text-muted">PDF dari INAPROC/SPSE atau Excel BOQ multi-sheet · bisa beberapa berkas sekaligus</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="primary" size="md" icon={Upload} onClick={() => inputRef.current?.click()}>
                Pilih berkas
              </Button>
              <Button size="md" icon={Sparkles} onClick={() => setFiles(sampleFiles)}>
                Pakai contoh: Sungai Burung
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              accept=".pdf,.xlsx,.xls"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
              {files.map((f, i) => (
                <li key={f.name + i} className="flex items-center gap-3 px-4 py-2.5">
                  {f.kind === "pdf" ? (
                    <FileText className="size-4 text-red-500" />
                  ) : (
                    <FileSpreadsheet className="size-4 text-emerald-600" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-fg">{f.name}</span>
                  <span className="text-[12px] text-subtle tabular">
                    {f.pages} hlm · {decimal(f.size / 1e6, 1)} MB
                  </span>
                  <button
                    onClick={() => setFiles((l) => l.filter((_, j) => j !== i))}
                    className="text-subtle hover:text-fg"
                    aria-label={`Hapus ${f.name}`}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex justify-end">
            <Button variant="primary" size="md" iconRight={ArrowRight} disabled={!files.length} onClick={() => setStep(1)}>
              Lanjut pilih set koefisien
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-fg">Set koefisien acuan proyek</h2>
          <p className="mt-1 text-[13px] text-muted">
            AI mendeteksi KAK mengacu <b className="text-fg">Permen PUPR 8/2023 TA 2025</b> (hlm. 12, butir 4.3). Pilih set yang berlaku agar
            harga sesuai requirement panitia.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {coefficientSets.map((s) => (
              <button
                key={s.id}
                onClick={() => setSetId(s.id)}
                className={cx(
                  "rounded-xl border px-4 py-3.5 text-left transition-colors",
                  setId === s.id ? "border-fg bg-surface-2 ring-1 ring-fg" : "border-line hover:border-line-strong",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-medium text-fg">{s.label}</span>
                  {s.id === "PUPR-2025" && <AiBadge label="Sesuai KAK" />}
                </div>
                <p className="mt-1 text-[12.5px] text-subtle">{s.note}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-between">
            <Button size="md" onClick={() => setStep(0)}>Kembali</Button>
            <Button variant="ai" size="md" icon={Sparkles} onClick={() => setStep(2)}>
              Jalankan ekstraksi AI
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="mx-auto max-w-2xl p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Sparkles className="size-4.5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-fg">Pipeline n8n berjalan</p>
              <p className="text-[12.5px] text-subtle">Hasil juga dikirim ke email estimator saat selesai</p>
            </div>
          </div>
          <ol className="mt-5 space-y-1">
            {pipeline.map((p, i) => {
              const state = i < done ? "done" : i === done ? "run" : "wait";
              return (
                <li key={p.label} className="flex items-start gap-3 rounded-lg px-2 py-2">
                  <span className="mt-0.5 flex size-5 items-center justify-center">
                    {state === "done" ? (
                      <CircleCheck className="size-4.5 text-emerald-500" />
                    ) : state === "run" ? (
                      <LoaderCircle className="size-4.5 animate-spin text-indigo-500" />
                    ) : (
                      <span className="size-2 rounded-full bg-line-strong" />
                    )}
                  </span>
                  <div>
                    <p className={cx("text-[13.5px]", state === "wait" ? "text-subtle" : "text-fg")}>{p.label}</p>
                    <p className="text-[12px] text-subtle">{p.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {step === 3 && <ReviewStep setLabel={coefficientSets.find((s) => s.id === setId).label} onRestart={() => { setFiles([]); setStep(0); }} />}
    </div>
  );
}

function ReviewStep({ setLabel, onRestart }) {
  const [filter, setFilter] = useState("all");
  const items = useMemo(
    () =>
      boqSections.flatMap((s) =>
        s.items.map((it) => ({
          ...it,
          section: s.no,
          state: it.lumpsum ? "ok" : !it.ahsp ? "missing" : it.conf < 90 ? "doubt" : "ok",
        })),
      ),
    [],
  );
  const counts = {
    ok: items.filter((i) => i.state === "ok").length,
    doubt: items.filter((i) => i.state === "doubt").length,
    missing: items.filter((i) => i.state === "missing").length,
  };
  const visible = items.filter((i) => filter === "all" || i.state === filter);

  return (
    <div className="space-y-4">
      <Callout tone="green" icon={CircleCheck} title={`${items.length} item diekstrak dalam 4,4 detik.`}>
        {counts.ok} cocok yakin, {counts.doubt} ragu (skor &lt; 90%), {counts.missing} belum ada harga — ditandai untuk review. Set koefisien:{" "}
        {setLabel}.
      </Callout>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-2.5">
          <Segmented
            value={filter}
            onChange={setFilter}
            items={[
              { value: "all", label: "Semua", count: items.length },
              { value: "ok", label: "Cocok", count: counts.ok },
              { value: "doubt", label: "Ragu", count: counts.doubt },
              { value: "missing", label: "Tanpa harga", count: counts.missing },
            ]}
          />
          <div className="flex gap-2">
            <Button icon={RotateCcw} onClick={onRestart}>Unggah ulang</Button>
            <Link href="/tender/boq">
              <Button variant="primary" iconRight={ArrowRight}>Buka Rekap BOQ</Button>
            </Link>
          </div>
        </div>
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>No</th>
                <th className={th}>Teks di dokumen panitia</th>
                <th className={th}>Dicocokkan ke</th>
                <th className={th}>Sat.</th>
                <th className={cx(th, "text-right")}>Volume</th>
                <th className={cx(th, "text-right")}>Keyakinan</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((it) => (
                <tr key={it.name} className={cx("border-t border-line", it.state === "missing" && "bg-amber-500/[0.05]")}>
                  <td className={cx(td, "text-muted")}>
                    {it.section}.{it.no}
                  </td>
                  <td className={cx(td, "font-mono text-[12.5px]")}>“{it.raw}”</td>
                  <td className={cx(td, "whitespace-normal")}>
                    {it.ahsp ? (
                      <span>
                        <Mono className="mr-1.5 text-fg">{it.ahsp}</Mono>
                        <span className="text-muted">{analysisByCode[it.ahsp].name}</span>
                      </span>
                    ) : it.lumpsum ? (
                      <span className="text-muted">Lumpsum — dari history Kuala Secapah 2025</span>
                    ) : (
                      <span className="text-subtle">Tidak ditemukan di master</span>
                    )}
                  </td>
                  <td className={cx(td, "text-muted")}>{it.unit}</td>
                  <td className={cx(td, "text-right tabular")}>{decimal(it.vol, 0)}</td>
                  <td className={cx(td, "text-right")}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-3">
                        <span
                          className={cx(
                            "block h-full",
                            it.conf >= 90 ? "bg-emerald-500" : it.conf >= 70 ? "bg-amber-500" : "bg-red-500",
                          )}
                          style={{ width: `${it.conf}%` }}
                        />
                      </span>
                      <span className="w-8 text-right text-[12.5px] tabular">{it.conf}%</span>
                    </span>
                  </td>
                  <td className={td}>
                    {it.state === "ok" ? (
                      <Badge tone="green" dot>Cocok</Badge>
                    ) : it.state === "doubt" ? (
                      <Badge tone="amber" dot>Ragu — cek</Badge>
                    ) : (
                      <Badge tone="red" dot>Belum ada harga</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>
    </div>
  );
}
