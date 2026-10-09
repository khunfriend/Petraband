"use client";

import { useEffect } from "react";

// Elements that can hold a child span. Form fields (input, select) can't, so
// they keep only their CSS feedback.
const TARGETS = 'button:not(:disabled), a[href], [role="button"], [role="tab"], label';

/**
 * Material-style ripple: a soft circle in the element's own text colour
 * spreads from the press point and stays inside the element's rounded box.
 */
export function Ripple() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const el = (e.target as Element | null)?.closest?.(TARGETS) as HTMLElement | null;
      if (!el || el.closest("[data-no-ripple]")) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // The clip layer needs a positioned parent; restore it afterwards.
      const restorePosition = getComputedStyle(el).position === "static";
      if (restorePosition) el.style.position = "relative";

      const clip = document.createElement("span");
      clip.className = "pb-ripple-clip";
      const dot = document.createElement("span");
      dot.className = "pb-ripple";
      const size = Math.hypot(rect.width, rect.height) * 2;
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.left = `${e.clientX - rect.left - size / 2}px`;
      dot.style.top = `${e.clientY - rect.top - size / 2}px`;
      clip.appendChild(dot);
      el.appendChild(clip);

      const cleanup = () => {
        clip.remove();
        if (restorePosition && !el.querySelector(".pb-ripple-clip")) el.style.position = "";
      };
      dot.addEventListener("animationend", cleanup, { once: true });
      setTimeout(cleanup, 1000);
    }

    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return null;
}
