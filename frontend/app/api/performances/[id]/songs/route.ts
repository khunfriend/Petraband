import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const songs = await prisma.performanceSong.findMany({
    where: { performanceId: id },
    include: { song: { select: { id: true, title: true, songCode: true, category: true } } },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ songs });
}

const addSongSchema = z.object({
  songId: z.string().min(1),
  order: z.number().int().optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = addSongSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );

  const maxOrder = await prisma.performanceSong.aggregate({
    where: { performanceId: id },
    _max: { order: true },
  });

  const performanceSong = await prisma.performanceSong.create({
    data: {
      performanceId: id,
      songId: parsed.data.songId,
      order: parsed.data.order ?? (maxOrder._max.order ?? -1) + 1,
    },
    include: { song: { select: { id: true, title: true, songCode: true, category: true } } },
  });

  return NextResponse.json({ performanceSong }, { status: 201 });
}

const removeSongSchema = z.object({
  songId: z.string().min(1),
});

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = removeSongSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );

  await prisma.performanceSong.deleteMany({
    where: { performanceId: id, songId: parsed.data.songId },
  });

  return NextResponse.json({ ok: true });
}
