import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [pref, overrides] = await Promise.all([
    prisma.userPerformanceSheetPref.findUnique({
      where: { userId_performanceId: { userId: session.user.id, performanceId: id } },
    }),
    prisma.userSongSheetOverride.findMany({
      where: {
        userId: session.user.id,
        performanceSong: { performanceId: id },
      },
      select: { performanceSongId: true, sheetName: true },
    }),
  ]);

  return NextResponse.json({
    defaultSheet: pref?.sheetName ?? null,
    overrides,
  });
}

const putSchema = z.object({
  defaultSheet: z.string().min(1).nullable(),
  overrides: z.array(
    z.object({
      performanceSongId: z.string().min(1),
      sheetName: z.string().min(1),
    })
  ),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const userId = session.user.id;
  const { defaultSheet, overrides } = parsed.data;

  // Validate all overrides belong to this performance
  const validSongs = await prisma.performanceSong.findMany({
    where: {
      performanceId: id,
      id: { in: overrides.map((o) => o.performanceSongId) },
    },
    select: { id: true },
  });
  const validIds = new Set(validSongs.map((s) => s.id));
  const cleanOverrides = overrides.filter((o) => validIds.has(o.performanceSongId));

  await prisma.$transaction([
    defaultSheet
      ? prisma.userPerformanceSheetPref.upsert({
          where: { userId_performanceId: { userId, performanceId: id } },
          create: { userId, performanceId: id, sheetName: defaultSheet },
          update: { sheetName: defaultSheet },
        })
      : prisma.userPerformanceSheetPref.deleteMany({
          where: { userId, performanceId: id },
        }),
    prisma.userSongSheetOverride.deleteMany({
      where: {
        userId,
        performanceSong: { performanceId: id },
      },
    }),
    ...cleanOverrides.map((o) =>
      prisma.userSongSheetOverride.create({
        data: { userId, performanceSongId: o.performanceSongId, sheetName: o.sheetName },
      })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
