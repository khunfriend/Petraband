import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CalendarClock, Users, ArrowRight, Music, Package, UserCheck, UserRound, BadgeCheck, type LucideIcon } from "lucide-react";
import { ShortcutPager, type Shortcut } from "@/components/app/ShortcutPager";
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
  // App home tiles: next show first, then the sections, admin tools last.
  const tone: Record<string, string> = {
    "/performances": "bg-sky-50 text-sky-700",
    "/songs": "bg-orange-50 text-orange-700",
    "/members": "bg-violet-50 text-violet-700",
    "/equipment": "bg-amber-50 text-amber-700",
    "/admin/pending-users": "bg-rose-50 text-rose-700",
  };
  const order = ["/performances", "/songs", "/members"];
  const shortcuts: Shortcut[] = [
    ...(nextPerformance && daysUntilNext !== null
      ? [{
          href: `/performances/${nextPerformance.performance.id}`,
          label: "งานถัดไป",
          icon: <CalendarClock size={30} strokeWidth={1.6} />,
          tone: "bg-emerald-50 text-emerald-700",
          badge: daysUntilNext <= 0 ? "วันนี้" : `${daysUntilNext} วัน`,
        }]
      : []),
    ...order
      .map((href) => links.find((l) => l.href === href))
      .filter((l): l is (typeof links)[number] => !!l)
      .map((l) => ({ href: l.href, label: l.label, icon: <l.icon size={30} strokeWidth={1.6} />, tone: tone[l.href] })),
    { href: "/profile", label: "โปรไฟล์", icon: <UserRound size={30} strokeWidth={1.6} />, tone: "bg-purple-50 text-purple-700" },
    ...links
      .filter((l) => NAV_ADMIN.has(l.href))
      .map((l) => ({
        href: l.href,
        label: l.href === "/admin/pending-users" ? "อนุมัติสมาชิก" : l.label,
        icon: <l.icon size={30} strokeWidth={1.6} />,
        tone: tone[l.href],
        badge: l.href === "/admin/pending-users" && pendingCount > 0 ? `${pendingCount}` : undefined,
      })),
  ];
  const roleLabel =
    session.user.role === "ADMIN" ? "แอดมิน" : session.user.role === "HEAD" ? "หัวหน้าวง" : "สมาชิกวง";

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

      {/* Installed as an app (home-screen icon): page title, greeting banner
          and the sections as colour tiles; the tab bar sits at the bottom. */}
      <div className="hidden standalone:flex flex-col gap-5 -mt-1">
        <h1 className="text-3xl font-bold text-ink">หน้าหลัก</h1>
        <section className="rounded-[28px] px-6 py-6 text-white bg-gradient-to-br from-primary via-navy-600 to-blue-400">
          <p className="flex items-center gap-2 text-sm text-white/85">
            <BadgeCheck size={18} strokeWidth={1.75} />
            {roleLabel}
          </p>
          <p className="mt-3 text-2xl font-semibold">สวัสดี {session.user.name}</p>
          <p className="mt-2 text-sm text-white/85">{todayLabel}</p>
        </section>
        <ShortcutPager title="ทั่วไป" items={shortcuts} />
      </div>

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
