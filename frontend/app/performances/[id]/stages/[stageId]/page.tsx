import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import StageEditor from "./StageEditor";

type Params = { params: Promise<{ id: string; stageId: string }> };

export default async function StageEditorPage({ params }: Params) {
  const { id: performanceId, stageId } = await params;
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const [stage, instruments, performance, members] = await Promise.all([
    prisma.stageLayout.findUnique({
      where: { id: stageId },
      include: {
        items: {
          include: {
            instrument: {
              select: {
                id: true,
                name: true,
                nameThai: true,
                footprintW: true,
                footprintH: true,
                iconType: true,
              },
            },
          },
          orderBy: { layerOrder: "asc" },
        },
      },
    }),
    prisma.instrument.findMany({
      orderBy: { nameThai: "asc" },
      select: {
        id: true,
        name: true,
        nameThai: true,
        footprintW: true,
        footprintH: true,
        iconType: true,
      },
    }),
    prisma.performance.findUnique({
      where: { id: performanceId },
      select: { id: true, name: true },
    }),
    prisma.performanceMember.findMany({
      where: { performanceId, position: "" },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            generation: true,
            primaryInstrumentId: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  if (!stage || !performance) notFound();

  const participants = members.map((m) => ({
    userId: m.user.id,
    nickname: m.user.nickname,
    generation: m.user.generation,
    primaryInstrumentId: m.user.primaryInstrumentId,
  }));

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-4">
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

      <StageEditor
        stageId={stageId}
        performanceId={performanceId}
        initialStage={{
          id: stage.id,
          name: stage.name,
          widthUnits: stage.widthUnits,
          heightUnits: stage.heightUnits,
          unitLabel: stage.unitLabel,
          items: stage.items.map((item) => ({
            id: item.id,
            instrumentId: item.instrumentId,
            x: item.x,
            y: item.y,
            rotation: item.rotation,
            layerOrder: item.layerOrder,
            label: item.label ?? "",
            instrument: item.instrument,
          })),
        }}
        instruments={instruments}
        participants={participants}
        isAdmin={isAdmin}
      />
    </div>
  );
}
