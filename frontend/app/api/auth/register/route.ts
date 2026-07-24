import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(1).max(60),
  generation: z.string().max(20).default(""),
  primaryInstrumentId: z.string().optional().nullable(),
});

// Stash the pending registration row before the client calls
// supabase.auth.signUp. The Supabase signUp runs in the browser so
// PKCE cookies land on the same origin that /auth/callback runs on.
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

  await prisma.pendingRegistration.upsert({
    where: { email },
    create: { email, passwordHash, nickname, generation, primaryInstrumentId: primaryInstrumentId || null },
    update: { passwordHash, nickname, generation, primaryInstrumentId: primaryInstrumentId || null },
  });

  return NextResponse.json({ ok: true });
}
