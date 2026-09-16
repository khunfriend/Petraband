import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  title: z.string().min(1).max(100).default("ตารางซ้อม"),
  slotIds: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "HEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: pollId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const poll = await prisma.availabilityPoll.findUnique({
    where: { id: pollId },
    include: {
      slots: {
        where: { id: { in: parsed.data.slotIds } },
        include: {
          responses: {
            where: { isAvailable: true },
            select: { userId: true },
          },
        },
      },
    },
  });
  if (!poll) return NextResponse.json({ error: "ไม่พบโพล" }, { status: 404 });
  if (poll.slots.length === 0) {
    return NextResponse.json({ error: "ไม่มีช่วงเวลาที่เลือก" }, { status: 400 });
  }

  // Group selected slots by date; each date → PracticeDay with its slots
  const byDate = new Map<string, typeof poll.slots>();
  for (const s of poll.slots) {
    const key = s.date.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(s);
  }
  const dates = Array.from(byDate.keys()).sort();

  const schedule = await prisma.$transaction(async (tx) => {
    const created = await tx.practiceSchedule.create({
      data: {
        performanceId: poll.performanceId,
        title: parsed.data.title,
        sourcePollId: pollId,
        createdById: session.user.id,
        createdByName: session.user.name ?? "",
        days: {
          create: dates.map((dateStr, dayOrder) => ({
            date: new Date(dateStr),
            dayOrder,
            slots: {
              create: byDate.get(dateStr)!
                .sort((a, b) => a.slotOrder - b.slotOrder)
                .map((s, slotOrder) => ({
                  startTime: s.startTime,
                  endTime: s.endTime,
                  slotOrder,
                })),
            },
          })),
        },
      },
      include: {
        days: { include: { slots: true }, orderBy: { dayOrder: "asc" } },
      },
    });

    // Seed PracticeAvailability from poll: users who marked available for
    // the corresponding poll slot become available on the practice slot.
    // Match by (date, startTime, endTime) — safer than by index because
    // Prisma's returned slot order isn't guaranteed.
    const seedRows: { slotId: string; userId: string }[] = [];
    const pollSlotByKey = new Map<string, typeof poll.slots[number]>();
    for (const s of poll.slots) {
      const key = `${s.date.toISOString().slice(0, 10)}|${s.startTime}|${s.endTime}`;
      pollSlotByKey.set(key, s);
    }
    for (const day of created.days) {
      const dateKey = day.date.toISOString().slice(0, 10);
      for (const practiceSlot of day.slots) {
        const pollSlot = pollSlotByKey.get(`${dateKey}|${practiceSlot.startTime}|${practiceSlot.endTime}`);
        if (!pollSlot) continue;
        for (const r of pollSlot.responses) {
          seedRows.push({ slotId: practiceSlot.id, userId: r.userId });
        }
      }
    }
    if (seedRows.length > 0) {
      await tx.practiceAvailability.createMany({
        data: seedRows.map((r) => ({
          slotId: r.slotId,
          userId: r.userId,
          isAvailable: true,
        })),
        skipDuplicates: true,
      });
    }

    await tx.availabilityPoll.update({
      where: { id: pollId },
      data: { status: "CLOSED" },
    });

    return created;
  });

  return NextResponse.json({ scheduleId: schedule.id }, { status: 201 });
}
