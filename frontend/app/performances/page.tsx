import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronRight, Music, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Performance = Awaited<ReturnType<typeof getPerformances>>[number];

async function getPerformances() {
  return prisma.performance.findMany({
    include: {
      dates: { orderBy: { date: "asc" } },
      _count: { select: { songs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

function PerformanceCard({
  p,
  past,
  isNext,
}: {
  p: Performance;
  past?: boolean;
  isNext?: boolean;
}) {
  const earliest = p.dates[0];
  const latest = p.dates[p.dates.length - 1];

  return (
    <Link
      href={`/performances/${p.id}`}
      className={`group block rounded-[var(--radius-lg)] border bg-surface-card transition-colors duration-[var(--duration-pb-base)] ease-[var(--ease-pb)] ${
        past
          ? "border-hairline-soft opacity-70 hover:opacity-100 hover:border-hairline"
          : "border-hairline hover:border-primary/60"
      }`}
    >
      <div className="flex items-center gap-4 p-5 md:p-6">
        {/* Date badge — coral only on `isNext`, else navy */}
        {earliest ? (
          <DateBadge date={new Date(earliest.date)} coral={isNext} />
        ) : (
          <div className="shrink-0 w-14 h-14 rounded-[var(--radius-md)] border border-dashed border-hairline flex flex-col items-center justify-center text-muted-soft">
            <CalendarDays size={16} strokeWidth={1.75} />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-ink group-hover:text-primary transition-colors truncate">
              {p.name}
            </h2>
            {past && <Badge variant="slate">เสร็จสิ้น</Badge>}
            {isNext && <Badge variant="coral">งานถัดไป</Badge>}
          </div>
          {p.location && (
            <p className="text-sm text-muted truncate">{p.location}</p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-soft flex-wrap">
            {earliest ? (
              <span>
                {formatDate(earliest.date)}
                {latest &&
                  String(latest.date) !== String(earliest.date) &&
                  ` – ${formatDate(latest.date)}`}
                {earliest.startTime && ` · ${earliest.startTime}`}
              </span>
            ) : (
              <span>ยังไม่มีวันที่</span>
            )}
            {p.dates.length > 1 && <span>· {p.dates.length} วัน</span>}
            <span className="inline-flex items-center gap-1">
              · <Music size={11} strokeWidth={1.75} />
              {p._count.songs} เพลง
            </span>
          </div>
        </div>

        <ChevronRight
          size={18}
          strokeWidth={1.75}
          className="shrink-0 text-muted-soft transition-transform duration-[var(--duration-pb-base)] group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>
    </Link>
  );
}

function DateBadge({ date, coral }: { date: Date; coral?: boolean }) {
  const day = date.toLocaleDateString("th-TH", { day: "numeric" });
  const month = date.toLocaleDateString("th-TH", { month: "short" });
  return (
    <div
      className={`shrink-0 w-14 h-14 rounded-[var(--radius-md)] flex flex-col items-center justify-center border ${
        coral
          ? "bg-[color:var(--color-coral-100)] border-[color:var(--color-coral-500)]/40 text-[color:var(--color-coral-700)]"
          : "bg-surface-cream-strong border-hairline text-ink"
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] leading-none">
        {month}
      </span>
      <span className="text-lg font-bold leading-none mt-1">{day}</span>
    </div>
  );
}

export default async function PerformancesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const isAdmin = session.user.role === "ADMIN";

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isTemporary: true, linkedPerformanceId: true },
  });
  if (currentUser?.isTemporary) {
    if (currentUser.linkedPerformanceId) {
      redirect(`/performances/${currentUser.linkedPerformanceId}`);
    }
    redirect("/login");
  }

  const performances = await getPerformances();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming: Performance[] = [];
  const past: Performance[] = [];

  for (const p of performances) {
    if (p.dates.length === 0) {
      upcoming.push(p);
      continue;
    }
    const latest = new Date(p.dates[p.dates.length - 1].date);
    latest.setHours(0, 0, 0, 0);
    if (latest.getTime() < today.getTime()) {
      past.push(p);
    } else {
      upcoming.push(p);
    }
  }

  // Determine "งานถัดไป" — the ONE coral point in this viewport
  const nextId = upcoming
    .filter((p) => p.dates.length > 0)
    .sort(
      (a, b) =>
        new Date(a.dates[0].date).getTime() -
        new Date(b.dates[0].date).getTime()
    )[0]?.id;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col gap-10">
      <PageHeader
        eyebrow="Performances · งานแสดง"
        title="งานแสดงของวง"
        description="ตารางงานที่กำลังจะมาและประวัติการแสดงย้อนหลัง"
        actions={
          isAdmin && (
            <Link href="/performances/create">
              <Button variant="primary">
                <Plus size={16} strokeWidth={1.75} />
                สร้างงานแสดง
              </Button>
            </Link>
          )
        }
      />

      {/* Upcoming */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">
          ที่กำลังจะมา · Upcoming
        </p>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={28} strokeWidth={1.75} />}
            title="ไม่มีงานแสดงที่กำลังจะมา"
            description={
              isAdmin
                ? "สร้างงานแสดงใหม่เพื่อเริ่มวางแผนซ้อมและจัดคิว"
                : undefined
            }
            action={
              isAdmin ? (
                <Link href="/performances/create">
                  <Button variant="primary" size="sm">
                    <Plus size={14} strokeWidth={1.75} />
                    สร้างงานแสดง
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcoming.map((p) => (
              <PerformanceCard key={p.id} p={p} isNext={p.id === nextId} />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {past.length > 0 && (
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">
            ประวัติการแสดง · History
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {past.map((p) => (
              <PerformanceCard key={p.id} p={p} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
