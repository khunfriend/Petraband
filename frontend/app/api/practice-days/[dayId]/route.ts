import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";

type Params = { params: Promise<{ dayId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { dayId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const day = await prisma.practiceDay.findUnique({
    where: { id: dayId },
    include: { schedule: { select: { performanceId: true } } },
  });
  if (!day) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditPerformance(session.user.id, session.user.role, day.schedule.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.practiceDay.delete({ where: { id: dayId } });
  return NextResponse.json({ ok: true });
}
