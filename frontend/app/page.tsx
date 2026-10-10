import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CalendarClock, Users, ArrowRight, Music, Package, UserCheck, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { linksForRole } from "@/lib/navLinks";
import { prisma } from "@/lib/prisma";
import DashboardCalendar from "./dashboard/DashboardCalendar";
import type { CalendarPerformanceDate, CalendarPracticeDay } from "./dashboard/types";

const NAV_ADMIN = new Set(["/equipment", "/admin/pending-users"]);

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

  const isAdmin = session.user.role === "ADMIN";
  const pendingCount = isAdmin ? await prisma.user.count({ where: { status: "PENDING_APPROVAL" } }) : 0;
  const sectionIcons: Record<string, LucideIcon> = {
    "/songs": Music,
    "/performances": CalendarDays,
    "/members": Users,
    "/equipment": Package,
    "/admin/pending-users": UserCheck,
  };
  const links = linksForRole(session.user.role).map((l) => ({ href: l.href, label: l.label, icon: sectionIcons[l.href] ?? ArrowRight }));
  // App launcher grid: the main sections, then the next show, then admin tools.
  const appItems: { href: string; label: string; icon: LucideIcon; badge?: string }[] = [
    ...links.filter((l) => !NAV_ADMIN.has(l.href)).map((l) => ({ href: l.href, label: l.label, icon: l.icon })),
    ...(nextPerformance && daysUntilNext !== null
      ? [{
          href: `/performances/${nextPerformance.performance.id}`,
          label: "งานถัดไป",
          icon: CalendarClock,
          badge: daysUntilNext <= 0 ? "วันนี้" : `${daysUntilNext} วัน`,
        }]
      : []),
    ...links
      .filter((l) => NAV_ADMIN.has(l.href))
      .map((l) => ({
        href: l.href,
        label: l.href === "/admin/pending-users" ? "อนุมัติ" : l.label,
        icon: l.icon,
        badge: l.href === "/admin/pending-users" && pendingCount > 0 ? `${pendingCount}` : undefined,
      })),
  ];
  const initial = (session.user.name ?? "?").charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col gap-8">
      {/* In a browser: greeting and summary cards. */}
      <div className="standalone:hidden flex flex-col gap-8">
      <header className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight text-ink">
            สวัสดี, {session.user.name}
          </h1>
          <p className="text-sm text-muted">{todayLabel}</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 -mt-2">
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

      {/* Installed as an app (home-screen icon): a launcher screen — logo on
          navy up top, every section as an icon below. Fills the first screen;
          the calendar follows when scrolling. */}
      <section className="hidden standalone:flex -mx-4 -mt-6 min-h-[100dvh] flex-col bg-surface-card">
        <div className="relative bg-surface-dark rounded-b-[36px] pt-[calc(env(safe-area-inset-top)+12px)] pb-8 flex flex-col items-center">
          <Link
            href="/profile"
            aria-label="โปรไฟล์"
            className="absolute right-4 top-[calc(env(safe-area-inset-top)+12px)] w-11 h-11 rounded-full bg-white text-primary overflow-hidden flex items-center justify-center text-sm font-semibold shadow-sm"
          >
            {session.user.avatarUrl ? (
              <Image src={session.user.avatarUrl} alt="" width={44} height={44} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </Link>
          <Image
            src="/petraband-logo.png"
            alt="PETRAband"
            width={208}
            height={208}
            priority
            className="mt-10 w-52 h-52 rounded-full"
          />
          <p className="mt-4 text-2xl font-semibold tracking-wide text-white">PETRAband</p>
          <p className="mt-1 text-sm text-on-dark-soft">สวัสดี, {session.user.name}</p>
        </div>

        <nav aria-label="เมนูหลัก" className="flex-1 px-6 pt-10 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <ul className="grid grid-cols-3 gap-x-4 gap-y-8">
            {appItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} className="flex flex-col items-center gap-2 text-center active:opacity-70">
                    <span className="relative w-16 h-16 rounded-full border-[1.5px] border-primary text-primary flex items-center justify-center">
                      <Icon size={26} strokeWidth={1.5} />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-coral text-white text-[11px] font-bold leading-5 text-center ring-2 ring-surface-card">
                          {item.badge}
                        </span>
                      )}
                    </span>
                    <span className="text-[13px] font-medium text-primary leading-tight">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
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
    <div className="rounded-[var(--radius-md)] bg-surface-card border border-hairline px-4 py-3 flex items-center gap-3">
      <div className="text-muted shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-ink leading-none">{value}</span>
          <span className="text-xs text-muted">{unit}</span>
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
      <div className="rounded-[var(--radius-md)] bg-surface-card border border-hairline px-4 py-3 flex items-center gap-3">
        <div className="text-muted shrink-0">
          <CalendarDays size={18} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">งานถัดไป</p>
          <p className="mt-1 text-sm text-muted-soft">ยังไม่มีงานในตาราง</p>
        </div>
      </div>
    );
  }

  // งานถัดไป = จุด coral จุดเดียวใน viewport (§9.2)
  return (
    <Link
      href={`/performances/${performance.performance.id}`}
      className="group rounded-[var(--radius-md)] bg-surface-card border border-hairline border-l-[3px] border-l-coral px-4 py-3 flex items-center gap-3 transition-colors duration-[var(--duration-pb-base)] hover:border-primary/40 hover:border-l-coral"
    >
      <div className="text-coral shrink-0">
        <CalendarDays size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-coral">
          งานถัดไป · {daysUntil <= 0 ? "วันนี้" : `อีก ${daysUntil} วัน`}
        </p>
        <p className="mt-0.5 text-base font-semibold text-ink truncate">
          {performance.performance.name}
        </p>
      </div>
      <ArrowRight
        size={18}
        strokeWidth={1.75}
        className="text-muted-soft shrink-0 transition-transform duration-[var(--duration-pb-base)] group-hover:translate-x-0.5"
      />
    </Link>
  );
}
