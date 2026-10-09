import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mergeContiguous } from "@/lib/pollGrid";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  title: z.string().min(1).max(100).default("ตารางซ้อม"),
  slotIds: z.array(z.string()).min(1).max(3000),
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
  // Back-to-back poll cells become one practice slot; a member counts as
  // available for it only if they marked every cell inside.
  const mergedByDate = new Map(
    dates.map((d) => [
      d,
      mergeContiguous(byDate.get(d)!).map((m) => {
        const [first, ...rest] = m.parts.map((p) => new Set(p.responses.map((r) => r.userId)));
        const userIds = [...first].filter((u) => rest.every((set) => set.has(u)));
        return { startTime: m.startTime, endTime: m.endTime, userIds };
      }),
    ]),
  );

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
              create: mergedByDate.get(dateStr)!.map((s, slotOrder) => ({
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

    // Seed PracticeAvailability from the poll. Match by (date, start, end) —
    // safer than by index because Prisma's returned slot order isn't guaranteed.
    const seedRows: { slotId: string; userId: string }[] = [];
    for (const day of created.days) {
      const merged = mergedByDate.get(day.date.toISOString().slice(0, 10)) ?? [];
      for (const practiceSlot of day.slots) {
        const m = merged.find((x) => x.startTime === practiceSlot.startTime && x.endTime === practiceSlot.endTime);
        for (const userId of m?.userIds ?? []) seedRows.push({ slotId: practiceSlot.id, userId });
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
