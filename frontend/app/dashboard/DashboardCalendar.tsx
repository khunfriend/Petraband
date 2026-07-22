"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Music, Users } from "lucide-react";
import type { CalendarPerformanceDate, CalendarPracticeDay } from "./types";

type Props = {
  performanceDates: CalendarPerformanceDate[];
  practiceDays: CalendarPracticeDay[];
};

const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function monthName(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });
}

export default function DashboardCalendar({ performanceDates, practiceDays }: Props) {
  const today = isoToday();
  const todayDate = new Date();

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const perfMap = useMemo(() => {
    const map = new Map<string, CalendarPerformanceDate[]>();
    for (const d of performanceDates) {
      const existing = map.get(d.date) ?? [];
      map.set(d.date, [...existing, d]);
    }
    return map;
  }, [performanceDates]);

  const practiceMap = useMemo(() => {
    const map = new Map<string, CalendarPracticeDay[]>();
    for (const d of practiceDays) {
      const existing = map.get(d.date) ?? [];
      map.set(d.date, [...existing, d]);
    }
    return map;
  }, [practiceDays]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells: { iso: string; day: number; current: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      cells.push({ iso: toISO(y, m, d), day: d, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ iso: toISO(year, month, d), day: d, current: true });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      cells.push({ iso: toISO(y, m, d), day: d, current: false });
    }
    return cells;
  }, [year, month]);

  const selectedPerf = selectedDate ? perfMap.get(selectedDate) ?? [] : [];
  const selectedPrac = selectedDate ? practiceMap.get(selectedDate) ?? [] : [];
  const hasSelected = selectedPerf.length > 0 || selectedPrac.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Calendar card ─────────────────────────────── */}
      <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline-soft">
          <button
            onClick={prevMonth}
            aria-label="เดือนก่อนหน้า"
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-surface-cream-strong transition-colors duration-[var(--duration-pb-base)] text-muted hover:text-ink"
          >
            <ChevronLeft size={18} strokeWidth={1.75} />
          </button>
          <p className="text-sm font-bold text-ink">{monthName(year, month)}</p>
          <button
            onClick={nextMonth}
            aria-label="เดือนถัดไป"
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-surface-cream-strong transition-colors duration-[var(--duration-pb-base)] text-muted hover:text-ink"
          >
            <ChevronRight size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Day headers — eyebrow style */}
        <div className="grid grid-cols-7 border-b border-hairline-soft bg-surface-soft">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((cell, i) => {
            const perfs = perfMap.get(cell.iso) ?? [];
            const pracs = practiceMap.get(cell.iso) ?? [];
            const isToday = cell.iso === today;
            const isSelected = cell.iso === selectedDate;
            const hasSunday = i % 7 === 0;

            return (
              <button
                key={cell.iso + i}
                onClick={() =>
                  setSelectedDate(cell.iso === selectedDate ? null : cell.iso)
                }
                className={[
                  "min-h-[76px] p-1.5 text-left border-b border-r border-hairline-soft transition-colors duration-[var(--duration-pb-base)] relative",
                  cell.current
                    ? "bg-canvas hover:bg-surface-cream-strong"
                    : "bg-surface-soft/60",
                  isSelected
                    ? "ring-[1.5px] ring-inset ring-primary z-10"
                    : "",
                  hasSunday ? "border-l-0" : "",
                ].join(" ")}
              >
                {/* Date number — today = coral underline (the ONE coral point) */}
                <span
                  className={[
                    "inline-flex flex-col items-center leading-none text-xs font-semibold mb-1 pb-0.5",
                    isToday
                      ? "text-ink border-b-2 border-coral"
                      : cell.current
                      ? "text-ink"
                      : "text-muted-soft",
                  ].join(" ")}
                >
                  {cell.day}
                </span>

                {/* Event chips — navy filled = performance, navy outline = practice */}
                <div className="flex flex-col gap-0.5">
                  {perfs.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className="truncate text-[10px] font-medium px-1 py-0.5 rounded-[var(--radius-xs)] bg-primary text-on-primary leading-tight"
                    >
                      {p.performance.name}
                    </div>
                  ))}
                  {pracs.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className="truncate text-[10px] font-medium px-1 py-0.5 rounded-[var(--radius-xs)] border border-primary/50 text-primary leading-tight"
                    >
                      {p.scheduleTitle}
                    </div>
                  ))}
                  {perfs.length + pracs.length > 4 && (
                    <p className="text-[10px] text-muted-soft px-1">
                      +{perfs.length + pracs.length - 4} อื่นๆ
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 px-5 py-3 border-t border-hairline-soft">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-primary shrink-0" />
            <span className="text-xs text-muted">งานแสดง</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] border border-primary/50 shrink-0" />
            <span className="text-xs text-muted">ตารางซ้อม</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="inline-flex items-center leading-none text-xs font-bold text-ink pb-0.5 border-b-2 border-coral">
              {new Date().getDate()}
            </span>
            <span className="text-xs text-muted">วันนี้</span>
          </div>
        </div>
      </div>

      {/* ─── Selected day detail ────────────────────────── */}
      {selectedDate && (
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
          <div className="px-5 py-3 border-b border-hairline-soft">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {!hasSelected ? (
            <div className="flex items-center gap-3 px-5 py-6">
              <div className="text-muted-soft">
                <Music size={20} strokeWidth={1.75} />
              </div>
              <p className="text-sm text-muted">ไม่มีกิจกรรมในวันนี้</p>
            </div>
          ) : (
            <div className="divide-y divide-hairline-soft">
              {selectedPerf.map((p) => (
                <Link
                  key={p.id}
                  href={`/performances/${p.performance.id}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-surface-cream-strong transition-colors duration-[var(--duration-pb-base)] group"
                >
                  <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                      {p.performance.name}
                    </p>
                    {p.performance.location && (
                      <p className="text-xs text-muted mt-0.5">
                        {p.performance.location}
                      </p>
                    )}
                    {(p.startTime || p.endTime) && (
                      <p className="text-xs text-muted-soft mt-0.5">
                        {p.startTime}
                        {p.startTime && p.endTime ? "–" : ""}
                        {p.endTime} น.
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-primary bg-primary px-2 py-0.5 rounded-[var(--radius-pill)] shrink-0">
                    แสดง
                  </span>
                </Link>
              ))}

              {selectedPrac.map((p) => (
                <Link
                  key={p.id}
                  href={`/performances/${p.performanceId}/practice/${p.scheduleId}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-surface-cream-strong transition-colors duration-[var(--duration-pb-base)] group"
                >
                  <span className="mt-1 w-2 h-2 rounded-full border border-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                      {p.scheduleTitle}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{p.performanceName}</p>
                    {p.slots.length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-1">
                        {p.slots.map((s, i) => (
                          <p
                            key={i}
                            className="text-xs text-muted-soft inline-flex items-center gap-1"
                          >
                            <span>
                              {s.startTime}–{s.endTime} น.
                              {s.label ? ` · ${s.label}` : ""}
                            </span>
                            {s.isSpecial && (
                              <Star
                                size={12}
                                strokeWidth={1.75}
                                className="text-primary shrink-0"
                                aria-label="พิเศษ"
                              />
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary border border-primary/50 px-2 py-0.5 rounded-[var(--radius-pill)] shrink-0 inline-flex items-center gap-1">
                    <Users size={10} strokeWidth={1.75} />
                    ซ้อม
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
