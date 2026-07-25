import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  pollSlotId: z.string().min(1),
  isAvailable: z.boolean(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: pollId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const poll = await prisma.availabilityPoll.findUnique({ where: { id: pollId } });
  if (!poll) return NextResponse.json({ error: "ไม่พบโพล" }, { status: 404 });
  if (poll.status === "CLOSED") {
    return NextResponse.json({ error: "โพลปิดแล้ว" }, { status: 400 });
  }
  if (poll.deadline && poll.deadline.getTime() < Date.now()) {
    return NextResponse.json({ error: "หมดเขตกดว่างแล้ว" }, { status: 400 });
  }

  // Only members of the performance may vote — this is about who's actually
  // going to show up, not who can manage the performance.
  const membership = await prisma.performanceMember.findFirst({
    where: { performanceId: poll.performanceId, userId: session.user.id },
    select: { id: true },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "ต้องเข้าร่วมงานแสดงก่อนจึงจะโหวตได้" },
      { status: 403 },
    );
  }

  const slot = await prisma.availabilityPollSlot.findFirst({
    where: { id: parsed.data.pollSlotId, pollId },
    select: { id: true },
  });
  if (!slot) return NextResponse.json({ error: "ไม่พบช่วงเวลา" }, { status: 404 });

  await prisma.availabilityPollResponse.upsert({
    where: { pollSlotId_userId: { pollSlotId: slot.id, userId: session.user.id } },
    create: {
      pollSlotId: slot.id,
      userId: session.user.id,
      isAvailable: parsed.data.isAvailable,
    },
    update: { isAvailable: parsed.data.isAvailable },
  });

  return NextResponse.json({ ok: true });
}
