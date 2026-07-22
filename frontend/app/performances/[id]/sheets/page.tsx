import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NotationGrid, type SheetData } from "@/components/songs/NotationGrid";
import { NotebookSection } from "@/app/songs/[id]/NotebookSection";

type Params = { params: Promise<{ id: string }> };

function formatDuration(s: number | null) {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default async function PerformanceSheetsPage({ params }: Params) {
  const { id } = await params;
  await auth();

  const performance = await prisma.performance.findUnique({
    where: { id },
    include: {
      songs: {
        orderBy: { order: "asc" },
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
    },
  });

  if (!performance) notFound();

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      {/* Header */}
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

      {performance.songs.length === 0 ? (
        <p className="text-sm text-muted text-center py-16">ยังไม่มีเพลงในงานแสดงนี้</p>
      ) : (
        <div className="flex flex-col gap-12">
          {performance.songs.map((ps, i) => {
            const song = ps.song;
            const sheetData = song.sheetData as SheetData | null;
            const publishedSheets = song.notebooks[0]?.sheets ?? [];

            return (
              <div key={ps.id}>
                {/* Song header */}
                <div className="flex items-baseline gap-3 mb-4 pb-3 border-b-2 border-primary/20">
                  <span className="text-sm font-bold text-muted-soft w-6 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/songs/${song.id}`}
                      className="text-xl font-bold text-ink hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
                    >
                      {song.title}
                    </Link>
                    <span className="ml-3 text-sm text-muted-soft">{song.songCode}</span>
                    {formatDuration(song.duration) && (
                      <span className="ml-3 text-sm text-muted-soft">· {formatDuration(song.duration)}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted bg-surface-soft px-2 py-1 rounded-full border border-hairline shrink-0">
                    {song.category}
                  </span>
                </div>

                {/* Notation — prefer notebook published sheets, fallback to old sheetData */}
                <div className="pl-9">
                  {publishedSheets.length > 0 ? (
                    <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-lg)] p-6">
                      <NotebookSection sheets={publishedSheets} />
                    </div>
                  ) : sheetData && sheetData.rows.length > 0 ? (
                    <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-lg)] p-6">
                      <NotationGrid sheetData={sheetData} editable={false} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-soft">ยังไม่มีโน้ตเพลง</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
