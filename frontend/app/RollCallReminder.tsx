import Link from "next/link";
import { BellRing, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { bangkokTodayStr } from "@/lib/today";

/**
 * Admin-only home card: today is a roll-call day ("วันเช็คชื่อ", booked on the
 * practice page) and not everyone in the lineup has been marked yet.
 */
export async function RollCallReminder() {
  const today = new Date(bangkokTodayStr());
  const days = await prisma.practiceDay.findMany({
    where: { date: today, attendanceOpenedAt: { not: null } },
    select: {
      id: true,
      _count: { select: { attendances: true } },
      schedule: {
        select: {
          title: true,
          performance: { select: { id: true, name: true, members: { select: { userId: true } } } },
        },
      },
    },
  });

  const due = days
    .map((d) => {
      const lineup = new Set(d.schedule.performance.members.map((m) => m.userId)).size;
      return { ...d, lineup, marked: d._count.attendances };
    })
    .filter((d) => d.lineup === 0 || d.marked < d.lineup);
  if (due.length === 0) return null;

  return (
    <section className="flex flex-col gap-2" aria-label="แจ้งเตือนเช็คชื่อ">
      {due.map((d) => (
        <Link
          key={d.id}
          href={`/performances/${d.schedule.performance.id}/practice/attendance/${d.id}`}
          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-coral/40 bg-coral-100 px-4 py-3 hover:border-coral"
        >
          <BellRing size={20} strokeWidth={1.75} className="shrink-0 text-coral" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">วันนี้ต้องเช็คชื่อ</p>
            <p className="text-xs text-body truncate">
              {d.schedule.performance.name} · {d.schedule.title} · เช็คแล้ว {d.marked}/{d.lineup} คน
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-coral-700">เช็คชื่อ</span>
          <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-coral-700" />
        </Link>
      ))}
    </section>
  );
}
