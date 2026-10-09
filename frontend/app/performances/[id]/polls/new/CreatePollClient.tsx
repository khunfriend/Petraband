"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateRowPicker } from "@/components/ui/DateRowPicker";
import { cellsForRange } from "@/lib/pollGrid";

type Props = {
  performanceId: string;
  performanceName: string;
  performanceDates: string[];
};

// Whole hours only, like when2meet's "no earlier than / no later than".
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

function formatDateThai(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CreatePollClient({ performanceId, performanceName, performanceDates }: Props) {
  const router = useRouter();
  const [todayStr] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10));
  const [name, setName] = useState(`โพลตารางว่าง ${performanceName}`);
  const [deadline, setDeadline] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [fromTime, setFromTime] = useState("10:00");
  const [toTime, setToTime] = useState("21:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Allow selecting any day up to and including the last performance day
  const maxPerformanceDate =
    performanceDates.length > 0 ? performanceDates[performanceDates.length - 1] : null;
  const selectedDateSet = useMemo(() => new Set(dates), [dates]);
  const cellsPerDay = cellsForRange(fromTime, toTime).length;

  function toggleDate(iso: string) {
    setDates((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort()));
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("กรุณาใส่ชื่อโพล"); return; }
    if (dates.length === 0) { setError("กรุณาเลือกอย่างน้อย 1 วัน"); return; }
    if (cellsPerDay === 0) { setError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม"); return; }
    const past = dates.find((d) => d < todayStr);
    if (past) { setError(`ห้ามสร้างโพลย้อนหลัง (${formatDateThai(past)})`); return; }
    const cells = cellsForRange(fromTime, toTime);
    const flatSlots = dates.flatMap((date) => cells.map((c) => ({ date, ...c })));

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
        <h2 className="text-sm font-bold text-muted mb-3">ชื่อโพล</h2>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อโพล" />
      </div>

      <div>
        <h2 className="text-sm font-bold text-muted mb-3">
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
          <h2 className="text-sm font-bold text-muted">เลือกวันที่เป็นไปได้</h2>
          {maxPerformanceDate && (
            <p className="text-xs text-muted-soft">
              เลือกได้ถึงวันแสดง ({new Date(maxPerformanceDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })})
            </p>
          )}
        </div>
        <DateRowPicker
          mode="multi"
          selected={selectedDateSet}
          onToggle={toggleDate}
          minDate={todayStr}
          maxDate={maxPerformanceDate}
        />
      </div>

      <div>
        <h2 className="text-sm font-bold text-muted mb-3">ช่วงเวลา</h2>
        <div className="flex items-center gap-2 text-sm text-ink">
          <select
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3 tabular-nums focus:outline-none focus:border-primary"
          >
            {HOUR_OPTIONS.slice(0, -1).map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="text-muted">ถึง</span>
          <select
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3 tabular-nums focus:outline-none focus:border-primary"
          >
            {HOUR_OPTIONS.slice(1).map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <p className="mt-2 text-xs text-muted-soft">
          {cellsPerDay > 0
            ? `สมาชิกลากเลือกช่วงที่ว่างได้ทีละ 30 นาที${dates.length > 0 ? ` · ${dates.length} วัน` : ""}`
            : "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม"}
        </p>
      </div>

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
