import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; sectionId: string }> };

const renameSchema = z.object({ name: z.string().trim().min(1).max(60) });

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, sectionId } = await params;
  const parsed = renameSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const { count } = await prisma.lineupSection.updateMany({
    where: { id: sectionId, performanceId: id },
    data: { name: parsed.data.name },
  });
  if (count === 0) return NextResponse.json({ error: "ไม่พบชุดการแสดง" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Removing the last section un-splits the lineup: its positions move back to
// the plain lineup. Removing any other section drops that section's positions
// (the people stay in the performance).
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, sectionId } = await params;
  const result = await prisma.$transaction(async (tx) => {
    const sections = await tx.lineupSection.findMany({ where: { performanceId: id }, select: { id: true } });
    if (!sections.some((s) => s.id === sectionId)) return null;
    const isLast = sections.length === 1;
    if (isLast) {
      await tx.performanceMember.updateMany({
        where: { performanceId: id, sectionId },
        data: { sectionId: "" },
      });
    } else {
      await tx.performanceMember.deleteMany({ where: { performanceId: id, sectionId } });
    }
    await tx.lineupSection.delete({ where: { id: sectionId } });
    return { movedBack: isLast };
  });
  if (!result) return NextResponse.json({ error: "ไม่พบชุดการแสดง" }, { status: 404 });
  return NextResponse.json(result);
}
