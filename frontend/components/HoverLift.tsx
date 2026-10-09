"use client";

import { useEffect } from "react";

const TARGETS = 'button:not(:disabled), a[href], [role="button"], [role="tab"], label';

/**
 * Quiet hover for clickable items on light ground: a soft cream backdrop so
 * it is clear what can be clicked. No movement. Uses Web Animations so it
 * never touches an element's own classes; coloured buttons, items on dark
 * bars and items that style their own hover are left alone.
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
/** Is the first painted background behind this element dark (nav bar, hero)? */
function onDarkGround(el: Element) {
  for (let n: Element | null = el.parentElement; n; n = n.parentElement) {
    const bg = getComputedStyle(n).backgroundColor;
    if (!isClear(bg)) return !isLight(bg) && luminance(bg) < 120;
  }
  return false;
}
function luminance(color: string) {
  const [r = 0, g = 0, b = 0] = rgba(color);
  return 0.299 * r + 0.587 * g + 0.114 * b;
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
      // Leave elements that run their own hover effect alone.
      if (el.style.transform || el.style.backgroundColor) return;
      const cs = getComputedStyle(el);
      if (!isClear(cs.backgroundColor) || onDarkGround(el)) return;
      const from: Keyframe = { backgroundColor: cs.backgroundColor };
      const to: Keyframe = { backgroundColor: cream() };
      if (cs.borderTopLeftRadius === "0px") {
        from.borderRadius = "0px";
        to.borderRadius = "6px";
      }
      const anim = el.animate([from, to], { duration: 150, easing: "ease-out", fill: "forwards" });
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
