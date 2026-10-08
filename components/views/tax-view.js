"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CircleCheck,
  Download,
  FileCode2,
  FileInput,
  FileOutput,
  Percent,
  PlugZap,
  Receipt,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  coretaxSync,
  dppNilaiLain,
  fakturKeluaran as seedKeluaran,
  fakturMasukan,
  pphPotput,
  ppn12,
  taxPeriods,
} from "@/lib/data/accounting";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHeader,
  EmptyState,
  Modal,
  Mono,
  PageHeader,
  Select,
  StatCard,
  StatusBadge,
  Tabs,
  td,
  th,
  trHover,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { useCompany } from "@/components/shell/app-shell";
import { amount, cx, date, decimal, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const trxLabel = {
  "02": "02 · Instansi pemerintah (WAPU)",
  "03": "03 · Pemungut selain instansi pemerintah",
  "04": "04 · DPP nilai lain",
};

const pphTone = {
  "BP Diterima": "green",
  "Menunggu BP": "amber",
  Disetor: "blue",
  "BPPU Terbit": "green",
  Draft: "neutral",
};

const pphAmount = (r) => Math.round((r.base * r.rate) / 100);
const isValid = (f) => f.tin.replace(/\D/g, "").length === 16;
const validation = (f) => (f.tin ? (isValid(f) ? "Valid" : "NPWP Tidak Valid") : "NPWP Kosong");

function formatTin(tin) {
  const d = tin.replace(/\D/g, "");
  return d.length === 16 ? d.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4") : tin || "–";
}

/* ───────────────────────── XML Coretax ───────────────────────── */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n) => `${Math.round(n)}.00`;

function buildXml(rows, sellerTin) {
  const invoices = rows
    .map((f) => {
      const nik = f.idType === "NIK";
      const dpp = dppNilaiLain(f.price);
      return `    <TaxInvoice>
      <TaxInvoiceDate>${f.date}</TaxInvoiceDate>
      <TaxInvoiceOpt>Normal</TaxInvoiceOpt>
      <TrxCode>${f.trx}</TrxCode>
      <AddInfo/>
      <CustomDoc/>
      <RefDesc>${esc(f.id)}</RefDesc>
      <FacilityStamp/>
      <SellerIDTKU>${sellerTin}000000</SellerIDTKU>
      <BuyerTin>${nik ? "0000000000000000" : f.tin}</BuyerTin>
      <BuyerDocument>${nik ? "National ID" : "TIN"}</BuyerDocument>
      <BuyerCountry>IDN</BuyerCountry>
      <BuyerDocumentNumber>${nik ? f.tin : "-"}</BuyerDocumentNumber>
      <BuyerName>${esc(f.buyer)}</BuyerName>
      <BuyerAdress>${esc(f.address)}</BuyerAdress>
      <BuyerEmail/>
      <BuyerIDTKU>${nik ? "000000" : `${f.tin}000000`}</BuyerIDTKU>
      <ListOfGoodService>
        <GoodService>
          <Opt>B</Opt>
          <Code>000000</Code>
          <Name>${esc(f.item)}</Name>
          <Unit>UM.0033</Unit>
          <Price>${money(f.price)}</Price>
          <Qty>1</Qty>
          <TotalDiscount>0</TotalDiscount>
          <TaxBase>${money(f.price)}</TaxBase>
          <OtherTaxBase>${money(dpp)}</OtherTaxBase>
          <VATRate>12</VATRate>
          <VAT>${money(ppn12(f.price))}</VAT>
          <STLGRate>0</STLGRate>
          <STLG>0</STLG>
        </GoodService>
      </ListOfGoodService>
    </TaxInvoice>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<TaxInvoiceBulk xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="TaxInvoice.xsd">
  <TIN>${sellerTin}</TIN>
  <ListOfTaxInvoice>
${invoices}
  </ListOfTaxInvoice>
</TaxInvoiceBulk>
`;
}

function XmlLine({ line }) {
  if (line.trimStart().startsWith("<?")) return <span className="text-subtle">{line}</span>;
  const parts = line.split(/(<[^>]+>)/);
  return parts.map((p, i) =>
    p.startsWith("<") ? (
      <span key={i} className="text-indigo-600 dark:text-indigo-300">
        {p}
      </span>
    ) : (
      <span key={i} className="text-emerald-700 dark:text-emerald-300">
        {p}
      </span>
    ),
  );
}

/* ───────────────────────── View ───────────────────────── */

export function TaxView() {
  const toast = useToast();
  const company = useCompany();
  const [masa, setMasa] = useState("2026-09");
  const [tab, setTab] = useState("keluaran");
  const [keluaran, setKeluaran] = useState(seedKeluaran);
  const [selected, setSelected] = useState(() => new Set());
  const [xmlOpen, setXmlOpen] = useState(false);

  const sellerTin = company.npwp.replace(/\D/g, "");

  const fk = useMemo(() => keluaran.filter((r) => r.date.startsWith(masa)), [keluaran, masa]);
  const fm = useMemo(() => fakturMasukan.filter((r) => r.date.startsWith(masa)), [masa]);
  const pph = useMemo(() => pphPotput.filter((r) => r.date.startsWith(masa)), [masa]);

  const recap = useMemo(() => {
    const total = fk.reduce((s, f) => s + ppn12(f.price), 0);
    const wapu = fk.filter((f) => f.trx === "02").reduce((s, f) => s + ppn12(f.price), 0);
    const own = total - wapu;
    const creditable = fm.filter((f) => f.valid).reduce((s, f) => s + ppn12(f.price), 0);
    const blocked = fm.filter((f) => !f.valid);
    return {
      total,
      wapu,
      own,
      creditable,
      masukanAll: fm.reduce((s, f) => s + ppn12(f.price), 0),
      net: own - creditable,
      blocked,
      blockedPpn: blocked.reduce((s, f) => s + ppn12(f.price), 0),
    };
  }, [fk, fm]);

  const pph42 = pph.filter((r) => r.type === "PPh 4(2)" && r.direction === "dipotong").reduce((s, r) => s + pphAmount(r), 0);
  const pph23 = pph.filter((r) => r.type === "PPh 23" && r.direction === "memotong").reduce((s, r) => s + pphAmount(r), 0);
  const pph23In = pph.filter((r) => r.type === "PPh 23" && r.direction === "dipotong").reduce((s, r) => s + pphAmount(r), 0);

  const selectable = (f) => validation(f) === "Valid" && f.status === "Siap Export";
  const eligible = fk.filter(selectable);
  const selectedRows = fk.filter((f) => selected.has(f.id));
  const allSelected = eligible.length > 0 && eligible.every((f) => selected.has(f.id));

  const changeMasa = (v) => {
    setMasa(v);
    setSelected(new Set());
  };

  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const xml = useMemo(() => (xmlOpen ? buildXml(selectedRows, sellerTin) : ""), [xmlOpen, selectedRows, sellerTin]);
  const fileName = `TaxInvoiceBulk_${sellerTin}_${masa.replace("-", "")}.xml`;

  const download = () => {
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    const ids = new Set(selectedRows.map((f) => f.id));
    setKeluaran((rows) => rows.map((f) => (ids.has(f.id) ? { ...f, status: "Exported" } : f)));
    setSelected(new Set());
    setXmlOpen(false);
    toast({
      title: `${ids.size} faktur diexport ke XML Coretax`,
      description: `${fileName} — impor di Coretax › e-Faktur › Pajak Keluaran › Impor Data.`,
    });
  };

  const masaInfo = taxPeriods.find((p) => p.value === masa);

  return (
    <div>
      <PageHeader
        icon={FileCode2}
        title="Pajak & Coretax"
        description="PPN, PPh final 4(2) jasa konstruksi, dan PPh 23 — faktur divalidasi otomatis lalu diexport ke format impor Coretax DJP."
        meta={
          <>
            <Badge tone="indigo">{company.name}</Badge>
            <Badge>{masaInfo.note}</Badge>
          </>
        }
        actions={
          <Select value={masa} onChange={(e) => changeMasa(e.target.value)} className="h-9 w-48">
            {taxPeriods.map((p) => (
              <option key={p.value} value={p.value}>
                Masa {p.label}
              </option>
            ))}
          </Select>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="PPN Keluaran" value={rpShort(recap.total)} hint={`${fk.length} faktur · ${rpShort(recap.wapu)} dipungut WAPU`} icon={FileOutput} />
        <StatCard label="PPN Masukan" value={rpShort(recap.masukanAll)} hint={`${rpShort(recap.creditable)} dapat dikreditkan`} icon={FileInput} />
        <StatCard
          label="Kurang / (Lebih) bayar"
          value={rp(recap.net)}
          delta={recap.net < 0 ? "Lebih bayar" : recap.net > 0 ? "Kurang bayar" : "Nihil"}
          deltaTone={recap.net > 0 ? "amber" : "green"}
          icon={Receipt}
        />
        <StatCard label="PPh 4(2) final dipotong" value={rpShort(pph42)} hint="oleh pemberi kerja · 2,65%" icon={Percent} />
        <StatCard label="PPh 23" value={rpShort(pph23)} hint={`wajib setor · ${rpShort(pph23In)} dipotong pihak lain`} icon={Percent} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={PlugZap}
            title="Integrasi Coretax DJP"
            description="Impor/ekspor faktur dan bukti potong via format XML resmi"
            actions={
              <Button size="xs" variant="ghost" icon={RefreshCw} onClick={() => toast({ title: "Sinkronisasi Coretax selesai", description: "Status faktur & bukti potong diperbarui.", tone: "info" })}>
                Sinkronkan
              </Button>
            }
          />
          <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 border-t border-line px-4 py-3 text-[12.5px]">
            <dt className="text-subtle">Status</dt>
            <dd>
              <Badge tone="green" dot>
                Terhubung
              </Badge>
            </dd>
            <dt className="text-subtle">NPWP penjual</dt>
            <dd className="font-mono text-[12px] text-fg">{company.npwp}</dd>
            <dt className="text-subtle">NITKU</dt>
            <dd className="font-mono text-[12px] text-fg">{sellerTin}000000</dd>
            <dt className="text-subtle">Sinkron terakhir</dt>
            <dd className="text-fg">{coretaxSync.lastSyncLabel}</dd>
            <dt className="text-subtle">Skema</dt>
            <dd>
              <Mono className="text-fg">Skema {coretaxSync.schema}</Mono>
            </dd>
            <dt className="text-subtle">Sertifikat</dt>
            <dd className="flex items-center gap-1.5 text-fg">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              {coretaxSync.certificate}
            </dd>
          </dl>
        </Card>

        <Card>
          <CardHeader icon={Receipt} title={`Rekap PPN masa ${masaInfo.label}`} description="SPT Masa PPN — dihitung dari faktur terdaftar" />
          <table className="w-full border-t border-line text-[13px]">
            <tbody>
              {[
                ["PPN keluaran (seluruh faktur)", recap.total],
                ["Dikurangi: dipungut instansi pemerintah (kode 02)", -recap.wapu],
                ["PPN keluaran harus dipungut sendiri", recap.own, "sub"],
                ["Dikurangi: PPN masukan dapat dikreditkan", -recap.creditable],
              ].map(([label, v, kind]) => (
                <tr key={label} className={cx(kind === "sub" && "border-t border-line font-medium")}>
                  <td className="px-4 py-1.5 text-fg">{label}</td>
                  <td className="px-4 py-1.5 text-right text-fg tabular">{amount(v)}</td>
                </tr>
              ))}
              <tr className="border-t border-line-strong bg-surface-2">
                <td className="px-4 py-2 font-semibold text-fg">{recap.net < 0 ? "PPN lebih bayar" : "PPN kurang bayar"}</td>
                <td className={cx("px-4 py-2 text-right font-semibold tabular", recap.net < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-fg")}>
                  {amount(recap.net)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="px-4 py-2.5 text-[11.5px] text-subtle">
            {recap.net < 0
              ? "Lebih bayar wajar untuk kontraktor dengan pemberi kerja WAPU — dikompensasikan ke masa berikutnya."
              : "Setor via kode billing sebelum pelaporan SPT Masa PPN."}
            {recap.blockedPpn > 0 && ` PPN masukan ${rp(recap.blockedPpn)} tidak dikreditkan (faktur tidak valid).`}
          </p>
        </Card>
      </div>

      {recap.blocked.length > 0 && (
        <Callout tone="indigo" icon={Bot} className="mt-4" title="Agent Hermes:">
          {recap.blocked.length} faktur masukan tanpa NPWP valid — tidak dapat dikreditkan (
          {recap.blocked.map((f) => f.seller).join(", ")}; PPN {rp(recap.blockedPpn)}). Permintaan perbaikan faktur sudah
          disiapkan untuk vendor — tahan pembayaran PPN-nya hingga faktur pengganti terbit.
        </Callout>
      )}

      <Card className="mt-4 overflow-visible">
        <Tabs
          className="px-2"
          value={tab}
          onChange={setTab}
          items={[
            { value: "keluaran", label: "Faktur Keluaran", count: fk.length },
            { value: "masukan", label: "Faktur Masukan", count: fm.length },
            { value: "pph", label: "PPh Potput", count: pph.length },
          ]}
        />

        {tab === "keluaran" && (
          <>
            <TableScroll>
              <table className="w-full min-w-[1180px]">
                <thead className="bg-surface-2">
                  <tr>
                    <th className={cx(th, "w-10 pr-0")}>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua faktur siap export"
                        className="size-3.5 accent-indigo-600"
                        checked={allSelected}
                        disabled={eligible.length === 0}
                        onChange={() => setSelected(allSelected ? new Set() : new Set(eligible.map((f) => f.id)))}
                      />
                    </th>
                    <th className={th}>Nomor faktur</th>
                    <th className={th}>Tanggal</th>
                    <th className={th}>Pembeli</th>
                    <th className={th}>NPWP / NIK pembeli</th>
                    <th className={th}>Kode</th>
                    <th className={cx(th, "text-right")}>Harga jual</th>
                    <th className={cx(th, "text-right")}>DPP nilai lain</th>
                    <th className={cx(th, "text-right")}>PPN 12%</th>
                    <th className={th}>Validasi</th>
                    <th className={th}>Export</th>
                  </tr>
                </thead>
                <tbody>
                  {fk.map((f) => {
                    const v = validation(f);
                    const can = selectable(f);
                    const reason =
                      v !== "Valid"
                        ? `${v} — lengkapi NPWP pembeli di master customer sebelum export`
                        : f.status === "Exported"
                          ? "Sudah diexport ke Coretax"
                          : "";
                    return (
                      <tr
                        key={f.id}
                        className={cx(trHover, selected.has(f.id) && "bg-indigo-500/[0.05]", can && "cursor-pointer")}
                        onClick={() => can && toggle(f.id)}
                      >
                        <td className={cx(td, "pr-0")} title={reason || "Pilih untuk export"} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${f.no}`}
                            className="size-3.5 accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                            checked={selected.has(f.id)}
                            disabled={!can}
                            onChange={() => toggle(f.id)}
                          />
                        </td>
                        <td className={td}>
                          <Mono className="text-fg">{f.no}</Mono>
                          <div className="max-w-[280px] truncate text-[12px] text-subtle" title={f.item}>
                            {f.item}
                          </div>
                        </td>
                        <td className={cx(td, "tabular")}>{date(f.date)}</td>
                        <td className={cx(td, "max-w-[240px] truncate")} title={f.buyer}>
                          {f.buyer}
                        </td>
                        <td className={td}>
                          {f.tin ? <Mono>{formatTin(f.tin)}</Mono> : <span className="text-red-600 dark:text-red-400">–</span>}
                          <div className="text-[11px] text-subtle">{f.idType}</div>
                        </td>
                        <td className={td} title={trxLabel[f.trx]}>
                          <Badge tone={f.trx === "02" ? "blue" : "neutral"}>{f.trx}</Badge>
                        </td>
                        <td className={cx(td, "text-right tabular")}>{amount(f.price)}</td>
                        <td className={cx(td, "text-right tabular")}>{amount(dppNilaiLain(f.price))}</td>
                        <td className={cx(td, "text-right font-medium tabular")}>{amount(ppn12(f.price))}</td>
                        <td className={td}>
                          {v === "Valid" || v === "NPWP Kosong" ? <StatusBadge status={v} /> : <Badge tone="red" dot>{v}</Badge>}
                        </td>
                        <td className={td}>
                          <StatusBadge status={f.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {fk.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-line-strong bg-surface-2">
                      <td colSpan={6} className={cx(td, "font-semibold")}>
                        Jumlah {fk.length} faktur
                      </td>
                      <td className={cx(td, "text-right font-semibold tabular")}>{amount(fk.reduce((s, f) => s + f.price, 0))}</td>
                      <td className={cx(td, "text-right font-semibold tabular")}>{amount(fk.reduce((s, f) => s + dppNilaiLain(f.price), 0))}</td>
                      <td className={cx(td, "text-right font-semibold tabular")}>{amount(recap.total)}</td>
                      <td colSpan={2} className={cx(td, "text-[12px] text-subtle")}>
                        {eligible.length} siap export
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {fk.length === 0 && <EmptyState icon={FileOutput} title="Belum ada faktur keluaran" description="Tidak ada faktur pada masa pajak ini." />}
            </TableScroll>

            {selectedRows.length > 0 && (
              <div className="sticky bottom-4 z-20 mx-3 mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-fg px-4 py-2.5 text-surface shadow-2xl shadow-slate-950/25 animate-pop">
                <span className="text-[13px] font-medium">
                  {selectedRows.length} faktur dipilih
                  <span className="ml-2 opacity-60 tabular">PPN {rp(selectedRows.reduce((s, f) => s + ppn12(f.price), 0))}</span>
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => setSelected(new Set())} className="flex h-8 items-center gap-1 rounded-md px-2 text-[12.5px] opacity-70 hover:opacity-100">
                    <X className="size-3.5" />
                    Batal
                  </button>
                  <Button size="md" variant="ai" icon={FileCode2} onClick={() => setXmlOpen(true)}>
                    Export XML Coretax (TaxInvoice Bulk)
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "masukan" && (
          <TableScroll>
            <table className="w-full min-w-[1080px]">
              <thead className="bg-surface-2">
                <tr>
                  <th className={th}>Nomor faktur</th>
                  <th className={th}>Tanggal</th>
                  <th className={th}>Penjual</th>
                  <th className={th}>NPWP penjual</th>
                  <th className={th}>Dokumen</th>
                  <th className={cx(th, "text-right")}>DPP nilai lain</th>
                  <th className={cx(th, "text-right")}>PPN 12%</th>
                  <th className={th}>Validasi</th>
                  <th className={th}>Pengkreditan</th>
                </tr>
              </thead>
              <tbody>
                {fm.map((f) => (
                  <tr key={f.id} className={cx(trHover, !f.valid && "bg-red-500/[0.03]")}>
                    <td className={td}>
                      <Mono className="text-fg">{f.no}</Mono>
                    </td>
                    <td className={cx(td, "tabular")}>{date(f.date)}</td>
                    <td className={td}>
                      {f.seller}
                      {f.affiliate && (
                        <Badge tone="violet" className="ml-2">
                          Afiliasi
                        </Badge>
                      )}
                    </td>
                    <td className={td}>{f.tin ? <Mono>{formatTin(f.tin)}</Mono> : <span className="text-red-600 dark:text-red-400">–</span>}</td>
                    <td className={td}>
                      <Mono>{f.doc}</Mono>
                    </td>
                    <td className={cx(td, "text-right tabular")}>{amount(dppNilaiLain(f.price))}</td>
                    <td className={cx(td, "text-right font-medium tabular")}>{amount(ppn12(f.price))}</td>
                    <td className={td}>{f.valid ? <StatusBadge status="Valid" /> : <Badge tone="red" dot>{f.issue}</Badge>}</td>
                    <td className={td}>
                      {f.valid ? <Badge tone="green">Dikreditkan</Badge> : <Badge tone="red">Tidak dapat dikreditkan</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
              {fm.length > 0 && (
                <tfoot>
                  <tr className="border-t border-line-strong bg-surface-2">
                    <td colSpan={5} className={cx(td, "font-semibold")}>
                      Jumlah {fm.length} faktur · dapat dikreditkan {rp(recap.creditable)}
                    </td>
                    <td className={cx(td, "text-right font-semibold tabular")}>{amount(fm.reduce((s, f) => s + dppNilaiLain(f.price), 0))}</td>
                    <td className={cx(td, "text-right font-semibold tabular")}>{amount(recap.masukanAll)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
            {fm.length === 0 && <EmptyState icon={FileInput} title="Belum ada faktur masukan" description="Tidak ada faktur pada masa pajak ini." />}
          </TableScroll>
        )}

        {tab === "pph" && (
          <TableScroll>
            <table className="w-full min-w-[1120px]">
              <thead className="bg-surface-2">
                <tr>
                  <th className={th}>Tanggal</th>
                  <th className={th}>Jenis</th>
                  <th className={th}>Arah</th>
                  <th className={th}>Pihak</th>
                  <th className={th}>Objek pajak</th>
                  <th className={cx(th, "text-right")}>Bruto / DPP</th>
                  <th className={cx(th, "text-right")}>Tarif</th>
                  <th className={cx(th, "text-right")}>PPh</th>
                  <th className={th}>Bukti potong</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pph.map((r) => (
                  <tr key={r.id} className={trHover}>
                    <td className={cx(td, "tabular")}>{date(r.date)}</td>
                    <td className={td}>
                      <Badge tone={r.type === "PPh 23" ? "blue" : "indigo"}>{r.type === "PPh 4(2)" ? "PPh 4(2) final" : r.type}</Badge>
                    </td>
                    <td className={cx(td, "text-[12.5px] text-muted")}>{r.direction === "dipotong" ? "Dipotong pihak lain" : "Kita memotong"}</td>
                    <td className={cx(td, "max-w-[220px] truncate")} title={r.party}>
                      {r.party}
                    </td>
                    <td className={cx(td, "max-w-[260px] truncate text-[12.5px] text-muted")} title={r.object}>
                      {r.object}
                    </td>
                    <td className={cx(td, "text-right tabular")}>{amount(r.base)}</td>
                    <td className={cx(td, "text-right tabular")}>{decimal(r.rate, 2)}%</td>
                    <td className={cx(td, "text-right font-medium tabular")}>{amount(pphAmount(r))}</td>
                    <td className={td}>{r.bp ? <Mono>{r.bp}</Mono> : <span className="text-subtle">–</span>}</td>
                    <td className={td}>
                      <Badge tone={pphTone[r.status] ?? "neutral"} dot>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pph.length === 0 && <EmptyState icon={Percent} title="Belum ada bukti potong" description="Tidak ada transaksi PPh pada masa pajak ini." />}
            {pph.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line bg-surface-2 px-4 py-2.5 text-[12px] text-muted">
                <span>Tarif PPh final 4(2) konstruksi (PP 9/2022): 1,75% kualifikasi kecil · 2,65% menengah/besar · 4% tanpa SBU</span>
                <span>PPh 23 sewa alat & jasa teknik: 2%</span>
              </div>
            )}
          </TableScroll>
        )}
      </Card>

      <Modal
        open={xmlOpen}
        onClose={() => setXmlOpen(false)}
        size="lg"
        title="Preview XML Coretax"
        description={`${fileName} · ${selectedRows.length} faktur · skema ${coretaxSync.schema}`}
        footer={
          <>
            <span className="mr-auto flex items-center gap-1.5 text-[12px] text-subtle">
              <CircleCheck className="size-3.5 text-emerald-500" />
              Lolos validasi skema · NPWP penjual {company.npwp}
            </span>
            <Button onClick={() => setXmlOpen(false)}>Batal</Button>
            <Button variant="primary" icon={Download} onClick={download}>
              Unduh .xml
            </Button>
          </>
        }
      >
        <pre className="max-h-[56vh] overflow-auto rounded-lg border border-line bg-surface-2 p-3.5 font-mono text-[11.5px] leading-[1.6] scroll-thin">
          {xml.split("\n").map((line, i) => (
            <div key={i} className="min-h-[1.6em] whitespace-pre">
              <XmlLine line={line} />
            </div>
          ))}
        </pre>
      </Modal>
    </div>
  );
}
