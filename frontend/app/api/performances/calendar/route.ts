import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const performances = await prisma.performance.findMany({
    where: {
      dates: {
        some: {
          date: { gte: start, lt: end },
        },
      },
    },
    include: {
      dates: {
        where: { date: { gte: start, lt: end } },
        orderBy: { date: "asc" },
      },
    },
  });

  return NextResponse.json({ performances, year, month });
}
