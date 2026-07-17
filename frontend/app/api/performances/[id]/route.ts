import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const performance = await prisma.performance.findUnique({
    where: { id },
    include: {
      dates: { orderBy: { date: "asc" } },
      songs: {
        include: { song: { select: { id: true, title: true, songCode: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!performance) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ performance });
}

const activitySchema = z.object({
  time: z.string(),
  activity: z.string(),
});

const programDaySchema = z.object({
  day: z.number().int().positive(),
  activities: z.array(activitySchema),
});

const instrumentNeededSchema = z.object({
  name: z.string(),
  chairs: z.number().int().min(0),
  tables: z.number().int().min(0).nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  costume: z.string().nullable().optional(),
  programSchedule: z.array(programDaySchema).nullable().optional(),
  instrumentsNeeded: z.array(instrumentNeededSchema).nullable().optional(),
  equipmentNotes: z.record(z.string(), z.string()).nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );

  const { programSchedule, instrumentsNeeded, equipmentNotes, ...rest } = parsed.data;
  const performance = await prisma.performance.update({
    where: { id: id },
    data: {
      ...rest,
      ...(programSchedule !== undefined && {
        programSchedule: programSchedule === null ? Prisma.JsonNull : programSchedule,
      }),
      ...(instrumentsNeeded !== undefined && {
        instrumentsNeeded: instrumentsNeeded === null ? Prisma.JsonNull : instrumentsNeeded,
      }),
      ...(equipmentNotes !== undefined && {
        equipmentNotes: equipmentNotes === null ? Prisma.JsonNull : (equipmentNotes as Prisma.InputJsonValue),
      }),
    },
  });

  return NextResponse.json({ performance });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.performance.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
