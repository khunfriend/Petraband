import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

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

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const patchSchema = z
  .object({
    label: z.string().max(1000).optional(),
    startTime: hhmm.optional(),
    endTime: hhmm.optional(),
    location: z.string().trim().max(100).optional(),
    supervisor: z.string().trim().max(100).optional(),
    show: z.string().trim().max(100).optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined));

export async function PATCH(req: Request, { params }: Params) {
  const { slotId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const slot = await prisma.practiceSlot.findUnique({
    where: { id: slotId },
    include: { day: { include: { schedule: { select: { performanceId: true } } } } },
  });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditPerformance(session.user.id, session.user.role, slot.day.schedule.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const startTime = parsed.data.startTime ?? slot.startTime;
  const endTime = parsed.data.endTime ?? slot.endTime;
  if (startTime >= endTime) {
    return NextResponse.json({ error: "เวลาจบต้องหลังเวลาเริ่ม" }, { status: 400 });
  }
  // One item per line; trim stray blank lines so the timetable stays tidy.
  const label =
    parsed.data.label === undefined
      ? slot.label
      : parsed.data.label.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
  const updated = await prisma.practiceSlot.update({
    where: { id: slotId },
    data: {
      label,
      startTime,
      endTime,
      location: parsed.data.location ?? slot.location,
      supervisor: parsed.data.supervisor ?? slot.supervisor,
      show: parsed.data.show ?? slot.show,
    },
    select: { id: true, label: true, startTime: true, endTime: true, location: true, supervisor: true, show: true },
  });
  return NextResponse.json({ ok: true, slot: updated });
}
