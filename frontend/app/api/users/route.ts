import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { guestEmail } from "@/lib/guest";
import { tempNicknameTaken } from "@/lib/guest-server";

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

// Members join through Google (/register); admins only create temporary
// accounts here, which sign in with nickname + password.
const createSchema = z.object({
  password: z.string().min(8),
  nickname: z.string().trim().min(1).max(50),
  contact: z.string().max(200).optional(),
  linkedPerformanceId: z.string().min(1),
  primaryInstrumentId: z.string().optional(),
  secondaryInstrumentIds: z.array(z.string()).default([]),
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
    password, nickname, contact, linkedPerformanceId,
    primaryInstrumentId, secondaryInstrumentIds,
  } = parsed.data;

  // The nickname is the login name, so it must not collide.
  if (await tempNicknameTaken(nickname)) {
    return NextResponse.json({ error: "ชื่อนี้มีบัญชีชั่วคราวใช้อยู่แล้ว" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: guestEmail(),
      passwordHash,
      nickname,
      contact: contact || null,
      isTemporary: true,
      linkedPerformanceId,
      role: "MEMBER",
      primaryInstrumentId: primaryInstrumentId || null,
      secondaryInstruments: {
        create: secondaryInstrumentIds.map((instrumentId) => ({ instrumentId })),
      },
    },
    select: { id: true, email: true, nickname: true, role: true, status: true, isTemporary: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
