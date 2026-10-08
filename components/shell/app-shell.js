"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronsUpDown,
  CornerDownLeft,
  Moon,
  PanelLeft,
  Search,
  Sun,
  X,
} from "lucide-react";
import { navItems, findNav } from "@/lib/nav";
import { companies, currentUser } from "@/lib/data/org";
import { ToastProvider } from "@/components/toast";
import { Avatar, DragScroll, Kbd } from "@/components/ui";
import { Sidebar, toggleRail } from "@/components/shell/sidebar";
import { cx } from "@/lib/format";

const CompanyContext = createContext(companies[0]);
export const useCompany = () => useContext(CompanyContext);

export function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);
  const [company, setCompany] = useState(companies[0]);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Open-page tabs (like browser tabs inside the ERP). Track route changes
  // during render instead of in an effect so the tab appears in the same frame.
  // Tabs are keyed by nav item, so a detail page (/budget/project/x) reuses its module's tab.
  const navHref = findNav(pathname)?.href;
  const [tabs, setTabs] = useState(() => (!navHref || navHref === "/" ? ["/"] : ["/", navHref]));
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileNav(false);
    if (navHref && !tabs.includes(navHref)) setTabs([...tabs, navHref]);
  }

  const closeTab = (href) => {
    const idx = tabs.indexOf(href);
    const next = tabs.filter((t) => t !== href);
    setTabs(next);
    if (href === navHref) router.push(next[Math.max(0, idx - 1)] ?? "/");
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleRail();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CompanyContext.Provider value={company}>
      <ToastProvider>
        <div className="flex h-dvh overflow-hidden bg-canvas">
          {/* Mobile scrim */}
          {mobileNav && (
            <div
              className="fixed inset-0 z-30 bg-slate-950/30 animate-fade-in lg:hidden"
              onClick={() => setMobileNav(false)}
            />
          )}
          <Sidebar pathname={pathname} mobileOpen={mobileNav} />

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              onToggleSidebar={() => {
                if (window.matchMedia("(min-width: 1024px)").matches) toggleRail();
                else setMobileNav((o) => !o);
              }}
              onOpenPalette={() => setPaletteOpen(true)}
              company={company}
              onCompany={setCompany}
            />
            <OpenTabs tabs={tabs} pathname={pathname} onClose={closeTab} />
            <main className="flex-1 overflow-y-auto scroll-thin">
              <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </ToastProvider>
    </CompanyContext.Provider>
  );
}

/* ───────────────────────── Topbar ───────────────────────── */

const notifications = [
  { title: "PR-2026-0187 menunggu approval Anda", meta: "Jembatan A · 2 jam lalu", unread: true },
  { title: "Budget Jalan B kategori Aspal mencapai 92%", meta: "Budget guard · 5 jam lalu", unread: true },
  { title: "Agent Hermes selesai mengurai KAK Sungai Burung", meta: "Estimasi · kemarin", unread: false },
];

function Topbar({ onToggleSidebar, onOpenPalette, company, onCompany }) {
  const [companyOpen, setCompanyOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Sync with the class the inline head script applied before hydration.
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) setDark(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("erp-theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
      <IconButton label="Tampilkan/sembunyikan sidebar" onClick={onToggleSidebar}>
        <PanelLeft className="size-4" />
      </IconButton>
      <div className="mx-1 h-5 w-px bg-line" />
      <button
        onClick={onOpenPalette}
        className="flex h-8 w-full max-w-[280px] items-center gap-2 rounded-lg px-2 text-[13.5px] text-subtle transition-colors hover:bg-surface-2"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Cari modul, dokumen…</span>
        <span className="hidden sm:inline-flex">
          <Kbd>Ctrl K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative">
          <button
            onClick={() => setCompanyOpen((o) => !o)}
            className="flex h-8 max-w-[300px] items-center gap-2 rounded-lg border border-line px-2.5 text-[13px] font-medium text-fg transition-colors hover:border-line-strong"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="hidden truncate sm:inline">{company.name}</span>
            <span className="sm:hidden">{company.id}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-subtle" />
          </button>
          {companyOpen && (
            <Popover onClose={() => setCompanyOpen(false)} className="w-[320px]">
              <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wider text-subtle uppercase">
                Tricowarna Group
              </p>
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onCompany(c);
                    setCompanyOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="flex size-7 items-center justify-center rounded-md bg-surface-3 font-mono text-[10px] font-semibold text-muted">
                    {c.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-fg">{c.name}</span>
                    <span className="block text-[11.5px] text-subtle">{c.role}</span>
                  </span>
                  {c.id === company.id && <Check className="size-4 text-fg" />}
                </button>
              ))}
            </Popover>
          )}
        </div>

        <IconButton label={dark ? "Mode terang" : "Mode gelap"} onClick={toggleTheme}>
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </IconButton>

        <div className="relative">
          <IconButton label="Notifikasi" onClick={() => setBellOpen((o) => !o)}>
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red-500 ring-2 ring-surface" />
          </IconButton>
          {bellOpen && (
            <Popover onClose={() => setBellOpen(false)} className="w-[340px]">
              <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wider text-subtle uppercase">
                Notifikasi
              </p>
              {notifications.map((n) => (
                <div key={n.title} className="flex gap-2.5 rounded-md px-2.5 py-2 hover:bg-surface-2">
                  <span
                    className={cx(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      n.unread ? "bg-sky-500" : "bg-transparent",
                    )}
                  />
                  <div>
                    <p className="text-[13px] text-fg">{n.title}</p>
                    <p className="text-[11.5px] text-subtle">{n.meta}</p>
                  </div>
                </div>
              ))}
            </Popover>
          )}
        </div>
        <Avatar initials={currentUser.initials} tone="indigo" className="ml-1 size-8 text-[11px]" />
      </div>
    </header>
  );
}

function IconButton({ label, children, ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className="relative flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-fg"
      {...props}
    >
      {children}
    </button>
  );
}

function Popover({ onClose, className, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => e.key === "Escape" && onClose();
    // Defer so the click that opened the popover doesn't immediately close it.
    const t = setTimeout(() => document.addEventListener("mousedown", onDown));
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div
      ref={ref}
      className={cx(
        "absolute top-10 right-0 z-50 rounded-xl border border-line bg-surface p-1 shadow-xl shadow-slate-950/10 animate-pop",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── Open tabs ───────────────────────── */

function OpenTabs({ tabs, pathname, onClose }) {
  return (
    <DragScroll className="flex h-10 shrink-0 items-end gap-0.5 border-b border-line bg-surface px-3">
      {tabs.map((href) => {
        const item = findNav(href);
        if (!item) return null;
        const active = href === findNav(pathname)?.href;
        const Icon = item.icon;
        return (
          <div
            key={href}
            className={cx(
              "group relative flex h-9 shrink-0 items-center gap-2 rounded-t-lg border border-b-0 pr-1.5 pl-3 text-[13px] transition-colors",
              active
                ? "border-line bg-canvas font-medium text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {active && <span className="absolute inset-x-0 -bottom-px h-px bg-canvas" />}
            <Link href={href} className="flex items-center gap-2">
              <Icon className="size-3.5" strokeWidth={1.9} />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
            {href !== "/" ? (
              <button
                onClick={() => onClose(href)}
                aria-label={`Tutup tab ${item.label}`}
                className={cx(
                  "flex size-5 items-center justify-center rounded text-subtle transition-opacity hover:bg-surface-3 hover:text-fg",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              >
                <X className="size-3" />
              </button>
            ) : (
              <span className="w-1" />
            )}
          </div>
        );
      })}
    </DragScroll>
  );
}

/* ───────────────────────── Command palette ───────────────────────── */

function CommandPalette({ open, onClose }) {
  if (!open) return null;
  return <PaletteBody onClose={onClose} />;
}

function PaletteBody({ onClose }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return navItems;
    return navItems.filter(
      (i) => i.label.toLowerCase().includes(term) || i.group.toLowerCase().includes(term),
    );
  }, [q]);

  const go = (item) => {
    router.push(item.href);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter" && results[cursor]) {
      go(results[cursor]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-slate-950/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl animate-pop">
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="size-4 text-subtle" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Lompat ke modul…"
            className="h-12 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-subtle"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul className="max-h-[360px] overflow-y-auto p-1.5 scroll-thin">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px] text-subtle">Tidak ada modul yang cocok.</li>
          )}
          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <button
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(item)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                    i === cursor ? "bg-surface-3" : "",
                  )}
                >
                  <Icon className="size-4 text-muted" strokeWidth={1.8} />
                  <span className="flex-1 text-[13.5px] text-fg">{item.label}</span>
                  <span className="text-[11.5px] text-subtle">{item.group}</span>
                  {i === cursor && <CornerDownLeft className="size-3.5 text-subtle" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
