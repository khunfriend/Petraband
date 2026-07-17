import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";

const bodySchema = z.object({ email: z.string().email() });

const TOKEN_TTL_MINUTES = 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  // Always return success to prevent email enumeration
  const ok = NextResponse.json({ ok: true });

  if (!parsed.success) return ok;

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, nickname: true, status: true },
  });

  if (!user || user.status === "EXPIRED") return ok;

  // Invalidate any prior unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  try {
    await sendPasswordResetEmail(user.email, user.nickname, token);
  } catch (e) {
    console.error("[forgot] email send failed:", e);
  }

  return ok;
}
