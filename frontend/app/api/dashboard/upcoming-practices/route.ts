import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots = await prisma.practiceSlot.findMany({
    where: {
      day: { date: { gte: today } },
    },
    orderBy: [
      { day: { date: "asc" } },
      { slotOrder: "asc" },
    ],
    take: 5,
    include: {
      day: {
        include: {
          schedule: {
            include: {
              performance: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ slots });
}
