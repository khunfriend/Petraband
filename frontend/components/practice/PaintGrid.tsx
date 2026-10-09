"use client";

import { useEffect, useRef, useState } from "react";
import { toMin } from "@/lib/pollGrid";

type Row = { startTime: string; endTime: string };

type Props = {
  dates: string[]; // YYYY-MM-DD
  rows: Row[];
  /** Poll slot id at (date, row), or undefined when that day has no such cell. */
  cellId: (date: string, row: Row) => string | undefined;
  /** Current on/off value of a cell — decides whether a stroke adds or removes. */
  isOn: (id: string) => boolean;
  cellClass: (id: string, previewOn: boolean | null) => string;
  /** Called once per stroke with every cell in the dragged rectangle. */
  onPaint?: (ids: string[], on: boolean) => void;
  onHover?: (id: string | null) => void;
};

type Point = { di: number; ri: number };

function formatDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return {
    weekday: d.toLocaleDateString("th-TH", { weekday: "short" }),
    day: d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
  };
}

/** when2meet-style grid: press, drag a rectangle, release. Mouse and touch. */
export function PaintGrid({ dates, rows, cellId, isOn, cellClass, onPaint, onHover }: Props) {
  type Stroke = { from: Point; to: Point; on: boolean };
  const [stroke, setStrokeState] = useState<Stroke | null>(null);
  // Mirror for the window pointerup listener; only written from handlers.
  const strokeRef = useRef<Stroke | null>(null);
  function setStroke(s: Stroke | null) {
    strokeRef.current = s;
    setStrokeState(s);
  }
  const paintable = !!onPaint;

  // Uniform short rows (new polls) read like a calendar; long free-form
  // rows (older polls) get a full "start–end" label.
  const fine = rows.every((r) => toMin(r.endTime) - toMin(r.startTime) <= 60);

  useEffect(() => {
    if (!stroke) return;
    function finish() {
      const s = strokeRef.current;
      setStroke(null);
      if (!s || !onPaint) return;
      const ids: string[] = [];
      const [d0, d1] = [Math.min(s.from.di, s.to.di), Math.max(s.from.di, s.to.di)];
      const [r0, r1] = [Math.min(s.from.ri, s.to.ri), Math.max(s.from.ri, s.to.ri)];
      for (let di = d0; di <= d1; di++) {
        for (let ri = r0; ri <= r1; ri++) {
          const id = cellId(dates[di], rows[ri]);
          if (id) ids.push(id);
        }
      }
      onPaint(ids, s.on);
    }
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    // Only (re)bind when a stroke starts or ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stroke === null]);

  function pointAt(x: number, y: number): Point | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-di]");
    if (!el) return null;
    return { di: Number(el.dataset.di), ri: Number(el.dataset.ri) };
  }

  function inStroke(di: number, ri: number) {
    if (!stroke) return false;
    return (
      di >= Math.min(stroke.from.di, stroke.to.di) && di <= Math.max(stroke.from.di, stroke.to.di) &&
      ri >= Math.min(stroke.from.ri, stroke.to.ri) && ri <= Math.max(stroke.from.ri, stroke.to.ri)
    );
  }

  return (
    <div className="overflow-x-auto">
      <div
        className={`inline-grid select-none ${paintable ? "touch-none" : ""}`}
        style={{ gridTemplateColumns: `${fine ? 44 : 88}px repeat(${dates.length}, minmax(44px, 64px))` }}
        onPointerMove={(e) => {
          const p = pointAt(e.clientX, e.clientY);
          if (stroke && p && (p.di !== stroke.to.di || p.ri !== stroke.to.ri)) setStroke({ ...stroke, to: p });
          if (!stroke && onHover) {
            onHover(p ? cellId(dates[p.di], rows[p.ri]) ?? null : null);
          }
        }}
        onPointerLeave={() => onHover?.(null)}
      >
        <div />
        {dates.map((d) => {
          const f = formatDay(d);
          return (
            <div key={d} className="px-1 pb-1.5 text-center leading-tight">
              <div className="text-[11px] text-muted">{f.weekday}</div>
              <div className="text-xs font-semibold text-ink whitespace-nowrap">{f.day}</div>
            </div>
          );
        })}

        {rows.map((row, ri) => {
          const onHour = row.startTime.endsWith(":00");
          return [
            <div
              key={`l${ri}`}
              className={`pr-1.5 text-right text-[10px] tabular-nums text-muted leading-none ${fine ? "h-4 -translate-y-1/2" : "h-9 flex items-center justify-end"}`}
            >
              {fine ? (onHour ? row.startTime : "") : `${row.startTime}–${row.endTime}`}
            </div>,
            ...dates.map((date, di) => {
              const id = cellId(date, row);
              const border = fine
                ? `border-l border-hairline ${onHour ? "border-t border-t-hairline" : "border-t border-t-hairline-soft border-dashed"}`
                : "border-l border-t border-hairline";
              if (!id) {
                return <div key={`${date}${ri}`} className={`${fine ? "h-4" : "h-9"} ${border} bg-hairline-soft/50`} />;
              }
              const preview = inStroke(di, ri) ? stroke!.on : null;
              return (
                <div
                  key={id}
                  data-di={di}
                  data-ri={ri}
                  onPointerDown={
                    paintable
                      ? (e) => {
                          e.preventDefault();
                          // Touch pointers are captured by the target; release so
                          // elementFromPoint tracking works while dragging.
                          (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                          const p = { di, ri };
                          setStroke({ from: p, to: p, on: !isOn(id) });
                        }
                      : undefined
                  }
                  className={`${fine ? "h-4" : "h-9"} ${border} ${paintable ? "cursor-pointer" : ""} ${cellClass(id, preview)}`}
                />
              );
            }),
          ];
        })}
        {/* Closing line under the last row */}
        <div />
        {dates.map((d) => <div key={`end${d}`} className="border-t border-hairline" />)}
      </div>
    </div>
  );
}
