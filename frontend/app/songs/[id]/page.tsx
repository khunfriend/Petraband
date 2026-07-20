import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import SongDetailClient from "./SongDetailClient";
import { NotebookSection } from "./NotebookSection";

type Params = { params: Promise<{ id: string }> };

export default async function SongDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) notFound();

  const notebook = await prisma.notebook.findFirst({
    where: { songId: id },
    include: {
      sheets: {
        where: { isPublished: true },
        select: { id: true, name: true, sheetOrder: true },
        orderBy: { sheetOrder: "asc" },
      },
    },
  });
  const publishedSheets = notebook?.sheets ?? [];

  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/songs" className="hover:text-ink transition-colors">เพลง</Link>
        <span>/</span>
        <span className="text-ink">{song.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="pill">{song.category}</Badge>
            <span className="text-xs text-muted-soft">{song.songCode}</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">{song.title}</h1>
        </div>
      </div>

      {/* Notation Grid */}
      <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-lg)] p-6">
        <SongDetailClient
          song={{
            id: song.id,
            title: song.title,
            category: song.category,
            duration: song.duration,
            sheetData: song.sheetData,
            defaultBpm: song.defaultBpm,
            defaultTimeSig: song.defaultTimeSig,
          }}
          isAdmin={isAdmin}
        />
        {publishedSheets.length > 0 && (
          <NotebookSection sheets={publishedSheets} />
        )}
      </div>
    </div>
  );
}
