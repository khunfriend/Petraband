import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const roleSchema = z.object({
  role: z.enum(["MEMBER", "HEAD", "ADMIN"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "HEAD")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Cannot change own role
  if (session.user.id === id)
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });

  const body = await req.json();
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  // Head can change roles but cannot promote to Admin or demote an Admin
  if (session.user.role === "HEAD") {
    if (parsed.data.role === "ADMIN") {
      return NextResponse.json({ error: "Head ไม่สามารถตั้ง Admin ได้" }, { status: 403 });
    }
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === "ADMIN") {
      return NextResponse.json({ error: "Head ไม่สามารถแก้ไข role ของ Admin ได้" }, { status: 403 });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, nickname: true, generation: true, role: true, email: true },
  });

  return NextResponse.json({ user });
}
