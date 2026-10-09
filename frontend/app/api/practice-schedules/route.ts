import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";
import { practiceSlotInput } from "@/lib/practiceSchema";

const slotSchema = practiceSlotInput;

const daySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(slotSchema),
});

const groupSchema = z.object({
  name: z.string().min(1),
  memberIds: z.array(z.string()),
});

const createSchema = z.object({
  performanceId: z.string().min(1),
  title: z.string().trim().min(1).max(100).default("ตารางซ้อม"),
  location: z.string().trim().max(100).default(""),
  locationNote: z.string().trim().max(100).default(""),
  dateMode: z.enum(["ALL", "ANY"]).default("ALL"),
  days: z.array(daySchema).min(1),
  groups: z.array(groupSchema).default([]),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const performanceId = searchParams.get("performance_id");

  if (!performanceId) {
    return NextResponse.json({ error: "performance_id required" }, { status: 400 });
  }

  const schedules = await prisma.practiceSchedule.findMany({
    where: { performanceId },
    include: {
      days: { include: { slots: { select: { id: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = schedules.map((s) => ({
    id: s.id,
    title: s.title,
    performanceId: s.performanceId,
    createdAt: s.createdAt,
    daysCount: s.days.length,
    slotsCount: s.days.reduce((acc, d) => acc + d.slots.length, 0),
  }));

  return NextResponse.json({ schedules: result });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "HEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { performanceId, title, location, locationNote, dateMode, days, groups } = parsed.data;

  // A HEAD may only add schedules to performances they lead, and past ones are frozen.
  if (!(await canEditPerformance(session.user.id, session.user.role, performanceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const todayStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const pastDay = days.find((d) => d.date < todayStr);
  if (pastDay) {
    return NextResponse.json(
      { error: `ห้ามสร้างตารางย้อนหลัง วันที่ ${pastDay.date} อยู่ในอดีต` },
      { status: 400 }
    );
  }

  const schedule = await prisma.practiceSchedule.create({
    data: {
      performanceId,
      title,
      location,
      locationNote,
      dateMode,
      createdById: session.user.id,
      createdByName: session.user.name ?? "",
      days: {
        create: days.map((d, dayOrder) => ({
          date: new Date(d.date),
          dayOrder,
          slots: {
            create: d.slots.map((s, slotOrder) => ({
              startTime: s.startTime,
              endTime: s.endTime,
              label: s.label,
              location: s.location,
              isSpecial: s.isSpecial,
              slotOrder,
            })),
          },
        })),
      },
      memberGroups: {
        create: groups.map((g, displayOrder) => ({
          name: g.name,
          displayOrder,
          members: {
            create: g.memberIds.map((userId) => ({ userId })),
          },
        })),
      },
    },
    include: {
      days: { include: { slots: true }, orderBy: { dayOrder: "asc" } },
      memberGroups: {
        include: {
          members: { include: { user: { select: { id: true, nickname: true, generation: true } } } },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  return NextResponse.json({ schedule }, { status: 201 });
}
