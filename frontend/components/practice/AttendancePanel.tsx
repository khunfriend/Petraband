"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { attendanceDayLabel } from "@/lib/attendance";

export type AttendanceDay = {
  id: string;
  /** "YYYY-MM-DD" */
  date: string;
  scheduleTitle: string;
  opened: boolean;
  counts: { PRESENT: number; LATE: number; EXCUSED: number; ABSENT: number };
};

/**
 * "เช็คชื่อ" box on the practice page. Roll call isn't taken every day: a
 * head/admin presses "เช็คชื่อวันนี้" (or picks another day), and only those
 * days get an attendance sheet.
 */
export function AttendancePanel({
  performanceId,
  days,
  today,
  lineupSize,
  canEdit,
}: {
  performanceId: string;
  /** Every practice day of the performance, in date order. */
  days: AttendanceDay[];
  today: string;
  lineupSize: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const todays = days.filter((d) => d.date === today);
  const others = days.filter((d) => d.date !== today && !d.opened);
  // Default to the next practice day (to plan ahead), else the latest past one.
  const [otherDay, setOtherDay] = useState((others.find((d) => d.date > today) ?? others.at(-1))?.id ?? "");
  const otherIsFuture = (others.find((d) => d.id === otherDay)?.date ?? "") > today;
  const checked = days.filter((d) => d.opened).reverse();
  const href = (dayId: string) => `/performances/${performanceId}/practice/attendance/${dayId}`;

  /** Today/past: open the sheet. Future: book it — admins get a reminder that day. */
  async function open(dayId: string, future = false) {
    setBusy(true);
    const res = await fetch(`/api/practice-days/${dayId}/attendance`, { method: "POST" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return toast.error("เปิดเช็คชื่อไม่สำเร็จ");
    if (future) {
      toast.success("ตั้งวันเช็คชื่อแล้ว — วันนั้นแอดมินจะได้แจ้งเตือน");
      router.refresh();
    } else {
      router.push(href(dayId));
    }
  }

  if (!canEdit && checked.length === 0) return null;

  return (
    <section className="mb-6 rounded-[var(--radius-md)] border border-hairline bg-surface-card p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink flex-1">
          <ClipboardCheck size={18} strokeWidth={1.75} className="text-primary" />
          เช็คชื่อ
        </h2>
        {canEdit &&
          todays.map((d) =>
            d.opened ? (
              <Link key={d.id} href={href(d.id)}>
                <Button size="sm" variant="secondary">เปิดหน้าเช็คชื่อวันนี้{todays.length > 1 ? ` (${d.scheduleTitle})` : ""}</Button>
              </Link>
            ) : (
              <Button key={d.id} size="sm" variant="primary" disabled={busy} onClick={() => open(d.id)}>
                เช็คชื่อวันนี้{todays.length > 1 ? ` (${d.scheduleTitle})` : ""}
              </Button>
            ),
          )}
      </div>

      {canEdit && (todays.length === 0 || others.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {todays.length === 0 && <span>วันนี้ไม่มีซ้อม ·</span>}
          {others.length > 0 && (
            <>
              <span>ตั้งวันเช็คชื่อ / เช็คย้อนหลัง</span>
              <select
                value={otherDay}
                onChange={(e) => setOtherDay(e.target.value)}
                className="h-8 rounded-[var(--radius-sm)] border border-hairline bg-surface-soft px-2 text-sm text-ink"
              >
                {others.map((d) => (
                  <option key={d.id} value={d.id}>
                    {attendanceDayLabel(d.date)} · {d.scheduleTitle}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="secondary" disabled={busy || !otherDay} onClick={() => open(otherDay, otherIsFuture)}>
                {otherIsFuture ? "ตั้งเป็นวันเช็คชื่อ" : "เช็คชื่อ"}
              </Button>
            </>
          )}
        </div>
      )}

      {checked.length > 0 ? (
        <ul className="flex flex-col divide-y divide-hairline-soft">
          {checked.map((d) => {
            const marked = d.counts.PRESENT + d.counts.LATE + d.counts.EXCUSED + d.counts.ABSENT;
            return (
              <li key={d.id}>
                <Link href={href(d.id)} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm hover:text-primary">
                  <span className="font-medium text-ink w-40">{attendanceDayLabel(d.date)}</span>
                  <span className="text-xs text-muted flex-1">{d.scheduleTitle}</span>
                  {d.date > today ? (
                    <span className="text-xs text-primary">นัดเช็คชื่อ</span>
                  ) : (
                  <span className="text-xs tabular-nums text-body">
                    มา {d.counts.PRESENT} · สาย {d.counts.LATE} · ลา {d.counts.EXCUSED} · ขาด {d.counts.ABSENT}
                    {lineupSize > marked && <span className="text-muted-soft"> · ยังไม่เช็ค {lineupSize - marked}</span>}
                  </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-soft">ยังไม่มีวันที่เช็คชื่อ — กด &quot;เช็คชื่อวันนี้&quot; ในวันที่ต้องการเช็ค</p>
      )}
    </section>
  );
}
