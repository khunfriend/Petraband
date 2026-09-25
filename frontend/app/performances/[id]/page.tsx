import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import PerformanceClient from "./PerformanceClient";

type Params = { params: Promise<{ id: string }> };

export default async function PerformanceDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  // Temp accounts can only access their linked performance
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isTemporary: true, linkedPerformanceId: true },
  });
  if (currentUser?.isTemporary && currentUser.linkedPerformanceId !== id) {
    notFound();
  }

  const [performance, participants, myMember, stageLayout, practiceSchedules, polls, sections, lineupSections] = await Promise.all([
    prisma.performance.findUnique({
      where: { id },
      include: {
        dates: { orderBy: { date: "asc" } },
        songs: {
          include: { song: { select: { id: true, title: true, songCode: true, category: true } } },
          orderBy: [{ sectionId: "asc" }, { orderInSection: "asc" }, { order: "asc" }],
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
    prisma.availabilityPoll.findMany({
      where: { performanceId: id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { slots: true } },
        slots: { select: { _count: { select: { responses: true } } } },
      },
    }),
    prisma.performanceSection.findMany({
      where: { performanceId: id },
      orderBy: { sectionOrder: "asc" },
    }),
    prisma.lineupSection.findMany({
      where: { performanceId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
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

  // Until someone joins, they only get the top of the page (info, costume,
  // notes, songs). The lineup, practice, polls and stage plot aren't even
  // sent — hiding them client-side would still leak them in the payload.
  const canSeeFull = isAdmin || isHead || !!myMember;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-10">
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted mb-6"
      >
        <Link
          href="/performances"
          className="hover:text-ink transition-colors duration-[var(--duration-pb-base)]"
        >
          งานแสดง
        </Link>
        <ChevronRight size={12} strokeWidth={1.75} className="text-muted-soft" />
        <span className="text-ink font-medium truncate">{performance.name}</span>
      </nav>

      <PerformanceClient
        // Remount when access changes (join / leave + router.refresh) so the
        // client state is rebuilt from the newly visible data.
        key={canSeeFull ? "full" : "limited"}
        canSeeFull={canSeeFull}
        hasJoined={!!myMember}
        performance={{
          id: perf.id,
          name: perf.name,
          location: perf.location ?? null,
          description: perf.description ?? null,
          costume: perf.costume ?? null,
          equipmentNotes: (perf.equipmentNotes as Record<string, string> | null) ?? null,
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
            sectionId: ps.sectionId ?? null,
            orderInSection: ps.orderInSection,
          })),
          sections: sections.map((s) => ({
            id: s.id,
            name: s.name,
            sectionOrder: s.sectionOrder,
          })),
        }}
        participants={(canSeeFull ? participants : []).map((m) => ({
          memberId: m.id,
          userId: m.user.id,
          nickname: m.user.nickname,
          generation: m.user.generation,
          primaryInstrumentNameThai: m.user.primaryInstrument?.nameThai ?? null,
          position: m.position,
          sectionId: m.sectionId,
        }))}
        lineupSections={canSeeFull ? lineupSections : []}
        isAdmin={isAdmin}
        isHead={isHead}
        stageLayout={
          canSeeFull && stageLayout
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
                  customName: it.customName,
                  customWidth: it.customWidth,
                  customHeight: it.customHeight,
                  instrument: it.instrument,
                })),
              }
            : null
        }
        practiceSchedules={(canSeeFull ? practiceSchedules : []).map((s) => ({
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
        polls={(canSeeFull ? polls : []).map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          deadline: p.deadline?.toISOString() ?? null,
          slotCount: p._count.slots,
          responseCount: p.slots.reduce((sum, s) => sum + s._count.responses, 0),
        }))}
      />
    </div>
  );
}
