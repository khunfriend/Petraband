import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const songSchema = z.object({
  songCode: z.string().min(1),
  title: z.string().min(1),
  category: z.string().default("ดนตรีไทย"),
  duration: z.number().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { songs } = await req.json();
  if (!Array.isArray(songs) || songs.length === 0) {
    return NextResponse.json({ error: "songs array required" }, { status: 400 });
  }

  let success = 0;
  let failed = 0;

  for (const raw of songs) {
    const parsed = songSchema.safeParse(raw);
    if (!parsed.success) { failed++; continue; }

    try {
      await prisma.song.upsert({
        where: { songCode: parsed.data.songCode },
        update: { title: parsed.data.title, category: parsed.data.category, duration: parsed.data.duration ?? null },
        create: { songCode: parsed.data.songCode, title: parsed.data.title, category: parsed.data.category, duration: parsed.data.duration ?? null },
      });
      success++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ success, failed });
}
