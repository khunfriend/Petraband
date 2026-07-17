import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const slotSchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  label: z.string().default(""),
  isSpecial: z.boolean().default(false),
});

const bodySchema = z.object({
  date: z.string().min(1),
  slots: z.array(slotSchema).default([]),
});

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedule = await prisma.practiceSchedule.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditPerformance(session.user.id, session.user.role, schedule.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { date, slots } = parsed.data;

  const existing = await prisma.practiceDay.findMany({
    where: { scheduleId: id },
    orderBy: { dayOrder: "desc" },
    take: 1,
  });
  const nextOrder = existing[0] ? existing[0].dayOrder + 1 : 0;

  const day = await prisma.practiceDay.create({
    data: {
      scheduleId: id,
      date: new Date(date),
      dayOrder: nextOrder,
      slots: {
        create: slots.map((s, slotOrder) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          label: s.label,
          isSpecial: s.isSpecial,
          slotOrder,
        })),
      },
    },
    include: { slots: { orderBy: { slotOrder: "asc" } } },
  });

  return NextResponse.json({ day }, { status: 201 });
}
