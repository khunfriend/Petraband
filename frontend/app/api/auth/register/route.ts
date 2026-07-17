import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
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
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    email, password, nickname, firstName, lastName, avatarUrl,
    contact, generation, isTemporary, linkedPerformanceId, primaryInstrumentId, secondaryInstrumentIds,
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
      primaryInstrumentId: primaryInstrumentId || null,
      secondaryInstruments: {
        create: secondaryInstrumentIds.map((instrumentId) => ({ instrumentId })),
      },
    },
    select: { id: true, email: true, nickname: true, role: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
