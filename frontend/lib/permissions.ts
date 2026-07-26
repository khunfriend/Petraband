import { prisma } from "@/lib/prisma";

export async function canEditPerformance(
  userId: string,
  userRole: string,
  performanceId: string
): Promise<boolean> {
  // Past performances are frozen — nobody edits them, regardless of role
  const perf = await prisma.performance.findUnique({
    where: { id: performanceId },
    select: { dates: { orderBy: { date: "desc" }, take: 1, select: { date: true } } },
  });
  if (!perf) return false;
  if (perf.dates.length > 0) {
    const latestStr = perf.dates[0].date.toISOString().slice(0, 10);
    const todayStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
    if (latestStr < todayStr) return false;
  }

  if (userRole === "ADMIN") return true;
  if (userRole === "HEAD") {
    const head = await prisma.performanceHead.findUnique({
      where: { userId_performanceId: { userId, performanceId } },
    });
    return !!head;
  }
  return false;
}
