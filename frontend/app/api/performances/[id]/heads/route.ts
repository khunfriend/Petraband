import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: performanceId } = await params;

  const heads = await prisma.performanceHead.findMany({
    where: { performanceId },
    include: {
      user: { select: { id: true, nickname: true, generation: true } },
    },
    orderBy: { assignedAt: "asc" },
  });

  return NextResponse.json({ heads });
}

const userIdSchema = z.object({ userId: z.string().min(1) });

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: performanceId } = await params;
  const body = await req.json();
  const parsed = userIdSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const head = await prisma.performanceHead.upsert({
    where: {
      userId_performanceId: {
        userId: parsed.data.userId,
        performanceId,
      },
    },
    create: {
      userId: parsed.data.userId,
      performanceId,
    },
    update: {},
    include: {
      user: { select: { id: true, nickname: true, generation: true } },
    },
  });

  return NextResponse.json({ head }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: performanceId } = await params;
  const body = await req.json();
  const parsed = userIdSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  await prisma.performanceHead.deleteMany({
    where: { userId: parsed.data.userId, performanceId },
  });

  return NextResponse.json({ ok: true });
}
