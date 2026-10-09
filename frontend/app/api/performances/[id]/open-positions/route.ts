import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const entry = z.object({
  position: z.string().trim().min(1).max(100),
  sectionId: z.string().default(""),
});

// Positions picked before anyone is chosen to play them. Same rights as the
// lineup itself (members API): admins only.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = z.array(entry).min(1).max(100).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const sectionIds = new Set(
    (await prisma.lineupSection.findMany({ where: { performanceId: id }, select: { id: true } })).map((s) => s.id),
  );
  for (const e of parsed.data) {
    const ok = sectionIds.size === 0 ? e.sectionId === "" : sectionIds.has(e.sectionId);
    if (!ok) return NextResponse.json({ error: "ชุดการแสดงไม่ถูกต้อง" }, { status: 400 });
  }

  await prisma.openPosition.createMany({
    data: parsed.data.map((e) => ({ performanceId: id, sectionId: e.sectionId, position: e.position })),
    skipDuplicates: true,
  });
  const openPositions = await prisma.openPosition.findMany({
    where: { performanceId: id },
    select: { position: true, sectionId: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ openPositions }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = entry.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  await prisma.openPosition.deleteMany({
    where: { performanceId: id, sectionId: parsed.data.sectionId, position: parsed.data.position },
  });
  return NextResponse.json({ ok: true });
}
