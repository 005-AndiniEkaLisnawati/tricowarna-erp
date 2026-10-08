"use client";

import { useEffect } from "react";

const THRESHOLD = 4; // px of movement before a press becomes a pan

/**
 * Click-and-drag horizontal panning for an overflow container, plus edge-fade
 * hints (data-fade="left|right|both") so hidden scrollbars never hide content.
 * Clicks still work: a press only turns into a pan after it moves, and the click
 * that ends a pan is swallowed so it doesn't trigger a row or pill underneath.
 */
export function useDragScroll(ref, { ignore = "input, select, textarea, .col-resizer" } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateFade = () => {
      const max = el.scrollWidth - el.clientWidth;
      const left = el.scrollLeft > 1;
      const right = max - el.scrollLeft > 1;
      const fade = left && right ? "both" : left ? "left" : right ? "right" : "";
      if (fade) el.dataset.fade = fade;
      else delete el.dataset.fade;
    };

    let start = null;
    let panning = false;

    const onDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (el.scrollWidth <= el.clientWidth) return;
      if (e.target.closest(ignore)) return;
      start = { x: e.clientX, left: el.scrollLeft, id: e.pointerId };
      panning = false;
    };

    const onMove = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      if (!panning && Math.abs(dx) < THRESHOLD) return;
      if (!panning) {
        panning = true;
        el.setPointerCapture(e.pointerId);
        document.documentElement.classList.add("is-panning");
      }
      el.scrollLeft = start.left - dx;
    };

    const swallowClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const onUp = (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (panning) {
        document.documentElement.classList.remove("is-panning");
        el.addEventListener("click", swallowClick, { capture: true, once: true });
        // If no click follows (pointer released outside), drop the trap.
        setTimeout(() => el.removeEventListener("click", swallowClick, { capture: true }), 0);
      }
      start = null;
      panning = false;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("scroll", updateFade, { passive: true });
    const ro = new ResizeObserver(updateFade);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    updateFade();

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("scroll", updateFade);
      ro.disconnect();
      document.documentElement.classList.remove("is-panning");
    };
  }, [ref, ignore]);
}
