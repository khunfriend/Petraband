import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

// Roll call for one practice day. Taken only on the days someone opens it
// ("เช็คชื่อวันนี้"); heads and admins mark everyone in the lineup.

type Params = { params: Promise<{ dayId: string }> };

async function editableDay(dayId: string) {
  const session = await auth();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const day = await prisma.practiceDay.findUnique({
    where: { id: dayId },
    select: { id: true, attendanceOpenedAt: true, schedule: { select: { performanceId: true } } },
  });
  if (!day) return { error: NextResponse.json({ error: "ไม่พบวันซ้อม" }, { status: 404 }) };
  const allowed = await canEditPerformance(session.user.id, session.user.role, day.schedule.performanceId);
  if (!allowed) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { day };
}

/** Open roll call for this day. */
export async function POST(_req: Request, { params }: Params) {
  const { dayId } = await params;
  const r = await editableDay(dayId);
  if ("error" in r) return r.error;
  if (!r.day.attendanceOpenedAt) {
    await prisma.practiceDay.update({ where: { id: dayId }, data: { attendanceOpenedAt: new Date() } });
  }
  return NextResponse.json({ ok: true });
}

const markSchema = z.object({
  userId: z.string().min(1),
  /** null clears the mark. */
  status: z.enum(["PRESENT", "LATE", "EXCUSED", "ABSENT"]).nullable(),
});

/** Mark one member, or several at once ({ marks: [...] }) for "ทุกคนมา". */
export async function PUT(req: Request, { params }: Params) {
  const { dayId } = await params;
  const r = await editableDay(dayId);
  if ("error" in r) return r.error;
  if (!r.day.attendanceOpenedAt) return NextResponse.json({ error: "ยังไม่ได้เปิดเช็คชื่อวันนี้" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = z.object({ marks: z.array(markSchema).min(1).max(200) }).or(markSchema).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const marks = "marks" in parsed.data ? parsed.data.marks : [parsed.data];

  // Only people in this performance's lineup can be marked.
  const lineup = new Set(
    (
      await prisma.performanceMember.findMany({
        where: { performanceId: r.day.schedule.performanceId, userId: { in: marks.map((m) => m.userId) } },
        select: { userId: true },
      })
    ).map((m) => m.userId),
  );
  if (marks.some((m) => !lineup.has(m.userId))) {
    return NextResponse.json({ error: "มีคนที่ไม่ได้อยู่ในงานนี้" }, { status: 400 });
  }

  await prisma.$transaction(
    marks.map((m) =>
      m.status === null
        ? prisma.practiceAttendance.deleteMany({ where: { dayId, userId: m.userId } })
        : prisma.practiceAttendance.upsert({
            where: { dayId_userId: { dayId, userId: m.userId } },
            create: { dayId, userId: m.userId, status: m.status },
            update: { status: m.status },
          }),
    ),
  );
  return NextResponse.json({ ok: true });
}

/** Cancel roll call for this day: drops the marks too. */
export async function DELETE(_req: Request, { params }: Params) {
  const { dayId } = await params;
  const r = await editableDay(dayId);
  if ("error" in r) return r.error;
  await prisma.$transaction([
    prisma.practiceAttendance.deleteMany({ where: { dayId } }),
    prisma.practiceDay.update({ where: { id: dayId }, data: { attendanceOpenedAt: null } }),
  ]);
  return NextResponse.json({ ok: true });
}
