import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Deletes temporary accounts whose linked performance has fully passed (all dates in the past)
export async function POST() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find temp users whose linked performance has ended (max date < today), or whose performance was deleted (linkedPerformanceId = null but isTemporary)
  const deleted = await prisma.user.deleteMany({
    where: {
      isTemporary: true,
      OR: [
        { linkedPerformanceId: null },
        {
          linkedPerformance: {
            dates: {
              every: { date: { lt: today } },
            },
          },
        },
      ],
    },
  });

  return NextResponse.json({ deleted: deleted.count });
}
