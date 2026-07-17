import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const performances = await prisma.performance.findMany({
    where: {
      dates: { some: { date: { gte: today } } },
    },
    select: {
      id: true,
      name: true,
      dates: {
        select: { date: true },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ performances });
}
