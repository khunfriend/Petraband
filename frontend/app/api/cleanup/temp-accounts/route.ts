import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Downgrades temporary accounts whose linked performance has fully passed (all dates in the past)
// Keeps the record for audit; sets status = EXPIRED so login is blocked.
export async function POST() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.user.updateMany({
    where: {
      isTemporary: true,
      status: "ACTIVE",
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
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({ expired: result.count });
}
