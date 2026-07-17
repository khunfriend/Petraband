import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import StageListClient from "./StageListClient";

type Params = { params: Promise<{ id: string }> };

export default async function StagesPage({ params }: Params) {
  const { id: performanceId } = await params;
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const [performance, stages] = await Promise.all([
    prisma.performance.findUnique({
      where: { id: performanceId },
      select: { id: true, name: true },
    }),
    prisma.stageLayout.findMany({
      where: { performanceId },
      include: {
        _count: { select: { versions: true, items: true } },
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, versionNumber: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!performance) notFound();

  // ถ้ามีผังเวทีแล้ว → ไปตรงๆ เลย
  if (stages.length > 0) {
    redirect(`/performances/${performanceId}/stages/${stages[0].id}`);
  }

  const templates = await prisma.stageTemplate.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, widthUnits: true, heightUnits: true, unitLabel: true },
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/performances" className="hover:text-ink transition-colors">
          งานแสดง
        </Link>
        <span>/</span>
        <Link href={`/performances/${performanceId}`} className="hover:text-ink transition-colors">
          {performance.name}
        </Link>
        <span>/</span>
        <span className="text-ink">ผังเวที</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">ผังเวที</h1>
      </div>

      <StageListClient
        performanceId={performanceId}
        stages={[]}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          widthUnits: t.widthUnits,
          heightUnits: t.heightUnits,
          unitLabel: t.unitLabel,
        }))}
        isAdmin={isAdmin}
      />
    </div>
  );
}
