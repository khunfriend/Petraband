import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const performances = await prisma.performance.findMany({
    include: {
      dates: { orderBy: { date: "asc" } },
      _count: { select: { songs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ performances });
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  dates: z
    .array(
      z.object({
        date: z.string().min(1),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );

  const { name, description, location, dates } = parsed.data;

  const performance = await prisma.performance.create({
    data: {
      name,
      description,
      location,
      dates: {
        create: dates.map((d) => ({
          date: new Date(d.date),
          startTime: d.startTime,
          endTime: d.endTime,
        })),
      },
    },
    include: { dates: { orderBy: { date: "asc" } } },
  });

  return NextResponse.json({ performance }, { status: 201 });
}
