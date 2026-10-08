"use client";

import { useEffect, useRef } from "react";
import { useDragScroll } from "@/lib/use-drag-scroll";
import { cx } from "@/lib/format";

const MIN_COL = 56;

/**
 * Wraps one data table: horizontal drag-to-pan with hidden scrollbars, sticky
 * header, and Excel-style column resizing (drag a header edge; double-click
 * it to reset the whole table to automatic widths).
 *
 * Columns stay in automatic layout until the first resize — then every header
 * width is frozen in px and the table switches to `table-layout: fixed`, so
 * the column you drag is the only one that moves.
 */
export function TableScroll({ className, maxHeight = "max-h-[min(72dvh,760px)]", children }) {
  const ref = useRef(null);
  useDragScroll(ref, { ignore: "input, select, textarea, label, .col-resizer" });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const headerCells = (table) => {
      const head = table.tHead;
      // Only single-row headers without spans map 1:1 onto columns.
      if (!head || head.rows.length !== 1) return null;
      const cells = Array.from(head.rows[0].cells);
      return cells.every((c) => c.colSpan === 1) ? cells : null;
    };

    const freeze = (table, cells) => {
      if (table.dataset.resized) return;
      const widths = cells.map((c) => c.getBoundingClientRect().width);
      cells.forEach((c, i) => (c.style.width = `${widths[i]}px`));
      table.style.tableLayout = "fixed";
      table.style.width = `${widths.reduce((a, b) => a + b, 0)}px`;
      table.style.minWidth = "0";
      table.dataset.resized = "1";
    };

    const reset = (table, cells) => {
      cells.forEach((c) => (c.style.width = ""));
      table.style.tableLayout = "";
      table.style.width = "";
      table.style.minWidth = "";
      delete table.dataset.resized;
    };

    const startResize = (e, table, cells, cell) => {
      e.preventDefault();
      e.stopPropagation();
      const handle = e.currentTarget;
      // Second press within 350ms = double-click: back to automatic widths.
      // (Detected here because preventDefault on pointerdown suppresses dblclick.)
      const now = performance.now();
      if (now - Number(handle.dataset.lastDown || 0) < 350) {
        delete handle.dataset.lastDown;
        reset(table, cells);
        return;
      }
      handle.dataset.lastDown = String(now);
      freeze(table, cells);
      handle.setPointerCapture(e.pointerId);
      handle.dataset.active = "1";
      document.documentElement.classList.add("is-panning");
      const startX = e.clientX;
      const startW = cell.getBoundingClientRect().width;
      const others = cells.reduce((s, c) => (c === cell ? s : s + c.getBoundingClientRect().width), 0);

      const move = (ev) => {
        const w = Math.max(MIN_COL, startW + ev.clientX - startX);
        cell.style.width = `${w}px`;
        table.style.width = `${others + w}px`;
      };
      const up = () => {
        delete handle.dataset.active;
        document.documentElement.classList.remove("is-panning");
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    };

    // React owns the header cells, so handles are re-attached whenever it
    // re-renders them (the observer fires on its own appends too, harmlessly).
    const enhance = () => {
      root.querySelectorAll("table").forEach((table) => {
        const cells = headerCells(table);
        if (!cells) return;
        cells.forEach((cell, i) => {
          if (i === cells.length - 1 || cell.querySelector(":scope > .col-resizer")) return;
          const handle = document.createElement("span");
          handle.className = "col-resizer";
          handle.setAttribute("aria-hidden", "true");
          handle.title = "Seret untuk ubah lebar · klik ganda untuk reset";
          handle.addEventListener("pointerdown", (e) => startResize(e, table, headerCells(table), cell));
          handle.addEventListener("click", (e) => e.stopPropagation());
          cell.appendChild(handle);
        });
      });
    };

    enhance();
    const mo = new MutationObserver(enhance);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  return (
    <div ref={ref} className={cx("data-table drag-scroll overflow-auto scrollbar-none overscroll-x-contain", maxHeight, className)}>
      {children}
    </div>
  );
}
