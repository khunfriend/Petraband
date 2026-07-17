import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const schedule = await prisma.practiceSchedule.findUnique({
    where: { id },
    include: {
      days: {
        include: {
          slots: {
            include: {
              availabilities: { where: { isAvailable: true }, select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!schedule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const summary: Record<string, number> = {};
  for (const day of schedule.days) {
    for (const slot of day.slots) {
      summary[slot.id] = slot.availabilities.length;
    }
  }

  return NextResponse.json({ summary });
}
