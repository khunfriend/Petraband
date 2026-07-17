import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ dayId: string }> };

const bodySchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  label: z.string().default(""),
  isSpecial: z.boolean().default(false),
});

export async function POST(req: Request, { params }: Params) {
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

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.practiceSlot.findMany({
    where: { dayId },
    orderBy: { slotOrder: "desc" },
    take: 1,
  });
  const nextOrder = existing[0] ? existing[0].slotOrder + 1 : 0;

  const slot = await prisma.practiceSlot.create({
    data: {
      dayId,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      label: parsed.data.label,
      isSpecial: parsed.data.isSpecial,
      slotOrder: nextOrder,
    },
  });

  return NextResponse.json({ slot }, { status: 201 });
}
