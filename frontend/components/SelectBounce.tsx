"use client";

import { useEffect } from "react";

const TARGETS =
  'button:not(:disabled), a[href], [role="button"], [role="tab"], label, input[type="checkbox"], input[type="radio"]';

/**
 * The song picker's "picked" bounce, for everything clickable: a quick grow
 * past full size and back. Small chips bounce more, wide rows only a little,
 * so a full-width row moves about as much as a picked song does.
 */
export function SelectBounce() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest?.(TARGETS) as HTMLElement | null;
      if (!el || el.closest("[data-no-bounce]")) return;
      const { width } = el.getBoundingClientRect();
      if (width === 0) return;
      const grow = Math.min(0.08, Math.max(0.015, 10 / width));
      el.animate(
        [
          { transform: "scale(1)" },
          { transform: `scale(${1 + grow})` },
          { transform: `scale(${1 - grow / 3})` },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
    }

    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
