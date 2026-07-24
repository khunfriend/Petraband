import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseServer } from "@/lib/supabase-server";
import { sendAdminNewPendingEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const tokenHash = req.nextUrl.searchParams.get("token_hash");
  const type = req.nextUrl.searchParams.get("type");
  const origin = req.nextUrl.origin;

  if (!code && !tokenHash) {
    console.error("[callback] no code or token_hash. Search:", req.nextUrl.search);
    return NextResponse.redirect(`${origin}/login?error=verify_missing_code`);
  }

  const supabase = await getSupabaseServer();
  let userEmail: string | null = null;
  let userId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user?.email) {
      console.error("[callback] exchange failed:", error);
      return NextResponse.redirect(`${origin}/login?error=verify_failed`);
    }
    userEmail = data.user.email;
    userId = data.user.id;
  } else if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: (type as any) || "signup",
    });
    if (error || !data.user?.email) {
      console.error("[callback] verifyOtp failed:", error);
      return NextResponse.redirect(`${origin}/login?error=verify_failed`);
    }
    userEmail = data.user.email;
    userId = data.user.id;
  }

  if (!userEmail || !userId) {
    return NextResponse.redirect(`${origin}/login?error=verify_failed`);
  }

  const email = userEmail;
  const supabaseUserId = userId;

  // If user already exists (rare — e.g. duplicate flow) — just make sure they're linked
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.supabaseUserId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { supabaseUserId, emailVerifiedAt: new Date() },
      });
    }
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?verified=1`);
  }

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  if (!pending) {
    // No pending row — reject cleanly
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no_pending`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        email: pending.email,
        passwordHash: pending.passwordHash,
        nickname: pending.nickname,
        generation: pending.generation,
        primaryInstrumentId: pending.primaryInstrumentId,
        supabaseUserId,
        emailVerifiedAt: new Date(),
        status: "PENDING_APPROVAL",
        role: "MEMBER",
      },
    });
    await tx.pendingRegistration.delete({ where: { email } });
  });

  // Notify admins (fire-and-forget)
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { email: true, nickname: true },
    });
    await Promise.all(
      admins.map((a) => sendAdminNewPendingEmail(a.email, a.nickname, pending.nickname, pending.email))
    );
  } catch (e) {
    console.error("[callback] admin notify failed:", e);
  }

  // We don't use Supabase session — sign out and rely on NextAuth login
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login?pending_approval=1`);
}
