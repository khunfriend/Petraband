import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const sections = await prisma.performanceSection.findMany({
    where: { performanceId: id },
    orderBy: { sectionOrder: "asc" },
  });
  return NextResponse.json({ sections });
}

const createSchema = z.object({ name: z.string().min(1).max(120) });

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const max = await prisma.performanceSection.aggregate({
    where: { performanceId: id },
    _max: { sectionOrder: true },
  });

  const section = await prisma.performanceSection.create({
    data: {
      performanceId: id,
      name: parsed.data.name.trim(),
      sectionOrder: (max._max.sectionOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ section }, { status: 201 });
}
