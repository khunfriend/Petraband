import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { SheetData } from "@/components/songs/NotationGrid";
import PerformanceSheetsClient from "./PerformanceSheetsClient";
import { sortSheetsByCanonicalOrder } from "@/lib/sheetOrder";

type Params = { params: Promise<{ id: string }> };

export default async function PerformanceSheetsPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const [performance, pref, overrideRows] = await Promise.all([
    prisma.performance.findUnique({
      where: { id },
      include: {
        songs: {
          orderBy: [{ sectionId: "asc" }, { orderInSection: "asc" }, { order: "asc" }],
          include: {
            song: {
              select: {
                id: true,
                songCode: true,
                title: true,
                category: true,
                duration: true,
                sheetData: true,
                notebooks: {
                  take: 1,
                  include: {
                    sheets: {
                      where: { isPublished: true },
                      select: { id: true, name: true, sheetOrder: true },
                      orderBy: { sheetOrder: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
        sections: { orderBy: { sectionOrder: "asc" } },
      },
    }),
    prisma.userPerformanceSheetPref.findUnique({
      where: { userId_performanceId: { userId: session.user.id, performanceId: id } },
    }),
    prisma.userSongSheetOverride.findMany({
      where: { userId: session.user.id, performanceSong: { performanceId: id } },
      select: { performanceSongId: true, sheetName: true },
    }),
  ]);

  if (!performance) notFound();

  const clientSongs = performance.songs.map((ps) => ({
    id: ps.id,
    sectionId: ps.sectionId,
    song: {
      id: ps.song.id,
      songCode: ps.song.songCode,
      title: ps.song.title,
      category: ps.song.category,
      duration: ps.song.duration,
      sheetData: ps.song.sheetData as SheetData | null,
      publishedSheets: sortSheetsByCanonicalOrder(ps.song.notebooks[0]?.sheets ?? []),
    },
  }));

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-2">
        <Link href="/performances" className="hover:text-ink transition-colors">งานแสดง</Link>
        <span>/</span>
        <Link href={`/performances/${id}`} className="hover:text-ink transition-colors">{performance.name}</Link>
        <span>/</span>
        <span className="text-ink">โน้ตเพลง</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">{performance.name}</h1>
          <p className="text-sm text-muted mt-1">{performance.songs.length} เพลง</p>
        </div>
        <Link
          href={`/performances/${id}`}
          className="text-sm text-muted hover:text-ink transition-colors"
        >
          ← กลับ
        </Link>
      </div>

      {performance.songs.length === 0 && performance.sections.length === 0 ? (
        <p className="text-sm text-muted text-center py-16">ยังไม่มีเพลงในงานแสดงนี้</p>
      ) : (
        <PerformanceSheetsClient
          performanceId={id}
          songs={clientSongs}
          sections={performance.sections.map((s) => ({ id: s.id, name: s.name }))}
          initialDefaultSheet={pref?.sheetName ?? null}
          initialOverrides={overrideRows}
        />
      )}
    </div>
  );
}
