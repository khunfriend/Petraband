import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setPerformanceSlug } from "@/lib/performanceSlug";
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
  /** Optional link name; empty → name + first date. */
  slug: z.string().max(100).optional(),
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

  const { name, description, location, dates, slug } = parsed.data;

  // Block dates before Bangkok "today" — performances must be scheduled forward
  const todayStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const pastDate = dates.find((d) => d.date < todayStr);
  if (pastDate) {
    return NextResponse.json(
      { error: `ห้ามสร้างงานย้อนหลัง วันที่ ${pastDate.date} อยู่ในอดีต` },
      { status: 400 }
    );
  }

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

  const slugResult = await setPerformanceSlug(performance.id, slug ?? "");
  if ("error" in slugResult) {
    // The show exists; fall back to the automatic link name and say why.
    const fallback = await setPerformanceSlug(performance.id, "");
    return NextResponse.json(
      { performance: { ...performance, slug: "slug" in fallback ? fallback.slug : null }, slugError: slugResult.error },
      { status: 201 },
    );
  }

  return NextResponse.json({ performance: { ...performance, slug: slugResult.slug } }, { status: 201 });
}
