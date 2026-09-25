import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const createSchema = z.object({ name: z.string().trim().min(1).max(60) });

// Add a section to the lineup. The first one takes over every position
// already assigned, so splitting a lineup never loses anyone.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const performance = await prisma.performance.findUnique({ where: { id }, select: { id: true } });
  if (!performance) return NextResponse.json({ error: "ไม่พบงานแสดง" }, { status: 404 });

  const section = await prisma.$transaction(async (tx) => {
    const existing = await tx.lineupSection.findMany({
      where: { performanceId: id },
      select: { sortOrder: true },
    });
    const created = await tx.lineupSection.create({
      data: {
        performanceId: id,
        name: parsed.data.name,
        sortOrder: existing.reduce((m, s) => Math.max(m, s.sortOrder + 1), 0),
      },
    });
    if (existing.length === 0) {
      await tx.performanceMember.updateMany({
        where: { performanceId: id, sectionId: "", position: { not: "" } },
        data: { sectionId: created.id },
      });
    }
    return created;
  });

  return NextResponse.json({ section }, { status: 201 });
}
