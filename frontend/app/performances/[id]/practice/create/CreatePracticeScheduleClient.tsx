"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateRowPicker } from "@/components/ui/DateRowPicker";
import { TimeRangePicker } from "@/components/ui/TimeRangePicker";

type Member = {
  id: string;
  nickname: string;
  generation: string;
  primaryInstrument: { name: string; nameThai: string } | null;
};

type Slot = { startTime: string; endTime: string; label: string; isSpecial: boolean };
type DayEntry = { date: string; slots: Slot[] };

type Props = {
  performanceId: string;
  performanceName: string;
  members: Member[];
  performanceDates: string[];
};

const PRESET_SLOTS: { label: string; startTime: string; endTime: string }[] = [
  { label: "10:00–12:00", startTime: "10:00", endTime: "12:00" },
  { label: "14:00–17:00", startTime: "14:00", endTime: "17:00" },
  { label: "17:00–20:00", startTime: "17:00", endTime: "20:00" },
];

function emptySlot(): Slot {
  return { startTime: "", endTime: "", label: "", isSpecial: false };
}

function formatDateThai(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CreatePracticeScheduleClient({ performanceId, performanceName, performanceDates }: Props) {
  const router = useRouter();
  const [todayStr] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10));
  const [title, setTitle] = useState(`ตารางซ้อม ${performanceName}`);
  const [days, setDays] = useState<DayEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // วันซ้อมต้องก่อนวันแสดงวันแรก
  const minPerformanceDate = performanceDates.length > 0 ? performanceDates[0] : null;

  const selectedDateSet = useMemo(() => new Set(days.map((d) => d.date)), [days]);

  function toggleDate(iso: string) {
    if (selectedDateSet.has(iso)) {
      setDays((prev) => prev.filter((d) => d.date !== iso));
    } else {
      const defaultSlots = PRESET_SLOTS.map((p) => ({
        startTime: p.startTime,
        endTime: p.endTime,
        label: "",
        isSpecial: false,
      }));
      setDays((prev) =>
        [...prev, { date: iso, slots: defaultSlots }].sort((a, b) =>
          a.date.localeCompare(b.date)
        )
      );
    }
  }

  function removeDay(date: string) {
    setDays((prev) => prev.filter((d) => d.date !== date));
  }

  function togglePreset(dayIndex: number, preset: typeof PRESET_SLOTS[number]) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const exists = d.slots.some(
          (s) => s.startTime === preset.startTime && s.endTime === preset.endTime
        );
        if (exists) {
          return { ...d, slots: d.slots.filter((s) => !(s.startTime === preset.startTime && s.endTime === preset.endTime)) };
        }
        const newSlot: Slot = { startTime: preset.startTime, endTime: preset.endTime, label: "", isSpecial: false };
        const sorted = [...d.slots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime));
        return { ...d, slots: sorted };
      })
    );
  }

  function addCustomSlot(dayIndex: number) {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, slots: [...d.slots, emptySlot()] } : d))
    );
  }

  function removeSlot(dayIndex: number, slotIndex: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, slots: d.slots.filter((_, j) => j !== slotIndex) } : d
      )
    );
  }

  function updateSlot(dayIndex: number, slotIndex: number, field: keyof Slot, value: string | boolean) {
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
    if (!title.trim()) { setError("กรุณาใส่ชื่อตาราง"); return; }
    if (days.length === 0) { setError("กรุณาเลือกอย่างน้อย 1 วัน"); return; }
    const todayStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
    for (const day of days) {
      if (day.date < todayStr) { setError(`ห้ามสร้างตารางย้อนหลัง (${formatDateThai(day.date)})`); return; }
      if (day.slots.length === 0) { setError(`กรุณาเพิ่มช่วงเวลาสำหรับ ${formatDateThai(day.date)}`); return; }
      for (const slot of day.slots) {
        if (!slot.startTime || !slot.endTime) { setError("กรุณากรอกเวลาให้ครบทุกช่วง"); return; }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/practice-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performanceId, title: title.trim(), days, groups: [] }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "เกิดข้อผิดพลาด");
        return;
      }

      const data = await res.json();
      router.push(`/performances/${performanceId}/practice/${data.schedule.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Section 1: ชื่อตาราง */}
      <div>
        <h2 className="text-sm font-bold tracking-[1.5px] uppercase text-muted mb-3">ชื่อตาราง</h2>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ชื่อตารางซ้อม"
        />
      </div>

      {/* Section 2: เลือกวันจากปฏิทิน */}
      <div>
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="text-sm font-bold tracking-[1.5px] uppercase text-muted">เลือกวันซ้อม</h2>
          {minPerformanceDate && (
            <p className="text-xs text-muted-soft">
              เลือกได้ถึงวันแสดง ({new Date(minPerformanceDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })})
            </p>
          )}
        </div>
        <DateRowPicker
          mode="multi"
          selected={selectedDateSet}
          onToggle={toggleDate}
          minDate={todayStr}
          maxDate={minPerformanceDate}
        />
      </div>

      {/* Section 3: กำหนดช่วงเวลาต่อวัน */}
      {days.length > 0 && (
        <div>
          <h2 className="text-sm font-bold tracking-[1.5px] uppercase text-muted mb-3">
            ช่วงเวลาต่อวัน
          </h2>
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
                  {/* Preset chips */}
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

                  {/* Custom slots only — presets need no extra config */}
                  {day.slots.some((s) => !PRESET_SLOTS.some((p) => p.startTime === s.startTime && p.endTime === s.endTime)) && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted">ตั้งค่าแต่ละช่วง</p>
                      {day.slots.map((slot, slotIndex) => {
                        const isPreset = PRESET_SLOTS.some((p) => p.startTime === slot.startTime && p.endTime === slot.endTime);
                        if (isPreset) return null;
                        return (
                          <div key={slotIndex} className="flex flex-col gap-2 p-3 rounded-[var(--radius-md)] border border-hairline-soft bg-surface-soft">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted uppercase tracking-wider">ช่วงเวลา</span>
                              <button
                                type="button"
                                onClick={() => removeSlot(dayIndex, slotIndex)}
                                className="text-muted hover:text-error transition-colors text-base leading-none"
                              >
                                ×
                              </button>
                            </div>
                            <TimeRangePicker
                              startTime={slot.startTime}
                              endTime={slot.endTime}
                              onChange={(s, e) => {
                                updateSlot(dayIndex, slotIndex, "startTime", s);
                                updateSlot(dayIndex, slotIndex, "endTime", e);
                              }}
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                type="text"
                                value={slot.label}
                                onChange={(e) => updateSlot(dayIndex, slotIndex, "label", e.target.value)}
                                placeholder="ชื่อช่วง (เช่น ซ้อมรวม + อัดเสียง)"
                                className="flex-1 min-w-[140px] px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                              />
                              <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  checked={slot.isSpecial}
                                  onChange={(e) => updateSlot(dayIndex, slotIndex, "isSpecial", e.target.checked)}
                                  className="accent-coral"
                                />
                                พิเศษ
                              </label>
                            </div>
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

      {error && <p className="text-sm text-coral">{error}</p>}

      <div className="flex gap-3">
        <Button variant="coral" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "กำลังสร้าง..." : "สร้างตารางซ้อม"}
        </Button>
        <Button variant="secondary" onClick={() => router.back()} disabled={submitting}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
