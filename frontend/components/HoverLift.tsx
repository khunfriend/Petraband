"use client";

import { useEffect } from "react";

const TARGETS = 'button:not(:disabled), a[href], [role="button"], [role="tab"], label';
const EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/**
 * The song picker's hover, for everything clickable: the item under the
 * mouse grows a touch with a slight overshoot and settles back on leave.
 * Small chips grow more, wide rows only a little. Uses Web Animations so it
 * never touches an element's own transitions or classes; items that already
 * animate their own transform (song rows, member chips) are left alone.
 */
function rgba(color: string): number[] {
  return (color.match(/[\d.]+/g) ?? []).map(Number);
}
function isClear(color: string) {
  const [, , , alpha = 1] = rgba(color);
  return color === "transparent" || alpha === 0;
}
function isLight(color: string) {
  const [r = 0, g = 0, b = 0] = rgba(color);
  return 0.299 * r + 0.587 * g + 0.114 * b > 186;
}
function cream() {
  return getComputedStyle(document.documentElement).getPropertyValue("--color-surface-cream-strong").trim() || "#efe8da";
}

export function HoverLift() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lifted = new Map<HTMLElement, Animation>();

    function lift(el: HTMLElement) {
      if (lifted.has(el) || el.closest("[data-no-hover]")) return;
      // Leave elements that drive their own transform alone.
      if (el.style.transform || getComputedStyle(el).transform !== "none") return;
      const { width } = el.getBoundingClientRect();
      if (width === 0) return;
      const grow = Math.min(0.06, Math.max(0.015, 8 / width));
      const cs = getComputedStyle(el);
      const raise = cs.position !== "static";
      // Like a picked song: see-through items on light ground also get a soft
      // cream backdrop. Coloured buttons and light text on dark bars don't.
      const highlight = isClear(cs.backgroundColor) && !isLight(cs.color);
      const from: Keyframe = { transform: "scale(1)" };
      const to: Keyframe = { transform: `scale(${1 + grow})` };
      if (raise) to.zIndex = "1";
      if (highlight) {
        from.backgroundColor = cs.backgroundColor;
        to.backgroundColor = cream();
        if (cs.borderTopLeftRadius === "0px") {
          from.borderRadius = "0px";
          to.borderRadius = "8px";
        }
      }
      const anim = el.animate(
        [from, to],
        { duration: 240, easing: EASE, fill: "forwards" },
      );
      lifted.set(el, anim);
    }

    function settle(el: HTMLElement) {
      const anim = lifted.get(el);
      if (!anim) return;
      lifted.delete(el);
      anim.reverse();
      anim.addEventListener("finish", () => anim.cancel(), { once: true });
    }

    function target(node: EventTarget | null) {
      return ((node as Element | null)?.closest?.(TARGETS) as HTMLElement | null) ?? null;
    }

    function onOver(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const el = target(e.target);
      if (el) lift(el);
    }
    function onOut(e: PointerEvent) {
      const from = target(e.target);
      if (!from) return;
      // Still inside the same item (moving between its children).
      if (e.relatedTarget instanceof Node && from.contains(e.relatedTarget)) return;
      settle(from);
    }

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      lifted.forEach((a) => a.cancel());
    };
  }, []);

  return null;
}
