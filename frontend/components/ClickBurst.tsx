"use client";

import { useEffect } from "react";

const TARGETS =
  'button:not(:disabled), a[href], [role="button"], [role="tab"], label, select, input[type="checkbox"], input[type="radio"]';

/**
 * A small ring that spreads from the point you press on anything clickable.
 * It lives in its own fixed layer, so no element's layout or overflow changes.
 * Pairs with Ripple, which fills the pressed element itself.
 */
export function ClickBurst() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const target = (e.target as Element | null)?.closest?.(TARGETS);
      if (!target || target.closest("[data-no-burst]")) return;

      const ring = document.createElement("span");
      ring.className = "pb-burst";
      ring.style.left = `${e.clientX}px`;
      ring.style.top = `${e.clientY}px`;
      document.body.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove(), { once: true });
      // Safety net if the animation never runs (hidden tab, etc.).
      setTimeout(() => ring.remove(), 1000);
    }

    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return null;
}
