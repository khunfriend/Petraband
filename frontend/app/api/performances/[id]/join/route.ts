import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const performance = await prisma.performance.findUnique({ where: { id } });
  if (!performance) return NextResponse.json({ error: "ไม่พบงานแสดง" }, { status: 404 });

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
    where: { userId: session.user.id, performanceId: id, position: "" },
  });

  return NextResponse.json({ ok: true });
}
