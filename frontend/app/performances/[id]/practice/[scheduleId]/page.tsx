import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PracticeScheduleClient from "./PracticeScheduleClient";

type Params = { params: Promise<{ id: string; scheduleId: string }> };

export default async function PracticeSchedulePage({ params }: Params) {
  const { id, scheduleId } = await params;
  const session = await auth();

  const [schedule, performance, performanceMembers] = await Promise.all([
    prisma.practiceSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        days: {
          include: {
            slots: {
              include: { availabilities: true },
              orderBy: { slotOrder: "asc" },
            },
          },
          orderBy: { dayOrder: "asc" },
        },
        memberGroups: {
          include: {
            members: {
              include: {
                user: { select: { id: true, nickname: true, generation: true } },
              },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.performance.findUnique({
      where: { id },
      select: { id: true, name: true, heads: { select: { userId: true } } },
    }),
    prisma.performanceMember.findMany({
      where: { performanceId: id },
      include: { user: { select: { id: true, nickname: true, generation: true } } },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  if (!schedule || !performance || schedule.performanceId !== id) notFound();

  const isAdmin = session?.user.role === "ADMIN";
  const isHead =
    session?.user.role === "HEAD" &&
    performance.heads.some((h) => h.userId === session.user.id);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-8 py-8">
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

      <PracticeScheduleClient
        schedule={{
          ...schedule,
          days: schedule.days.map((d) => ({
            ...d,
            date: d.date.toISOString(),
          })),
        }}
        allMembers={performanceMembers.map((m) => m.user)}
        performanceId={id}
        currentUserId={session?.user.id ?? null}
        isAdmin={isAdmin}
        isHead={isHead}
      />
    </div>
  );
}
