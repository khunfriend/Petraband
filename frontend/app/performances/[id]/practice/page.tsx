import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { canEditPerformance } from "@/lib/permissions";
import ManagePracticeClient from "./ManagePracticeClient";
import { bangkokTodayStr } from "@/lib/today";
import { availabilityFromPolls, type PollAnswers } from "@/lib/practiceAvailability";
import type { SheetAnswer, SheetRow } from "@/components/practice/AvailabilitySheet";
import { AttendancePanel, type AttendanceDay } from "@/components/practice/AttendancePanel";

type Params = { params: Promise<{ id: string }> };

export default async function PracticeListPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const performance = await prisma.performance.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      heads: { select: { userId: true } },
      songs: { orderBy: { order: "asc" }, select: { song: { select: { title: true } } } },
      dates: { select: { date: true }, orderBy: { date: "asc" } },
    },
  });

  if (!performance) notFound();

  const isAdmin = session?.user.role === "ADMIN";
  const isHead =
    session?.user.role === "HEAD" &&
    performance.heads.some((h) => h.userId === session?.user.id);
  const canEdit = isAdmin || isHead;
  // Past performances are frozen; the API refuses edits, so don't offer them.
  const canEditNow = !!session && canEdit && (await canEditPerformance(session.user.id, session.user.role, id));

  const schedules = await prisma.practiceSchedule.findMany({
    where: { performanceId: id },
    include: {
      days: { include: { slots: { orderBy: { slotOrder: "asc" } } }, orderBy: { date: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (schedules.length === 0) {
    if (canEdit) redirect(`/performances/${id}/practice/create`);
    redirect(`/performances/${id}`);
  }

  // ── "ใครว่างบ้าง": one column per musician in the lineup ──
  const lineup = await prisma.performanceMember.findMany({
    where: { performanceId: id },
    orderBy: { joinedAt: "asc" },
    select: { userId: true, user: { select: { nickname: true, firstName: true } } },
  });
  const members = [...new Map(lineup.map((m) => [m.userId, { id: m.userId, name: m.user.nickname || m.user.firstName || "?" }])).values()];
  const memberIds = members.map((m) => m.id);
  const slotIds = schedules.flatMap((s) => s.days.flatMap((d) => d.slots.map((sl) => sl.id)));

  const [manual, polls] = await Promise.all([
    prisma.practiceAvailability.findMany({
      where: { slotId: { in: slotIds }, userId: { in: memberIds } },
      select: { slotId: true, userId: true, isAvailable: true },
    }),
    prisma.availabilityPoll.findMany({
      where: { performanceId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slots: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
            responses: { where: { userId: { in: memberIds } }, select: { userId: true, isAvailable: true } },
          },
        },
      },
    }),
  ]);
  const pollAnswers = new Map<string, PollAnswers>(
    polls.map((p) => [
      p.id,
      {
        cells: p.slots.map((c) => ({
          date: c.date.toISOString().slice(0, 10),
          startTime: c.startTime,
          endTime: c.endTime,
          availableUserIds: c.responses.filter((r) => r.isAvailable).map((r) => r.userId),
        })),
        responderIds: [...new Set(p.slots.flatMap((c) => c.responses.map((r) => r.userId)))],
      },
    ]),
  );
  const manualBySlot = new Map<string, Map<string, boolean>>();
  for (const m of manual) {
    if (!manualBySlot.has(m.slotId)) manualBySlot.set(m.slotId, new Map());
    manualBySlot.get(m.slotId)!.set(m.userId, m.isAvailable);
  }

  // ── เช็คชื่อ: marks per day, for the days roll call was taken ──
  const marks = await prisma.practiceAttendance.groupBy({
    by: ["dayId", "status"],
    where: { dayId: { in: schedules.flatMap((s) => s.days.map((d) => d.id)) } },
    _count: { _all: true },
  });
  const attendanceDays: AttendanceDay[] = schedules
    .flatMap((s) =>
      s.days.map((d) => {
        const counts = { PRESENT: 0, LATE: 0, EXCUSED: 0, ABSENT: 0 };
        for (const m of marks) if (m.dayId === d.id) counts[m.status] = m._count._all;
        return {
          id: d.id,
          date: d.date.toISOString().slice(0, 10),
          scheduleTitle: s.title,
          opened: !!d.attendanceOpenedAt,
          counts,
        };
      }),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  function sheetFor(s: (typeof schedules)[number]) {
    // The poll this schedule was made from speaks first, then the newest.
    const ordered = [
      ...(s.sourcePollId && pollAnswers.has(s.sourcePollId) ? [pollAnswers.get(s.sourcePollId)!] : []),
      ...polls.filter((p) => p.id !== s.sourcePollId).map((p) => pollAnswers.get(p.id)!),
    ];
    const rows: SheetRow[] = [];
    const answers: Record<string, Record<string, SheetAnswer>> = {};
    for (const d of s.days) {
      const date = d.date.toISOString().slice(0, 10);
      for (const sl of d.slots) {
        rows.push({ slotId: sl.id, date, startTime: sl.startTime, endTime: sl.endTime, label: sl.label, supervisor: sl.supervisor });
        answers[sl.id] = {};
        for (const m of members) {
          const own = manualBySlot.get(sl.id)?.get(m.id);
          answers[sl.id][m.id] =
            own !== undefined
              ? { value: own ? "yes" : "no", manual: true }
              : { value: availabilityFromPolls(ordered, date, sl.startTime, sl.endTime, m.id), manual: false };
        }
      }
    }
    return { rows, answers };
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/performances" className="hover:text-ink transition-colors">
          งานแสดง
        </Link>
        <span>/</span>
        <Link href={`/performances/${id}`} className="hover:text-ink transition-colors">
          {performance.name}
        </Link>
        <span>/</span>
        <span className="text-ink">ตารางซ้อม</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">ตารางซ้อมทั้งหมด</h1>
        </div>
        {canEdit && (
          <Link
            href={`/performances/${id}/practice/create`}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-[var(--radius-md)] hover:bg-primary-active transition-colors duration-[var(--duration-pb-base)]"
          >
            + สร้างตารางซ้อมเพิ่ม
          </Link>
        )}
      </div>

      <AttendancePanel
        performanceId={id}
        days={attendanceDays}
        today={bangkokTodayStr()}
        lineupSize={members.length}
        canEdit={canEditNow}
      />

      <ManagePracticeClient
        members={members}
        viewerId={session?.user.id ?? ""}
        isAdmin={isAdmin}
        showSuggestions={performance.songs.map((ps) => ps.song.title)}
        sheets={Object.fromEntries(schedules.map((s) => [s.id, sheetFor(s)]))}
        canEdit={canEditNow}
        canDelete={isAdmin}
        dateRange={{
          min: bangkokTodayStr(),
          max: performance.dates.at(-1)?.date.toISOString().slice(0, 10),
        }}
        schedules={schedules.map((s) => ({
          id: s.id,
          title: s.title,
          location: s.location,
          locationNote: s.locationNote,
          dateMode: s.dateMode,
          days: s.days.map((d) => ({
            id: d.id,
            date: d.date.toISOString(),
            note: d.note,
            slots: d.slots.map((sl) => ({
              id: sl.id,
              startTime: sl.startTime,
              endTime: sl.endTime,
              label: sl.label,
              show: sl.show,
              location: sl.location,
              isSpecial: sl.isSpecial,
            })),
          })),
        }))}
      />
    </div>
  );
}
