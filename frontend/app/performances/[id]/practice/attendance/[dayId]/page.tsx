import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { attendanceDayLabel } from "@/lib/attendance";
import AttendanceClient from "./AttendanceClient";

type Params = { params: Promise<{ id: string; dayId: string }> };

export default async function AttendancePage({ params }: Params) {
  const { id, dayId } = await params;
  const session = await auth();

  const day = await prisma.practiceDay.findUnique({
    where: { id: dayId },
    select: {
      id: true,
      date: true,
      attendanceOpenedAt: true,
      schedule: { select: { title: true, performanceId: true, performance: { select: { name: true } } } },
      slots: { orderBy: { slotOrder: "asc" }, select: { startTime: true, endTime: true } },
      attendances: { select: { userId: true, status: true } },
    },
  });
  if (!day || day.schedule.performanceId !== id) notFound();

  const lineup = await prisma.performanceMember.findMany({
    where: { performanceId: id },
    orderBy: { joinedAt: "asc" },
    select: { userId: true, user: { select: { nickname: true, firstName: true, lastName: true } } },
  });
  const members = [
    ...new Map(
      lineup.map((m) => [
        m.userId,
        {
          id: m.userId,
          name: m.user.nickname || m.user.firstName || "?",
          fullName: [m.user.firstName, m.user.lastName].filter(Boolean).join(" "),
        },
      ]),
    ).values(),
  ];
  const canEdit = !!session && (await canEditPerformance(session.user.id, session.user.role, id));
  const date = day.date.toISOString().slice(0, 10);
  const times = day.slots.length ? `${day.slots[0].startTime} – ${day.slots.at(-1)!.endTime}` : "";

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href={`/performances/${id}`} className="hover:text-ink">
          {day.schedule.performance.name}
        </Link>
        <span>/</span>
        <Link href={`/performances/${id}/practice`} className="hover:text-ink">
          ตารางซ้อม
        </Link>
        <span>/</span>
        <span className="text-ink">เช็คชื่อ</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-ink">เช็คชื่อ {attendanceDayLabel(date)}</h1>
        <p className="mt-1 text-sm text-muted">
          {day.schedule.title}
          {times && ` · ${times}`}
        </p>
      </div>
      <AttendanceClient
        performanceId={id}
        dayId={day.id}
        opened={!!day.attendanceOpenedAt}
        canEdit={canEdit}
        members={members}
        initial={Object.fromEntries(day.attendances.map((a) => [a.userId, a.status]))}
      />
    </div>
  );
}
