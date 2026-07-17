import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const songId = searchParams.get("songId");

  const notebooks = await prisma.notebook.findMany({
    where: songId ? { songId } : undefined,
    include: {
      _count: { select: { sheets: true } },
      song: { select: { id: true, title: true, songCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    notebooks: notebooks.map((n) => ({
      id: n.id,
      name: n.name,
      songId: n.songId,
      song: n.song,
      sheetCount: n._count.sheets,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
  });
}

const createSchema = z.object({
  songId: z.string().optional().nullable(),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const { songId, name } = parsed.data;

  // Verify song exists if provided
  if (songId) {
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) return NextResponse.json({ error: "ไม่พบเพลงที่ระบุ" }, { status: 404 });
  }

  const notebook = await prisma.notebook.create({
    data: { songId: songId ?? null, name },
    include: {
      _count: { select: { sheets: true } },
      song: { select: { id: true, title: true, songCode: true } },
    },
  });

  return NextResponse.json({ notebook }, { status: 201 });
}
