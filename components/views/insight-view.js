"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Database, LoaderCircle, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { projects } from "@/lib/data/org";
import { Badge, DragScroll, Card, CardHeader, Mono, PageHeader, Segmented } from "@/components/ui";
import { cx, pct, rpShort } from "@/lib/format";

// Canned, data-grounded answers. In production Hermes calls DB tools via 9Router;
// here each answer cites the tables it "read" so the demo shows the principle.
const answers = {
  "Hitung total kebutuhan semen seluruh BOQ Sungai Burung": {
    sources: ["boq_items (TDR-2026-031, R-2)", "ahsp_koefisien (Permen PUPR 2025)"],
    body: [
      "Total kebutuhan semen PC dari 14 item analisa yang memakai semen:",
      { table: [["Beton K-300 lantai tambatan", "412 m³ × 413 kg", "170.156 kg"], ["Beton K-250 balok & pile cap", "286 m³ × 384 kg", "109.824 kg"], ["Rabat beton t=12 cm", "4.380 m² × 0,12 × 326 kg", "171.346 kg"], ["Pasangan batu 1:4 (DPT)", "918 m³ × 163 kg", "149.634 kg"], ["Plesteran & lain-lain", "—", "38.240 kg"]] },
      "**Total ±639,2 ton ≈ 12.784 sak @50 kg.** Harga master Mempawah 2026 Rp68.000/sak → Rp869,3 jt. History tender Kuala Secapah (2025): Rp66.500/sak.",
    ],
  },
  "Item mana yang belum ada harga?": {
    sources: ["boq_items", "master_harga (wilayah Kalbar, 2026)"],
    body: [
      "4 item BOQ Sungai Burung belum punya harga di master maupun history wilayah:",
      { list: ["Geotextile non-woven 300 gr/m² — 2.480 m²", "Bollard besi cor 5 ton — 12 bh", "Fender karet tipe V 300H — 24 bh", "Tangga monyet galvanis — 4 unit"] },
      "Saran: kirim RFQ ke 3 vendor marine terdaftar. Item sejenis terakhir dibeli PT Trico Bahari Konstruksi (fender V 250H, 2025) — bisa dipakai sebagai acuan sementara dengan eskalasi 6%.",
    ],
  },
  "Berapa nilai pekerjaan revetment di revisi terakhir?": {
    sources: ["boq_revisions (R-1, R-2)"],
    body: [
      "Pekerjaan **II. Revetment** pada revisi **R-2**: **Rp9,84 M** (38,1% dari total biaya langsung).",
      "Turun Rp312 jt dari R-1 karena volume batu belah dikoreksi dari 7.040 m³ ke 6.820 m³ mengikuti gambar potongan, bukan angka KAK.",
    ],
  },
  "Proyek mana yang marginnya paling tertekan?": {
    sources: ["gl_entries (Jan–Sep 2026)", "project_budget", "rab_final"],
    body: [
      "**Jalan B (PRJ-TRT-2026-002)** — margin proyeksi saat selesai 7,9% vs RAB 13,5%.",
      { list: ["Aspal AC-WC: realisasi + komitmen 92% pagu, progres fisik 38%", "Sewa alat naik karena hujan: 11 hari standby excavator", "Belum ada adendum harga"] },
      "Rekomendasi: ajukan CCO untuk eskalasi aspal (Perpres 12/2021 penyesuaian harga) dan kunci PO aspal sisa sebelum November.",
    ],
  },
};

const suggestions = Object.keys(answers);

const projectNarratives = [
  { code: "PRJ-TRT-2026-001", rab: 16.0, actual: 14.2, trend: "down", note: "Harga besi naik 6,8% sejak Juli; produktivitas pengecoran sesuai jadwal." },
  { code: "PRJ-TRT-2026-002", rab: 13.5, actual: 7.9, trend: "down", note: "Overrun aspal & standby alat karena curah hujan tinggi." },
  { code: "PRJ-TRT-2026-004", rab: 15.2, actual: 17.6, trend: "up", note: "Spun pile dari afiliasi TBP 4% di bawah harga RAB; mobilisasi hemat." },
];

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : part,
  );
}

export function InsightView() {
  const [period, setPeriod] = useState("q3");
  const [thread, setThread] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [thread, thinking]);

  const ask = (q) => {
    const question = q.trim();
    if (!question || thinking) return;
    setInput("");
    setThread((t) => [...t, { role: "user", text: question }]);
    setThinking(true);
    setTimeout(() => {
      const hit = answers[question] ?? {
        sources: ["—"],
        body: ["Untuk demo ini Hermes menjawab pertanyaan contoh di bawah. Di produksi, pertanyaan bebas diterjemahkan menjadi query ke database ERP melalui tools yang diizinkan per peran (RBAC)."],
      };
      setThread((t) => [...t, { role: "ai", ...hit }]);
      setThinking(false);
    }, 1100);
  };

  return (
    <div>
      <PageHeader
        icon={Sparkles}
        title="AI Executive Summary"
        description="Narasi kinerja keuangan & rekomendasi dari Agent Hermes — semua angka bersumber dari database ERP, bukan karangan."
        actions={
          <Segmented
            value={period}
            onChange={setPeriod}
            items={[
              { value: "sep", label: "Sep 2026" },
              { value: "q3", label: "Q3 2026" },
              { value: "ytd", label: "YTD" },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_440px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Margin aktual vs RAB per proyek" description="Proyeksi at-completion dari realisasi + komitmen" />
            <ul className="divide-y divide-line border-t border-line">
              {projectNarratives.map((n) => {
                const p = projects.find((x) => x.code === n.code);
                const delta = n.actual - n.rab;
                return (
                  <li key={n.code} className="grid grid-cols-1 gap-3 px-4 py-3.5 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium text-fg">
                        {p.name} <Mono className="ml-1 text-[11px]">{n.code}</Mono>
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-muted">{n.note}</p>
                    </div>
                    <div className="flex items-center gap-4 sm:justify-end">
                      <div className="text-right">
                        <p className="text-[11px] text-subtle">RAB</p>
                        <p className="text-[13px] text-muted tabular">{pct(n.rab)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-subtle">Aktual</p>
                        <p className="text-[15px] font-semibold text-fg tabular">{pct(n.actual)}</p>
                      </div>
                      <span
                        className={cx(
                          "flex w-[72px] items-center justify-end gap-1 text-[12.5px] font-medium tabular",
                          delta < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {delta < 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                        {delta > 0 ? "+" : ""}
                        {pct(delta)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="px-5 py-4">
            <div className="flex items-center gap-2">
              <Badge tone="indigo">Narasi Q3 2026</Badge>
              <span className="text-[11.5px] text-subtle">dibuat 08 Okt 2026 06:00 · n8n terjadwal</span>
            </div>
            <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-fg">
              <p>
                Pendapatan grup Q3 mencapai <b>{rpShort(9_412_000_000)}</b> (+18% QoQ), didorong termin 2–3 Jembatan A dan uang muka 20%
                Kampung Nelayan. Laba kotor 15,1%, turun 0,9 poin karena tekanan harga material baja dan aspal.
              </p>
              <p>
                Beban administrasi & umum terkendali di 4,2% pendapatan. Pos <i>Atensi</i> dan <i>Entertainment</i> naik 31% di
                September seiring 3 aanwijzing tender — masih di dalam pagu OPEX CC-300.
              </p>
              <p>
                Posisi kas grup <b>Rp18,74 M</b> setara 41 hari operasional. Utang usaha jatuh tempo 30 hari ke depan{" "}
                <b>Rp3,12 M</b>; piutang termin yang sudah BAST <b>Rp4,06 M</b>.
              </p>
            </div>
            <div className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3">
              <p className="text-[12px] font-semibold text-fg">Rekomendasi prioritas</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[13px] text-fg">
                <li>Tagih termin 3 Jembatan A (Rp2,79 M) — BAST sudah ditandatangani 30 Sep.</li>
                <li>Kunci harga besi sisa ±42 ton Jembatan A via PO kontrak.</li>
                <li>Ajukan CCO eskalasi aspal Jalan B sebelum progres 50%.</li>
                <li>Selesaikan 3 kasbon &gt;30 hari (Rp41,1 jt) sebelum tutup buku September.</li>
              </ol>
            </div>
          </Card>
        </div>

        {/* Hermes chat */}
        <Card className="flex h-[640px] flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Bot className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-[13.5px] font-semibold text-fg">Tanya Agent Hermes</p>
              <p className="text-[11.5px] text-subtle">Membaca master, history & transaksi · read-only</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-[11.5px] text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" /> online
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scroll-thin">
            {thread.length === 0 && (
              <div className="pt-6 text-center">
                <p className="text-[13px] text-muted">Contoh pertanyaan dari tim estimasi & keuangan:</p>
              </div>
            )}
            {thread.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-fg px-3.5 py-2 text-[13px] text-surface">{m.text}</p>
                </div>
              ) : (
                <div key={i} className="max-w-[95%] space-y-2 text-[13px] leading-relaxed text-fg animate-fade-in">
                  {m.body.map((b, j) =>
                    typeof b === "string" ? (
                      <p key={j}>{renderInline(b)}</p>
                    ) : b.list ? (
                      <ul key={j} className="list-disc space-y-0.5 pl-4">
                        {b.list.map((x) => <li key={x}>{x}</li>)}
                      </ul>
                    ) : (
                      <table key={j} className="w-full overflow-hidden rounded-lg border border-line text-[12px]">
                        <tbody>
                          {b.table.map((row) => (
                            <tr key={row[0]} className="border-t border-line first:border-t-0">
                              <td className="px-2 py-1.5">{row[0]}</td>
                              <td className="px-2 py-1.5 text-subtle">{row[1]}</td>
                              <td className="px-2 py-1.5 text-right tabular">{row[2]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ),
                  )}
                  <p className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-subtle">
                    <Database className="size-3" />
                    {m.sources.map((s) => (
                      <span key={s} className="rounded bg-surface-3 px-1.5 py-0.5 font-mono">{s}</span>
                    ))}
                  </p>
                </div>
              ),
            )}
            {thinking && (
              <p className="flex items-center gap-2 text-[12.5px] text-indigo-600 dark:text-indigo-400">
                <LoaderCircle className="size-3.5 animate-spin" /> Hermes menjalankan query ke database…
              </p>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line p-3">
            <DragScroll className="mb-2 flex gap-1.5">
              {suggestions
                .filter((s) => !thread.some((m) => m.text === s))
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    disabled={thinking}
                    className="shrink-0 whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-left text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
            </DragScroll>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex items-center gap-2 rounded-xl border border-line px-3 focus-within:border-line-strong"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya tentang proyek, BOQ, budget…"
                className="h-10 flex-1 bg-transparent text-[13.5px] text-fg outline-none placeholder:text-subtle"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                aria-label="Kirim"
                className="flex size-7 items-center justify-center rounded-lg bg-fg text-surface transition-opacity disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
