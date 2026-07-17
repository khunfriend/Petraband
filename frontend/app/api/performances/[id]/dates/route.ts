import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const addDateSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = addDateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );

  const performanceDate = await prisma.performanceDate.create({
    data: {
      performanceId: id,
      date: new Date(parsed.data.date),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    },
  });

  return NextResponse.json({ performanceDate }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { dateId, startTime, endTime } = await req.json();
  if (!dateId) return NextResponse.json({ error: "dateId required" }, { status: 400 });

  const updated = await prisma.performanceDate.update({
    where: { id: dateId },
    data: {
      startTime: startTime?.trim() || null,
      endTime: endTime?.trim() || null,
    },
  });

  return NextResponse.json({ performanceDate: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = req.nextUrl;
  const dateId = searchParams.get("dateId");
  if (!dateId) return NextResponse.json({ error: "dateId required" }, { status: 400 });

  await prisma.performanceDate.delete({ where: { id: dateId } });
  return NextResponse.json({ ok: true });
}
