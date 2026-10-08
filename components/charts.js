"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";

/* Single-series charts drawn in real pixels (measured width), so strokes stay
   2px and text never stretches. Marks use --series-1; all text uses ink tokens. */

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** Clean tick values (1/2/2.5/5 × 10^k) covering [min, max]. */
function niceTicks(max, count = 4, min = 0) {
  const raw = (max - min) / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw);
  const lo = Math.floor(min / step) * step;
  const ticks = [];
  for (let v = lo; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  if (ticks.at(-1) < max) ticks.push(ticks.at(-1) + step);
  return ticks;
}

function Tooltip({ x, y, width, children }) {
  // Flip to the left of the pointer near the right edge.
  const flip = x > width - 170;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-[140px] rounded-lg border border-line bg-surface px-3 py-2 text-[12px] shadow-md"
      style={{ top: Math.max(0, y - 12), left: flip ? undefined : x + 12, right: flip ? width - x + 12 : undefined }}
    >
      {children}
    </div>
  );
}

const PAD = { top: 12, right: 56, bottom: 24, left: 44 };

/**
 * Line with crosshair tooltip and labelled end point. With baseline="zero" it
 * gets the 10% area wash (area implies magnitude from zero); with "auto" the
 * y-domain hugs the data so a level series' movement stays readable.
 */
export function AreaChart({ data, height = 200, format, tickFormat, label, baseline = "zero" }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);

  const values = data.map((d) => d.value);
  const zero = baseline === "zero";
  const ticks = zero
    ? niceTicks(Math.max(...values) * 1.08)
    : niceTicks(Math.max(...values), 4, Math.min(...values));
  const yMin = ticks[0];
  const yMax = ticks.at(-1);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (data.length === 1 ? 0 : (i / (data.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join("");
  const area = `${line}L${x(data.length - 1)},${y(yMin)}L${x(0)},${y(yMin)}Z`;
  const last = data.length - 1;
  const xLabelEvery = Math.ceil(data.length / 6);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left - PAD.left;
    const i = Math.round((px / innerW) * (data.length - 1));
    setHover(Math.max(0, Math.min(last, i)));
  };

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={label}
          className="block touch-none"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-subtle text-[11px] tabular">
                {tickFormat(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % xLabelEvery === 0 || i === last ? (
              <text key={d.label} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="fill-subtle text-[11px]">
                {d.short}
              </text>
            ) : null,
          )}
          {zero && <path d={area} fill="var(--series-1)" fillOpacity="0.1" />}
          <path d={line} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {hover != null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--line-strong)" strokeWidth="1" />
          )}
          {/* End marker + direct label (the one value the chart leads with). */}
          <circle cx={x(last)} cy={y(data[last].value)} r="4" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />
          <text x={x(last) + 8} y={y(data[last].value)} dy="0.32em" className="fill-fg text-[11.5px] font-semibold tabular">
            {tickFormat(data[last].value)}
          </text>
          {hover != null && hover !== last && (
            <circle cx={x(hover)} cy={y(data[hover].value)} r="4" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />
          )}
        </svg>
      )}
      {hover != null && width > 0 && (
        <Tooltip x={x(hover)} y={y(data[hover].value)} width={width}>
          <p className="font-semibold text-fg tabular">{format(data[hover].value)}</p>
          <p className="text-subtle">{data[hover].label}</p>
        </Tooltip>
      )}
    </div>
  );
}

/** Columns ≤24px with 4px rounded caps, an optional reference rule, per-bar tooltips. */
export function ColumnChart({ data, height = 200, format, tickFormat, reference, label }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);

  const ticks = niceTicks(Math.max(reference?.value ?? 0, ...data.map((d) => d.value)) * 1.08);
  const yMax = ticks.at(-1);
  const pad = { ...PAD, right: 12 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const band = innerW / data.length;
  const barW = Math.min(24, band * 0.56);
  const y = (v) => pad.top + innerH - (v / yMax) * innerH;
  const base = y(0);

  const bar = (center, v) => {
    const top = y(v);
    const r = Math.min(4, (base - top) / 2);
    const l = center - barW / 2;
    const rt = center + barW / 2;
    return `M${l},${base}V${top + r}Q${l},${top} ${l + r},${top}H${rt - r}Q${rt},${top} ${rt},${top + r}V${base}Z`;
  };

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-subtle text-[11px] tabular">
                {tickFormat(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const mid = pad.left + band * i + band / 2;
            return (
              <g
                key={d.label}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                className="cursor-default"
              >
                {/* Hit target spans the whole band, bigger than the mark. */}
                <rect x={mid - band / 2} y={pad.top} width={band} height={innerH} fill="transparent" />
                <path
                  d={bar(mid, d.value)}
                  fill="var(--series-1)"
                  className="transition-opacity duration-150"
                  opacity={hover == null || hover === i ? 1 : 0.45}
                />
                <text x={mid} y={height - 6} textAnchor="middle" className="fill-subtle text-[11px]">
                  {d.short}
                </text>
              </g>
            );
          })}
          {reference && (
            <g className="pointer-events-none">
              <line x1={pad.left} x2={width - pad.right} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--muted)" strokeWidth="1" />
              <text x={pad.left + 6} y={y(reference.value) - 6} className="fill-muted text-[11px]">
                {reference.label}
              </text>
            </g>
          )}
        </svg>
      )}
      {hover != null && width > 0 && (
        <Tooltip x={pad.left + band * hover + band / 2} y={y(data[hover].value)} width={width}>
          <p className="font-semibold text-fg tabular">{format(data[hover].value)}</p>
          <p className="text-subtle">{data[hover].label}</p>
          {reference && (
            <p className="mt-1 text-muted tabular">
              {data[hover].value >= reference.value ? "+" : "−"}
              {format(Math.abs(data[hover].value - reference.value))} vs pagu
            </p>
          )}
        </Tooltip>
      )}
    </div>
  );
}

/** 12-ish point trend: de-emphasised line, current period in the accent. */
export function Sparkline({ values, className, w = 96, h = 28 }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)]);
  const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join("");
  const [lx, ly] = pts.at(-1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="xMaxYMid meet" className={cx("overflow-visible", className)} aria-hidden>
      <path d={d} fill="none" stroke="var(--line-strong)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="3" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="1.5" />
    </svg>
  );
}
