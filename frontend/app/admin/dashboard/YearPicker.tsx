"use client";

import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";

/** Which band year (1 June – 31 May) the dashboard counts. */
export default function YearPicker({ year, options }: { year: number; options: { value: number; label: string }[] }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <CalendarRange size={16} strokeWidth={1.75} className="text-muted" />
      <span className="text-muted">ช่วงเวลา</span>
      <select
        value={year}
        onChange={(e) => router.push(`/admin/dashboard?year=${e.target.value}`)}
        className="h-9 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3 font-medium text-ink outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-soft">นับงานแสดงและการเช็คชื่อในรอบปีนี้ (เริ่ม 1 มิ.ย.)</span>
    </div>
  );
}
