import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient, { type MemberStats } from "./DashboardClient";
import YearPicker from "./YearPicker";
import { bandYearLabel, bandYearOf, bandYearRange } from "@/lib/bandYear";
import { bangkokTodayStr } from "@/lib/today";

export const dynamic = "force-dynamic";

/** Admin overview of every member: role, shows played, roll-call record, instruments. */
export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  // Numbers count one band year (1 June – 31 May); the current one by default.
  const currentYear = bandYearOf(bangkokTodayStr());
  const asked = Number((await searchParams).year);
  const year = Number.isInteger(asked) && asked >= 2000 && asked <= currentYear ? asked : currentYear;
  const { start, end } = bandYearRange(year);
  const inYear = { gte: start, lt: end };
  const showInYear = { dates: { some: { date: inYear } } };

  const [users, lineups, heads, marks, rollCallDays] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE", isTemporary: false },
      orderBy: { nickname: "asc" },
      select: {
        id: true,
        nickname: true,
        firstName: true,
        lastName: true,
        generation: true,
        role: true,
        avatarUrl: true,
        primaryInstrument: { select: { nameThai: true } },
        secondaryInstruments: { orderBy: { rank: "asc" }, select: { instrument: { select: { nameThai: true } } } },
      },
    }),
    // One row per (person, show) — a person can hold several positions in one show.
    prisma.performanceMember.groupBy({ by: ["userId", "performanceId"], where: { performance: showInYear } }),
    prisma.performanceHead.groupBy({ by: ["userId"], where: { performance: showInYear }, _count: { _all: true } }),
    prisma.practiceAttendance.groupBy({ by: ["userId", "status"], where: { day: { date: inYear } }, _count: { _all: true } }),
    prisma.practiceDay.count({ where: { attendanceOpenedAt: { not: null }, date: inYear } }),
  ]);

  const showsBy = new Map<string, number>();
  for (const l of lineups) showsBy.set(l.userId, (showsBy.get(l.userId) ?? 0) + 1);
  const headsBy = new Map(heads.map((h) => [h.userId, h._count._all]));

  const members: MemberStats[] = users.map((u) => {
    const count = (status: string) =>
      marks.find((m) => m.userId === u.id && m.status === status)?._count._all ?? 0;
    return {
      id: u.id,
      nickname: u.nickname,
      fullName: [u.firstName, u.lastName].filter(Boolean).join(" "),
      generation: u.generation,
      role: u.role,
      avatarUrl: u.avatarUrl,
      shows: showsBy.get(u.id) ?? 0,
      headOf: headsBy.get(u.id) ?? 0,
      attendance: { PRESENT: count("PRESENT"), LATE: count("LATE"), EXCUSED: count("EXCUSED"), ABSENT: count("ABSENT") },
      instruments: [
        ...(u.primaryInstrument ? [u.primaryInstrument.nameThai] : []),
        ...u.secondaryInstruments.map((s) => s.instrument.nameThai),
      ],
    };
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">แดชบอร์ดสมาชิก</h1>
        <p className="mt-1 text-sm text-muted">ยศ การเข้าร่วมงาน ความตรงต่อเวลา และเครื่องที่เล่นได้ของสมาชิกทุกคน</p>
      </div>
      <YearPicker
        year={year}
        options={Array.from({ length: Math.min(5, currentYear - 2024 + 1) }, (_, i) => currentYear - i).map((y) => ({
          value: y,
          label: bandYearLabel(y),
        }))}
      />
      <DashboardClient members={members} rollCallDays={rollCallDays} />
    </div>
  );
}
