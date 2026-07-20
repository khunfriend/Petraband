import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) return NextResponse.json({ error: "ไม่พบเพลง" }, { status: 404 });
  return NextResponse.json({ song });
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().optional(),
  duration: z.number().int().positive().nullable().optional(),
  sheetData: z.any().optional(),
  defaultBpm: z.number().int().min(30).max(240).nullable().optional(),
  defaultTimeSig: z.enum(["4/4", "3/4", "6/8", "12/8", "7/8"]).nullable().optional(),
  commitMessage: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const { commitMessage, ...songData } = parsed.data;
  const current = await prisma.song.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "ไม่พบเพลง" }, { status: 404 });

  const [, song] = await prisma.$transaction([
    prisma.songVersion.create({
      data: {
        songId: id,
        sheetData: current.sheetData ?? undefined,
        duration: current.duration,
        message: commitMessage?.trim() || "แก้ไขโน้ต",
        createdById: session.user.id,
      },
    }),
    prisma.song.update({ where: { id }, data: songData }),
  ]);

  return NextResponse.json({ song });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const performanceSongs = await prisma.performanceSong.findMany({
    where: { songId: id },
    select: { id: true },
  });
  const psIds = performanceSongs.map((ps) => ps.id);

  await prisma.$transaction([
    prisma.songAssignment.deleteMany({ where: { performanceSongId: { in: psIds } } }),
    prisma.performanceSong.deleteMany({ where: { songId: id } }),
    prisma.notebook.deleteMany({ where: { songId: id } }),
    prisma.song.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
