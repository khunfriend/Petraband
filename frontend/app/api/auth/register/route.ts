import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendAdminNewPendingEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(1).max(60),
  generation: z.string().max(20).default(""),
  primaryInstrumentId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const { email, password, nickname, generation, primaryInstrumentId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "อีเมลนี้มีบัญชีอยู่แล้ว" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      nickname,
      generation,
      primaryInstrumentId: primaryInstrumentId || null,
      status: "PENDING_APPROVAL",
      role: "MEMBER",
    },
  });

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { email: true, nickname: true },
    });
    await Promise.all(
      admins.map((a) => sendAdminNewPendingEmail(a.email, a.nickname, nickname, email))
    );
  } catch (e) {
    console.error("[register] admin notify failed:", e);
  }

  return NextResponse.json({ ok: true });
}
