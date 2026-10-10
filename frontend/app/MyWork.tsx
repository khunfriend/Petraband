import Link from "next/link";
import { CalendarDays, ChevronRight, Vote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { bangkokTodayStr } from "@/lib/today";

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Bangkok" });
}

/**
 * Home-page block: the upcoming shows the user plays in (or heads), and the
 * open availability polls of those shows. Only people in a show see its polls.
 */
export async function MyWork({ userId }: { userId: string }) {
  const todayStr = bangkokTodayStr();
  const performances = await prisma.performance.findMany({
    where: { OR: [{ members: { some: { userId } } }, { heads: { some: { userId } } }] },
    select: {
      id: true,
      slug: true,
      name: true,
      location: true,
      dates: { orderBy: { date: "asc" }, select: { date: true } },
      availabilityPolls: {
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          deadline: true,
          // Any answer of mine on any slot → I've already filled it in.
          slots: { select: { responses: { where: { userId }, select: { id: true }, take: 1 } } },
        },
      },
    },
  });

  // Shows still to come (or not dated yet), soonest first.
  const upcoming = performances
    .filter((p) => !p.dates.length || p.dates[p.dates.length - 1].date.toISOString().slice(0, 10) >= todayStr)
    .sort((a, b) => (a.dates[0]?.date.getTime() ?? Infinity) - (b.dates[0]?.date.getTime() ?? Infinity));

  const polls = upcoming.flatMap((p) =>
    p.availabilityPolls
      .filter((poll) => !poll.deadline || poll.deadline.getTime() >= Date.now())
      .map((poll) => ({
        ...poll,
        performanceName: p.name,
        answered: poll.slots.some((s) => s.responses.length > 0),
      })),
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-ink">
          งานของฉัน <span className="text-muted font-normal">{upcoming.length} งาน</span>
        </h2>
        <Link href="/performances" className="text-sm text-muted hover:text-primary">
          ดูทั้งหมด
        </Link>
      </div>

      {polls.length > 0 && (
        <div className="flex flex-col gap-2">
          {polls.map((poll) => (
            <Link
              key={poll.id}
              href={`/polls/${encodeURIComponent(poll.slug ?? poll.id)}`}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-hairline border-l-[3px] border-l-coral bg-surface-card px-4 py-3 hover:border-primary/40 hover:border-l-coral"
            >
              <Vote size={20} strokeWidth={1.75} className="shrink-0 text-coral" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{poll.name}</p>
                <p className="text-xs text-muted truncate">
                  {poll.performanceName}
                  {poll.deadline && ` · หมดเขต ${formatDate(poll.deadline)}`}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  poll.answered
                    ? "bg-[color:var(--color-success-bg)] text-[color:var(--color-success-fg)]"
                    : "bg-coral text-white"
                }`}
              >
                {poll.answered ? "ตอบแล้ว" : "รอตอบ"}
              </span>
              <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-muted-soft" />
            </Link>
          ))}
        </div>
      )}

      {upcoming.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-hairline px-4 py-5 text-sm text-muted text-center">
          ยังไม่มีงานที่คุณอยู่ในรายชื่อ
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {upcoming.map((p) => (
            <Link
              key={p.id}
              href={`/performances/${encodeURIComponent(p.slug ?? p.id)}`}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-hairline bg-surface-card px-4 py-3 hover:border-primary/40"
            >
              <CalendarDays size={20} strokeWidth={1.75} className="shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                <p className="text-xs text-muted truncate">
                  {p.dates[0] ? formatDate(p.dates[0].date) : "ยังไม่มีวันที่"}
                  {p.location && ` · ${p.location}`}
                </p>
              </div>
              <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-muted-soft" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
