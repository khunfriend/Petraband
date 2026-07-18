import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SongListClient from "./SongListClient";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;

  const where = {
    ...(q && { title: { contains: q, mode: "insensitive" as const } }),
    ...(category && { category }),
  };

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [songs, categories] = await Promise.all([
    prisma.song.findMany({
      where,
      select: { id: true, songCode: true, title: true, category: true, duration: true },
      orderBy: { title: "asc" },
      take: 200,
    }),
    prisma.song.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Eyebrow className="mb-1">คลังเพลง</Eyebrow>
          <h1 className="text-2xl font-bold text-ink">เพลง · Songs</h1>
        </div>
      </div>

      <SongListClient
        songs={songs}
        categories={categories.map((c) => c.category)}
        initialQ={q}
        initialCategory={category}
        isAdmin={isAdmin}
      />
    </div>
  );
}
