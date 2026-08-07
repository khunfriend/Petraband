import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ orderedIds: z.array(z.string().min(1)) });

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  await prisma.$transaction(
    parsed.data.orderedIds.map((sectionId, idx) =>
      prisma.performanceSection.update({
        where: { id: sectionId, performanceId: id },
        data: { sectionOrder: idx },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
