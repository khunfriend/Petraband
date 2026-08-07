"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

type Props = {
  startTime: string;
  endTime: string;
  onChange: (start: string, end: string) => void;
  startLabel?: string;
  endLabel?: string;
  className?: string;
};

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function splitTime(t: string): { hh: string; mm: string } {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return { hh: "00", mm: "00" };
  const [hh, mm] = t.split(":");
  return { hh, mm };
}

function joinTime(hh: string, mm: string) {
  return `${hh}:${mm}`;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onChange,
  startLabel = "เริ่ม",
  endLabel = "สิ้นสุด",
  className,
}: Props) {
  const [openWhich, setOpenWhich] = useState<"start" | "end" | null>(null);
  const invalid = startTime && endTime && startTime >= endTime;

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <TimeRow
        label={startLabel}
        value={startTime}
        open={openWhich === "start"}
        onToggle={() => setOpenWhich((w) => (w === "start" ? null : "start"))}
        onChange={(t) => onChange(t, endTime)}
      />
      <TimeRow
        label={endLabel}
        value={endTime}
        open={openWhich === "end"}
        onToggle={() => setOpenWhich((w) => (w === "end" ? null : "end"))}
        onChange={(t) => onChange(startTime, t)}
      />
      {invalid && (
        <p className="text-xs text-error">เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม</p>
      )}
    </div>
  );
}

function TimeRow({
  label,
  value,
  open,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  onChange: (t: string) => void;
}) {
  const { hh, mm } = splitTime(value);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Clock size={14} strokeWidth={1.75} className="text-muted" />
          <span>{label}</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={[
            "px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-semibold tabular-nums transition-colors",
            open
              ? "bg-primary text-white"
              : "bg-primary/10 text-primary hover:bg-primary/15",
          ].join(" ")}
        >
          {value || "--:--"}
        </button>
      </div>

      {open && (
        <div className="mt-2 border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card p-3">
          <div className="flex items-stretch justify-center gap-2 relative">
            <WheelColumn
              values={HOURS}
              selected={hh}
              onChange={(next) => onChange(joinTime(next, mm))}
            />
            <div className="flex items-center text-lg font-bold text-ink">:</div>
            <WheelColumn
              values={MINUTES}
              selected={mm}
              onChange={(next) => onChange(joinTime(hh, next))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function WheelColumn({
  values,
  selected,
  onChange,
}: {
  values: string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressScrollRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = values.indexOf(selected);
    if (idx < 0) return;
    const target = idx * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) {
      suppressScrollRef.current = true;
      el.scrollTop = target;
      setTimeout(() => {
        suppressScrollRef.current = false;
      }, 50);
    }
  }, [selected, values]);

  function handleScroll() {
    if (suppressScrollRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      const next = values[clamped];
      if (next && next !== selected) onChange(next);
    }, 90);
  }

  const centerPad = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

  return (
    <div className="relative w-16" style={{ height: WHEEL_HEIGHT }}>
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-[var(--radius-md)] bg-surface-cream-strong pointer-events-none"
        style={{ height: ITEM_HEIGHT }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
        style={{
          scrollbarWidth: "none",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 20%, black 40%, black 60%, rgba(0,0,0,0.4) 80%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 20%, black 40%, black 60%, rgba(0,0,0,0.4) 80%, transparent 100%)",
        }}
      >
        <style>{`
          .scrollbar-none::-webkit-scrollbar { display: none; }
        `}</style>
        <div style={{ height: centerPad }} />
        {values.map((v) => {
          const isSelected = v === selected;
          return (
            <div
              key={v}
              className={[
                "flex items-center justify-center snap-center tabular-nums transition-colors",
                isSelected ? "text-ink font-bold text-xl" : "text-muted font-medium text-base",
              ].join(" ")}
              style={{ height: ITEM_HEIGHT }}
              onClick={() => onChange(v)}
            >
              {v}
            </div>
          );
        })}
        <div style={{ height: centerPad }} />
      </div>
    </div>
  );
}
