"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronsUpDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { navGroups } from "@/lib/nav";
import { currentUser } from "@/lib/data/org";
import { Avatar, Kbd } from "@/components/ui";
import { cx } from "@/lib/format";

const isRail = () =>
  document.documentElement.dataset.sidebar === "rail" &&
  window.matchMedia("(min-width: 1024px)").matches;

/**
 * Desktop sidebar: expanded ↔ icon rail. The mode lives on <html data-sidebar>
 * (restored by the head script before first paint) and is styled with the
 * `rail:` variant, so no React state is needed for the layout itself.
 */
export function toggleRail() {
  const root = document.documentElement;
  const next = root.dataset.sidebar === "rail" ? "full" : "rail";
  root.dataset.sidebar = next;
  try {
    localStorage.setItem("erp-sidebar", next);
  } catch {}
}

export function Sidebar({ pathname, mobileOpen }) {
  const [collapsed, setCollapsed] = useState({});
  const [tip, setTip] = useState(null);

  // One fixed-position tooltip, so the scrolling nav never clips it.
  const tipProps = (label, extra) => ({
    onMouseEnter: (e) => {
      if (!isRail()) return;
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ label, extra, top: r.top + r.height / 2, left: r.right + 10 });
    },
    onMouseLeave: () => setTip(null),
    onFocus: (e) => {
      if (!isRail()) return;
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ label, extra, top: r.top + r.height / 2, left: r.right + 10 });
    },
    onBlur: () => setTip(null),
  });

  return (
    <aside
      className={cx(
        "fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col border-r border-line bg-surface transition-[transform,width] duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 lg:rail:w-16",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <Link
        href="/"
        aria-label="Triton Kencana Tirta — Command Center"
        className="flex h-14 shrink-0 items-center overflow-hidden px-4 lg:rail:justify-center lg:rail:px-0"
      >
        {/* Both marks are navy/black on transparent, so dark mode sets them on a white tile. */}
        {/* logo.png is a 200×200 canvas with the wordmark in a band across the middle — crop to it. */}
        <span className="relative h-11 w-34 overflow-hidden rounded-md dark:bg-white lg:rail:hidden">
          <Image
            src="/logo.png"
            alt="Triton Kencana Tirta"
            fill
            sizes="136px"
            loading="eager"
            className="object-cover object-[50%_44%]"
          />
        </span>
        <span className="relative hidden size-9 overflow-hidden rounded-lg dark:bg-white lg:rail:block">
          <Image
            src="/favicon.png"
            alt="Triton Kencana Tirta"
            fill
            sizes="36px"
            loading="eager"
            className="object-contain p-0.5"
          />
        </span>
      </Link>

      <nav
        className="flex-1 overflow-x-hidden overflow-y-auto px-2.5 pb-4 scroll-thin lg:rail:px-2 lg:rail:scrollbar-none"
        onScroll={() => setTip(null)}
      >
        {navGroups.map((group, gi) => {
          const isCollapsed = collapsed[group.id];
          return (
            <div key={group.id} className="mt-3 first:mt-1">
              {gi > 0 && <div className="mx-2 mb-2 hidden h-px bg-line lg:rail:block" />}
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [group.id]: !c[group.id] }))}
                className="group flex h-7 w-full items-center justify-between rounded-md px-2 text-[11px] font-medium tracking-wider whitespace-nowrap text-subtle uppercase transition-colors hover:text-muted lg:rail:hidden"
              >
                {group.label}
                <ChevronDown
                  className={cx(
                    "size-3.5 opacity-0 transition-[transform,opacity] group-hover:opacity-100",
                    isCollapsed && "-rotate-90 opacity-100",
                  )}
                />
              </button>
              {/* In the rail every icon stays visible, regardless of group collapse. */}
              <ul className={cx("mt-0.5 space-y-px", isCollapsed && "hidden lg:rail:block")}>
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-label={item.label}
                        {...tipProps(item.label, item.badge && `${item.badge} menunggu`)}
                        className={cx(
                          "relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13.5px] transition-colors lg:rail:h-9 lg:rail:justify-center lg:rail:px-0",
                          active
                            ? "bg-surface-3 font-medium text-fg"
                            : "text-muted hover:bg-surface-2 hover:text-fg",
                        )}
                      >
                        {active && (
                          <span className="absolute top-1.5 bottom-1.5 -left-2.5 w-[3px] rounded-r-full bg-fg lg:rail:-left-2" />
                        )}
                        <Icon className="size-4 shrink-0" strokeWidth={1.8} />
                        <span className="truncate lg:rail:hidden">{item.label}</span>
                        {item.badge && (
                          <>
                            <span className="ml-auto rounded-full bg-amber-500/15 px-1.5 text-[10.5px] font-semibold text-amber-700 tabular lg:rail:hidden dark:text-amber-400">
                              {item.badge}
                            </span>
                            <span className="absolute top-1.5 right-2 hidden size-1.5 rounded-full bg-amber-500 ring-2 ring-surface lg:rail:block" />
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-line p-2.5 lg:rail:px-2">
        <button
          onClick={() => {
            setTip(null);
            toggleRail();
          }}
          aria-label="Ciutkan atau bentangkan sidebar"
          {...tipProps("Bentangkan sidebar", "Ctrl B")}
          className="hidden h-8 w-full items-center gap-2.5 rounded-md px-2 text-[13px] whitespace-nowrap text-muted transition-colors hover:bg-surface-2 hover:text-fg lg:flex lg:rail:justify-center lg:rail:px-0"
        >
          <PanelLeftClose className="size-4 shrink-0 lg:rail:hidden" strokeWidth={1.8} />
          <PanelLeftOpen className="hidden size-4 shrink-0 lg:rail:block" strokeWidth={1.8} />
          <span className="lg:rail:hidden">Ciutkan sidebar</span>
          <span className="ml-auto lg:rail:hidden">
            <Kbd>Ctrl B</Kbd>
          </span>
        </button>
        <div
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 lg:rail:justify-center lg:rail:px-0"
          {...tipProps(currentUser.name, currentUser.role)}
        >
          <Avatar initials={currentUser.initials} tone="indigo" className="size-8 text-[11px]" />
          <div className="min-w-0 flex-1 leading-tight lg:rail:hidden">
            <p className="truncate text-[13px] font-medium text-fg">{currentUser.name}</p>
            <p className="truncate text-[11.5px] text-subtle">{currentUser.role}</p>
          </div>
          <ChevronsUpDown className="size-3.5 text-subtle lg:rail:hidden" />
        </div>
      </div>

      {/* Portalled: the aside's transform would otherwise trap it under the main column. */}
      {tip &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[70] flex -translate-y-1/2 items-center gap-2 rounded-md bg-fg px-2.5 py-1.5 text-[12.5px] font-medium whitespace-nowrap text-surface shadow-md animate-fade-in"
            style={{ top: tip.top, left: tip.left }}
          >
            <span className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rotate-45 rounded-[1px] bg-fg" />
            {tip.label}
            {tip.extra && <span className="font-normal opacity-60">{tip.extra}</span>}
          </div>,
          document.body,
        )}
    </aside>
  );
}
