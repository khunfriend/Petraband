import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendApprovalResultEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason.trim() || null : null;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  if (user.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "บัญชีนี้ไม่ได้อยู่ในสถานะรออนุมัติ" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason },
  });

  try {
    await sendApprovalResultEmail(user.email, user.nickname, false, reason);
  } catch (e) {
    console.error("[reject] email failed:", e);
  }

  return NextResponse.json({ ok: true });
}
