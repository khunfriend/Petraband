import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Users, Sparkles, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
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
      <section className="pb-reveal relative overflow-hidden rounded-[var(--radius-xl)] bg-surface-dark text-on-dark px-6 py-8 md:px-10 md:py-10 shadow-[0_24px_48px_-28px_rgb(13_27_51/0.9)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 260px at 85% 10%, rgb(201 162 75 / 0.18), transparent 70%), radial-gradient(500px 300px at 0% 100%, rgb(217 79 127 / 0.14), transparent 70%)",
          }}
        />
        <Image
          src="/petraband-logo.png"
          alt=""
          width={320}
          height={320}
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-20 w-64 md:w-80 opacity-[0.12] rotate-[-8deg]"
        />
        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">
              <span aria-hidden className="h-px w-6 bg-gold" />
              PETRAband
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-semibold leading-[1.15] text-white">
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
    <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.06] backdrop-blur-sm p-4 md:p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-white/10 text-gold flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-on-dark-soft">{label}</p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-semibold text-white leading-none">{value}</span>
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
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.06] p-4 md:p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/10 text-on-dark-soft flex items-center justify-center shrink-0">
          <Sparkles size={18} strokeWidth={1.75} />
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
      className="group rounded-[var(--radius-lg)] bg-coral/90 hover:bg-coral p-4 md:p-5 flex items-center gap-4 transition-colors duration-[var(--duration-pb-base)] ease-[var(--ease-pb)] shadow-[0_12px_28px_-16px_rgb(217_79_127/0.9)]"
    >
      <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
        <Sparkles size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/85">
          งานถัดไป · {daysUntil <= 0 ? "วันนี้" : `อีก ${daysUntil} วัน`}
        </p>
        <p className="mt-1 font-display text-lg font-semibold text-white truncate">
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
