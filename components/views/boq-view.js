"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, ChevronDown, FileSpreadsheet, PencilLine, TriangleAlert } from "lucide-react";
import { analysisByCode, boqSections, coefficientSets, costAnalysis } from "@/lib/data/estimasi";
import { tenders } from "@/lib/data/tenders";
import {
  Badge,
  Button,
  Callout,
  Card,
  Field,
  Input,
  Modal,
  Mono,
  PageHeader,
  Segmented,
  Select,
  StatCard,
  Tabs,
  td,
  th,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { TableScroll } from "@/components/table-scroll";
import { cx, decimal, pct, rp, rpShort } from "@/lib/format";

const tender = tenders.find((t) => t.id === "TDR-2026-031");
const TKDN_MIN = 40;

function useBoq({ setId, op, revision, overrides }) {
  return useMemo(() => {
    const set = coefficientSets.find((s) => s.id === setId);
    const sections = boqSections.map((sec) => {
      const items = sec.items.map((it) => {
        const vol = revision === "R-1" && it.volR1 ? it.volR1 : it.vol;
        let unitDirect = null;
        let tkdn = it.tkdnL ?? 0;
        if (it.lumpsum) {
          unitDirect = it.lumpsum;
        } else if (it.ahsp) {
          const c = costAnalysis(analysisByCode[it.ahsp], set);
          unitDirect = c.direct;
          tkdn = c.tkdn;
        } else if (overrides[it.name]) {
          unitDirect = overrides[it.name];
          tkdn = 55;
        }
        // Lumpsum and manual prices are final; AHSP prices get overhead & profit.
        const manual = !it.ahsp && !it.lumpsum && overrides[it.name] != null;
        const price =
          unitDirect == null ? null : it.lumpsum || manual ? unitDirect : unitDirect * (1 + op / 100);
        const total = price == null ? 0 : price * vol;
        return { ...it, vol, price, total, tkdn, missing: price == null, manual };
      });
      const total = items.reduce((s, i) => s + i.total, 0);
      const tkdn = total ? items.reduce((s, i) => s + i.total * i.tkdn, 0) / total : 0;
      return { ...sec, items, total, tkdn };
    });
    const direct = sections.reduce((s, x) => s + x.total, 0);
    const tkdn = direct ? sections.reduce((s, x) => s + x.total * x.tkdn, 0) / direct : 0;
    const rounded = Math.floor(direct / 1000) * 1000;
    const ppn = Math.round(rounded * (11 / 12) * 0.12);
    const total = rounded + ppn;
    const missing = sections.flatMap((s) => s.items).filter((i) => i.missing);
    return { sections, direct, rounded, ppn, total, tkdn, missing };
  }, [setId, op, revision, overrides]);
}

/* SpreadsheetML 2003 — opens in Excel with one worksheet per sheet, no library needed. */
function exportWorkbook(boq, revision) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const cell = (v, style) =>
    typeof v === "number"
      ? `<Cell${style ? ` ss:StyleID="${style}"` : ""}><Data ss:Type="Number">${Math.round(v * 100) / 100}</Data></Cell>`
      : `<Cell${style ? ` ss:StyleID="${style}"` : ""}><Data ss:Type="String">${esc(v ?? "")}</Data></Cell>`;
  const row = (cells, style) => `<Row>${cells.map((c) => cell(c, style)).join("")}</Row>`;
  const sheet = (name, rows) => `<Worksheet ss:Name="${name}"><Table>${rows.join("")}</Table></Worksheet>`;

  const resume = sheet("Resume", [
    row([tender.title], "h"),
    row([`Revisi ${revision}`]),
    row([]),
    row(["No", "Uraian Pekerjaan", "Jumlah (Rp)", "TKDN (%)"], "h"),
    ...boq.sections.map((s) => row([s.no, s.name, s.total, s.tkdn])),
    row(["", "Jumlah", boq.direct, boq.tkdn], "h"),
    row(["", "Dibulatkan", boq.rounded]),
    row(["", "PPN 12% x DPP 11/12", boq.ppn]),
    row(["", "Total Penawaran", boq.total], "h"),
  ]);
  const boqSheet = sheet("BOQ", [
    row(["No", "Uraian", "Sat", "Volume", "Harga Satuan", "Jumlah", "Kode Analisa", "TKDN (%)"], "h"),
    ...boq.sections.flatMap((s) => [
      row([s.no, s.name], "h"),
      ...s.items.map((i) => row([i.no, i.name, i.unit, i.vol, i.price ?? "", i.total, i.ahsp ?? (i.lumpsum ? "Lumpsum" : "-"), i.tkdn])),
    ]),
  ]);
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1"/></Style></Styles>${resume}${boqSheet}</Workbook>`;
  const url = URL.createObjectURL(new Blob([xml], { type: "application/vnd.ms-excel" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `BOQ_Sungai-Burung_${revision}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BoqView() {
  const toast = useToast();
  const [setId, setSetId] = useState("PUPR-2025");
  const [op, setOp] = useState(10);
  const [revision, setRevision] = useState("R-2");
  const [overrides, setOverrides] = useState({});
  const [tab, setTab] = useState("boq");
  const [collapsed, setCollapsed] = useState({});
  const [pricing, setPricing] = useState(null); // item being priced manually

  const boq = useBoq({ setId, op, revision, overrides });
  const ratio = (boq.total / tender.hps) * 100;
  const prev = useBoq({ setId, op, revision: "R-1", overrides });

  return (
    <div>
      <PageHeader
        icon={Calculator}
        title="Rekap BOQ & Margin"
        description={tender.title}
        meta={
          <>
            <Mono>{tender.code}</Mono>
            <Badge tone="blue" dot>Dianalisis</Badge>
            <span className="text-[12px] text-subtle">HPS {rp(tender.hps)}</span>
          </>
        }
        actions={
          <>
            <Segmented
              value={revision}
              onChange={setRevision}
              items={[
                { value: "R-1", label: "R-1" },
                { value: "R-2", label: "R-2 (terbaru)" },
              ]}
            />
            <Button
              size="md"
              variant="primary"
              icon={FileSpreadsheet}
              onClick={() => {
                exportWorkbook(boq, revision);
                toast({ title: "Workbook diunduh", description: "Sheet Resume & BOQ — susunan kolom mengikuti format tim." });
              }}
            >
              Export Excel
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard label="Biaya + O&P" value={rpShort(boq.rounded)} hint={`O&P ${pct(op)}`} />
        <StatCard label="Nilai penawaran (incl. PPN)" value={rpShort(boq.total)} hint={revision === "R-2" ? `${boq.total < prev.total ? "−" : "+"}${rpShort(Math.abs(boq.total - prev.total))} vs R-1` : "revisi awal"} />
        <StatCard
          label="Terhadap HPS"
          value={pct(ratio)}
          delta={ratio > 100 ? "di atas HPS" : ratio < 80 ? "< 80% HPS" : "wajar"}
          deltaTone={ratio > 100 ? "red" : ratio < 80 ? "amber" : "green"}
        />
        <StatCard
          label="TKDN gabungan"
          value={pct(boq.tkdn)}
          delta={boq.tkdn >= TKDN_MIN ? `≥ ${TKDN_MIN}% syarat` : `< ${TKDN_MIN}% syarat`}
          deltaTone={boq.tkdn >= TKDN_MIN ? "green" : "red"}
        />
        <StatCard label="Item tanpa harga" value={boq.missing.length} delta={boq.missing.length ? "perlu review" : "lengkap"} deltaTone={boq.missing.length ? "amber" : "green"} />
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="grid grid-cols-1 gap-4 border-b border-line px-4 py-3 md:grid-cols-[1fr_1fr]">
          <Field label="Set koefisien acuan">
            <Select value={setId} onChange={(e) => setSetId(e.target.value)}>
              {coefficientSets.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </Select>
          </Field>
          <Field label={`Overhead & keuntungan — ${pct(op)}`} hint="Diterapkan ke harga satuan hasil AHSP; lumpsum tidak terpengaruh.">
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={op}
              onChange={(e) => setOp(Number(e.target.value))}
              className="mt-2.5 w-full accent-slate-900 dark:accent-slate-100"
            />
          </Field>
        </div>
        <div className="px-3">
          <Tabs
            value={tab}
            onChange={setTab}
            className="border-b-0"
            items={[
              { value: "boq", label: "BOQ" },
              { value: "sub", label: "Sub Resume" },
              { value: "resume", label: "Resume" },
            ]}
          />
        </div>

        {boq.missing.length > 0 && tab === "boq" && (
          <div className="border-t border-line px-4 py-3">
            <Callout tone="amber" icon={TriangleAlert} title={`${boq.missing.length} item belum ada harga.`}>
              AI tidak menemukan kode analisa maupun history harga yang cukup yakin — item ditandai agar tidak lolos begitu saja. Isi
              harga manual atau kirim RFQ.
            </Callout>
          </div>
        )}

        <TableScroll className="border-t border-line">
          {tab === "boq" && (
            <table className="w-full">
              <thead className="bg-surface-2">
                <tr>
                  <th className={cx(th, "w-12")}>No</th>
                  <th className={th}>Uraian pekerjaan</th>
                  <th className={th}>Analisa</th>
                  <th className={th}>Sat.</th>
                  <th className={cx(th, "text-right")}>Volume</th>
                  <th className={cx(th, "text-right")}>Harga satuan</th>
                  <th className={cx(th, "text-right")}>Jumlah</th>
                  <th className={cx(th, "text-right")}>TKDN</th>
                </tr>
              </thead>
              {boq.sections.map((sec) => (
                <tbody key={sec.no}>
                  <tr
                    className="cursor-pointer border-t border-line bg-surface-2/60 hover:bg-surface-2"
                    onClick={() => setCollapsed((c) => ({ ...c, [sec.no]: !c[sec.no] }))}
                  >
                    <td className={cx(td, "font-semibold")}>{sec.no}</td>
                    <td className={cx(td, "font-semibold")} colSpan={5}>
                      <span className="flex items-center gap-1.5">
                        <ChevronDown className={cx("size-3.5 text-subtle transition-transform", collapsed[sec.no] && "-rotate-90")} />
                        {sec.name}
                      </span>
                    </td>
                    <td className={cx(td, "text-right font-semibold tabular")}>{rp(sec.total)}</td>
                    <td className={cx(td, "text-right font-medium tabular text-muted")}>{pct(sec.tkdn)}</td>
                  </tr>
                  {!collapsed[sec.no] &&
                    sec.items.map((it) => (
                      <tr key={it.name} className={cx("border-t border-line", it.missing && "bg-amber-500/[0.05]")}>
                        <td className={cx(td, "pl-6 text-muted")}>{it.no}</td>
                        <td className={cx(td, "whitespace-normal")}>
                          {it.name}
                          {it.volR1 && revision === "R-2" && (
                            <span className="ml-2 text-[11.5px] text-subtle tabular">vol R-1 {decimal(it.volR1, 0)}</span>
                          )}
                        </td>
                        <td className={td}>
                          {it.ahsp ? (
                            <Mono className="text-[11.5px]">{it.ahsp}</Mono>
                          ) : it.lumpsum ? (
                            <Badge>Lumpsum</Badge>
                          ) : it.manual ? (
                            <Badge tone="violet">Manual</Badge>
                          ) : (
                            <Badge tone="amber" dot>Belum ada harga</Badge>
                          )}
                        </td>
                        <td className={cx(td, "text-muted")}>{it.unit}</td>
                        <td className={cx(td, "text-right tabular")}>{decimal(it.vol, 0)}</td>
                        <td className={cx(td, "text-right tabular")}>
                          {it.missing ? (
                            <Button size="xs" icon={PencilLine} onClick={() => setPricing(it)}>
                              Isi harga
                            </Button>
                          ) : (
                            rp(it.price)
                          )}
                        </td>
                        <td className={cx(td, "text-right font-medium tabular")}>{it.missing ? "–" : rp(it.total)}</td>
                        <td className={cx(td, "text-right tabular text-muted")}>{it.missing ? "–" : pct(it.tkdn)}</td>
                      </tr>
                    ))}
                </tbody>
              ))}
            </table>
          )}

          {tab === "sub" && (
            <table className="w-full">
              <thead className="bg-surface-2">
                <tr>
                  <th className={th}>No</th>
                  <th className={th}>Jenis pekerjaan</th>
                  <th className={cx(th, "text-right")}>Item</th>
                  <th className={cx(th, "text-right")}>Jumlah</th>
                  <th className={cx(th, "text-right")}>Bobot</th>
                  <th className={cx(th, "text-right")}>TKDN</th>
                  <th className={cx(th, "text-right")}>KDN (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {boq.sections.map((s) => (
                  <tr key={s.no} className="border-t border-line">
                    <td className={cx(td, "font-medium")}>{s.no}</td>
                    <td className={td}>{s.name}</td>
                    <td className={cx(td, "text-right tabular text-muted")}>{s.items.length}</td>
                    <td className={cx(td, "text-right tabular")}>{rp(s.total)}</td>
                    <td className={cx(td, "text-right tabular")}>
                      <span className="flex items-center justify-end gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
                          <span className="block h-full bg-fg" style={{ width: `${(s.total / boq.direct) * 100}%` }} />
                        </span>
                        {pct((s.total / boq.direct) * 100)}
                      </span>
                    </td>
                    <td className={cx(td, "text-right tabular")}>{pct(s.tkdn)}</td>
                    <td className={cx(td, "text-right tabular text-muted")}>{rp((s.total * s.tkdn) / 100)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-line-strong bg-surface-2">
                <tr>
                  <td className={cx(td, "font-semibold")} colSpan={3}>Jumlah</td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{rp(boq.direct)}</td>
                  <td className={cx(td, "text-right tabular")}>100%</td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{pct(boq.tkdn)}</td>
                  <td className={cx(td, "text-right font-semibold tabular")}>{rp((boq.direct * boq.tkdn) / 100)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {tab === "resume" && (
            <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1fr_320px]">
              <dl className="divide-y divide-line rounded-xl border border-line text-[13.5px]">
                {boq.sections.map((s) => (
                  <div key={s.no} className="flex justify-between px-4 py-2.5">
                    <dt className="text-muted">
                      {s.no}. {s.name}
                    </dt>
                    <dd className="text-fg tabular">{rp(s.total)}</dd>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 font-medium">
                  <dt>A. Jumlah harga pekerjaan</dt>
                  <dd className="tabular">{rp(boq.direct)}</dd>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-muted">B. Dibulatkan</dt>
                  <dd className="tabular">{rp(boq.rounded)}</dd>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-muted">C. PPN 12% × DPP (11/12 × B)</dt>
                  <dd className="tabular">{rp(boq.ppn)}</dd>
                </div>
                <div className="flex justify-between bg-surface-2 px-4 py-3 font-semibold">
                  <dt>D. Total nilai penawaran (B + C)</dt>
                  <dd className="text-[16px] tabular">{rp(boq.total)}</dd>
                </div>
              </dl>
              <div className="space-y-3">
                <Callout tone={boq.tkdn >= TKDN_MIN ? "green" : "red"} title={`TKDN gabungan ${pct(boq.tkdn)}.`}>
                  Syarat KAK minimal {TKDN_MIN}%. Rumus rekap mengikuti format Excel tim — kolom yang dulu <Mono>#DIV/0!</Mono> kini terisi.
                </Callout>
                <Callout tone={ratio > 100 ? "red" : ratio < 80 ? "amber" : "indigo"} title={`${pct(ratio)} dari HPS.`}>
                  {ratio > 100
                    ? "Turunkan O&P atau tinjau volume — penawaran di atas HPS akan gugur."
                    : ratio < 80
                      ? "Di bawah 80% HPS: siapkan klarifikasi kewajaran harga."
                      : "Rentang wajar. Simulasikan O&P di atas untuk strategi harga."}
                </Callout>
                <Link href="/tender" className="block text-[12.5px] font-medium text-fg underline-offset-2 hover:underline">
                  Kembali ke detail tender →
                </Link>
              </div>
            </div>
          )}
        </TableScroll>
      </Card>

      {pricing && (
        <PriceModal
          item={pricing}
          onClose={() => setPricing(null)}
          onSave={(price) => {
            setOverrides((o) => ({ ...o, [pricing.name]: price }));
            toast({ title: "Harga manual disimpan", description: `${pricing.name} · ${rp(price)}/${pricing.unit} — tercatat di audit log.` });
            setPricing(null);
          }}
        />
      )}
    </div>
  );
}

const suggestions = {
  "Geotextile non-woven 300 gr/m²": [["RFQ PT Geosindo Kalbar (Sep 2026)", 24_500], ["History TBK – Sambas 2025", 22_800]],
  "Bollard besi cor kapasitas 5 ton": [["History TBK – Sambas 2025 (+6% eskalasi)", 8_904_000]],
  "Fender karet tipe V 300H": [["History TBK – fender V 250H 2025 (+6%)", 6_360_000]],
  "Tangga monyet galvanis": [["Analisa Sendiri AS.02 (estimasi bengkel)", 3_150_000]],
};

function PriceModal({ item, onClose, onSave }) {
  const options = suggestions[item.name] ?? [];
  const [value, setValue] = useState(options[0]?.[1] ?? 0);
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Isi harga satuan"
      description={`${item.name} · ${decimal(item.vol, 0)} ${item.unit}`}
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" disabled={!value} onClick={() => onSave(value)}>
            Simpan harga
          </Button>
        </>
      }
    >
      {options.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <p className="text-[12px] font-medium text-muted">Referensi dari history & RFQ</p>
          {options.map(([label, price]) => (
            <button
              key={label}
              onClick={() => setValue(price)}
              className={cx(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[13px] transition-colors",
                value === price ? "border-fg bg-surface-2" : "border-line hover:border-line-strong",
              )}
            >
              <span className="text-fg">{label}</span>
              <span className="font-medium tabular">{rp(price)}</span>
            </button>
          ))}
        </div>
      )}
      <Field label={`Harga satuan (Rp / ${item.unit}) — termasuk O&P`}>
        <Input
          inputMode="numeric"
          value={value ? new Intl.NumberFormat("id-ID").format(value) : ""}
          onChange={(e) => setValue(Number(e.target.value.replace(/\D/g, "")) || 0)}
          className="tabular"
        />
      </Field>
      <p className="mt-2 text-[12px] text-subtle tabular">Jumlah: {rp(value * item.vol)}</p>
    </Modal>
  );
}
