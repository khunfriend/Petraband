import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  equipmentName: z.string().min(1).optional(),
  equipmentId: z.string().min(1).nullable().optional(),
  quantity: z.number().int().positive().optional(),
  counterparty: z.string().min(1).optional(),
  borrowedAt: z.string().datetime().optional(),
  returnedAt: z.string().datetime().nullable().optional(),
  note: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "HEAD")) {
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

  const existing = await prisma.equipmentLoan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบรายการยืม" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.equipmentName !== undefined) data.equipmentName = parsed.data.equipmentName;
  if (parsed.data.equipmentId !== undefined) data.equipmentId = parsed.data.equipmentId;
  if (parsed.data.quantity !== undefined) data.quantity = parsed.data.quantity;
  if (parsed.data.counterparty !== undefined) data.counterparty = parsed.data.counterparty;
  if (parsed.data.borrowedAt !== undefined) data.borrowedAt = new Date(parsed.data.borrowedAt);
  if (parsed.data.returnedAt !== undefined) {
    data.returnedAt = parsed.data.returnedAt ? new Date(parsed.data.returnedAt) : null;
  }
  if (parsed.data.note !== undefined) data.note = parsed.data.note;

  const loan = await prisma.equipmentLoan.update({
    where: { id },
    data,
  });

  return NextResponse.json({ loan });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.equipmentLoan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบรายการยืม" }, { status: 404 });
  }

  await prisma.equipmentLoan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
