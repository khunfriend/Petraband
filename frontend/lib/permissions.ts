import { prisma } from "@/lib/prisma";

export async function canEditPerformance(
  userId: string,
  userRole: string,
  performanceId: string
): Promise<boolean> {
  if (userRole === "ADMIN") return true;
  if (userRole === "HEAD") {
    const head = await prisma.performanceHead.findUnique({
      where: { userId_performanceId: { userId, performanceId } },
    });
    return !!head;
  }
  return false;
}
