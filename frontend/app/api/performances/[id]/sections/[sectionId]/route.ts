import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string; sectionId: string }> };

const patchSchema = z.object({ name: z.string().min(1).max(120) });

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, sectionId } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const section = await prisma.performanceSection.update({
    where: { id: sectionId, performanceId: id },
    data: { name: parsed.data.name.trim() },
  });

  return NextResponse.json({ section });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, sectionId } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.performanceSection.delete({
    where: { id: sectionId, performanceId: id },
  });

  return NextResponse.json({ ok: true });
}
