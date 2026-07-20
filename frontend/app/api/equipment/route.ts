import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";

  const equipment = await prisma.equipment.findMany({
    where: {
      ...(search && { name: { contains: search, mode: "insensitive" as const } }),
      ...(type && { type }),
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ equipment });
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  quantity: z.number().int().min(0).default(1),
  brokenQuantity: z.number().int().min(0).default(0),
  lengthCm: z.number().positive().nullable().optional(),
  widthCm: z.number().positive().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  note: z.string().nullable().optional(),
}).refine((d) => d.brokenQuantity <= d.quantity, {
  message: "จำนวนที่ต้องซ่อมต้องไม่เกินจำนวนทั้งหมด",
  path: ["brokenQuantity"],
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
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

  const equipment = await prisma.equipment.create({ data: parsed.data });
  return NextResponse.json({ equipment }, { status: 201 });
}
