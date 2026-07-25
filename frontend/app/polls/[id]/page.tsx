import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import PollClient from "./PollClient";

type Params = { params: Promise<{ id: string }> };

export default async function PollPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const poll = await prisma.availabilityPoll.findUnique({
    where: { id },
    include: {
      performance: {
        select: { id: true, name: true, heads: { select: { userId: true } } },
      },
      slots: {
        orderBy: [{ date: "asc" }, { slotOrder: "asc" }],
        include: {
          responses: {
            include: {
              user: { select: { id: true, nickname: true, generation: true } },
            },
          },
        },
      },
    },
  });
  if (!poll) notFound();

  const members = await prisma.performanceMember.findMany({
    where: { performanceId: poll.performanceId, position: "" },
    include: { user: { select: { id: true, nickname: true, generation: true } } },
  });

  const isAdmin = session.user.role === "ADMIN";
  const isHead =
    session.user.role === "HEAD" &&
    poll.performance.heads.some((h) => h.userId === session.user.id);
  const canManage = isAdmin || isHead;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/performances" className="hover:text-ink transition-colors">งานแสดง</Link>
        <span>/</span>
        <Link href={`/performances/${poll.performance.id}`} className="hover:text-ink transition-colors">
          {poll.performance.name}
        </Link>
        <span>/</span>
        <span className="text-ink">{poll.name}</span>
      </div>

      <PollClient
        canManage={canManage}
        currentUserId={session.user.id}
        poll={{
          id: poll.id,
          name: poll.name,
          status: poll.status,
          deadline: poll.deadline?.toISOString() ?? null,
          performanceId: poll.performance.id,
          performanceName: poll.performance.name,
          slots: poll.slots.map((s) => ({
            id: s.id,
            date: s.date.toISOString().slice(0, 10),
            startTime: s.startTime,
            endTime: s.endTime,
            availableUsers: s.responses
              .filter((r) => r.isAvailable)
              .map((r) => ({ id: r.user.id, nickname: r.user.nickname, generation: r.user.generation })),
            myResponse: s.responses.find((r) => r.user.id === session.user.id)?.isAvailable ?? false,
          })),
          members: members.map((m) => ({
            id: m.user.id,
            nickname: m.user.nickname,
            generation: m.user.generation,
          })),
        }}
      />
    </div>
  );
}
