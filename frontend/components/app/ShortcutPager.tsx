"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Shortcut = {
  href: string;
  label: string;
  /** Already-rendered icon (component functions can't cross to the client). */
  icon: ReactNode;
  /** Tile colours, e.g. "bg-emerald-50 text-emerald-700". */
  tone: string;
  badge?: string;
};

const PER_PAGE = 6;

/** 3-column tiles, six per page; swipe or use the arrows to change page. */
export function ShortcutPager({ title, items }: { title: string; items: Shortcut[] }) {
  const pages: Shortcut[][] = [];
  for (let i = 0; i < items.length; i += PER_PAGE) pages.push(items.slice(i, i + PER_PAGE));
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  function go(to: number) {
    const el = scroller.current;
    if (!el) return;
    const next = Math.max(0, Math.min(pages.length - 1, to));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  return (
    <section className="rounded-[28px] bg-surface-card border border-hairline px-5 pt-5 pb-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setPage(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="mt-3 flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((tiles, p) => (
          <ul key={p} className="w-full shrink-0 snap-start grid grid-cols-3 gap-x-3 gap-y-6 content-start pt-2">
            {tiles.map((t) => {
              return (
                <li key={t.href + t.label}>
                  <Link href={t.href} className="flex flex-col items-center gap-2 text-center active:opacity-70">
                    <span className={`relative w-[72px] h-[72px] rounded-[22px] flex items-center justify-center ${t.tone}`}>
                      {t.icon}
                      {t.badge && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-coral text-white text-[11px] font-bold leading-5 text-center ring-2 ring-surface-card">
                          {t.badge}
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-ink leading-tight">{t.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </div>

      {pages.length > 1 && (
        <>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button type="button" onClick={() => go(page - 1)} aria-label="หน้าก่อน" disabled={page === 0} className="text-primary disabled:text-muted-soft">
              <ChevronLeft size={20} strokeWidth={1.75} />
            </button>
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`หน้า ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === page ? "w-7 bg-primary" : "w-2 bg-hairline"}`}
              />
            ))}
            <button type="button" onClick={() => go(page + 1)} aria-label="หน้าถัดไป" disabled={page === pages.length - 1} className="text-primary disabled:text-muted-soft">
              <ChevronRight size={20} strokeWidth={1.75} />
            </button>
          </div>
          <p className="mt-3 text-center text-sm text-muted">ปัดซ้าย–ขวาเพื่อดูทางลัด</p>
        </>
      )}
    </section>
  );
}
