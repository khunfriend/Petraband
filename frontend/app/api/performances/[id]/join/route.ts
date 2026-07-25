import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const performance = await prisma.performance.findUnique({
    where: { id },
    include: { dates: { orderBy: { date: "desc" }, take: 1 } },
  });
  if (!performance) return NextResponse.json({ error: "ไม่พบงานแสดง" }, { status: 404 });

  if (performance.dates.length > 0) {
    // Compare in Bangkok time. DB stores DATE (Prisma returns UTC midnight),
    // and we want "งานสิ้นสุด" to flip over at Bangkok midnight, not UTC midnight.
    const latestStr = performance.dates[0].date.toISOString().slice(0, 10);
    const todayStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
    if (latestStr < todayStr) {
      return NextResponse.json({ error: "งานแสดงสิ้นสุดแล้ว" }, { status: 400 });
    }
  }

  await prisma.$executeRaw`
    INSERT INTO "PerformanceMember" ("id", "userId", "performanceId", "position", "joinedAt")
    VALUES (gen_random_uuid()::text, ${session.user.id}, ${id}, '', now())
    ON CONFLICT ("userId", "performanceId", "position") DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.performanceMember.deleteMany({
    where: { userId: session.user.id, performanceId: id },
  });

  return NextResponse.json({ ok: true });
}
