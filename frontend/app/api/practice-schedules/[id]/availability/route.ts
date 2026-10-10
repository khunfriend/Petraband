import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  slotId: z.string().min(1),
  /** null clears the answer, so the poll decides again. */
  isAvailable: z.boolean().nullable(),
  /** Someone else's answer — heads and admins only. Defaults to the caller. */
  userId: z.string().min(1).optional(),
});

/** Set one member's "ว่าง / ไม่ว่าง" for one practice session. */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const { slotId, isAvailable } = parsed.data;
  const userId = parsed.data.userId ?? session.user.id;

  const slot = await prisma.practiceSlot.findUnique({
    where: { id: slotId },
    include: { day: { select: { scheduleId: true, schedule: { select: { performanceId: true } } } } },
  });
  if (!slot || slot.day.scheduleId !== id) {
    return NextResponse.json({ error: "ไม่พบช่วงซ้อมนี้" }, { status: 404 });
  }
  const performanceId = slot.day.schedule.performanceId;

  // Only people in the lineup have a column; editors may fill in for them.
  const member = await prisma.performanceMember.findFirst({ where: { performanceId, userId }, select: { id: true } });
  if (!member) return NextResponse.json({ error: "คนนี้ไม่ได้อยู่ในงานนี้" }, { status: 400 });
  if (userId !== session.user.id && !(await canEditPerformance(session.user.id, session.user.role, performanceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isAvailable === null) {
    await prisma.practiceAvailability.deleteMany({ where: { slotId, userId } });
  } else {
    await prisma.practiceAvailability.upsert({
      where: { slotId_userId: { slotId, userId } },
      create: { slotId, userId, isAvailable },
      update: { isAvailable },
    });
  }
  return NextResponse.json({ ok: true });
}
