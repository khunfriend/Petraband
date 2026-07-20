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
    include: {
      equipment: { select: { id: true, name: true, type: true, quantity: true } },
    },
    orderBy: [{ returnedAt: "asc" }, { borrowedAt: "desc" }],
  });

  return NextResponse.json({ loans });
}

const createSchema = z.object({
  equipmentId: z.string().min(1),
  direction: z.enum(["BORROWED_IN", "LENT_OUT"]),
  quantity: z.number().int().positive(),
  counterparty: z.string().min(1),
  borrowedAt: z.string().datetime().optional(),
  note: z.string().nullable().optional(),
});

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

  const equipment = await prisma.equipment.findUnique({
    where: { id: parsed.data.equipmentId },
  });
  if (!equipment) {
    return NextResponse.json({ error: "ไม่พบอุปกรณ์" }, { status: 404 });
  }

  const loan = await prisma.equipmentLoan.create({
    data: {
      ...parsed.data,
      borrowedAt: parsed.data.borrowedAt ? new Date(parsed.data.borrowedAt) : undefined,
      note: parsed.data.note ?? null,
    },
    include: {
      equipment: { select: { id: true, name: true, type: true, quantity: true } },
    },
  });

  return NextResponse.json({ loan }, { status: 201 });
}
