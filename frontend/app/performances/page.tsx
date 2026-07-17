import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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

function PerformanceCard({ p, past }: { p: Performance; past?: boolean }) {
  const earliest = p.dates[0];
  const latest = p.dates[p.dates.length - 1];

  return (
    <Link href={`/performances/${p.id}`} className="block">
      <Card className={`hover:border-coral transition-colors cursor-pointer ${past ? "opacity-70" : ""}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-ink truncate">{p.name}</h2>
              {past && (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-surface-cream-strong text-muted border border-hairline-soft">
                  เสร็จสิ้น
                </span>
              )}
            </div>
            {p.location && (
              <p className="text-sm text-muted mt-0.5">{p.location}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-soft">
              {earliest ? (
                <span>
                  {formatDate(earliest.date)}
                  {latest && String(latest.date) !== String(earliest.date) && ` – ${formatDate(latest.date)}`}
                  {earliest.startTime && ` · ${earliest.startTime}`}
                </span>
              ) : (
                <span>ยังไม่มีวันที่</span>
              )}
              {p.dates.length > 1 && <span>· {p.dates.length} วัน</span>}
              <span>· {p._count.songs} เพลง</span>
            </div>
          </div>
          <span className="text-muted-soft text-sm shrink-0">→</span>
        </div>
      </Card>
    </Link>
  );
}

export default async function PerformancesPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

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

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold tracking-[1.5px] uppercase text-muted mb-1">งานแสดง</p>
          <h1 className="text-2xl font-bold text-ink">งานแสดง · Performances</h1>
        </div>
        {isAdmin && (
          <Link href="/performances/create">
            <Button variant="coral" size="sm">+ สร้างงานแสดง</Button>
          </Link>
        )}
      </div>

      {/* Upcoming */}
      <section className="mb-10">
        <h2 className="text-xs font-bold tracking-[1.5px] uppercase text-muted mb-3">
          ที่กำลังจะมา · Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <Card>
            <p className="text-muted text-sm">ไม่มีงานแสดงที่กำลังจะมา</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((p) => (
              <PerformanceCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-bold tracking-[1.5px] uppercase text-muted mb-3">
            ประวัติการแสดง · History
          </h2>
          <div className="flex flex-col gap-3">
            {past.map((p) => (
              <PerformanceCard key={p.id} p={p} past />
            ))}
          </div>
        </section>
      )}

      {performances.length === 0 && (
        <Card>
          <p className="text-muted text-sm">ยังไม่มีงานแสดง</p>
        </Card>
      )}
    </div>
  );
}
