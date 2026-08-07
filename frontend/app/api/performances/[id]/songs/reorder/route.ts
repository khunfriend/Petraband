import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const itemSchema = z.object({
  performanceSongId: z.string().min(1),
  sectionId: z.string().min(1).nullable(),
  orderInSection: z.number().int().nonnegative(),
});

const schema = z.object({ items: z.array(itemSchema) });

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
    parsed.data.items.map((item) =>
      prisma.performanceSong.update({
        where: { id: item.performanceSongId, performanceId: id },
        data: {
          sectionId: item.sectionId,
          orderInSection: item.orderInSection,
        },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
