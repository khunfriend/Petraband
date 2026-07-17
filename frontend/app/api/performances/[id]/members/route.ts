import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const rows = await prisma.performanceMember.findMany({
    where: { performanceId: id },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          generation: true,
          primaryInstrument: { select: { name: true, nameThai: true } },
        },
      },
    },
    orderBy: [{ position: "asc" }, { joinedAt: "asc" }],
  });

  return NextResponse.json({ members: rows });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const entries: Array<{ userId: string; position?: string }> = Array.isArray(body) ? body : [body];

  for (const e of entries) {
    await prisma.$executeRaw`
      INSERT INTO "PerformanceMember" ("id", "userId", "performanceId", "position", "joinedAt")
      VALUES (gen_random_uuid()::text, ${e.userId}, ${id}, ${e.position ?? ""}, now())
      ON CONFLICT ("userId", "performanceId", "position") DO NOTHING
    `;
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { userId, position } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (position !== undefined) {
    await prisma.performanceMember.deleteMany({
      where: { userId, performanceId: id, position },
    });
  } else {
    await prisma.performanceMember.deleteMany({
      where: { userId, performanceId: id },
    });
  }

  return NextResponse.json({ ok: true });
}
