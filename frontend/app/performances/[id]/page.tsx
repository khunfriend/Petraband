import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import PerformanceClient from "./PerformanceClient";

type Params = { params: Promise<{ id: string }> };

export default async function PerformanceDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const [performance, participants, myMember, stageLayout, practiceSchedules] = await Promise.all([
    prisma.performance.findUnique({
      where: { id },
      include: {
        dates: { orderBy: { date: "asc" } },
        songs: {
          include: { song: { select: { id: true, title: true, songCode: true, category: true } } },
          orderBy: { order: "asc" },
        },
        heads: {
          include: { user: { select: { id: true, nickname: true, generation: true } } },
        },
      },
    }),
    prisma.performanceMember.findMany({
      where: { performanceId: id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            generation: true,
            primaryInstrument: { select: { nameThai: true } },
          },
        },
      },
      orderBy: [{ position: "asc" }, { joinedAt: "asc" }],
    }),
    session
      ? prisma.performanceMember.findFirst({
          where: { userId: session.user.id, performanceId: id },
        })
      : Promise.resolve(null),
    prisma.stageLayout.findFirst({
      where: { performanceId: id },
      include: {
        items: {
          include: {
            instrument: {
              select: { id: true, name: true, nameThai: true, iconType: true, footprintW: true, footprintH: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.practiceSchedule.findMany({
      where: { performanceId: id },
      include: {
        days: {
          include: { slots: { orderBy: { slotOrder: "asc" } } },
          orderBy: { dayOrder: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!performance) notFound();

  // Cast to include new fields added in schema (Prisma client regenerated on next build)
  const perf = performance as typeof performance & {
    costume: string | null;
    programSchedule: unknown;
    instrumentsNeeded: unknown;
  };

  const isAdmin = session?.user.role === "ADMIN";
  const isHead =
    session?.user.role === "HEAD" &&
    performance.heads.some((h) => h.userId === session.user.id);

  const assignedHeads = performance.heads.map((h) => ({
    id: h.user.id,
    nickname: h.user.nickname,
    generation: h.user.generation,
  }));

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/performances" className="hover:text-ink transition-colors">
          งานแสดง
        </Link>
        <span>/</span>
        <span className="text-ink">{performance.name}</span>
      </div>

      <PerformanceClient
        hasJoined={!!myMember}
        performance={{
          id: perf.id,
          name: perf.name,
          location: perf.location ?? null,
          description: perf.description ?? null,
          costume: perf.costume ?? null,
          dates: performance.dates.map((d) => ({
            id: d.id,
            date: d.date.toISOString(),
            startTime: d.startTime ?? null,
            endTime: d.endTime ?? null,
          })),
          songs: performance.songs.map((ps) => ({
            id: ps.id,
            songId: ps.song.id,
            order: ps.order,
            title: ps.song.title,
            songCode: ps.song.songCode,
            category: ps.song.category,
          })),
        }}
        participants={participants.map((m) => ({
          memberId: m.id,
          userId: m.user.id,
          nickname: m.user.nickname,
          generation: m.user.generation,
          primaryInstrumentNameThai: m.user.primaryInstrument?.nameThai ?? null,
          position: m.position,
        }))}
        isAdmin={isAdmin}
        isHead={isHead}
        assignedHeads={assignedHeads}
        stageLayout={
          stageLayout
            ? {
                id: stageLayout.id,
                name: stageLayout.name,
                widthUnits: stageLayout.widthUnits,
                heightUnits: stageLayout.heightUnits,
                unitLabel: stageLayout.unitLabel,
                items: stageLayout.items.map((it) => ({
                  id: it.id,
                  x: it.x,
                  y: it.y,
                  rotation: it.rotation,
                  label: it.label ?? "",
                  instrument: it.instrument,
                })),
              }
            : null
        }
        practiceSchedules={practiceSchedules.map((s) => ({
          id: s.id,
          title: s.title,
          days: s.days.map((d) => ({
            id: d.id,
            date: d.date.toISOString(),
            slots: d.slots.map((sl) => ({
              id: sl.id,
              startTime: sl.startTime,
              endTime: sl.endTime,
              label: sl.label,
              isSpecial: sl.isSpecial,
            })),
          })),
        }))}
      />
    </div>
  );
}
