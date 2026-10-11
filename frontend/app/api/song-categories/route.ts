import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// A category is just the `category` text on each song, so renaming or
// deleting one means rewriting it on every song that carries it.

const renameSchema = z.object({
  from: z.string().min(1),
  to: z.string().trim().min(1, "กรอกชื่อประเภท").max(50),
});

const deleteSchema = z.object({
  name: z.string().min(1),
  /** Where the category's songs go; songs always need a category. */
  moveTo: z.string().trim().min(1, "เลือกประเภทที่จะย้ายเพลงไป").max(50),
});

async function adminOnly() {
  const session = await auth();
  return session?.user.role === "ADMIN";
}

/** Rename a category. Renaming onto an existing one merges the two. */
export async function PATCH(req: Request) {
  if (!(await adminOnly())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = renameSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const { from, to } = parsed.data;
  const { count } = await prisma.song.updateMany({ where: { category: from }, data: { category: to } });
  if (count === 0) return NextResponse.json({ error: "ไม่พบประเภทนี้" }, { status: 404 });
  return NextResponse.json({ ok: true, moved: count });
}

/** Delete a category by moving its songs to another one. */
export async function DELETE(req: Request) {
  if (!(await adminOnly())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const { name, moveTo } = parsed.data;
  if (moveTo === name) return NextResponse.json({ error: "ต้องย้ายไปประเภทอื่น" }, { status: 400 });
  const { count } = await prisma.song.updateMany({ where: { category: name }, data: { category: moveTo } });
  return NextResponse.json({ ok: true, moved: count });
}
