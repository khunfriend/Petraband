import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const schedule = await prisma.practiceSchedule.findUnique({
    where: { id },
    include: {
      days: {
        include: {
          slots: {
            include: { availabilities: true },
            orderBy: { slotOrder: "asc" },
          },
        },
        orderBy: { dayOrder: "asc" },
      },
      memberGroups: {
        include: {
          members: {
            include: {
              user: { select: { id: true, nickname: true, generation: true } },
            },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!schedule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ schedule });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedule = await prisma.practiceSchedule.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditPerformance(session.user.id, session.user.role, schedule.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = z.object({ title: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.practiceSchedule.update({
    where: { id },
    data: { title: parsed.data.title },
  });

  return NextResponse.json({ schedule: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const schedule = await prisma.practiceSchedule.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.practiceSchedule.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
