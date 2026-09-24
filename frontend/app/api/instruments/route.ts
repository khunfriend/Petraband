import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { instrumentCreateSchema } from "@/lib/instrumentSchema";

const select = {
  id: true,
  name: true,
  nameThai: true,
  allowsConcurrent: true,
  footprintW: true,
  footprintH: true,
  iconType: true,
  isPlayable: true,
} as const;

export async function GET() {
  const instruments = await prisma.instrument.findMany({
    orderBy: { nameThai: "asc" },
    select,
  });
  return NextResponse.json({ instruments });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = instrumentCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const clash = await prisma.instrument.findFirst({
    where: { nameThai: parsed.data.nameThai },
    select: { id: true },
  });
  if (clash) {
    return NextResponse.json({ error: "มีชื่อนี้ในคลังแล้ว" }, { status: 409 });
  }

  const instrument = await prisma.instrument.create({
    // `name` is a unique internal key; seeded rows use romanised names.
    data: { ...parsed.data, name: `custom-${crypto.randomUUID()}` },
    select,
  });
  return NextResponse.json({ instrument }, { status: 201 });
}
