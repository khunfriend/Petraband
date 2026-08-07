"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "./Modal";

type CommonProps = {
  minDate?: string | null;
  maxDate?: string | null;
  windowSize?: number;
  className?: string;
};

type SingleProps = CommonProps & {
  mode: "single";
  value: string | null;
  onChange: (iso: string) => void;
};

type MultiProps = CommonProps & {
  mode: "multi";
  selected: Set<string>;
  onToggle: (iso: string) => void;
};

type Props = SingleProps | MultiProps;

const DAY_LABELS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function todayISOBangkok() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDaysISO(iso: string, days: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}

function weekdayShortEn(iso: string) {
  return parseISO(iso).toLocaleDateString("en-US", { weekday: "short" });
}

export function DateRowPicker(props: Props) {
  const {
    minDate = null,
    maxDate = null,
    windowSize = 5,
    className,
  } = props;

  const isSelected = (iso: string) =>
    props.mode === "single" ? props.value === iso : props.selected.has(iso);

  const anySelected: string | null =
    props.mode === "single"
      ? props.value
      : props.selected.size > 0
        ? [...props.selected].sort()[0]
        : null;

  const today = todayISOBangkok();
  const initialAnchor = anySelected ?? (minDate && minDate > today ? minDate : today);
  const [anchor, setAnchor] = useState<string>(initialAnchor);
  const [trackedSelected, setTrackedSelected] = useState<string | null>(anySelected);
  const [calendarOpen, setCalendarOpen] = useState(false);

  if (anySelected !== trackedSelected) {
    setTrackedSelected(anySelected);
    if (anySelected && (anySelected < anchor || anySelected >= addDaysISO(anchor, windowSize))) {
      setAnchor(anySelected);
    }
  }

  const windowDates = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < windowSize; i++) arr.push(addDaysISO(anchor, i));
    return arr;
  }, [anchor, windowSize]);

  const isDisabled = (iso: string) =>
    (minDate !== null && iso < minDate) || (maxDate !== null && iso > maxDate);

  function handlePick(iso: string) {
    if (isDisabled(iso)) return;
    if (props.mode === "single") props.onChange(iso);
    else props.onToggle(iso);
  }

  function shiftBy(delta: number) {
    const next = addDaysISO(anchor, delta);
    if (minDate !== null && delta < 0 && next < minDate) {
      setAnchor(minDate);
      return;
    }
    if (maxDate !== null && delta > 0) {
      const lastVisible = addDaysISO(next, windowSize - 1);
      if (lastVisible > maxDate) {
        const capped = addDaysISO(maxDate, -(windowSize - 1));
        setAnchor(minDate !== null && capped < minDate ? minDate : capped);
        return;
      }
    }
    setAnchor(next);
  }

  const canShiftLeft = minDate === null || anchor > minDate;
  const canShiftRight =
    maxDate === null || addDaysISO(anchor, windowSize - 1) < maxDate;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Calendar size={14} strokeWidth={1.75} className="text-muted" />
          <span>Date</span>
        </div>
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="text-xs font-medium text-primary hover:underline"
        >
          View calendar
        </button>
      </div>

      <div className="flex items-stretch gap-1.5">
        <button
          type="button"
          onClick={() => shiftBy(-windowSize)}
          disabled={!canShiftLeft}
          aria-label="ก่อนหน้า"
          className="w-7 shrink-0 rounded-[var(--radius-md)] border border-hairline-soft flex items-center justify-center text-muted hover:text-ink hover:bg-surface-cream-strong transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </button>

        <div className="grid flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${windowSize}, minmax(0, 1fr))` }}>
          {windowDates.map((iso) => {
            const disabled = isDisabled(iso);
            const selected = isSelected(iso);
            const dayNum = Number(iso.slice(-2));
            return (
              <button
                key={iso}
                type="button"
                onClick={() => handlePick(iso)}
                disabled={disabled}
                title={
                  disabled
                    ? minDate !== null && iso < minDate
                      ? "ก่อนวันนี้ เลือกไม่ได้"
                      : "เกินช่วงที่เลือกได้"
                    : undefined
                }
                className={[
                  "flex flex-col items-center justify-center gap-0.5 py-2 rounded-[var(--radius-md)] border-2 transition-colors",
                  disabled
                    ? "border-hairline-soft bg-surface-soft opacity-40 cursor-not-allowed"
                    : selected
                      ? "border-primary bg-primary/5 text-ink"
                      : "border-hairline-soft bg-surface-card hover:border-primary/40 text-ink",
                ].join(" ")}
              >
                <span className={`text-[11px] font-medium ${selected ? "text-primary" : "text-muted"}`}>
                  {weekdayShortEn(iso)}
                </span>
                <span className={`text-base font-bold ${selected ? "text-primary" : "text-ink"}`}>
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => shiftBy(windowSize)}
          disabled={!canShiftRight}
          aria-label="ถัดไป"
          className="w-7 shrink-0 rounded-[var(--radius-md)] border border-hairline-soft flex items-center justify-center text-muted hover:text-ink hover:bg-surface-cream-strong transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} strokeWidth={1.75} />
        </button>
      </div>

      <Modal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="เลือกวันที่"
        size="sm"
      >
        <FullCalendar
          selected={props.mode === "single" ? (props.value ? new Set([props.value]) : new Set()) : props.selected}
          onPick={(iso) => {
            handlePick(iso);
            if (props.mode === "single") setCalendarOpen(false);
          }}
          minDate={minDate}
          maxDate={maxDate}
          initialFocus={anchor}
        />
      </Modal>
    </div>
  );
}

function FullCalendar({
  selected,
  onPick,
  minDate,
  maxDate,
  initialFocus,
}: {
  selected: Set<string>;
  onPick: (iso: string) => void;
  minDate: string | null;
  maxDate: string | null;
  initialFocus: string;
}) {
  const focusDate = parseISO(initialFocus);
  const [year, setYear] = useState(focusDate.getFullYear());
  const [month, setMonth] = useState(focusDate.getMonth());
  const today = todayISOBangkok();

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const result: { iso: string; day: number; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      result.push({ iso: toISO(y, m, d), day: d, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ iso: toISO(year, month, d), day: d, current: true });
    }
    const rem = 42 - result.length;
    for (let d = 1; d <= rem; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      result.push({ iso: toISO(y, m, d), day: d, current: false });
    }
    return result;
  }, [year, month]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden select-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-soft">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-surface-cream-strong transition-colors text-muted hover:text-ink"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
        </button>
        <p className="text-sm font-bold text-ink">{monthLabel}</p>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-surface-cream-strong transition-colors text-muted hover:text-ink"
        >
          <ChevronRight size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-hairline-soft">
        {DAY_LABELS_TH.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold text-muted">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isSel = selected.has(cell.iso);
          const isToday = cell.iso === today;
          const beyondMax = maxDate !== null && cell.iso > maxDate;
          const beforeMin = minDate !== null && cell.iso < minDate;
          const disabled = !cell.current || beyondMax || beforeMin;

          return (
            <button
              key={cell.iso + i}
              type="button"
              onClick={() => !disabled && onPick(cell.iso)}
              disabled={disabled}
              title={
                beforeMin
                  ? "ก่อนวันที่กำหนด เลือกไม่ได้"
                  : beyondMax
                    ? "หลังวันที่กำหนด เลือกไม่ได้"
                    : undefined
              }
              className={[
                "h-10 text-sm font-medium transition-colors flex items-center justify-center border-b border-r border-hairline-soft",
                disabled
                  ? "text-muted-soft cursor-default bg-surface-soft opacity-40"
                  : isSel
                    ? "bg-primary text-white hover:bg-primary-active"
                    : "hover:bg-surface-cream-strong text-ink",
                isToday && !isSel && !disabled ? "font-extrabold text-coral" : "",
              ].join(" ")}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
