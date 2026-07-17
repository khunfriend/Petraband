import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Optional ?performanceId=X — excludes Temp users linked to a different performance
  const performanceId = req.nextUrl.searchParams.get("performanceId");

  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      ...(performanceId && {
        OR: [
          { isTemporary: false },
          { isTemporary: true, linkedPerformanceId: performanceId },
        ],
      }),
    },
    select: {
      id: true,
      email: true,
      nickname: true,
      generation: true,
      role: true,
      status: true,
      isTemporary: true,
      linkedPerformanceId: true,
      primaryInstrument: { select: { id: true, name: true, nameThai: true } },
    },
    orderBy: { nickname: "asc" },
  });

  return NextResponse.json({ users });
}

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(1).max(50),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  avatarUrl: z.string().optional(),
  contact: z.string().max(200).optional(),
  generation: z.string().default(""),
  isTemporary: z.boolean().default(false),
  linkedPerformanceId: z.string().optional(),
  primaryInstrumentId: z.string().optional(),
  secondaryInstrumentIds: z.array(z.string()).default([]),
  role: z.enum(["MEMBER", "HEAD", "ADMIN"]).default("MEMBER"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    email, password, nickname, firstName, lastName, avatarUrl,
    contact, generation, isTemporary, linkedPerformanceId,
    primaryInstrumentId, secondaryInstrumentIds, role,
  } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nickname,
      firstName: firstName || null,
      lastName: lastName || null,
      avatarUrl: avatarUrl || null,
      contact: contact || null,
      generation,
      isTemporary,
      linkedPerformanceId: isTemporary ? (linkedPerformanceId || null) : null,
      role: isTemporary ? "MEMBER" : role,
      primaryInstrumentId: primaryInstrumentId || null,
      secondaryInstruments: {
        create: secondaryInstrumentIds.map((instrumentId) => ({ instrumentId })),
      },
    },
    select: { id: true, email: true, nickname: true, role: true, status: true, isTemporary: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
