import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SongListClient from "./SongListClient";

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

  const [songs, categories, perCategory, allPerCategory] = await Promise.all([
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
    // Tab counts ignore the selected category, so the other tabs keep their numbers.
    prisma.song.groupBy({
      by: ["category"],
      where: q ? { title: { contains: q, mode: "insensitive" } } : {},
      _count: { _all: true },
    }),
    // Whole library, for "จัดการประเภท".
    isAdmin ? prisma.song.groupBy({ by: ["category"], _count: { _all: true } }) : Promise.resolve([]),
  ]);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-10">
      <SongListClient
        songs={songs}
        categories={categories.map((c) => c.category)}
        categoryCounts={Object.fromEntries(perCategory.map((c) => [c.category, c._count._all]))}
        initialQ={q}
        initialCategory={category}
        isAdmin={isAdmin}
        allCategoryCounts={Object.fromEntries(allPerCategory.map((c) => [c.category, c._count._all]))}
      />
    </div>
  );
}
