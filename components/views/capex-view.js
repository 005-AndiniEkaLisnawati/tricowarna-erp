"use client";

import { useMemo, useState } from "react";
import { Banknote, CalendarClock, Check, CircleCheck, Factory, Package, Play, ShieldCheck } from "lucide-react";
import { assets, capexLines, depreciation } from "@/lib/data/budget";
import { costCenters } from "@/lib/data/org";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Modal,
  Mono,
  PageHeader,
  Progress,
  StatCard,
  StatusBadge,
  td,
  th,
  trHover,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { cx, date, decimal, rp, rpShort } from "@/lib/format";
import { TableScroll } from "@/components/table-scroll";

const ccName = Object.fromEntries(costCenters.map((c) => [c.code, c.name]));

export function CapexView() {
  const toast = useToast();
  const [lines, setLines] = useState(capexLines);
  const [posted, setPosted] = useState(false);
  const [preview, setPreview] = useState(false);

  const period = posted ? "2026-10" : "2026-09";
  const periodLabel = posted ? "Okt 2026" : "Sep 2026";

  const register = useMemo(
    () =>
      assets.map((a) => {
        const now = depreciation(a, period);
        const next = depreciation(a, "2026-10");
        const sep = depreciation(a, "2026-09");
        return { ...a, ...now, october: next.accumulated - sep.accumulated, done: now.book === 0 };
      }),
    [period],
  );

  const octLines = register.filter((a) => a.october > 0);
  const octTotal = octLines.reduce((s, a) => s + a.october, 0);
  const fullyDep = register.filter((a) => depreciation(a, "2026-09").book === 0);

  const pagu = lines.reduce((s, l) => s + l.pagu, 0);
  const realized = lines.reduce((s, l) => s + l.realized, 0);
  const cost = register.reduce((s, a) => s + a.cost, 0);
  const book = register.reduce((s, a) => s + a.book, 0);

  const approve = (no) => {
    setLines((ls) => ls.map((l) => (l.no === no ? { ...l, status: "Disetujui" } : l)));
    toast({ title: `${no} disetujui`, description: "Pagu CAPEX terkunci, PR pengadaan dapat diterbitkan." });
  };

  const post = () => {
    setPosted(true);
    setPreview(false);
    toast({
      title: "Penyusutan Oktober 2026 diposting",
      description: `${octLines.length} aset · ${rp(octTotal)} — JV-DEP-2026-10 masuk General Ledger.`,
    });
  };

  return (
    <div>
      <PageHeader
        icon={Banknote}
        title="CAPEX & Aset Tetap"
        description="Anggaran belanja modal 2026, register aset tetap, dan penyusutan bulanan metode garis lurus."
        actions={
          posted ? (
            <Badge tone="green" className="h-9 px-3! text-[13px]!">
              <CircleCheck className="size-3.5" />
              Penyusutan Okt 2026 sudah diposting
            </Badge>
          ) : (
            <Button size="md" variant="primary" icon={Play} onClick={() => setPreview(true)}>
              Jalankan penyusutan Oktober 2026
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pagu CAPEX 2026" icon={Banknote} value={rpShort(pagu)} hint={`${lines.length} usulan investasi`} />
        <StatCard label="Realisasi CAPEX" value={rpShort(realized)} hint={`${decimal((realized / pagu) * 100, 1)}% dari pagu`} />
        <StatCard label="Harga perolehan aset" icon={Factory} value={rpShort(cost)} hint={`${register.length} aset terdaftar`} />
        <StatCard label={`Nilai buku per ${periodLabel}`} value={rpShort(book)} hint={`akumulasi ${rpShort(cost - book)}`} />
      </div>

      {/* Budget lines */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader title="Anggaran CAPEX 2026" description="Setiap usulan investasi > Rp50 jt wajib approval Direksi sebelum PR diterbitkan." icon={Package} />
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>No.</th>
                <th className={th}>Item investasi</th>
                <th className={th}>Cost center</th>
                <th className={cx(th, "text-right")}>Pagu</th>
                <th className={cx(th, "text-right")}>Realisasi</th>
                <th className={cx(th, "w-36")}>Serapan</th>
                <th className={cx(th, "text-right")}>Sisa</th>
                <th className={th}>Status</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const ratio = (l.realized / l.pagu) * 100;
                return (
                  <tr key={l.no} className={trHover}>
                    <td className={td}>
                      <Mono className="text-fg">{l.no}</Mono>
                    </td>
                    <td className={cx(td, "max-w-[320px] whitespace-normal")}>
                      <div className="font-medium">{l.name}</div>
                      <div className="text-[12px] leading-snug text-subtle">
                        {l.detail} · {l.vendor}
                      </div>
                    </td>
                    <td className={td}>
                      <Mono>{l.costCenter}</Mono>
                      <div className="text-[12px] text-subtle">{ccName[l.costCenter]}</div>
                    </td>
                    <td className={cx(td, "text-right tabular")}>{rp(l.pagu)}</td>
                    <td className={cx(td, "text-right tabular")}>{l.realized ? rp(l.realized) : "–"}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <Progress value={ratio} tone={l.status === "Selesai" ? "green" : "fg"} className="flex-1" />
                        <span className="w-9 text-right text-[11.5px] text-subtle tabular">{decimal(ratio, 0)}%</span>
                      </div>
                      {l.note && <div className="mt-1 text-[11.5px] text-subtle">{l.note}</div>}
                    </td>
                    <td className={cx(td, "text-right font-medium tabular")}>
                      {l.status === "Selesai" ? (
                        <span className="text-emerald-600 dark:text-emerald-400">hemat {rpShort(l.pagu - l.realized)}</span>
                      ) : (
                        rp(l.pagu - l.realized)
                      )}
                    </td>
                    <td className={td}>
                      <StatusBadge status={l.status} />
                    </td>
                    <td className={cx(td, "text-right")}>
                      {l.status === "Menunggu Approval" && (
                        <Button size="xs" variant="success" icon={Check} onClick={() => approve(l.no)}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      {/* Asset register */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader
          title="Register aset tetap"
          description={`Metode garis lurus tanpa nilai residu, disusutkan sejak bulan perolehan. Posisi akumulasi s/d ${periodLabel}.`}
          icon={CalendarClock}
        />
        <TableScroll>
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className={th}>Kode aset</th>
                <th className={th}>Nama aset</th>
                <th className={th}>Tgl perolehan</th>
                <th className={cx(th, "text-right")}>Harga perolehan</th>
                <th className={cx(th, "text-right")}>Umur ekonomis</th>
                <th className={th}>Metode</th>
                <th className={cx(th, "text-right")}>Penyusutan/bln</th>
                <th className={cx(th, "text-right")}>Akum. s/d {periodLabel}</th>
                <th className={cx(th, "text-right")}>Nilai buku</th>
              </tr>
            </thead>
            <tbody>
              {register.map((a) => (
                <tr key={a.code} className={trHover}>
                  <td className={td}>
                    <Mono className="text-fg">{a.code}</Mono>
                  </td>
                  <td className={td}>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-[12px] text-subtle">{a.group}</div>
                  </td>
                  <td className={cx(td, "text-muted")}>{date(a.acquired)}</td>
                  <td className={cx(td, "text-right tabular")}>{rp(a.cost)}</td>
                  <td className={cx(td, "text-right tabular")}>
                    {a.life} thn
                    <div className="text-[11.5px] text-subtle">
                      {a.months}/{a.life * 12} bln
                    </div>
                  </td>
                  <td className={td}>
                    <Badge>Garis lurus</Badge>
                  </td>
                  <td className={cx(td, "text-right tabular text-muted")}>{a.done ? "–" : rp(a.monthly)}</td>
                  <td className={cx(td, "text-right tabular")}>{rp(a.accumulated)}</td>
                  <td className={cx(td, "text-right font-medium tabular")}>
                    {a.done ? <Badge tone="neutral">Habis disusutkan</Badge> : rp(a.book)}
                    {!a.done && (
                      <Progress value={(a.book / a.cost) * 100} tone="indigo" className="mt-1 ml-auto w-20" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line-strong bg-surface-2">
                <td className={cx(td, "font-semibold")} colSpan={3}>
                  Total
                </td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rp(cost)}</td>
                <td className={td} colSpan={3}></td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rp(cost - book)}</td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rp(book)}</td>
              </tr>
            </tfoot>
          </table>
        </TableScroll>
      </Card>

      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        size="lg"
        title="Jalankan penyusutan Oktober 2026"
        description={`JV-DEP-2026-10 · ${octLines.length} aset · tanggal jurnal 31 Okt 2026`}
        footer={
          <>
            <span className="mr-auto hidden items-center gap-1.5 text-[12px] text-subtle sm:flex">
              <ShieldCheck className="size-3.5" />
              Jurnal dapat di-reverse sebelum tutup buku Oktober.
            </span>
            <Button onClick={() => setPreview(false)}>Batal</Button>
            <Button variant="primary" icon={Check} onClick={post}>
              Posting {rp(octTotal)}
            </Button>
          </>
        }
      >
        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-line scroll-thin">
          <table className="w-full">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th className={th}>Akun</th>
                <th className={th}>Keterangan</th>
                <th className={cx(th, "text-right")}>Debit</th>
                <th className={cx(th, "text-right")}>Kredit</th>
              </tr>
            </thead>
            <tbody>
              {octLines.map((a) => (
                <DepPair key={a.code} asset={a} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line-strong bg-surface-2">
                <td className={cx(td, "font-medium")} colSpan={2}>
                  <span className="flex items-center gap-2">
                    Total <Badge tone="green">Balance</Badge>
                  </span>
                </td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rp(octTotal)}</td>
                <td className={cx(td, "text-right font-semibold tabular")}>{rp(octTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {fullyDep.length > 0 && (
          <p className="mt-3 text-[12px] text-subtle">
            Dilewati: {fullyDep.map((a) => `${a.code} (${a.name})`).join(", ")} — sudah habis disusutkan.
          </p>
        )}
      </Modal>
    </div>
  );
}

function DepPair({ asset }) {
  return (
    <>
      <tr className="border-t border-line">
        <td className={td}>
          <Mono>6-1501</Mono> <span className="ml-1">Beban Penyusutan</span>
        </td>
        <td className={cx(td, "text-[12.5px] text-subtle")}>{asset.name}</td>
        <td className={cx(td, "text-right tabular")}>{rp(asset.october)}</td>
        <td className={td}></td>
      </tr>
      <tr>
        <td className={cx(td, "pt-0 pl-8")}>
          <Mono>1-2901</Mono> <span className="ml-1">Akumulasi Penyusutan</span>
        </td>
        <td className={cx(td, "pt-0 text-[12.5px] text-subtle")}>{asset.code}</td>
        <td className={cx(td, "pt-0")}></td>
        <td className={cx(td, "pt-0 text-right tabular")}>{rp(asset.october)}</td>
      </tr>
    </>
  );
}
