import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const performanceSongs = await prisma.performanceSong.findMany({
    include: {
      song: { select: { id: true, songCode: true, title: true, category: true, duration: true } },
      performance: { select: { id: true, name: true } },
    },
    orderBy: [{ performance: { createdAt: "desc" } }, { order: "asc" }],
  });

  // Group by song, collect which performances each song appears in
  const songMap = new Map<string, {
    id: string; songCode: string; title: string; category: string; duration: number | null;
    performances: { id: string; name: string }[];
  }>();

  for (const ps of performanceSongs) {
    const s = ps.song;
    if (!songMap.has(s.id)) {
      songMap.set(s.id, { ...s, performances: [] });
    }
    songMap.get(s.id)!.performances.push(ps.performance);
  }

  const songs = Array.from(songMap.values()).sort((a, b) => a.title.localeCompare(b.title, "th"));
  const categories = [...new Set(songs.map((s) => s.category))].sort((a, b) => a.localeCompare(b, "th"));

  return NextResponse.json({ songs, categories, total: songs.length });
}
