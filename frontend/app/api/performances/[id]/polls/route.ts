import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const slotSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

const createSchema = z.object({
  name: z.string().min(1).max(100).default("โพลตารางว่าง"),
  deadline: z.string().nullable().optional(),
  slots: z.array(slotSchema).min(1),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const polls = await prisma.availabilityPoll.findMany({
    where: { performanceId: id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { slots: true } },
      slots: { select: { _count: { select: { responses: true } } } },
    },
  });
  return NextResponse.json({
    polls: polls.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      deadline: p.deadline?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      slotCount: p._count.slots,
      responseCount: p.slots.reduce((sum, s) => sum + s._count.responses, 0),
    })),
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "HEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, deadline, slots } = parsed.data;

  const poll = await prisma.availabilityPoll.create({
    data: {
      performanceId: id,
      name,
      deadline: deadline ? new Date(deadline) : null,
      createdById: session.user.id,
      slots: {
        create: slots.map((s, order) => ({
          date: new Date(s.date),
          startTime: s.startTime,
          endTime: s.endTime,
          slotOrder: order,
        })),
      },
    },
  });

  return NextResponse.json({ pollId: poll.id }, { status: 201 });
}
