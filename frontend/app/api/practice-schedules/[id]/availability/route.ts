import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  slotId: z.string().min(1),
  isAvailable: z.boolean(),
});

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { slotId, isAvailable } = parsed.data;

  const slot = await prisma.practiceSlot.findUnique({
    where: { id: slotId },
    include: { day: { select: { scheduleId: true } } },
  });

  if (!slot || slot.day.scheduleId !== id) {
    return NextResponse.json({ error: "Slot not found in this schedule" }, { status: 404 });
  }

  await prisma.practiceAvailability.upsert({
    where: { slotId_userId: { slotId, userId: session.user.id } },
    create: { slotId, userId: session.user.id, isAvailable },
    update: { isAvailable },
  });

  return NextResponse.json({ ok: true });
}
