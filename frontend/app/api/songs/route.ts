import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));

  const where = {
    ...(q && {
      title: { contains: q, mode: "insensitive" as const },
    }),
    ...(category && { category }),
  };

  const [songs, total] = await Promise.all([
    prisma.song.findMany({
      where,
      select: {
        id: true,
        songCode: true,
        title: true,
        category: true,
        duration: true,
        updatedAt: true,
      },
      orderBy: { title: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.song.count({ where }),
  ]);

  const categories = await prisma.song.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return NextResponse.json({
    songs,
    total,
    page,
    pages: Math.ceil(total / limit),
    categories: categories.map((c) => c.category),
  });
}

const createSchema = z.object({
  songCode: z.string().min(1),
  title: z.string().min(1),
  category: z.string().default("ดนตรีไทย"),
  duration: z.number().int().positive().nullable().optional(),
  sheetData: z.any().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const song = await prisma.song.create({ data: parsed.data });
  return NextResponse.json({ song }, { status: 201 });
}
