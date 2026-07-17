import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedule = await prisma.practiceSchedule.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditPerformance(session.user.id, session.user.role, schedule.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [memberRows, respondedUserIds] = await Promise.all([
    prisma.performanceMember.findMany({
      where: { performanceId: schedule.performanceId },
      include: { user: { select: { id: true, nickname: true, generation: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.practiceAvailability.findMany({
      where: {
        slot: { day: { scheduleId: id } },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const seen = new Set<string>();
  const members = memberRows.map((r) => r.user).filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
  const respondedSet = new Set(respondedUserIds.map((r) => r.userId));

  const responded = members.filter((m) => respondedSet.has(m.id));
  const notResponded = members.filter((m) => !respondedSet.has(m.id));

  return NextResponse.json({ responded, notResponded });
}
