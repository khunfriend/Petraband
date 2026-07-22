import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
    <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col gap-8">
      {/* Breadcrumb */}
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted"
      >
        <Link
          href="/songs"
          className="hover:text-ink transition-colors duration-[var(--duration-pb-base)]"
        >
          คลังเพลง
        </Link>
        <ChevronRight size={12} strokeWidth={1.75} className="text-muted-soft" />
        <span className="text-ink font-medium truncate">{song.title}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="pill">{song.category}</Badge>
          <span className="text-xs text-muted-soft font-mono">
            {song.songCode}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight">
          {song.title}
        </h1>
      </header>

      <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-6 md:p-8">
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
