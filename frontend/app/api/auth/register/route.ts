import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(1).max(50),
  generation: z.string().min(1), // e.g. "#17", "#สมทบ"
  primaryInstrumentId: z.string().optional(),
  secondaryInstrumentId: z.string().optional(),
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

  const { email, password, nickname, generation, primaryInstrumentId, secondaryInstrumentId } =
    parsed.data;

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
      generation,
      primaryInstrumentId: primaryInstrumentId || null,
      secondaryInstrumentId: secondaryInstrumentId || null,
    },
    select: { id: true, email: true, nickname: true, role: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
