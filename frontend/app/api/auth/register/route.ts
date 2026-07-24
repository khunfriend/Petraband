import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseServer } from "@/lib/supabase-server";

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

  await prisma.pendingRegistration.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      nickname,
      generation,
      primaryInstrumentId: primaryInstrumentId || null,
    },
    update: {
      passwordHash,
      nickname,
      generation,
      primaryInstrumentId: primaryInstrumentId || null,
    },
  });

  const supabase = await getSupabaseServer();
  const origin = req.nextUrl.origin;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[register] supabase signUp error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user?.id) {
    await prisma.pendingRegistration.update({
      where: { email },
      data: { supabaseUserId: data.user.id },
    });
  }

  return NextResponse.json({ ok: true });
}
