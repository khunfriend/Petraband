import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Users, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import DashboardCalendar from "./dashboard/DashboardCalendar";
import type { CalendarPerformanceDate, CalendarPracticeDay } from "./dashboard/types";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Temporary accounts see only their assigned performance
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

  const rangeStart = new Date();
  rangeStart.setMonth(rangeStart.getMonth() - 1);
  rangeStart.setDate(1);
  rangeStart.setHours(0, 0, 0, 0);

  const rangeEnd = new Date();
  rangeEnd.setMonth(rangeEnd.getMonth() + 4);
  rangeEnd.setDate(0);
  rangeEnd.setHours(23, 59, 59, 999);

  const [performanceDates, practiceDays] = await Promise.all([
    prisma.performanceDate.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      include: {
        performance: { select: { id: true, name: true, location: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.practiceDay.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      include: {
        schedule: {
          include: {
            performance: { select: { id: true, name: true } },
          },
        },
        slots: {
          orderBy: { slotOrder: "asc" },
          select: { startTime: true, endTime: true, label: true, isSpecial: true },
        },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const perfDates: CalendarPerformanceDate[] = performanceDates.map((d) => ({
    id: d.id,
    date: d.date.toISOString().slice(0, 10),
    startTime: d.startTime,
    endTime: d.endTime,
    performance: d.performance,
  }));

  const pracDays: CalendarPracticeDay[] = practiceDays.map((d) => ({
    id: d.id,
    date: d.date.toISOString().slice(0, 10),
    scheduleId: d.scheduleId,
    scheduleTitle: d.schedule.title,
    performanceId: d.schedule.performance.id,
    performanceName: d.schedule.performance.name,
    slots: d.slots,
  }));

  // ─── Stats (derived from fetched data) ─────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const performancesThisMonth = performanceDates.filter(
    (d) => d.date >= monthStart && d.date <= monthEnd
  ).length;

  const practicesThisWeek = practiceDays.filter(
    (d) => d.date >= weekStart && d.date <= weekEnd
  ).length;

  const nextPerformance = performanceDates.find((d) => d.date >= now);
  const daysUntilNext = nextPerformance
    ? Math.ceil(
        (nextPerformance.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const todayLabel = now.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col gap-8">
      {/* Hero — the night sky from the logo */}
      <section className="pb-reveal rounded-[var(--radius-lg)] bg-surface-dark text-on-dark px-6 py-7 md:px-8 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight text-white">
              สวัสดี, {session.user.name}
            </h1>
            <p className="text-sm text-on-dark-soft">{todayLabel}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              icon={<CalendarDays size={18} strokeWidth={1.75} />}
              label="งานเดือนนี้"
              value={performancesThisMonth}
              unit="งาน"
            />
            <StatCard
              icon={<Users size={18} strokeWidth={1.75} />}
              label="ซ้อมสัปดาห์นี้"
              value={practicesThisWeek}
              unit="ครั้ง"
            />
            <NextEventCard performance={nextPerformance} daysUntil={daysUntilNext} />
          </div>
        </div>
      </section>

      <DashboardCalendar
        performanceDates={perfDates}
        practiceDays={pracDays}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] bg-white/[0.06] px-4 py-3 flex items-center gap-3">
      <div className="text-on-dark-soft shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-on-dark-soft">{label}</p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-white leading-none">{value}</span>
          <span className="text-xs text-on-dark-soft">{unit}</span>
        </p>
      </div>
    </div>
  );
}

type NextPerf = {
  date: Date;
  performance: { id: string; name: string; location: string | null };
};

function NextEventCard({
  performance,
  daysUntil,
}: {
  performance: NextPerf | undefined;
  daysUntil: number | null;
}) {
  if (!performance || daysUntil === null) {
    return (
      <div className="rounded-[var(--radius-md)] bg-white/[0.06] px-4 py-3 flex items-center gap-3">
        <div className="text-on-dark-soft shrink-0">
          <CalendarDays size={18} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-on-dark-soft">งานถัดไป</p>
          <p className="mt-1 text-sm text-on-dark-soft/80">ยังไม่มีงานในตาราง</p>
        </div>
      </div>
    );
  }

  // งานถัดไป = จุด coral จุดเดียวใน viewport (§9.2)
  return (
    <Link
      href={`/performances/${performance.performance.id}`}
      className="group rounded-[var(--radius-md)] bg-coral hover:bg-coral/90 px-4 py-3 flex items-center gap-3 transition-colors duration-[var(--duration-pb-base)] ease-[var(--ease-pb)]"
    >
      <div className="text-white shrink-0">
        <CalendarDays size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/85">
          งานถัดไป · {daysUntil <= 0 ? "วันนี้" : `อีก ${daysUntil} วัน`}
        </p>
        <p className="mt-0.5 text-base font-semibold text-white truncate">
          {performance.performance.name}
        </p>
      </div>
      <ArrowRight
        size={18}
        strokeWidth={1.75}
        className="text-white/80 shrink-0 transition-transform duration-[var(--duration-pb-base)] group-hover:translate-x-0.5"
      />
    </Link>
  );
}
