"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/format";
import { useDragScroll } from "@/lib/use-drag-scroll";

/* ───────────────────────── Buttons ───────────────────────── */

const buttonVariants = {
  primary:
    "bg-fg text-surface hover:opacity-90 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]",
  secondary:
    "bg-surface text-fg border border-line hover:border-line-strong hover:bg-surface-2",
  ghost: "text-muted hover:text-fg hover:bg-surface-3",
  danger:
    "bg-surface text-red-600 border border-line hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:border-red-500/40",
  ai: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/20",
  success: "bg-emerald-600 text-white hover:bg-emerald-500",
};

const buttonSizes = {
  xs: "h-7 px-2 text-xs gap-1 rounded-md",
  sm: "h-8 px-2.5 text-[13px] gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-sm gap-2 rounded-lg",
  icon: "h-8 w-8 justify-center rounded-md",
};

export function Button({
  variant = "secondary",
  size = "sm",
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex shrink-0 items-center font-medium whitespace-nowrap transition-[background-color,border-color,color,opacity] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-45",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className={size === "md" ? "size-4" : "size-3.5"} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight className="size-3.5" strokeWidth={2} />}
    </button>
  );
}

/* ───────────────────────── Badges ───────────────────────── */

const tones = {
  neutral: "bg-surface-3 text-muted ring-line",
  green: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-700 ring-amber-600/25 dark:text-amber-400",
  red: "bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-400",
  blue: "bg-sky-500/10 text-sky-700 ring-sky-600/20 dark:text-sky-400",
  indigo: "bg-indigo-500/10 text-indigo-700 ring-indigo-600/20 dark:text-indigo-300",
  violet: "bg-violet-500/10 text-violet-700 ring-violet-600/20 dark:text-violet-300",
};

const dotTones = {
  neutral: "bg-slate-400",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-sky-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
};

export function Badge({ tone = "neutral", dot, className, children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cx("size-1.5 rounded-full", dotTones[tone])} />}
      {children}
    </span>
  );
}

// One mapping for every document status in the ERP, so the same word
// always carries the same colour across modules.
const statusTone = {
  Draft: "neutral",
  Disiapkan: "amber",
  Dianalisis: "blue",
  Lolos: "green",
  Menang: "green",
  Kalah: "red",
  "Menunggu Approval": "amber",
  "Approval L2": "amber",
  "Approval L3": "amber",
  Disetujui: "green",
  Ditolak: "red",
  Terkirim: "blue",
  "Diterima Sebagian": "amber",
  "Diterima Penuh": "green",
  Selesai: "green",
  Match: "green",
  "Selisih Qty": "amber",
  "Selisih Harga": "red",
  "Belum Jatuh Tempo": "neutral",
  "Jatuh Tempo": "amber",
  Overdue: "red",
  Lunas: "green",
  Outstanding: "amber",
  "Settle Sebagian": "blue",
  Settled: "green",
  Posted: "green",
  Valid: "green",
  "NPWP Kosong": "red",
  "Siap Export": "blue",
  Exported: "green",
  Aman: "green",
  Waspada: "amber",
  Kritis: "red",
  // Budgeting
  "On Budget": "green",
  "Out of Budget": "red",
  "On Going": "green",
  "Multi Years": "violet",
  Closed: "neutral",
  // Sales pipeline
  "Data Baru": "blue",
  "Follow-up": "amber",
  Customer: "green",
  Lost: "red",
  "Waiting Internal": "amber",
  "Approved Internal": "green",
  "Waiting Customer": "blue",
  "Converted to SO": "indigo",
  Void: "red",
  "Awaiting Approval": "amber",
  Approved: "green",
  "Ready for DO": "blue",
  "Ready for Invoice": "blue",
  // Delivery, invoicing & cash-in
  "In Transit": "blue",
  Delivered: "green",
  "BAST Signed": "green",
  Unpaid: "amber",
  "Partially Paid": "blue",
  Paid: "green",
  Reconciled: "green",
  "Pending Match": "amber",
};

export function StatusBadge({ status, className }) {
  return (
    <Badge tone={statusTone[status] ?? "neutral"} dot className={className}>
      {status}
    </Badge>
  );
}

export function AiBadge({ confidence, label = "AI Detected", className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset animate-pop dark:text-emerald-400",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="size-2.5" fill="currentColor" aria-hidden>
        <path d="M8 0l1.8 5.2L15 7l-5.2 1.8L8 14l-1.8-5.2L1 7l5.2-1.8z" />
      </svg>
      {label}
      {confidence != null && (
        <span className="tabular text-emerald-600/80 dark:text-emerald-400/80">
          · {confidence.toString().replace(".", ",")}%
        </span>
      )}
    </span>
  );
}

/* ───────────────────────── Surfaces ───────────────────────── */

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cx("rounded-xl border border-line bg-surface", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions, icon: Icon, className }) {
  return (
    <div className={cx("flex items-start justify-between gap-4 px-4 pt-3.5 pb-3", className)}>
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-fg">
          {Icon && <Icon className="size-4 text-subtle" strokeWidth={2} />}
          {title}
        </h3>
        {description && <p className="mt-0.5 text-xs text-subtle">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

export function PageHeader({ icon: Icon, title, description, actions, meta }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-5">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-[22px] font-semibold tracking-tight text-fg">
          {Icon && <Icon className="size-5 text-fg" strokeWidth={2} />}
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, delta, deltaTone = "green", icon: Icon }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {Icon && <Icon className="size-3.5 text-subtle" strokeWidth={2} />}
      </div>
      <div className="mt-1.5 text-[22px] leading-7 font-semibold tracking-tight text-fg">
        {value}
      </div>
      {(hint || delta) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
          {delta && (
            <span
              className={cx(
                "font-medium",
                deltaTone === "green" && "text-emerald-600 dark:text-emerald-400",
                deltaTone === "red" && "text-red-600 dark:text-red-400",
                deltaTone === "amber" && "text-amber-600 dark:text-amber-400",
              )}
            >
              {delta}
            </span>
          )}
          {hint}
        </div>
      )}
    </Card>
  );
}

export function Callout({ tone = "indigo", icon: Icon, title, children, className }) {
  const palette = {
    indigo: "border-indigo-500/20 bg-indigo-500/[0.06] text-indigo-900 dark:text-indigo-200",
    amber: "border-amber-500/25 bg-amber-500/[0.07] text-amber-900 dark:text-amber-200",
    green: "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-200",
    red: "border-red-500/20 bg-red-500/[0.06] text-red-900 dark:text-red-200",
  };
  return (
    <div className={cx("flex gap-2.5 rounded-lg border px-3 py-2.5 text-[13px]", palette[tone], className)}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0 opacity-80" strokeWidth={2} />}
      <div className="min-w-0 leading-relaxed">
        {title && <span className="font-semibold">{title} </span>}
        {children}
      </div>
    </div>
  );
}

/* ───────────────────────── Navigation ───────────────────────── */

/** Horizontal row that pans by click-and-drag or trackpad, with no visible scrollbar. */
export function DragScroll({ className, children, ...props }) {
  const ref = useRef(null);
  useDragScroll(ref);
  return (
    <div ref={ref} className={cx("drag-scroll overflow-x-auto scrollbar-none", className)} {...props}>
      {children}
    </div>
  );
}

export function Tabs({ items, value, onChange, className }) {
  return (
    <DragScroll role="tablist" className={cx("flex items-center gap-1 border-b border-line", className)}>
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cx(
              "relative flex h-10 shrink-0 items-center gap-2 px-3 text-[13.5px] font-medium transition-colors",
              active ? "text-fg" : "text-subtle hover:text-fg",
            )}
          >
            {Icon && <Icon className="size-4" strokeWidth={1.9} />}
            {item.label}
            {item.count != null && (
              <span className="tabular text-subtle font-normal">({item.count})</span>
            )}
            <span
              className={cx(
                "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity",
                active ? "bg-fg opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </DragScroll>
  );
}

export function Segmented({ items, value, onChange, className }) {
  return (
    <DragScroll className={cx("inline-flex max-w-full items-center gap-0.5 rounded-lg bg-surface-3 p-0.5", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cx(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-all",
              active
                ? "bg-surface text-fg shadow-sm ring-1 ring-line"
                : "text-muted hover:text-fg",
            )}
          >
            {item.label}
            {item.count != null && (
              <span className={cx("tabular text-[11px]", active ? "text-muted" : "text-subtle")}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </DragScroll>
  );
}

/* ───────────────────────── Data display ───────────────────────── */

export function Progress({ value, tone = "fg", className, size = "sm" }) {
  const bar = {
    fg: "bg-fg",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    indigo: "bg-indigo-500",
  };
  return (
    <div
      className={cx(
        "w-full overflow-hidden rounded-full bg-surface-3",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className={cx("h-full rounded-full transition-[width] duration-500 ease-out", bar[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export const th =
  "relative h-8 px-3 text-left text-[11px] font-medium tracking-wide text-subtle uppercase whitespace-nowrap";
export const td = "px-3 py-2 text-[13px] text-fg whitespace-nowrap";
export const trHover = "border-t border-line transition-colors hover:bg-surface-2";

export function Avatar({ initials, className, tone = "zinc" }) {
  const palette = {
    zinc: "bg-surface-3 text-muted",
    indigo: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
  return (
    <span
      className={cx(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
        palette[tone],
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function Kbd({ children }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded border border-line bg-surface-2 px-1.5 font-sans text-[10.5px] text-subtle">
      {children}
    </kbd>
  );
}

export function Mono({ children, className }) {
  return <span className={cx("font-mono text-[12px] text-muted", className)}>{children}</span>;
}

/* ───────────────────────── Forms ───────────────────────── */

export function Field({ label, hint, aside, children, className }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-muted">{label}</span>
        {aside}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-subtle">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-9 w-full rounded-lg border border-line bg-surface px-3 text-[13.5px] text-fg placeholder:text-subtle outline-none transition-[border-color,box-shadow] hover:border-line-strong focus:border-line-strong focus:ring-3 focus:ring-[var(--ring)]";

export function Input({ className, highlight, ...props }) {
  return (
    <input
      className={cx(
        inputClass,
        highlight && "border-emerald-500/50 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, highlight, children, ...props }) {
  return (
    <select
      className={cx(
        inputClass,
        "appearance-none bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b8b94' stroke-width='2'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E\")]",
        highlight && "border-emerald-500/50 bg-emerald-500/[0.04]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/* ───────────────────────── Overlays ───────────────────────── */

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, description, size = "md", footer, children }) {
  useEscape(open, onClose);
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="fixed inset-0 bg-slate-950/40 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "relative my-auto w-full rounded-2xl border border-line bg-surface shadow-2xl shadow-slate-950/20 animate-pop",
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-subtle">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup">
            <X className="size-4" />
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-line bg-surface-2 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, subtitle, actions, footer, children, width = "max-w-xl" }) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-slate-950/30 animate-fade-in" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "relative flex h-full w-full flex-col border-l border-line bg-surface shadow-2xl animate-slide-in",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-fg">{title}</h2>
            {subtitle && <div className="mt-1 flex flex-wrap items-center gap-2">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-1">
            {actions}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup">
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 scroll-thin">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2 px-5 py-3">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-line bg-surface-2">
          <Icon className="size-5 text-subtle" strokeWidth={1.8} />
        </div>
      )}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-subtle">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
