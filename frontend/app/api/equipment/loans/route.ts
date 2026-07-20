import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const direction = searchParams.get("direction");
  const active = searchParams.get("active");

  const loans = await prisma.equipmentLoan.findMany({
    where: {
      ...(direction === "BORROWED_IN" || direction === "LENT_OUT"
        ? { direction }
        : {}),
      ...(active === "true"
        ? { returnedAt: null }
        : active === "false"
          ? { returnedAt: { not: null } }
          : {}),
    },
    orderBy: [{ returnedAt: "asc" }, { borrowedAt: "desc" }],
  });

  return NextResponse.json({ loans });
}

const createSchema = z.object({
  direction: z.enum(["BORROWED_IN", "LENT_OUT"]),
  equipmentId: z.string().min(1).nullable().optional(),
  equipmentName: z.string().min(1),
  quantity: z.number().int().positive(),
  counterparty: z.string().min(1),
  borrowedAt: z.string().datetime().optional(),
  note: z.string().nullable().optional(),
}).refine(
  (d) => d.direction === "BORROWED_IN" || (d.equipmentId && d.equipmentId.length > 0),
  { message: "ต้องเลือกอุปกรณ์จากคลังสำหรับการให้ยืม", path: ["equipmentId"] }
);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "HEAD")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.equipmentId) {
    const equipment = await prisma.equipment.findUnique({
      where: { id: parsed.data.equipmentId },
    });
    if (!equipment) {
      return NextResponse.json({ error: "ไม่พบอุปกรณ์" }, { status: 404 });
    }
  }

  const loan = await prisma.equipmentLoan.create({
    data: {
      direction: parsed.data.direction,
      equipmentId: parsed.data.equipmentId ?? null,
      equipmentName: parsed.data.equipmentName,
      quantity: parsed.data.quantity,
      counterparty: parsed.data.counterparty,
      borrowedAt: parsed.data.borrowedAt ? new Date(parsed.data.borrowedAt) : undefined,
      note: parsed.data.note ?? null,
    },
  });

  return NextResponse.json({ loan }, { status: 201 });
}
