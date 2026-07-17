import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) {
    return NextResponse.json({ error: "ไม่พบอุปกรณ์" }, { status: 404 });
  }
  return NextResponse.json({ equipment });
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().nullable().optional(),
  quantity: z.number().int().min(0).optional(),
  condition: z.enum(["GOOD", "FAIR", "NEEDS_REPAIR", "RETIRED"]).optional(),
  lengthCm: z.number().positive().nullable().optional(),
  widthCm: z.number().positive().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  note: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบอุปกรณ์" }, { status: 404 });
  }

  const equipment = await prisma.equipment.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ equipment });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบอุปกรณ์" }, { status: 404 });
  }

  await prisma.equipment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
