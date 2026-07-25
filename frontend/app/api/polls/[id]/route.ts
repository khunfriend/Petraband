import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const poll = await prisma.availabilityPoll.findUnique({
    where: { id },
    include: {
      performance: { select: { id: true, name: true } },
      slots: {
        orderBy: [{ date: "asc" }, { slotOrder: "asc" }],
        include: {
          responses: {
            include: {
              user: { select: { id: true, nickname: true, generation: true } },
            },
          },
        },
      },
    },
  });
  if (!poll) return NextResponse.json({ error: "ไม่พบโพล" }, { status: 404 });

  const members = await prisma.performanceMember.findMany({
    where: { performanceId: poll.performanceId, position: "" },
    include: { user: { select: { id: true, nickname: true, generation: true } } },
  });
  const memberList = members.map((m) => m.user);

  return NextResponse.json({
    poll: {
      id: poll.id,
      name: poll.name,
      status: poll.status,
      deadline: poll.deadline?.toISOString() ?? null,
      timezone: poll.timezone,
      performance: poll.performance,
      slots: poll.slots.map((s) => ({
        id: s.id,
        date: s.date.toISOString().slice(0, 10),
        startTime: s.startTime,
        endTime: s.endTime,
        availableUsers: s.responses.filter((r) => r.isAvailable).map((r) => r.user),
        myResponse:
          s.responses.find((r) => r.user.id === session.user.id)?.isAvailable ?? false,
      })),
      members: memberList,
    },
  });
}

const patchSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  name: z.string().min(1).max(100).optional(),
  deadline: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "HEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  await prisma.availabilityPoll.update({
    where: { id },
    data: {
      ...(parsed.data.status && { status: parsed.data.status }),
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.deadline !== undefined && {
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      }),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "HEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.availabilityPoll.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
