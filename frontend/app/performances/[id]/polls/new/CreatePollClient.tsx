"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Slot = { startTime: string; endTime: string };
type DayEntry = { date: string; slots: Slot[] };

type Props = {
  performanceId: string;
  performanceName: string;
  performanceDates: string[];
};

const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const PRESET_SLOTS: { label: string; startTime: string; endTime: string }[] = [
  { label: "10:00–12:00", startTime: "10:00", endTime: "12:00" },
  { label: "14:00–17:00", startTime: "14:00", endTime: "17:00" },
  { label: "17:00–20:00", startTime: "17:00", endTime: "20:00" },
];

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function emptySlot(): Slot {
  return { startTime: "", endTime: "" };
}

function formatDateThai(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DatePickerCalendar({
  selectedDates,
  onToggle,
  maxDateISO,
}: {
  selectedDates: Set<string>;
  onToggle: (iso: string) => void;
  maxDateISO: string | null;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

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
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-surface-cream-strong transition-colors text-muted hover:text-ink text-lg"
        >
          ‹
        </button>
        <p className="text-sm font-bold text-ink">{monthLabel}</p>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-surface-cream-strong transition-colors text-muted hover:text-ink text-lg"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-hairline-soft">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold text-muted">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const selected = selectedDates.has(cell.iso);
          const isToday = cell.iso === todayISO;
          const isAfterPerformance = maxDateISO !== null && cell.iso > maxDateISO;
          const isBeforeToday = cell.iso < todayISO;
          const disabled = !cell.current || isAfterPerformance || isBeforeToday;

          return (
            <button
              key={cell.iso + i}
              type="button"
              onClick={() => !disabled && onToggle(cell.iso)}
              disabled={disabled}
              title={
                isBeforeToday
                  ? "ก่อนวันนี้ เลือกไม่ได้"
                  : isAfterPerformance
                    ? "หลังวันแสดง เลือกไม่ได้"
                    : undefined
              }
              className={[
                "h-10 text-sm font-medium transition-colors relative flex items-center justify-center border-b border-r border-hairline-soft",
                disabled
                  ? "text-muted-soft cursor-default bg-surface-soft opacity-40"
                  : selected
                    ? "bg-primary text-white hover:bg-primary-active"
                    : "hover:bg-surface-cream-strong text-ink",
                isToday && !selected && !disabled ? "font-extrabold text-coral" : "",
              ].join(" ")}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-2.5 border-t border-hairline-soft flex items-center gap-2">
        <span className="w-4 h-4 rounded-sm bg-primary inline-block shrink-0" />
        <span className="text-xs text-muted">วันที่เลือก</span>
        <span className="ml-auto text-xs text-muted font-semibold">
          {selectedDates.size > 0 ? `เลือกแล้ว ${selectedDates.size} วัน` : "คลิกเพื่อเลือกวัน"}
        </span>
      </div>
    </div>
  );
}

export default function CreatePollClient({ performanceId, performanceName, performanceDates }: Props) {
  const router = useRouter();
  const [name, setName] = useState(`โพลตารางว่าง ${performanceName}`);
  const [deadline, setDeadline] = useState("");
  const [days, setDays] = useState<DayEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Allow selecting any day up to and including the last performance day
  const maxPerformanceDate =
    performanceDates.length > 0 ? performanceDates[performanceDates.length - 1] : null;
  const selectedDateSet = useMemo(() => new Set(days.map((d) => d.date)), [days]);

  function toggleDate(iso: string) {
    if (selectedDateSet.has(iso)) {
      setDays((prev) => prev.filter((d) => d.date !== iso));
    } else {
      const defaultSlots = PRESET_SLOTS.map((p) => ({ startTime: p.startTime, endTime: p.endTime }));
      setDays((prev) =>
        [...prev, { date: iso, slots: defaultSlots }].sort((a, b) => a.date.localeCompare(b.date))
      );
    }
  }
  function removeDay(date: string) {
    setDays((prev) => prev.filter((d) => d.date !== date));
  }
  function togglePreset(dayIndex: number, preset: (typeof PRESET_SLOTS)[number]) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const exists = d.slots.some((s) => s.startTime === preset.startTime && s.endTime === preset.endTime);
        if (exists) {
          return { ...d, slots: d.slots.filter((s) => !(s.startTime === preset.startTime && s.endTime === preset.endTime)) };
        }
        const newSlot: Slot = { startTime: preset.startTime, endTime: preset.endTime };
        const sorted = [...d.slots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime));
        return { ...d, slots: sorted };
      })
    );
  }
  function addCustomSlot(dayIndex: number) {
    setDays((prev) => prev.map((d, i) => (i === dayIndex ? { ...d, slots: [...d.slots, emptySlot()] } : d)));
  }
  function removeSlot(dayIndex: number, slotIndex: number) {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, slots: d.slots.filter((_, j) => j !== slotIndex) } : d))
    );
  }
  function updateSlot(dayIndex: number, slotIndex: number, field: keyof Slot, value: string) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, slots: d.slots.map((s, j) => (j === slotIndex ? { ...s, [field]: value } : s)) }
          : d
      )
    );
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("กรุณาใส่ชื่อโพล"); return; }
    if (days.length === 0) { setError("กรุณาเลือกอย่างน้อย 1 วัน"); return; }
    const todayStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
    const flatSlots: { date: string; startTime: string; endTime: string }[] = [];
    for (const day of days) {
      if (day.date < todayStr) { setError(`ห้ามสร้างโพลย้อนหลัง (${formatDateThai(day.date)})`); return; }
      if (day.slots.length === 0) { setError(`กรุณาเพิ่มช่วงเวลาสำหรับ ${formatDateThai(day.date)}`); return; }
      for (const s of day.slots) {
        if (!s.startTime || !s.endTime) { setError("กรุณากรอกเวลาให้ครบทุกช่วง"); return; }
        flatSlots.push({ date: day.date, startTime: s.startTime, endTime: s.endTime });
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/performances/${performanceId}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), deadline: deadline || null, slots: flatSlots }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "สร้างโพลไม่สำเร็จ");
        return;
      }
      const data = await res.json();
      router.push(`/polls/${data.pollId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h2 className="text-sm font-bold tracking-[1.5px] uppercase text-muted mb-3">ชื่อโพล</h2>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อโพล" />
      </div>

      <div>
        <h2 className="text-sm font-bold tracking-[1.5px] uppercase text-muted mb-3">
          หมดเขตกดว่าง <span className="text-muted-soft text-xs font-normal normal-case tracking-normal">(ไม่บังคับ)</span>
        </h2>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
        />
      </div>

      <div>
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="text-sm font-bold tracking-[1.5px] uppercase text-muted">เลือกวันที่เป็นไปได้</h2>
          {maxPerformanceDate && (
            <p className="text-xs text-muted-soft">
              เลือกได้ถึงวันแสดง ({new Date(maxPerformanceDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })})
            </p>
          )}
        </div>
        <DatePickerCalendar selectedDates={selectedDateSet} onToggle={toggleDate} maxDateISO={maxPerformanceDate} />
      </div>

      {days.length > 0 && (
        <div>
          <h2 className="text-sm font-bold tracking-[1.5px] uppercase text-muted mb-3">ช่วงเวลาต่อวัน</h2>
          <div className="flex flex-col gap-4">
            {days.map((day, dayIndex) => (
              <div
                key={day.date}
                className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-soft bg-primary/5">
                  <p className="text-sm font-semibold text-ink">{formatDateThai(day.date)}</p>
                  <button
                    type="button"
                    onClick={() => removeDay(day.date)}
                    className="text-muted hover:text-error transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-muted mb-2">เลือกช่วงเวลา</p>
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_SLOTS.map((preset) => {
                        const active = day.slots.some(
                          (s) => s.startTime === preset.startTime && s.endTime === preset.endTime
                        );
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => togglePreset(dayIndex, preset)}
                            className={`px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)] border transition-colors ${
                              active
                                ? "bg-primary text-white border-primary"
                                : "bg-canvas text-ink border-hairline hover:bg-surface-cream-strong hover:border-primary/40"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {day.slots.some((s) => !PRESET_SLOTS.some((p) => p.startTime === s.startTime && p.endTime === s.endTime)) && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted">ช่วงเวลากำหนดเอง</p>
                      {day.slots.map((slot, slotIndex) => {
                        const isPreset = PRESET_SLOTS.some((p) => p.startTime === slot.startTime && p.endTime === slot.endTime);
                        if (isPreset) return null;
                        return (
                          <div key={slotIndex} className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-ink bg-surface-cream-strong px-3 py-1.5 rounded-[var(--radius-md)] shrink-0 border border-hairline-soft">
                              {slot.startTime && slot.endTime ? `${slot.startTime}–${slot.endTime}` : "กำหนดเวลา"}
                            </span>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateSlot(dayIndex, slotIndex, "startTime", e.target.value)}
                              className="px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                            />
                            <span className="text-muted text-sm">–</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateSlot(dayIndex, slotIndex, "endTime", e.target.value)}
                              className="px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                            />
                            <button
                              type="button"
                              onClick={() => removeSlot(dayIndex, slotIndex)}
                              className="text-muted hover:text-error transition-colors text-base leading-none"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Button variant="secondary" size="sm" onClick={() => addCustomSlot(dayIndex)} className="self-start">
                    + เพิ่มช่วงเวลาอื่น
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "กำลังสร้าง..." : "สร้างโพล"}
        </Button>
        <Button variant="secondary" onClick={() => router.back()} disabled={submitting}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
