"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateRowPicker } from "@/components/ui/DateRowPicker";

type Props = {
  performanceId: string;
  performanceName: string;
  performanceDates: string[];
};

const timeField =
  "h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3 text-sm text-ink tabular-nums focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15";

function formatDateThai(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Quick start: name, place, days and one time range for all of them.
 * Per-day changes (extra slots, details, other rooms) happen on the practice page.
 */
export default function CreatePracticeScheduleClient({ performanceId, performanceName, performanceDates }: Props) {
  const router = useRouter();
  const [todayStr] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10));
  const [title, setTitle] = useState(`ตารางซ้อม ${performanceName}`);
  const [location, setLocation] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("20:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Rehearsals can run up to the last show day (run-throughs on the day).
  const lastPerformanceDate = performanceDates.at(-1) ?? null;
  const selectedDateSet = useMemo(() => new Set(dates), [dates]);

  function toggleDate(iso: string) {
    setDates((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort()));
  }

  async function handleSubmit() {
    setError("");
    if (!title.trim()) return setError("กรุณาใส่ชื่อตาราง");
    if (dates.length === 0) return setError("กรุณาเลือกอย่างน้อย 1 วัน");
    if (!startTime || !endTime || startTime >= endTime) return setError("เวลาจบต้องหลังเวลาเริ่ม");
    const past = dates.find((d) => d < todayStr);
    if (past) return setError(`ห้ามสร้างตารางย้อนหลัง (${formatDateThai(past)})`);

    setSubmitting(true);
    try {
      const res = await fetch("/api/practice-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          performanceId,
          title: title.trim(),
          location: location.trim(),
          days: dates.map((date) => ({ date, slots: [{ startTime, endTime }] })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "สร้างตารางไม่สำเร็จ");
        return;
      }
      const data = await res.json();
      router.push(`/performances/${performanceId}/practice#schedule-${data.schedule.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="ชื่อ" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ซ้อมรวม" />
        <Input label="สถานที่" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ไม่บังคับ" />
      </div>

      <div>
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="text-sm font-bold text-muted">เลือกวันซ้อม</h2>
          {lastPerformanceDate && (
            <p className="text-xs text-muted-soft">ถึงวันแสดง ({formatDateThai(lastPerformanceDate)})</p>
          )}
        </div>
        <DateRowPicker
          mode="multi"
          selected={selectedDateSet}
          onToggle={toggleDate}
          minDate={todayStr}
          maxDate={lastPerformanceDate}
        />
      </div>

      <div>
        <h2 className="text-sm font-bold text-muted mb-3">เวลา</h2>
        <div className="flex items-center gap-2">
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={timeField} />
          <span className="text-muted">ถึง</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={timeField} />
        </div>
        <p className="mt-2 text-xs text-muted-soft">
          ใช้กับทุกวันที่เลือก{dates.length > 0 ? ` (${dates.length} วัน)` : ""} เพิ่มช่วงหรือแก้รายวันได้หลังสร้าง
        </p>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "กำลังสร้าง..." : "สร้างตาราง"}
        </Button>
        <Button variant="secondary" onClick={() => router.back()} disabled={submitting}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
