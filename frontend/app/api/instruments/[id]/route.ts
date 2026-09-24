import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { instrumentUpdateSchema } from "@/lib/instrumentSchema";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = instrumentUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (parsed.data.nameThai) {
    const clash = await prisma.instrument.findFirst({
      where: { nameThai: parsed.data.nameThai, id: { not: id } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json({ error: "มีชื่อนี้ในคลังแล้ว" }, { status: 409 });
    }
  }

  const instrument = await prisma.instrument.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ instrument });
}

// Only pieces nothing points at can go: stage layouts, song parts and member
// profiles all reference instruments, and none of those should lose data.
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const used = await prisma.instrument.findUnique({
    where: { id },
    select: {
      _count: {
        select: { stageItems: true, songAssignments: true, primaryUsers: true, secondaryUsers: true },
      },
    },
  });
  if (!used) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const c = used._count;
  if (c.stageItems + c.songAssignments + c.primaryUsers + c.secondaryUsers > 0) {
    return NextResponse.json(
      { error: "ลบไม่ได้ — มีผังเวที เพลง หรือสมาชิกใช้อยู่" },
      { status: 409 }
    );
  }

  await prisma.instrument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
