import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";

type Params = { params: Promise<{ slotId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { slotId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slot = await prisma.practiceSlot.findUnique({
    where: { id: slotId },
    include: { day: { include: { schedule: { select: { performanceId: true } } } } },
  });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditPerformance(session.user.id, session.user.role, slot.day.schedule.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.practiceSlot.delete({ where: { id: slotId } });
  return NextResponse.json({ ok: true });
}
