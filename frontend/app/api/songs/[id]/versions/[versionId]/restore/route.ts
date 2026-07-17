import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; versionId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, versionId } = await params;
  const version = await prisma.songVersion.findUnique({ where: { id: versionId } });
  if (!version || version.songId !== id) {
    return NextResponse.json({ error: "ไม่พบ version" }, { status: 404 });
  }

  // Snapshot current state before restoring
  const current = await prisma.song.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "ไม่พบเพลง" }, { status: 404 });

  await prisma.$transaction([
    // Save current as a new version
    prisma.songVersion.create({
      data: {
        songId: id,
        sheetData: current.sheetData ?? undefined,
        duration: current.duration,
        message: `ก่อนย้อนกลับเป็น "${version.message}"`,
        createdById: session.user.id,
      },
    }),
    // Restore
    prisma.song.update({
      where: { id },
      data: {
        sheetData: version.sheetData ?? undefined,
        duration: version.duration,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, sheetData: version.sheetData, duration: version.duration });
}
