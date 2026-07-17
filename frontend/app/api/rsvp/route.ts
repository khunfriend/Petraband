import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const performanceId = req.nextUrl.searchParams.get("performanceId");
  if (!performanceId)
    return NextResponse.json({ error: "performanceId required" }, { status: 400 });

  const rsvps = await prisma.rsvp.findMany({
    where: {
      userId: session.user.id,
      performanceDate: { performanceId },
    },
    include: { performanceDate: true },
  });

  return NextResponse.json({ rsvps });
}

const upsertSchema = z.object({
  performanceDateId: z.string().min(1),
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "PENDING"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );

  // Temp accounts can only RSVP to their linked performance
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isTemporary: true, linkedPerformanceId: true },
  });
  if (currentUser?.isTemporary) {
    const perfDate = await prisma.performanceDate.findUnique({
      where: { id: parsed.data.performanceDateId },
      select: { performanceId: true },
    });
    if (!perfDate || perfDate.performanceId !== currentUser.linkedPerformanceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const rsvp = await prisma.rsvp.upsert({
    where: {
      userId_performanceDateId: {
        userId: session.user.id,
        performanceDateId: parsed.data.performanceDateId,
      },
    },
    update: { status: parsed.data.status },
    create: {
      userId: session.user.id,
      performanceDateId: parsed.data.performanceDateId,
      status: parsed.data.status,
    },
  });

  return NextResponse.json({ rsvp });
}
