import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { canEditPerformance } from "@/lib/permissions";
import ManagePracticeClient from "./ManagePracticeClient";
import { bangkokTodayStr } from "@/lib/today";

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

      <ManagePracticeClient
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
            slots: d.slots.map((sl) => ({
              id: sl.id,
              startTime: sl.startTime,
              endTime: sl.endTime,
              label: sl.label,
              location: sl.location,
              isSpecial: sl.isSpecial,
            })),
          })),
        }))}
      />
    </div>
  );
}
